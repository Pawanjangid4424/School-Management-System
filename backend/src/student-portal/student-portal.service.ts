import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StudentPortalService {
  constructor(private prisma: PrismaService) {}

  private async resolveStudentProfile(tenantId: string, userId: string) {
    let student = await this.prisma.studentProfile.findUnique({
      where: { user_id: userId },
    });
    if (!student) {
      // Fallback for Admin preview/testing
      student = await this.prisma.studentProfile.findFirst({
        where: { tenant_id: tenantId },
      });
    }
    if (!student) {
      throw new BadRequestException('No student profile found. Please enroll a student first.');
    }
    return student;
  }

  async getDashboardSummary(tenantId: string, userId: string) {
    // 1. Resolve student profile
    const student = await this.resolveStudentProfile(tenantId, userId);

    const today = new Date();
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const todayDayOfWeek = days[today.getDay()];

    // 2. Fetch Exams (upcoming or recent)
    const exams = await this.prisma.exam.findMany({
      where: {
        tenant_id: tenantId,
        class_number: parseInt(student.current_class) || 0,
        section: student.current_section,
        exam_date: { gte: today },
      },
      include: { subject: true },
      orderBy: { exam_date: 'asc' },
      take: 10,
    });

    const examTimeTable = exams.map(exam => ({
      date: exam.exam_date,
      slot: 'TBD',
      ccode: exam.subject?.subject_code || 'N/A',
      course: exam.name || exam.subject?.subject_name || 'N/A',
      semester: student.current_class,
      type: 'Exam',
    }));

    // 3. Time Tables (Today & Weekly)
    const studentClassNum = parseInt(String(student.current_class || '0').replace(/\D/g, ''), 10) || 0;

    const timetableSlots = await this.prisma.timetableSlot.findMany({
      where: {
        tenant_id: tenantId,
        class_number: studentClassNum,
        section: student.current_section ? student.current_section.trim().toUpperCase() : undefined,
      },
      include: { subject: true, teacher: true },
      orderBy: [
        { day_of_week: 'asc' },
        { period_number: 'asc' }
      ],
    });

    const todayTimeTable = timetableSlots.filter(s => s.day_of_week === todayDayOfWeek).map(s => ({
      slot: `${s.start_time} - ${s.end_time}`,
      ccode: s.subject?.subject_name || 'Free Period',
    }));

    const classTimeTable = timetableSlots.map(s => ({
      day: s.day_of_week,
      period: s.period_number,
      time: `${s.start_time}-${s.end_time}`,
      subject: s.subject?.subject_name || '-',
      faculty: s.teacher ? `${s.teacher.first_name} ${s.teacher.last_name}` : '-',
      room: s.room_number || '-',
      day_of_week: s.day_of_week,
      period_number: s.period_number,
      start_time: s.start_time,
      end_time: s.end_time,
    }));

    // 4. Institute Details & Notifications
    const assignmentsCount = await this.prisma.assignment.count({
      where: {
        tenant_id: tenantId,
        due_date: { gte: today },
      }
    });

    const notices = await this.prisma.notice.findMany({
      where: { tenant_id: tenantId },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    const holidays = await this.prisma.holiday.findMany({
      where: {
        tenant_id: tenantId,
        start_date: { gte: new Date(today.getFullYear(), today.getMonth(), 1) }
      },
      orderBy: { start_date: 'asc' },
      take: 5,
    });

    // 5. Attendance Calculation
    const attendanceRecords = await this.prisma.attendanceRecord.findMany({
      where: { student_profile_id: student.id },
      include: { subject: true }
    });

    const presentCount = attendanceRecords.filter((r) => r.status === 'PRESENT').length;
    const totalWorkingDays = attendanceRecords.length || 1;
    let monthlyAttendancePercent = attendanceRecords.length === 0 ? 0 : Number(((presentCount / totalWorkingDays) * 100).toFixed(1));

    const subjectAttendanceMap: Record<string, { present: number; total: number; name: string }> = {};
    
    attendanceRecords.forEach(record => {
      const subjName = record.subject?.subject_name || 'General';
      if (!subjectAttendanceMap[subjName]) {
        subjectAttendanceMap[subjName] = { present: 0, total: 0, name: subjName };
      }
      subjectAttendanceMap[subjName].total += 1;
      if (record.status === 'PRESENT') {
        subjectAttendanceMap[subjName].present += 1;
      }
    });

    const subjectAttendance = Object.values(subjectAttendanceMap).map(subj => ({
      subject: subj.name,
      lectures: `${subj.present}/${subj.total}`,
      percentage: Number(((subj.present / subj.total) * 100).toFixed(1)),
    }));

    return {
      student: {
        id: student.id,
        name: `${student.first_name} ${student.last_name}`,
        studentCode: student.current_student_code,
        class: student.current_class,
        section: student.current_section,
        rollNo: student.roll_no,
        admissionNo: student.permanent_admission_no,
      },
      metrics: {
        monthlyAttendancePercent,
        pendingAssignments: assignmentsCount,
        announcementCount: notices.length,
        upcomingExams: examTimeTable.length,
        pendingTripConsents: 0, // Mock
      },
      widgets: {
        examTimeTable,
        todayTimeTable,
        classTimeTable,
        subjectAttendance,
        notifications: notices.map(n => ({ id: n.id, title: n.title, date: n.created_at })),
        holidays: holidays.map(h => ({ id: h.id, name: h.name, date: h.start_date, type: h.type }))
      }
    };
  }

  async getTimetableSelf(tenantId: string, userId: string) {
    const student = await this.resolveStudentProfile(tenantId, userId);

    const studentClassNum = parseInt(String(student.current_class || '0').replace(/\D/g, ''), 10) || 0;

    const slots = await this.prisma.timetableSlot.findMany({
      where: {
        tenant_id: tenantId,
        class_number: studentClassNum,
        section: student.current_section ? student.current_section.trim().toUpperCase() : undefined,
      },
      include: {
        subject: true,
        teacher: true,
      },
      orderBy: [
        { day_of_week: 'asc' },
        { period_number: 'asc' },
      ],
    });

    return slots;
  }

  async submitLeaveRequest(
    tenantId: string,
    userId: string,
    fromDate: string,
    toDate: string,
    reason: string,
  ) {
    const student = await this.resolveStudentProfile(tenantId, userId);

    return this.prisma.leaveRequest.create({
      data: {
        student_profile_id: student.id,
        from_date: new Date(fromDate),
        to_date: new Date(toDate),
        reason: reason.trim(),
        status: 'PENDING',
        requested_by: 'student',
      },
    });
  }

  async getMyLeaveRequests(tenantId: string, userId: string) {
    const student = await this.resolveStudentProfile(tenantId, userId);

    return this.prisma.leaveRequest.findMany({
      where: {
        student_profile_id: student.id,
      },
      include: {
        reviewed_by_staff: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }
}
