import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateFeeHeadDto {
  name: string;
  description?: string;
}

export interface CreateFeeStructureDto {
  classNumber: number;
  academicYear: number;
  feeHeadId: string;
  amount: number;
  frequency: 'ONE_TIME' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
}

export interface RecordPaymentDto {
  invoiceId: string;
  amountPaid: number;
  paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'OTHER';
  notes?: string;
}

@Injectable()
export class FeesService {
  constructor(private readonly prisma: PrismaService) {}

  // --- PART A: FEE HEADS & STRUCTURES ---

  async createFeeHead(tenantId: string, dto: CreateFeeHeadDto) {
    return this.prisma.feeHead.create({
      data: {
        tenant_id: tenantId,
        name: dto.name.trim(),
        description: dto.description ? dto.description.trim() : null,
      },
    });
  }

  async getFeeHeads(tenantId: string) {
    let heads = await this.prisma.feeHead.findMany({
      where: { tenant_id: tenantId },
      orderBy: { name: 'asc' },
    });

    if (heads.length === 0) {
      const defaultFeeHeads = [
        { name: 'Tuition Fee', description: 'Core academic tuition fee' },
        { name: 'Admission & Registration Fee', description: 'One-time admission and enrollment fee' },
        { name: 'Transport & Bus Fee', description: 'School bus transport facility fee' },
        { name: 'Laboratory & Science Fee', description: 'Science and computer lab fee' },
        { name: 'Examination & Assessment Fee', description: 'Term examination and assessment fee' },
        { name: 'Sports & Co-Curricular Fee', description: 'Sports and extra-curricular activity fee' },
      ];

      await this.prisma.feeHead.createMany({
        data: defaultFeeHeads.map((h) => ({
          tenant_id: tenantId,
          name: h.name,
          description: h.description,
        })),
      });

      heads = await this.prisma.feeHead.findMany({
        where: { tenant_id: tenantId },
        orderBy: { name: 'asc' },
      });
    }

    return heads;
  }

  async createFeeStructure(tenantId: string, dto: CreateFeeStructureDto) {
    return this.prisma.feeStructure.upsert({
      where: {
        tenant_id_class_number_academic_year_fee_head_id: {
          tenant_id: tenantId,
          class_number: Number(dto.classNumber),
          academic_year: Number(dto.academicYear),
          fee_head_id: dto.feeHeadId,
        },
      },
      update: {
        amount: Number(dto.amount),
        frequency: dto.frequency,
      },
      create: {
        tenant_id: tenantId,
        class_number: Number(dto.classNumber),
        academic_year: Number(dto.academicYear),
        fee_head_id: dto.feeHeadId,
        amount: Number(dto.amount),
        frequency: dto.frequency,
      },
    });
  }

  async getFeeStructures(tenantId: string, classNumber?: number, academicYear?: number) {
    const whereClause: any = { tenant_id: tenantId };
    if (classNumber) whereClause.class_number = Number(classNumber);
    if (academicYear) whereClause.academic_year = Number(academicYear);

    return this.prisma.feeStructure.findMany({
      where: whereClause,
      include: { fee_head: true },
      orderBy: [{ class_number: 'asc' }, { academic_year: 'desc' }],
    });
  }

  // --- PART B: STUDENT INVOICING & PAYMENT LEDGER ---

  async generateInvoices(tenantId: string, classNumber: number, academicYear: number, dueDateStr: string) {
    const structures = await this.prisma.feeStructure.findMany({
      where: {
        tenant_id: tenantId,
        class_number: Number(classNumber),
        academic_year: Number(academicYear),
      },
    });

    if (structures.length === 0) {
      throw new BadRequestException(`No fee structures configured for Grade ${classNumber} (Year ${academicYear})`);
    }

    const students = await this.prisma.studentProfile.findMany({
      where: {
        tenant_id: tenantId,
        current_class: { in: [String(classNumber), `Grade ${classNumber}`] },
        status: 'ACTIVE',
      },
    });

    if (students.length === 0) {
      throw new BadRequestException(`No active students found in Grade ${classNumber}`);
    }

    const dueDate = new Date(dueDateStr);
    let invoicesCreated = 0;

    for (const student of students) {
      for (const structure of structures) {
        const existing = await this.prisma.studentFeeInvoice.findFirst({
          where: {
            student_profile_id: student.id,
            fee_structure_id: structure.id,
            academic_year: Number(academicYear),
          },
        });

        if (!existing) {
          await this.prisma.studentFeeInvoice.create({
            data: {
              student_profile_id: student.id,
              fee_structure_id: structure.id,
              academic_year: Number(academicYear),
              due_date: dueDate,
              amount_due: structure.amount,
              amount_paid: 0,
              status: 'UNPAID',
            },
          });
          invoicesCreated++;
        }
      }
    }

    return {
      message: `Successfully generated ${invoicesCreated} fee invoices for Grade ${classNumber}`,
      invoicesCreated,
      totalStudents: students.length,
    };
  }

