import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { FeesService } from './fees.service';
import { PrismaService } from '../prisma/prisma.service';

describe('FeesService (Payment Aggregation Audit Trail & Invoicing)', () => {
  let service: FeesService;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockInvoice = {
    id: 'inv-101',
    student_profile_id: 'student-1',
    fee_structure_id: 'struct-1',
    academic_year: 2026,
    due_date: new Date('2026-12-31'),
    amount_due: 1000.0,
    amount_paid: 0,
    status: 'UNPAID',
    payments: [],
    student_profile: { tenant_id: 'tenant-123', first_name: 'Pawan', last_name: 'Sharma' },
    fee_structure: { fee_head: { name: 'Tuition Fee' } },
  };

  beforeEach(async () => {
    const paymentStore: any[] = [];
    let currentInvoiceState = { ...mockInvoice, payments: paymentStore };

    prismaService = {
      $transaction: jest.fn().mockImplementation(async (arg: any) => {
        if (Array.isArray(arg)) {
          return Promise.all(arg);
        }
        if (typeof arg === 'function') {
          return arg(prismaService);
        }
        return arg;
      }),
      studentFeeInvoice: {
        findUnique: jest.fn().mockImplementation(() => Promise.resolve(currentInvoiceState)),
        update: jest.fn().mockImplementation((data) => {
          currentInvoiceState = { ...currentInvoiceState, ...data.data };
          return Promise.resolve(currentInvoiceState);
        }),
        findMany: jest.fn().mockResolvedValue([currentInvoiceState]),
      } as any,
      feePayment: {
        create: jest.fn().mockImplementation((data) => {
          const newPayment = { id: `pay-${paymentStore.length + 1}`, ...data.data };
          paymentStore.push(newPayment);
          currentInvoiceState.payments = paymentStore;
          return Promise.resolve(newPayment);
        }),
      } as any,
      staffProfile: {
        findUnique: jest.fn().mockResolvedValue({ id: 'staff-1' }),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FeesService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<FeesService>(FeesService);
  });

  describe('3 Partial Payments Aggregation & Status Transitions', () => {
    it('should aggregate 3 partial payments (300 + 400 + 300) and transition UNPAID -> PARTIALLY_PAID -> PAID', async () => {
      // 1. Payment 1: $300 (Total = 300 / 1000 => PARTIALLY_PAID)
      const res1 = await service.recordPayment('tenant-123', 'user-staff-1', {
        invoiceId: 'inv-101',
        amountPaid: 300.0,
        paymentMethod: 'UPI',
        notes: 'First installment',
      });

      expect(res1.invoice.amount_paid).toBe(300.0);
      expect(res1.invoice.status).toBe('PARTIALLY_PAID');
      expect(res1.payment.receipt_number).toContain('RCP-SJA-2026-');

      // 2. Payment 2: $400 (Total = 700 / 1000 => PARTIALLY_PAID)
      const res2 = await service.recordPayment('tenant-123', 'user-staff-1', {
        invoiceId: 'inv-101',
        amountPaid: 400.0,
        paymentMethod: 'CASH',
        notes: 'Second installment',
      });

      expect(res2.invoice.amount_paid).toBe(700.0);
      expect(res2.invoice.status).toBe('PARTIALLY_PAID');

      // 3. Payment 3: $300 (Total = 1000 / 1000 => PAID)
      const res3 = await service.recordPayment('tenant-123', 'user-staff-1', {
        invoiceId: 'inv-101',
        amountPaid: 300.0,
        paymentMethod: 'BANK_TRANSFER',
        notes: 'Final installment',
      });

      expect(res3.invoice.amount_paid).toBe(1000.0);
      expect(res3.invoice.status).toBe('PAID');
      expect(prismaService.feePayment.create).toHaveBeenCalledTimes(3);
    });
  });

  describe('Overdue Status Precedence & Overpayment Validation', () => {
    it('should mark status as OVERDUE when an invoice is PARTIALLY_PAID but past its due_date', async () => {
      const pastDueInvoice = {
        ...mockInvoice,
        due_date: new Date('2020-01-01'), // past date
        payments: [{ id: 'p-1', amount_paid: 400.0 }],
        amount_paid: 400.0,
      };
      (prismaService.studentFeeInvoice.findUnique as jest.Mock).mockResolvedValue(pastDueInvoice);

      const recalculated = await service.recalculateInvoiceStatus('inv-101');
      expect(recalculated.amount_paid).toBe(400.0);
      expect(recalculated.status).toBe('OVERDUE');
    });

    it('should throw BadRequestException when payment amount exceeds remaining balance', async () => {
      const existingPaymentInvoice = {
        ...mockInvoice,
        amount_due: 1000.0,
        amount_paid: 700.0,
        payments: [{ id: 'p-1', amount_paid: 700.0 }],
      };
      (prismaService.studentFeeInvoice.findUnique as jest.Mock).mockResolvedValue(existingPaymentInvoice);

      await expect(
        service.recordPayment('tenant-123', 'user-staff-1', {
          invoiceId: 'inv-101',
          amountPaid: 400.0, // Remaining balance is 300
          paymentMethod: 'CASH',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Immutable Audit Trail Guarantee', () => {
    it('should recalculate amount_paid strictly from the SUM of FeePayment rows', async () => {
      // Record payment of $500
      await service.recordPayment('tenant-123', 'user-staff-1', {
        invoiceId: 'inv-101',
        amountPaid: 500.0,
        paymentMethod: 'CHEQUE',
      });

      // Recalculate status verify SUM(500)
      const recalculated = await service.recalculateInvoiceStatus('inv-101');
      expect(recalculated.amount_paid).toBe(500.0);
      expect(recalculated.status).toBe('PARTIALLY_PAID');
    });
  });
});
