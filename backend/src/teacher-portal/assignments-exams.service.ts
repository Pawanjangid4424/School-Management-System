import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherScopingService } from './teacher-scoping.service';

export interface CreateAssignmentDto {
  classNumber: number;
  section: string;
  subjectId?: string;
  title: string;
  description: string;
  dueDate: string;
  maxMarks?: number;
  attachmentUrl?: string;
}

export interface CreateExamDto {
  classNumber: number;
  section: string;
  subjectId?: string;
  name: string;
  examDate: string;
  maxMarks: number;
}

export interface ExamScoreInputDto {
  studentProfileId: string;
  marksObtained: number;
}

@Injectable()
export class AssignmentsExamsService {
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
      const firstStaff = await this.prisma.staffProfile.findFirst();
      return firstStaff ? firstStaff.id : 'staff-mock-id';
    }
    return staff.id;
  }

  /**
   * Grade Label Derivation Engine:
   * Maps percentage to letter grade label (A+, A, B, C, D, F).
   */
  deriveGradeLabel(marksObtained: number, maxMarks: number): string {
    if (!maxMarks || maxMarks <= 0) return 'N/A';
    const percent = (marksObtained / maxMarks) * 100;

    if (percent >= 90) return 'A+';
    if (percent >= 80) return 'A';
    if (percent >= 70) return 'B';
    if (percent >= 60) return 'C';
    if (percent >= 50) return 'D';
    return 'F';
  }

  // --- ASSIGNMENTS ---

  async createAssignment(tenantId: string, userId: string, dto: CreateAssignmentDto) {
    const staffId = await this.getStaffProfileId(userId);
    // Security Guard: Enforce class access
    await this.scopingService.enforceClassAccess(tenantId, staffId, dto.classNumber, dto.section);

    return this.prisma.assignment.create({
      data: {
        tenant_id: tenantId,
        class_number: dto.classNumber,
        section: dto.section.toUpperCase(),
        subject_id: dto.subjectId || null,
        created_by_staff_id: staffId,
        title: dto.title.trim(),
        description: dto.description.trim(),
        due_date: new Date(dto.dueDate),
        max_marks: dto.maxMarks ? Number(dto.maxMarks) : null,
        attachment_url: dto.attachmentUrl || null,
      },
      include: {
        subject: true,
      },
    });
  }

  async getAssignments(tenantId: string, userId: string) {
    const staffId = await this.getStaffProfileId(userId);
    const assigned = await this.scopingService.getAssignedClasses(tenantId, staffId);

    if (assigned.length === 0) return [];

    return this.prisma.assignment.findMany({
      where: {
        tenant_id: tenantId,
        OR: assigned.map((a) => ({
          class_number: a.classNumber,
          section: a.section,
        })),
      },
      include: {
        subject: true,
        submissions: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async getAssignmentSubmissions(tenantId: string, userId: string, assignmentId: string) {
    const staffId = await this.getStaffProfileId(userId);
    const assignment = await this.prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: { subject: true },
    });

    if (!assignment || assignment.tenant_id !== tenantId) {
      throw new NotFoundException(`Assignment not found`);
    }

    // Security check
    await this.scopingService.enforceClassAccess(
      tenantId,
      staffId,
      assignment.class_number,
      assignment.section,
    );

    const students = await this.prisma.studentProfile.findMany({
      where: {
        tenant_id: tenantId,
        current_class: String(assignment.class_number),
        current_section: assignment.section,
        status: 'ACTIVE',
      },
      include: {
        assignment_submissions: {
          where: { assignment_id: assignmentId },
        },
      },
      orderBy: { roll_no: 'asc' },
    });

    const submissions = students.map((s) => {
      const sub = s.assignment_submissions[0];
      return {
        studentProfileId: s.id,
        name: `${s.first_name} ${s.last_name}`,
        studentCode: s.current_student_code,
        submissionId: sub ? sub.id : null,
        submittedAt: sub?.submitted_at ? sub.submitted_at.toISOString() : null,
        isSubmitted: Boolean(sub?.submitted_at),
        fileUrl: sub?.file_url || null,
        marksObtained: sub?.marks_obtained ?? null,
        feedback: sub?.feedback || '',
        gradedAt: sub?.graded_at ? sub.graded_at.toISOString() : null,
      };
    });

    return {
      assignment,
      totalStudents: students.length,
      submittedCount: submissions.filter((s) => s.isSubmitted).length,
      submissions,
    };
  }

  async gradeSubmission(
    tenantId: string,
    submissionId: string,
    marksObtained: number,
    feedback?: string,
  ) {
    return this.prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        marks_obtained: Number(marksObtained),
        feedback: feedback || null,
        graded_at: new Date(),
      },
    });
  }

  // --- EXAMS & TEST SCORES ---

  async createExam(tenantId: string, userId: string, dto: CreateExamDto) {
    const staffId = await this.getStaffProfileId(userId);
    // Security Guard: Enforce class access
    await this.scopingService.enforceClassAccess(tenantId, staffId, dto.classNumber, dto.section);

    return this.prisma.exam.create({
      data: {
        tenant_id: tenantId,
        class_number: dto.classNumber,
        section: dto.section.toUpperCase(),
        subject_id: dto.subjectId || null,
        name: dto.name.trim(),
        exam_date: new Date(dto.examDate),
        max_marks: Number(dto.maxMarks),
        created_by_staff_id: staffId,
      },
      include: {
        subject: true,
      },
    });
  }

  async getExams(tenantId: string, userId: string) {
    const staffId = await this.getStaffProfileId(userId);
    const assigned = await this.scopingService.getAssignedClasses(tenantId, staffId);

    if (assigned.length === 0) return [];

    return this.prisma.exam.findMany({
      where: {
        tenant_id: tenantId,
        OR: assigned.map((a) => ({
          class_number: a.classNumber,
          section: a.section,
        })),
      },
      include: {
        subject: true,
        scores: true,
      },
      orderBy: { exam_date: 'desc' },
    });
  }

  async getExamScores(tenantId: string, userId: string, examId: string) {
    const staffId = await this.getStaffProfileId(userId);
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
      include: { subject: true },
    });

    if (!exam || exam.tenant_id !== tenantId) {
      throw new NotFoundException(`Exam not found`);
    }

    // Security check
    await this.scopingService.enforceClassAccess(
      tenantId,
      staffId,
      exam.class_number,
      exam.section,
    );

    const students = await this.prisma.studentProfile.findMany({
      where: {
        tenant_id: tenantId,
        current_class: String(exam.class_number),
        current_section: exam.section,
        status: 'ACTIVE',
      },
      include: {
        exam_scores: {
          where: { exam_id: examId },
        },
      },
      orderBy: { roll_no: 'asc' },
    });

    const scoreList = students.map((s) => {
      const score = s.exam_scores[0];
      const marks = score ? score.marks_obtained : 0;
      const gradeLabel = score
        ? score.grade_label
        : this.deriveGradeLabel(marks, exam.max_marks);

      return {
        studentProfileId: s.id,
        name: `${s.first_name} ${s.last_name}`,
        studentCode: s.current_student_code,
        rollNo: s.roll_no,
        marksObtained: score ? score.marks_obtained : 0,
        gradeLabel,
        isGraded: Boolean(score),
      };
    });

    // Calculate class statistics
    const gradedList = scoreList.filter((s) => s.isGraded);
    const totalMarksSum = gradedList.reduce((acc, curr) => acc + curr.marksObtained, 0);
    const classAverage = gradedList.length > 0 ? Math.round((totalMarksSum / gradedList.length) * 10) / 10 : 0;
    const highestScore = gradedList.length > 0 ? Math.max(...gradedList.map((s) => s.marksObtained)) : 0;
    const lowestScore = gradedList.length > 0 ? Math.min(...gradedList.map((s) => s.marksObtained)) : 0;

    return {
      exam,
      totalStudents: students.length,
      gradedCount: gradedList.length,
      classAverage,
      highestScore,
      lowestScore,
      scores: scoreList,
    };
  }

  async saveExamScores(
    tenantId: string,
    userId: string,
    examId: string,
    scores: ExamScoreInputDto[],
  ) {
    const staffId = await this.getStaffProfileId(userId);
    const exam = await this.prisma.exam.findUnique({
      where: { id: examId },
    });

    if (!exam || exam.tenant_id !== tenantId) {
      throw new NotFoundException(`Exam not found`);
    }

    // Security check
    await this.scopingService.enforceClassAccess(
      tenantId,
      staffId,
      exam.class_number,
      exam.section,
    );

    const saved = [];

    for (const item of scores) {
      const gradeLabel = this.deriveGradeLabel(item.marksObtained, exam.max_marks);

      const record = await this.prisma.examScore.upsert({
        where: {
          exam_id_student_profile_id: {
            exam_id: examId,
            student_profile_id: item.studentProfileId,
          },
        },
        update: {
          marks_obtained: Number(item.marksObtained),
          grade_label: gradeLabel,
        },
        create: {
          exam_id: examId,
          student_profile_id: item.studentProfileId,
          marks_obtained: Number(item.marksObtained),
          grade_label: gradeLabel,
        },
      });

      saved.push(record);
    }

    return {
      message: `Successfully saved ${saved.length} exam scores for ${exam.name}`,
      scoresSaved: saved.length,
    };
  }
}