  async recordPayment(tenantId: string, staffUserId: string, dto: RecordPaymentDto) {
    const invoice = await this.prisma.studentFeeInvoice.findUnique({
      where: { id: dto.invoiceId },
      include: { student_profile: true },
    });

    if (!invoice || invoice.student_profile.tenant_id !== tenantId) {
      throw new NotFoundException('Invoice not found');
    }

    if (dto.amountPaid <= 0) {
      throw new BadRequestException('Payment amount must be greater than zero');
    }

    const newAmountPaid = invoice.amount_paid + dto.amountPaid;
    if (newAmountPaid > invoice.amount_due) {
      throw new BadRequestException(`Overpayment not allowed. Outstanding balance is ₹${invoice.amount_due - invoice.amount_paid}`);
    }

    const newStatus = newAmountPaid >= invoice.amount_due ? 'PAID' : 'PARTIALLY_PAID';
    const staffProfile = await this.prisma.staffProfile.findUnique({
      where: { user_id: staffUserId },
    });

    const receiptNumber = `RCP-SJA-2026-${Date.now().toString().slice(-6)}`;

    const [payment, updatedInvoice] = await this.prisma.$transaction([
      this.prisma.feePayment.create({
        data: {
          invoice_id: dto.invoiceId,
          amount_paid: dto.amountPaid,
          payment_method: dto.paymentMethod,
          received_by_staff_id: staffProfile ? staffProfile.id : null,
          receipt_number: receiptNumber,
          notes: dto.notes ? dto.notes.trim() : null,
        },
      }),
      this.prisma.studentFeeInvoice.update({
        where: { id: dto.invoiceId },
        data: {
          amount_paid: newAmountPaid,
          status: newStatus,
        },
      }),
    ]);

    return { payment, invoice: updatedInvoice };
  }

