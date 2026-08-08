import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StaffIdGeneratorService } from './staff-id-generator.service';
import { MailboxProcessorService } from '../mailbox/mailbox-processor.service';
import { CreateStaffDto } from './dto/create-staff.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StaffService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly staffIdGenerator: StaffIdGeneratorService,
    private readonly mailboxProcessor: MailboxProcessorService,
  ) {}

  async createStaff(tenantId: string, dto: CreateStaffDto) {
    const { firstName, lastName, designation, department, joiningDate } = dto;

    // 1. Calculate next auto-incrementing staff sequence number for tenant
    const existingStaffCount = await this.prisma.staffProfile.count({
      where: { tenant_id: tenantId },
    });
    const nextSequenceNumber = 101 + existingStaffCount;

    // 2. Generate permanent Staff ID, Username, and Email
    const generated = await this.staffIdGenerator.generate({
      firstName,
      staffSequenceNumber: nextSequenceNumber,
      tenantId,
    });

    const defaultPasswordHash = await bcrypt.hash('StaffPass123!', 10);

    // 3. DB Transaction: Create User + StaffProfile + Mailbox Job
    const result = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          tenant_id: tenantId,
          role: 'TEACHER',
          current_email: generated.email,
          current_username: generated.username,
          password_hash: defaultPasswordHash,
          status: 'ACTIVE',
        },
      });

      const profile = await tx.staffProfile.create({
        data: {
          user_id: user.id,
          tenant_id: tenantId,
          staff_id: generated.staffId,
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          designation: designation.trim(),
          department: department.trim(),
          joining_date: new Date(joiningDate),
        },
      });

      const mailboxJob = await tx.mailboxProvisioningJob.create({
        data: {
          user_id: user.id,
          action: 'CREATE_MAILBOX',
          status: 'PENDING',
        },
      });

      return { user, profile, mailboxJob };
    });

    // 4. Trigger async background mailbox provisioning
    this.mailboxProcessor.processJobAsync(result.mailboxJob.id);

    return {
      id: result.profile.id,
      userId: result.user.id,
      staffId: result.profile.staff_id,
      username: result.user.current_username,
      email: result.user.current_email,
      defaultPassword: 'StaffPass123!',
      firstName: result.profile.first_name,
      lastName: result.profile.last_name,
      designation: result.profile.designation,
      department: result.profile.department,
      joiningDate: result.profile.joining_date,
      subjectsTaught: dto.subjectsTaught || null,
      classTeacherOf: dto.classTeacherOf || null,
      mailboxJob: {
        id: result.mailboxJob.id,
        status: result.mailboxJob.status,
      },
    };
  }

  async findAll(tenantId: string) {
    const staffMembers = await this.prisma.staffProfile.findMany({
      where: { tenant_id: tenantId },
      include: {
        user: {
          select: {
            current_email: true,
            current_username: true,
            status: true,
            mailbox_jobs: {
              take: 1,
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
      orderBy: { staff_id: 'asc' },
    });

    return staffMembers.map((s) => ({
      id: s.id,
      staffId: s.staff_id,
      name: `${s.first_name} ${s.last_name}`,
      designation: s.designation,
      department: s.department,
      joiningDate: s.joining_date.toISOString().split('T')[0],
      email: s.user.current_email,
      username: s.user.current_username,
      status: s.status, // Map from staff profile status, not user status just like student
      mailboxStatus: s.user.mailbox_jobs[0]?.status || 'COMPLETED',
    }));
  }

  async getStaff(id: string, tenantId: string) {
    const staff = await this.prisma.staffProfile.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        user: true,
      },
    });

    if (!staff) {
      throw new NotFoundException('Staff not found');
    }
    return staff;
  }

  async updateStaff(id: string, tenantId: string, payload: any) {
    return this.prisma.staffProfile.update({
      where: { id, tenant_id: tenantId },
      data: {
        first_name: payload.first_name,
        last_name: payload.last_name,
        designation: payload.designation,
        department: payload.department,
        joining_date: payload.joining_date ? new Date(payload.joining_date) : undefined,
      },
    });
  }

  async suspendStaff(id: string, tenantId: string, durationDays: number, reason: string) {
    const staff = await this.prisma.staffProfile.findFirst({
      where: { id, tenant_id: tenantId },
      include: { user: true },
    });

    if (!staff) throw new NotFoundException('Staff not found');

    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    await this.prisma.$transaction(async (tx) => {
      await tx.staffProfile.update({
        where: { id },
        data: {
          status: 'SUSPENDED',
          suspension_end_date: endDate,
          suspension_reason: reason,
        },
      });

      await tx.user.update({
        where: { id: staff.user_id },
        data: { status: 'SUSPENDED' },
      });
    });

    return { message: 'Staff suspended successfully' };
  }

  async deleteStaff(id: string, tenantId: string, adminId: string, adminName: string) {
    const staff = await this.prisma.staffProfile.findFirst({
      where: { id, tenant_id: tenantId },
      include: { user: true },
    });

    if (!staff) throw new NotFoundException('Staff not found');

    await this.prisma.$transaction(async (tx) => {
      // 1. Audit Log
      await tx.staffDeletionLog.create({
        data: {
          tenant_id: tenantId,
          staff_name: `${staff.first_name} ${staff.last_name}`,
          staff_code: staff.staff_id,
          deleted_by_name: adminName || 'Admin',
          deleted_by_id: adminId || 'admin-id',
          reason: 'Hard delete triggered from directory',
        },
      });

      // 2. Unlink ClassSection class_teacher_id
      await tx.classSection.updateMany({
        where: { class_teacher_id: staff.id },
        data: { class_teacher_id: null },
      });

      // 3. Unlink SubjectClassMapping teacher_id
      await tx.subjectClassMapping.updateMany({
        where: { teacher_id: staff.id },
        data: { teacher_id: null },
      });

      // 4. Delete DailyTeacherAssignments
      await tx.dailyTeacherAssignment.deleteMany({
        where: {
          OR: [
            { original_teacher_id: staff.id },
            { assigned_teacher_id: staff.id },
          ],
        },
      });

      // 5. Nullify AttendanceRecord marked_by_staff_id
      await tx.attendanceRecord.updateMany({
        where: { marked_by_staff_id: staff.id },
        data: { marked_by_staff_id: null },
      });

      // 6. Nullify LeaveRequest reviewed_by_staff_id
      await tx.leaveRequest.updateMany({
        where: { reviewed_by_staff_id: staff.id },
        data: { reviewed_by_staff_id: null },
      });

      // 7. Delete Assignments & Submissions created by staff
      const assignments = await tx.assignment.findMany({
        where: { created_by_staff_id: staff.id },
        select: { id: true },
      });
      if (assignments.length > 0) {
        const assignmentIds = assignments.map((a) => a.id);
        await tx.assignmentSubmission.deleteMany({
          where: { assignment_id: { in: assignmentIds } },
        });
        await tx.assignment.deleteMany({
          where: { created_by_staff_id: staff.id },
        });
      }

      // 8. Delete Exams & Scores created by staff
      const exams = await tx.exam.findMany({
        where: { created_by_staff_id: staff.id },
        select: { id: true },
      });
      if (exams.length > 0) {
        const examIds = exams.map((e) => e.id);
        await tx.examScore.deleteMany({
          where: { exam_id: { in: examIds } },
        });
        await tx.exam.deleteMany({
          where: { created_by_staff_id: staff.id },
        });
      }

      // 9. Nullify Notice created_by_staff_id
      await tx.notice.updateMany({
        where: { created_by_staff_id: staff.id },
        data: { created_by_staff_id: null },
      });

      // 10. Nullify FeePayment received_by_staff_id
      await tx.feePayment.updateMany({
        where: { received_by_staff_id: staff.id },
        data: { received_by_staff_id: null },
      });

      // 11. Delete Trips created by staff
      const trips = await tx.trip.findMany({
        where: { created_by_staff_id: staff.id },
        select: { id: true },
      });
      if (trips.length > 0) {
        const tripIds = trips.map((t) => t.id);
        await tx.tripPermission.deleteMany({
          where: { trip_id: { in: tripIds } },
        });
        await tx.trip.deleteMany({
          where: { created_by_staff_id: staff.id },
        });
      }

      // 12. Nullify Trip reviewed_by_staff_id
      await tx.trip.updateMany({
        where: { reviewed_by_staff_id: staff.id },
        data: { reviewed_by_staff_id: null },
      });

      // 13. Delete MailboxProvisioningJob
      await tx.mailboxProvisioningJob.deleteMany({
        where: { user_id: staff.user_id },
      });

      // 14. Delete StaffProfile & User
      await tx.staffProfile.delete({
        where: { id: staff.id },
      });

      await tx.user.delete({
        where: { id: staff.user_id },
      });
    });

    return { message: 'Staff deleted successfully' };
  }
}
