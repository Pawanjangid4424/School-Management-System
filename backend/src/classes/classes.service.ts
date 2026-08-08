import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface ClassTeacherAssignment {
  className: string;
  section: string;
  teacherId: string;
  teacherName: string;
}

@Injectable()
export class ClassesService {
  // In-memory or database map for class teacher assignments
  private assignments: Map<string, ClassTeacherAssignment> = new Map();

  constructor(private readonly prisma: PrismaService) {}

  async getClasses(tenantId: string) {
    // 1. Query real DB counts for active students grouped by class and section
    const studentCounts = await this.prisma.studentProfile.groupBy({
      by: ['current_class', 'current_section'],
      where: {
        tenant_id: tenantId,
        status: 'ACTIVE',
      },
      _count: {
        id: true,
      },
    });

    const countMap = new Map<string, number>();
    for (const sc of studentCounts) {
      if (sc.current_class && sc.current_section) {
        const key = `${sc.current_class}-${sc.current_section.toUpperCase()}`;
        countMap.set(key, sc._count.id);
      }
    }

    // 2. Generate list of 12 classes with sections A, B, C with REAL counts
    const classesList = [];
    for (let grade = 1; grade <= 12; grade++) {
      for (const sec of ['A', 'B', 'C']) {
        const key = `Grade ${grade}-${sec}`;
        const assignment = this.assignments.get(key);
        const realStudentCount = countMap.get(`${grade}-${sec}`) || 0;

        classesList.push({
          id: `class-${grade}-${sec}`,
          className: `Grade ${grade}`,
          section: sec,
          stream: grade >= 11 ? (sec === 'A' ? 'SCIENCE' : sec === 'B' ? 'COMMERCE' : 'ARTS') : null,
          studentCount: realStudentCount,
          classTeacher: assignment ? assignment.teacherName : null,
          classTeacherId: assignment ? assignment.teacherId : null,
        });
      }
    }
    return classesList;
  }

  async assignClassTeacher(tenantId: string, className: string, section: string, teacherId: string, teacherName: string) {
    const key = `${className}-${section}`;
    this.assignments.set(key, { className, section, teacherId, teacherName });
    return { success: true, message: `Assigned ${teacherName} as Class Teacher of ${className}-${section}` };
  }

  private getDayOfWeekString(date: Date): string {
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    return days[date.getDay()];
  }

  async checkTeacherAvailability(tenantId: string, teacherId: string, dateStr: string, periodNumber: number) {
    const date = new Date(dateStr);
    
    // 1. Is the teacher explicitly assigned as a replacement/daily assignment?
    const dailyAssigned = await this.prisma.dailyTeacherAssignment.findFirst({
      where: {
        tenant_id: tenantId,
        assigned_teacher_id: teacherId,
        date: date,
        period_number: periodNumber,
      },
    });

    if (dailyAssigned) {
      return `Teacher is already assigned to Grade ${dailyAssigned.class_number}-${dailyAssigned.section} (Daily Override)`;
    }

    // 2. Is the teacher scheduled in the regular timetable AND not replaced?
    const dayOfWeek = this.getDayOfWeekString(date);
    const weeklyAssigned = await this.prisma.timetableSlot.findFirst({
      where: {
        tenant_id: tenantId,
        teacher_id: teacherId,
        day_of_week: dayOfWeek,
        period_number: periodNumber,
      },
    });

    if (weeklyAssigned) {
      // Check if they were replaced today
      const isReplaced = await this.prisma.dailyTeacherAssignment.findFirst({
        where: {
          tenant_id: tenantId,
          class_number: weeklyAssigned.class_number,
          section: weeklyAssigned.section,
          date: date,
          period_number: periodNumber,
          original_teacher_id: teacherId,
        },
      });

      if (!isReplaced) {
        return `Teacher is scheduled for Grade ${weeklyAssigned.class_number}-${weeklyAssigned.section} (Regular Timetable)`;
      }
    }

    return null; // Teacher is available
  }