  async recalculateInvoiceStatus(invoiceId: string) {
    const invoice = await this.prisma.studentFeeInvoice.findUnique({
      where: { id: invoiceId },
      include: { payments: true },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    const totalPaid = (invoice.payments || []).reduce((sum, p) => sum + p.amount_paid, 0);
    const now = new Date();

    let newStatus = invoice.status;
    if (totalPaid >= invoice.amount_due) {
      newStatus = 'PAID';
    } else if (new Date(invoice.due_date) < now) {
      newStatus = 'OVERDUE';
    } else if (totalPaid > 0) {
      newStatus = 'PARTIALLY_PAID';
    } else {
      newStatus = 'UNPAID';
    }

    return this.prisma.studentFeeInvoice.update({
      where: { id: invoiceId },
      data: {
        amount_paid: totalPaid,
        status: newStatus,
      },
    });
  }

  async getInvoices(tenantId: string, classNumber?: number, status?: string, studentProfileId?: string) {
    const whereClause: any = {
      student_profile: { tenant_id: tenantId },
    };

    if (classNumber) {
      whereClause.student_profile.current_class = { in: [String(classNumber), `Grade ${classNumber}`] };
    }
    if (status) whereClause.status = status;
    if (studentProfileId) whereClause.student_profile_id = studentProfileId;

    return this.prisma.studentFeeInvoice.findMany({
      where: whereClause,
      include: {
        student_profile: true,
        fee_structure: { include: { fee_head: true } },
        payments: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getInvoiceById(tenantId: string, invoiceId: string) {
    const invoice = await this.prisma.studentFeeInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        student_profile: true,
        fee_structure: { include: { fee_head: true } },
        payments: {
          include: { received_by_staff: true },
          orderBy: { payment_date: 'desc' },
        },
      },
    });

    if (!invoice || invoice.student_profile.tenant_id !== tenantId) {
      throw new NotFoundException('Invoice not found');
    }

    return invoice;
  }

  async getDefaulters(tenantId: string) {
    const defaulterInvoices = await this.prisma.studentFeeInvoice.findMany({
      where: {
        student_profile: { tenant_id: tenantId },
        status: { in: ['UNPAID', 'OVERDUE', 'PARTIALLY_PAID'] },
        due_date: { lt: new Date() },
      },
      include: {
        student_profile: true,
        fee_structure: { include: { fee_head: true } },
      },
      orderBy: { due_date: 'asc' },
    });

    return defaulterInvoices.map((inv) => ({
      invoiceId: inv.id,
      studentProfileId: inv.student_profile_id,
      studentName: `${inv.student_profile.first_name} ${inv.student_profile.last_name}`,
      studentCode: inv.student_profile.current_student_code,
      class: `Grade ${inv.student_profile.current_class}-${inv.student_profile.current_section}`,
      feeHeadName: inv.fee_structure.fee_head.name,
      dueDate: inv.due_date.toISOString().split('T')[0],
      amountDue: inv.amount_due,
      amountPaid: inv.amount_paid,
      balanceOutstanding: inv.amount_due - inv.amount_paid,
      status: inv.status,
    }));
  }

  async getRecentPayments(tenantId: string) {
    const payments = await this.prisma.feePayment.findMany({
      where: { invoice: { student_profile: { tenant_id: tenantId } } },
      include: {
        invoice: {
          include: {
            student_profile: true,
          },
        },
      },
      orderBy: { payment_date: 'desc' },
      take: 10,
    });

    return payments.map((pmt) => ({
      id: pmt.id,
      receipt_number: pmt.receipt_number,
      student_name: `${pmt.invoice.student_profile.first_name} ${pmt.invoice.student_profile.last_name}`,
      payment_method: pmt.payment_method,
      amount_paid: pmt.amount_paid,
      payment_date: pmt.payment_date,
    }));
  }

  async getDashboardSummary(tenantId: string) {
    const [invoices, payments] = await Promise.all([
      this.prisma.studentFeeInvoice.findMany({
        where: { student_profile: { tenant_id: tenantId } },
      }),
      this.prisma.feePayment.findMany({
        where: { invoice: { student_profile: { tenant_id: tenantId } } },
      }),
    ]);

    const now = new Date();
    const totalInvoiced = invoices.reduce((sum, inv) => sum + inv.amount_due, 0);
    const totalCollected = invoices.reduce((sum, inv) => sum + inv.amount_paid, 0);
    const totalOutstanding = Math.max(0, totalInvoiced - totalCollected);
    const collectionRate = totalInvoiced > 0 ? (totalCollected / totalInvoiced) * 100 : 100;
    
    const overdueCount = invoices.filter(
      (inv) => inv.status === 'OVERDUE' || (inv.status !== 'PAID' && new Date(inv.due_date) < now),
    ).length;

    const totalPaidAmount = payments.reduce((sum, p) => sum + p.amount_paid, 0);
    const upiAmount = payments.filter((p) => p.payment_method === 'UPI').reduce((sum, p) => sum + p.amount_paid, 0);
    const bankAmount = payments.filter((p) => p.payment_method === 'BANK_TRANSFER').reduce((sum, p) => sum + p.amount_paid, 0);
    const cashAmount = payments.filter((p) => p.payment_method === 'CASH').reduce((sum, p) => sum + p.amount_paid, 0);
    const chequeAmount = payments.filter((p) => p.payment_method === 'CHEQUE').reduce((sum, p) => sum + p.amount_paid, 0);

    const channelBreakdown = {
      upiPercent: totalPaidAmount > 0 ? Math.round((upiAmount / totalPaidAmount) * 100) : 0,
      bankPercent: totalPaidAmount > 0 ? Math.round((bankAmount / totalPaidAmount) * 100) : 0,
      cashPercent: totalPaidAmount > 0 ? Math.round((cashAmount / totalPaidAmount) * 100) : 0,
      chequePercent: totalPaidAmount > 0 ? Math.round((chequeAmount / totalPaidAmount) * 100) : 0,
      totalPaymentsCount: payments.length,
    };

    return {
      totalInvoiced: Number(totalInvoiced.toFixed(2)),
      totalCollected: Number(totalCollected.toFixed(2)),
      totalOutstanding: Number(totalOutstanding.toFixed(2)),
      collectionRate: Number(collectionRate.toFixed(1)),
      overdueCount,
      totalInvoicesCount: invoices.length,
      channelBreakdown,
    };
  }
}
