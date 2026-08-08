import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface AssignedClassItem {
  classNumber: number;
  section: string;
  stream?: string;
  roleType: 'CLASS_TEACHER' | 'SUBJECT_TEACHER';
  subjectName?: string;
  subjectCode?: string;
}

@Injectable()
export class TeacherScopingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Returns all class/section/subject combinations assigned to a given teacher.
   */
  async getAssignedClasses(tenantId: string, staffProfileId: string): Promise<AssignedClassItem[]> {
    const assigned: AssignedClassItem[] = [];

    // 1. Check Class Teacher assignments
    const classTeacherSections = await this.prisma.classSection.findMany({
      where: {
        tenant_id: tenantId,
        class_teacher_id: staffProfileId,
      },
    });

    for (const sec of classTeacherSections) {
      assigned.push({
        classNumber: sec.class_number,
        section: sec.section,
        stream: sec.stream || undefined,
        roleType: 'CLASS_TEACHER',
      });
    }

    // 2. Check Subject Teacher mappings
    const subjectMappings = await this.prisma.subjectClassMapping.findMany({
      where: {
        tenant_id: tenantId,
        teacher_id: staffProfileId,
      },
      include: {
        subject: true,
      },
    });

    for (const map of subjectMappings) {
      assigned.push({
        classNumber: map.class_number,
        section: map.section,
        stream: map.stream || undefined,
        roleType: 'SUBJECT_TEACHER',
        subjectName: map.subject?.subject_name,
        subjectCode: map.subject?.subject_code,
      });
    }

    return assigned;
  }

  /**
   * Security Guard Check: Verifies if a teacher has authorization to access/mark attendance for a class & section.
   */
  async canAccessClass(
    tenantId: string,
    staffProfileId: string,
    classNumber: number,
    section: string,
  ): Promise<boolean> {
    const assigned = await this.getAssignedClasses(tenantId, staffProfileId);

    const hasPermission = assigned.some(
      (a) => a.classNumber === classNumber && a.section.toUpperCase() === section.toUpperCase(),
    );

    return hasPermission;
  }

  /**
   * Enforces security check, throwing ForbiddenException if teacher is not assigned to the class.
   */
  async enforceClassAccess(
    tenantId: string,
    staffProfileId: string,
    classNumber: number,
    section: string,
  ): Promise<void> {
    const allowed = await this.canAccessClass(tenantId, staffProfileId, classNumber, section);

    if (!allowed) {
      throw new ForbiddenException(
        `Security Access Denied: Teacher (ID: ${staffProfileId}) is not assigned to Grade ${classNumber}-${section}.`,
      );
    }
  }
}
