import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class SubjectsService {
  constructor(private readonly prisma: PrismaService) {}

  async createSubject(tenantId: string, name: string, code: string, department: string) {
    const existing = await this.prisma.subject.findFirst({
      where: { tenant_id: tenantId, subject_code: code.toUpperCase() },
    });

    if (existing) {
      throw new BadRequestException(`Subject with code ${code.toUpperCase()} already exists.`);
    }

    return this.prisma.subject.create({
      data: {
        tenant_id: tenantId,
        subject_name: name.trim(),
        subject_code: code.toUpperCase().trim(),
        department: department.trim(),
      },
    });
  }

  async getSubjects(tenantId: string) {
    return this.prisma.subject.findMany({
      where: { tenant_id: tenantId },
      include: {
        class_mappings: true,
      },
      orderBy: { subject_code: 'asc' },
    });
  }

  async mapSubjectToClass(
    tenantId: string,
    subjectId: string,
    classNumber: number,
    section: string,
    stream?: string,
    teacherId?: string,
  ) {
    const mapping = await this.prisma.subjectClassMapping.create({
      data: {
        tenant_id: tenantId,
        subject_id: subjectId,
        class_number: classNumber,
        section: section.toUpperCase(),
        stream: stream ? stream.toUpperCase() : null,
        teacher_id: teacherId || null,
      },
      include: {
        subject: true,
      },
    });

    return mapping;
  }

  async assignSubjectTeacher(mappingId: string, teacherId: string) {
    return this.prisma.subjectClassMapping.update({
      where: { id: mappingId },
      data: { teacher_id: teacherId },
      include: { subject: true },
    });
  }

  async updateSubject(tenantId: string, id: string, name: string, code: string, department: string) {
    return this.prisma.subject.update({
      where: { id },
      data: {
        subject_name: name.trim(),
        subject_code: code.toUpperCase().trim(),
        department: department.trim(),
      },
    });
  }

  async deleteSubject(tenantId: string, id: string) {
    await this.prisma.subjectClassMapping.deleteMany({
      where: { tenant_id: tenantId, subject_id: id },
    });
    return this.prisma.subject.delete({
      where: { id },
    });
  }

  async deleteClassMapping(mappingId: string) {
    return this.prisma.subjectClassMapping.delete({
      where: { id: mappingId },
    });
  }
}