  async assignDailyTeacher(
    tenantId: string,
    classNumber: number,
    section: string,
    dateStr: string,
    periodNumber: number,
    subjectId: string | null,
    originalTeacherId: string | null,
    assignedTeacherId: string,
    reason: string
  ) {
    // 1. Check Availability
    const conflict = await this.checkTeacherAvailability(tenantId, assignedTeacherId, dateStr, periodNumber);
    if (conflict) {
      throw new HttpException({ success: false, message: conflict }, HttpStatus.CONFLICT);
    }

    // 2. Upsert Daily Assignment
    const date = new Date(dateStr);
    const assignment = await this.prisma.dailyTeacherAssignment.upsert({
      where: {
        tenant_id_class_number_section_date_period_number: {
          tenant_id: tenantId,
          class_number: classNumber,
          section: section,
          date: date,
          period_number: periodNumber,
        }
      },
      update: {
        subject_id: subjectId,
        original_teacher_id: originalTeacherId,
        assigned_teacher_id: assignedTeacherId,
        reason: reason,
      },
      create: {
        tenant_id: tenantId,
        class_number: classNumber,
        section: section,
        date: date,
        period_number: periodNumber,
        subject_id: subjectId,
        original_teacher_id: originalTeacherId,
        assigned_teacher_id: assignedTeacherId,
        reason: reason,
      }
    });

    return { success: true, message: 'Teacher assignment recorded successfully', assignment };
  }

  async getDailySchedule(tenantId: string, classNumber: number, section: string, dateStr: string) {
    const date = new Date(dateStr);
    const dayOfWeek = this.getDayOfWeekString(date);

    // Get regular timetable slots
    const regularSlots = await this.prisma.timetableSlot.findMany({
      where: {
        tenant_id: tenantId,
        class_number: classNumber,
        section: section,
        day_of_week: dayOfWeek,
      },
      include: {
        subject: true,
        teacher: true,
      }
    });

    // Get daily overrides
    const overrides = await this.prisma.dailyTeacherAssignment.findMany({
      where: {
        tenant_id: tenantId,
        class_number: classNumber,
        section: section,
        date: date,
      },
      include: {
        subject: true,
        original_teacher: true,
        assigned_teacher: true,
      }
    });

    // Merge them
    // Max periods usually 8
    const schedule = [];
    for (let period = 1; period <= 8; period++) {
      const override = overrides.find(o => o.period_number === period);
      if (override) {
        schedule.push({
          period,
          isOverride: true,
          subject: override.subject?.subject_name || 'N/A',
          subjectId: override.subject_id,
          originalTeacher: override.original_teacher?.first_name ? `${override.original_teacher.first_name} ${override.original_teacher.last_name}` : null,
          originalTeacherId: override.original_teacher_id,
          assignedTeacher: `${override.assigned_teacher.first_name} ${override.assigned_teacher.last_name}`,
          assignedTeacherId: override.assigned_teacher_id,
          reason: override.reason,
        });
      } else {
        const regular = regularSlots.find(r => r.period_number === period);
        if (regular) {
          schedule.push({
            period,
            isOverride: false,
            subject: regular.subject?.subject_name || 'N/A',
            subjectId: regular.subject_id,
            originalTeacher: null,
            originalTeacherId: null,
            assignedTeacher: regular.teacher ? `${regular.teacher.first_name} ${regular.teacher.last_name}` : 'Unassigned',
            assignedTeacherId: regular.teacher_id,
            reason: null,
          });
        } else {
          schedule.push({
            period,
            isOverride: false,
            subject: 'Free Period',
            subjectId: null,
            originalTeacher: null,
            originalTeacherId: null,
            assignedTeacher: 'Unassigned',
            assignedTeacherId: null,
            reason: null,
          });
        }
      }
    }

    return schedule;
  }
}
