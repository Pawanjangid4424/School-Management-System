import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudentCodeGeneratorService } from '../students/student-code-generator.service';
import { MailboxProcessorService } from '../mailbox/mailbox-processor.service';

export interface PromotionItem {
  studentProfileId: string;
  action: 'PROMOTE' | 'REPEAT' | 'GRADUATE' | 'EXCLUDE';
  targetClass: number;
  targetSection: string;
  targetStream?: string;
  targetRollNo: number;
  targetYear: number;
}

@Injectable()
export class RolloverService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGenerator: StudentCodeGeneratorService,
    private readonly mailboxProcessor: MailboxProcessorService,
  ) {}

  /**
   * Previews student promotions and generated new codes/emails for target academic year.
   */
  async getRolloverPreview(tenantId: string, currentYear: number, targetYear: number) {
    const students = await this.prisma.studentProfile.findMany({
      where: {
        tenant_id: tenantId,
        status: 'ACTIVE',
      },
      include: {
        user: true,
      },
      orderBy: [{ current_class: 'asc' }, { roll_no: 'asc' }],
    });

    const previewList = [];

    for (const student of students) {
      const currentClassNum = parseInt(student.current_class, 10);
      const isGrade12 = currentClassNum >= 12;

      let targetClassNum = isGrade12 ? 12 : currentClassNum + 1;
      let targetStream = student.stream;
      if (targetClassNum >= 11 && !targetStream) {
        targetStream = 'SCIENCE'; // Default stream suggestion for Grade 10 -> 11
      }

      let generatedNew = null;
      if (!isGrade12) {
        generatedNew = await this.codeGenerator.generate({
          admissionYear: targetYear,
          classNumber: targetClassNum,
          stream: targetClassNum >= 11 ? targetStream : null,
          rollNumber: student.roll_no,
          tenantId,
          firstName: student.first_name,
          section: student.current_section,
        });
      }

      previewList.push({
        studentProfileId: student.id,
        name: `${student.first_name} ${student.last_name}`,
        currentClassNum,
        currentClass: `Grade ${student.current_class}-${student.current_section}`,
        currentCode: student.current_student_code,
        currentEmail: student.user.current_email,
        targetClassNum,
        targetClass: isGrade12 ? 'GRADUATED' : `Grade ${targetClassNum}-${student.current_section}`,
        targetSection: student.current_section,
        targetStream: targetStream || null,
        targetRollNo: student.roll_no,
        targetYear,
        newCode: generatedNew ? generatedNew.studentCode : 'GRADUATED',
        newEmail: generatedNew ? generatedNew.email : 'DEACTIVATED',
        newUsername: generatedNew ? generatedNew.username : 'graduated',
        action: isGrade12 ? 'GRADUATE' : 'PROMOTE',
        forwardingGracePeriod: '6 Months Email Forwarding',
      });
    }

    return {
      currentAcademicYear: currentYear,
      targetAcademicYear: targetYear,
      totalStudentsEligible: students.length,
      promotions: previewList,
    };
  }

  /**
   * Executes the bulk Academic Year Rollover.
   * WRAPPED IN A SINGLE ATOMIC TRANSACTION - If any student fails, the entire batch rolls back cleanly!
   */
  async executeRollover(
    tenantId: string,
    currentYear: number,
    targetYear: number,
    promotions: PromotionItem[],
  ) {
    const jobsToTrigger: string[] = [];

    const results = await this.prisma.$transaction(async (tx) => {
      const batchResults = [];

      for (const item of promotions) {
        if (item.action === 'EXCLUDE') {
          continue;
        }

        const student = await tx.studentProfile.findUnique({
          where: { id: item.studentProfileId },
          include: { user: true },
        });

        if (!student || student.tenant_id !== tenantId) {
          throw new BadRequestException(`Student with ID ${item.studentProfileId} not found for this tenant`);
        }

        // 1. Handle Graduation (Class 12)
        if (item.action === 'GRADUATE' || (parseInt(student.current_class, 10) >= 12 && item.action === 'PROMOTE')) {
          await tx.studentProfile.update({
            where: { id: student.id },
            data: { status: 'INACTIVE' },
          });

          await tx.user.update({
            where: { id: student.user_id },
            data: { status: 'INACTIVE' },
          });

          batchResults.push({
            studentProfileId: student.id,
            name: `${student.first_name} ${student.last_name}`,
            oldCode: student.current_student_code,
            newCode: 'GRADUATED',
            status: 'GRADUATED',
          });
          continue;
        }

        // 2. Handle Promotion or Grade Repeat
        const classNumberToUse = item.action === 'REPEAT' ? parseInt(student.current_class, 10) : item.targetClass;

        if (classNumberToUse >= 11 && !item.targetStream) {
          throw new BadRequestException(`Stream selection is required for ${student.first_name} ${student.last_name} entering Grade 11/12.`);
        }

        // Generate new student code for next academic year
        const generated = await this.codeGenerator.generate({
          admissionYear: targetYear,
          classNumber: classNumberToUse,
          stream: classNumberToUse >= 11 ? item.targetStream : null,
          rollNumber: item.targetRollNo,
          tenantId,
          firstName: student.first_name,
          section: item.targetSection,
        });

        const oldCode = student.current_student_code;
        const oldEmail = student.user.current_email;

        // A. Audit Trail Log in student_code_history
        await tx.studentCodeHistory.create({
          data: {
            student_profile_id: student.id,
            old_code: oldCode,
            old_email: oldEmail,
            class_at_time: `Grade ${student.current_class}-${student.current_section}`,
            reason: item.action === 'REPEAT' 
              ? `Grade Repeat (${currentYear} -> ${targetYear})`
              : `Academic Year Rollover Promotion (${currentYear} -> ${targetYear})`,
          },
        });

        // B. Update Student Profile
        await tx.studentProfile.update({
          where: { id: student.id },
          data: {
            current_student_code: generated.studentCode,
            current_class: String(classNumberToUse),
            current_section: item.targetSection.toUpperCase(),
            stream: classNumberToUse >= 11 ? item.targetStream?.toUpperCase() : null,
            admission_year: targetYear,
          },
        });

        // C. Update User record
        await tx.user.update({
          where: { id: student.user_id },
          data: {
            current_username: generated.username,
            current_email: generated.email,
          },
        });

        // D. Create Mailbox Provisioning Job
        const mailboxJob = await tx.mailboxProvisioningJob.create({
          data: {
            user_id: student.user_id,
            action: 'FORWARDING',
            status: 'PENDING',
            provider_response: JSON.stringify({
              oldEmail,
              newEmail: generated.email,
              gracePeriodMonths: 6,
            }),
          },
        });

        jobsToTrigger.push(mailboxJob.id);

        batchResults.push({
          studentProfileId: student.id,
          name: `${student.first_name} ${student.last_name}`,
          action: item.action,
          oldCode,
          newCode: generated.studentCode,
          oldEmail,
          newEmail: generated.email,
          status: item.action === 'REPEAT' ? 'REPEATED' : 'PROMOTED',
        });
      }

      return batchResults;
    });

    for (const jobId of jobsToTrigger) {
      this.mailboxProcessor.processJobAsync(jobId);
    }

    return {
      message: `Successfully executed Academic Year Rollover for ${targetYear}`,
      processedCount: results.length,
      details: results,
    };
  }

  /**
   * Reverts / Undoes the last Academic Year Rollover.
   * Restores student profiles, previous codes, emails, and active status.
   */
  async undoRollover(tenantId: string) {
    const historyRecords = await this.prisma.studentCodeHistory.findMany({
      where: {
        student_profile: { tenant_id: tenantId },
      },
      include: {
        student_profile: {
          include: { user: true },
        },
      },
      orderBy: { changed_at: 'desc' },
    });

    if (historyRecords.length === 0) {
      throw new BadRequestException('No previous rollover history found to undo');
    }

    const studentLatestHistoryMap = new Map<string, typeof historyRecords[0]>();
    for (const rec of historyRecords) {
      if (!studentLatestHistoryMap.has(rec.student_profile_id)) {
        studentLatestHistoryMap.set(rec.student_profile_id, rec);
      }
    }

    const revertedCount = await this.prisma.$transaction(async (tx) => {
      let count = 0;
      for (const [studentId, history] of studentLatestHistoryMap.entries()) {
        const student = history.student_profile;
        if (!student) continue;

        let oldClassStr = '1';
        let oldSectionStr = 'A';

        const match = history.class_at_time.match(/Grade\s*(\d+)-([A-Z0-9]+)/i) || history.class_at_time.match(/(\d+)-([A-Z0-9]+)/i);
        if (match) {
          oldClassStr = match[1];
          oldSectionStr = match[2].toUpperCase();
        }

        // 1. Revert StudentProfile
        await tx.studentProfile.update({
          where: { id: studentId },
          data: {
            current_student_code: history.old_code,
            current_class: oldClassStr,
            current_section: oldSectionStr,
            status: 'ACTIVE',
          },
        });

        // 2. Revert User
        const oldUsername = history.old_email.split('@')[0];
        await tx.user.update({
          where: { id: student.user_id },
          data: {
            current_username: oldUsername,
            current_email: history.old_email,
            status: 'ACTIVE',
          },
        });

        // 3. Clean up history entry
        await tx.studentCodeHistory.delete({
          where: { id: history.id },
        });

        count++;
      }
      return count;
    });

    return {
      message: `Successfully undone rollover and reverted ${revertedCount} student profiles & email accounts.`,
      revertedCount,
    };
  }
}
