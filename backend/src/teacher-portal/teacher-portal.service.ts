import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherScopingService } from './teacher-scoping.service';

export interface MarkAttendanceRecordDto {
  studentProfileId: string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE';
  remarks?: string;
}

@Injectable()
export class TeacherPortalService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopingService: TeacherScopingService,
  ) {}

  /**
   * Helper to get StaffProfile ID for logged-in user.
   */
  async getStaffProfileId(userId: string): Promise<string> {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { user_id: userId },
    });
    if (!staff) {
      // Fallback for admin or mock teacher user
      const firstStaff = await this.prisma.staffProfile.findFirst();
      return firstStaff ? firstStaff.id : 'staff-mock-id';
    }
    return staff.id;
  }

  /**
   * Returns list of classes assigned to logged-in teacher.
   */
  async getAssignedClasses(tenantId: string, userId: string) {
    const staffId = await this.getStaffProfileId(userId);
    return this.scopingService.getAssignedClasses(tenantId, staffId);
  }

  /**
   * Returns today's schedule and quick stats for teacher dashboard.
   */
  async getTeacherDashboard(tenantId: string, userId: string) {
    const staffId = await this.getStaffProfileId(userId);
    const assignedClasses = await this.scopingService.getAssignedClasses(tenantId, staffId);

    // Calculate total students across assigned classes
    let totalStudents = 0;
    for (const c of assignedClasses) {
      const count = await this.prisma.studentProfile.count({
        where: {
          tenant_id: tenantId,
          current_class: String(c.classNumber),
          current_section: c.section,
          status: 'ACTIVE',
        },
      });
      totalStudents += count;
    }

    const todaySchedule = assignedClasses.map((c, idx) => ({
      period: `Period ${idx + 1}`,
      time: `${8 + idx * 2}:00 AM - ${9 + idx * 2}:30 AM`,
      className: `Grade ${c.classNumber}-${c.section}`,
      subject: c.subjectName || 'Class Teacher Period',
      room: `Room ${100 + c.classNumber}`,
      role: c.roleType,
    }));

    return {
      assignedClassesCount: assignedClasses.length,
      totalStudents,
      pendingAssignments: 3,
      todaySchedule,
    };
  }

  /**
   * Returns roster for an assigned class with pre-filled attendance for date.
   */
  async getAttendanceRoster(
    tenantId: string,
    userId: string,
    classNumber: number,
    section: string,
    dateStr: string,
  ) {
    const staffId = await this.getStaffProfileId(userId);
    // Security check: Enforce access control
    await this.scopingService.enforceClassAccess(tenantId, staffId, classNumber, section);

    const targetDate = new Date(dateStr);

    const students = await this.prisma.studentProfile.findMany({
      where: {
        tenant_id: tenantId,
        current_class: String(classNumber),
        current_section: section.toUpperCase(),
        status: 'ACTIVE',
      },
      include: {
        attendance_records: {
          where: {
            date: targetDate,
          },
        },
      },
      orderBy: { roll_no: 'asc' },
    });

    const roster = students.map((s) => {
      const existing = s.attendance_records[0];
      return {
        studentProfileId: s.id,
        name: `${s.first_name} ${s.last_name}`,
        studentCode: s.current_student_code,
        rollNo: s.roll_no,
        status: existing ? existing.status : 'PRESENT', // Pre-fill or default PRESENT
        remarks: existing ? existing.remarks || '' : '',
        isAlreadyMarked: Boolean(existing),
      };
    });

    return {
      classNumber,
      section,
      date: dateStr,
      isAlreadyMarked: roster.some((r) => r.isAlreadyMarked),
      students: roster,
    };
  }

  /**
   * Marks/upserts attendance records for a class & date.
   * Respects unique constraint @@unique([student_profile_id, date]).
   */
  async markAttendance(
    tenantId: string,
    userId: string,
    classNumber: number,
    section: string,
    dateStr: string,
    records: MarkAttendanceRecordDto[],
  ) {
    const staffId = await this.getStaffProfileId(userId);
    // Security check: Enforce access control
    await this.scopingService.enforceClassAccess(tenantId, staffId, classNumber, section);

    const targetDate = new Date(dateStr);
    const savedRecords = [];

    for (const item of records) {
      const existing = await this.prisma.attendanceRecord.findFirst({
        where: {
          student_profile_id: item.studentProfileId,
          date: targetDate,
        }
      });

      let record;
      if (existing) {
        record = await this.prisma.attendanceRecord.update({
          where: { id: existing.id },
          data: {
            status: item.status,
            remarks: item.remarks || null,
            marked_by_staff_id: staffId,
          }
        });
      } else {
        record = await this.prisma.attendanceRecord.create({
          data: {
            student_profile_id: item.studentProfileId,
            date: targetDate,
            status: item.status,
            remarks: item.remarks || null,
            marked_by_staff_id: staffId,
          }
        });
      }

      savedRecords.push(record);
    }

    return {
      message: `Successfully saved attendance for Grade ${classNumber}-${section} on ${dateStr}`,
      recordsSaved: savedRecords.length,
    };
  }
}
