import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { StudentCodeGeneratorService } from './student-code-generator.service';
import { MailboxProcessorService } from '../mailbox/mailbox-processor.service';
import { CreateStudentDto } from './dto/create-student.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class StudentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly codeGenerator: StudentCodeGeneratorService,
    private readonly mailboxProcessor: MailboxProcessorService,
  ) {}

  async createStudent(tenantId: string, dto: CreateStudentDto) {
    const {
      firstName,
      lastName,
      classNumber,
      section,
      stream,
      rollNumber,
      admissionYear,
      // Extracted extended fields
      middleName, mobileNo, alternateMobileNo, dateOfBirth, birthPlace, gender,
      maritalStatus, nationality, bloodGroup, religion, category, subCaste, physicallyDisabled,
      aadharNo, passportNo, visaNumber, admissionType, admissionThrough,
      permanentAddress, localAddress, localGuardianAddress, photoUrl, signatureUrl,
      fatherDetails, motherDetails, localGuardianDetails
    } = dto;

    // Section Capacity Check (Max 40 students per section)
    const activeSectionCount = await this.prisma.studentProfile.count({
      where: {
        tenant_id: tenantId,
        current_class: String(classNumber),
        current_section: section.toUpperCase(),
        status: 'ACTIVE',
      },
    });

    if (activeSectionCount >= 40) {
      throw new BadRequestException(`Section ${section.toUpperCase()} is full (40/40 students enrolled). Please select a different section.`);
    }

    // 1. Generate unique student code, username, and email
    const generated = await this.codeGenerator.generate({
      admissionYear,
      classNumber,
      stream,
      rollNumber,
      tenantId,
      firstName,
      section,
    });

    // Generate permanent admission number e.g. ADM-2026-XXXX
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const permanentAdmissionNo = `ADM-${admissionYear}-${randomSuffix}`;
    const defaultPasswordHash = await bcrypt.hash('StudentPass123!', 10);

    let result;
    try {
      // 2. Perform DB Transaction: Create User + StudentProfile + Mailbox Job
      result = await this.prisma.$transaction(async (tx) => {
        // Create User record
        const user = await tx.user.create({
          data: {
            tenant_id: tenantId,
            role: 'STUDENT',
            current_email: generated.email,
            current_username: generated.username,
            password_hash: defaultPasswordHash,
            status: 'ACTIVE',
          },
        });

        // Create StudentProfile record
        const profile = await tx.studentProfile.create({
          data: {
            user_id: user.id,
            tenant_id: tenantId,
            permanent_admission_no: permanentAdmissionNo,
            current_student_code: generated.studentCode,
            current_class: String(classNumber),
            current_section: section.toUpperCase(),
            stream: stream ? stream.toUpperCase() : null,
            roll_no: rollNumber,
            admission_year: admissionYear,
            first_name: firstName.trim(),
            last_name: lastName.trim(),
            status: 'ACTIVE',
            // Extended fields
            middle_name: middleName,
            mobile_no: mobileNo,
            alternate_mobile_no: alternateMobileNo,
            date_of_birth: dateOfBirth ? new Date(dateOfBirth) : null,
            birth_place: birthPlace,
            gender: gender,
            marital_status: maritalStatus,
            nationality: nationality,
            blood_group: bloodGroup,
            religion: religion,
            category: category,
            sub_caste: subCaste,
            physically_disabled: physicallyDisabled,
            aadhar_no: aadharNo,
            passport_no: passportNo,
            visa_number: visaNumber,
            admission_type: admissionType,
            admission_through: admissionThrough,
            permanent_address: permanentAddress as any,
            local_address: localAddress as any,
            local_guardian_address: localGuardianAddress as any,
            photo_url: photoUrl,
            signature_url: signatureUrl,
          },
        });

        const createGuardian = async (details: any, relation: string) => {
          if (!details || (!details.firstName && !details.fullName)) return null;
          
          let guardianUser;
          let guardian;

          if (details.email) {
            guardianUser = await tx.user.findUnique({ where: { current_email: details.email } });
            if (guardianUser) {
              guardian = await tx.guardianProfile.findFirst({ where: { user_id: guardianUser.id } });
            }
          }

          if (!guardianUser) {
            guardianUser = await tx.user.create({
              data: {
                tenant_id: tenantId,
                role: 'PARENT',
                current_email: details.email || `parent_${Date.now()}_${Math.floor(Math.random()*1000)}@placeholder.com`,
                current_username: `parent_${Date.now()}_${Math.floor(Math.random()*1000)}`,
                password_hash: defaultPasswordHash,
                status: 'ACTIVE',
              }
            });
          }

          if (!guardian) {
            guardian = await tx.guardianProfile.create({
              data: {
                user_id: guardianUser.id,
                tenant_id: tenantId,
                full_name: details.fullName || `${details.firstName || ''} ${details.lastName || ''}`.trim(),
                first_name: details.firstName,
                middle_name: details.middleName,
                last_name: details.lastName,
                phone: details.phone,
                alternate_phone: details.alternatePhone,
                email: details.email,
                occupation: details.occupation,
                qualification: details.qualification,
                office_phone: details.officePhone,
                annual_income: details.annualIncome,
                relation_to_student: relation,
              }
            });
          }

          await tx.studentGuardianLink.create({
            data: {
              student_profile_id: profile.id,
              guardian_profile_id: guardian.id,
              is_primary_contact: relation === 'FATHER' // Just default father as primary for now
            }
          });
        };

        if (fatherDetails) await createGuardian(fatherDetails, 'FATHER');
        if (motherDetails) await createGuardian(motherDetails, 'MOTHER');
        if (localGuardianDetails) await createGuardian(localGuardianDetails, 'GUARDIAN');

        // Queue Mailbox Provisioning Job
        const mailboxJob = await tx.mailboxProvisioningJob.create({
          data: {
            user_id: user.id,
            action: 'CREATE_MAILBOX',
            status: 'PENDING',
          },
        });

        return { user, profile, mailboxJob };
      });
    } catch (error) {
      if (error.code === 'P2002') {
        const target = error.meta?.target || 'unknown field';
        throw new BadRequestException(`A record with this ${target} already exists. If it is a parent email, please use a different email or leave it blank.`);
      }
      throw error;
    }

    // 3. Trigger async background mailbox provisioning
    this.mailboxProcessor.processJobAsync(result.mailboxJob.id);

    return {
      id: result.profile.id,
      userId: result.user.id,
      permanentAdmissionNo: result.profile.permanent_admission_no,
      studentCode: result.profile.current_student_code,
      username: result.user.current_username,
      email: result.user.current_email,
      defaultPassword: 'StudentPass123!',
      firstName: result.profile.first_name,
      lastName: result.profile.last_name,
      class: result.profile.current_class,
      section: result.profile.current_section,
      stream: result.profile.stream,
      rollNo: result.profile.roll_no,
      admissionYear: result.profile.admission_year,
      mailboxJob: {
        id: result.mailboxJob.id,
        status: result.mailboxJob.status,
      },
    };
  }

  async findAll(tenantId: string) {
    const students = await this.prisma.studentProfile.findMany({
      where: { tenant_id: tenantId },
      include: {
        user: {
          select: {
            current_email: true,
            current_username: true,
            mailbox_jobs: {
              take: 1,
              orderBy: { created_at: 'desc' },
            },
          },
        },
      },
      orderBy: { permanent_admission_no: 'desc' },
    });

    return students.map((s) => ({
      id: s.id,
      permanentAdmissionNo: s.permanent_admission_no,
      studentCode: s.current_student_code,
      name: `${s.first_name} ${s.last_name}`,
      class: `Grade ${s.current_class}-${s.current_section}`,
      stream: s.stream || 'General',
      rollNo: s.roll_no,
      admissionYear: s.admission_year,
      email: s.user.current_email,
      username: s.user.current_username,
      status: s.status,
      mailboxStatus: s.user.mailbox_jobs[0]?.status || 'COMPLETED',
    }));
  }

  async findOne(id: string, tenantId: string) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, tenant_id: tenantId },
      include: {
        user: {
          select: {
            current_email: true,
            current_username: true,
            status: true,
          }
        },
        guardian_links: {
          include: {
            guardian_profile: true
          }
        }
      }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return student;
  }

  async findByUserId(userId: string, tenantId: string) {
    if (!userId) {
      throw new BadRequestException('User ID is required');
    }
    const student = await this.prisma.studentProfile.findFirst({
      where: { user_id: userId, tenant_id: tenantId },
      include: {
        user: {
          select: {
            current_email: true,
            current_username: true,
            status: true,
          }
        },
        guardian_links: {
          include: {
            guardian_profile: true
          }
        },
        attendance_records: {
          include: { subject: true }
        },
        fee_invoices: {
          include: {
            fee_structure: {
              include: { fee_head: true }
            }
          }
        },
        exam_scores: {
          include: {
            exam: {
              include: { subject: true }
            }
          }
        }
      }
    });

    if (!student) {
      throw new Error('Student profile not found');
    }

    return student;
  }
  async updateStudent(id: string, tenantId: string, dto: any) {
    const {
      firstName, middleName, lastName,
      mobileNo, alternateMobileNo, dateOfBirth, birthPlace, gender,
      maritalStatus, nationality, bloodGroup, religion, category, subCaste, physicallyDisabled,
      aadharNo, passportNo, visaNumber, admissionType, admissionThrough,
      permanentAddress, localAddress, localGuardianAddress, photoUrl, signatureUrl,
      classNumber, section, stream, rollNumber, admissionYear,
      fatherDetails, motherDetails, localGuardianDetails
    } = dto;

    return await this.prisma.$transaction(async (tx) => {
      const student = await tx.studentProfile.update({
        where: { id, tenant_id: tenantId },
        data: {
          first_name: firstName,
          middle_name: middleName,
          last_name: lastName,
          mobile_no: mobileNo,
          alternate_mobile_no: alternateMobileNo,
          date_of_birth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          birth_place: birthPlace,
          gender: gender,
          marital_status: maritalStatus,
          nationality: nationality,
          blood_group: bloodGroup,
          religion: religion,
          category: category,
          sub_caste: subCaste,
          physically_disabled: physicallyDisabled,
          aadhar_no: aadharNo,
          passport_no: passportNo,
          visa_number: visaNumber,
          admission_type: admissionType,
          admission_through: admissionThrough,
          permanent_address: permanentAddress as any,
          local_address: localAddress as any,
          local_guardian_address: localGuardianAddress as any,
          photo_url: photoUrl,
          signature_url: signatureUrl,
          current_class: classNumber ? String(classNumber) : undefined,
          current_section: section ? section.toUpperCase() : undefined,
          stream: stream ? stream.toUpperCase() : undefined,
          roll_no: rollNumber ? Number(rollNumber) : undefined,
          admission_year: admissionYear ? Number(admissionYear) : undefined,
        }
      });

      const updateGuardian = async (details: any, relation: string) => {
        if (!details || (!details.firstName && !details.lastName && !details.phone)) return;
        const link = await tx.studentGuardianLink.findFirst({
          where: { student_profile_id: id, guardian_profile: { relation_to_student: relation } },
          include: { guardian_profile: true }
        });

        if (link) {
          await tx.guardianProfile.update({
            where: { id: link.guardian_profile_id },
            data: {
              full_name: details.fullName || `${details.firstName || ''} ${details.lastName || ''}`.trim(),
              first_name: details.firstName,
              last_name: details.lastName,
              phone: details.phone,
              email: details.email,
              occupation: details.occupation,
              qualification: details.qualification,
              office_phone: details.officePhone,
              annual_income: details.annualIncome,
            }
          });
        }
      };

      await updateGuardian(fatherDetails, 'FATHER');
      await updateGuardian(motherDetails, 'MOTHER');
      await updateGuardian(localGuardianDetails, 'GUARDIAN');

      return student;
    });
  }

  async suspendStudent(id: string, tenantId: string, durationDays: number, reason: string) {
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + durationDays);

    return this.prisma.studentProfile.update({
      where: { id, tenant_id: tenantId },
      data: {
        status: 'SUSPENDED',
        suspension_end_date: endDate,
        suspension_reason: reason,
      }
    });
  }

  async deleteStudent(id: string, tenantId: string, adminUserId: string, adminName: string) {
    // We do a permanent delete (hard delete) of the StudentProfile, 
    // but first we record it in the StudentDeletionLog
    const student = await this.prisma.studentProfile.findFirst({
      where: { id, tenant_id: tenantId }
    });

    if (!student) {
      throw new Error('Student not found');
    }

    return await this.prisma.$transaction(async (tx) => {
      // 1. Create Deletion Log
      await tx.studentDeletionLog.create({
        data: {
          tenant_id: tenantId,
          student_name: `${student.first_name} ${student.last_name}`,
          student_code: student.current_student_code,
          admission_no: student.permanent_admission_no,
          deleted_by_name: adminName,
          deleted_by_id: adminUserId,
          reason: 'Manual deletion by admin',
        }
      });

      // 2. Delete StudentProfile
      await tx.studentProfile.delete({
        where: { id }
      });

      // 3. Delete associated User record to clean up logins (cascade should handle profile, but just in case)
      await tx.user.delete({
        where: { id: student.user_id }
      });

      return { success: true };
    });
  }

  async getActiveClassSections(tenantId: string) {
    const groups = await this.prisma.studentProfile.groupBy({
      by: ['current_class', 'current_section'],
      where: {
        user: { tenant_id: tenantId },
      },
      _count: {
        id: true,
      },
      orderBy: [
        { current_class: 'asc' },
        { current_section: 'asc' },
      ],
    });

    if (!groups || groups.length === 0) {
      return Array.from({ length: 12 }, (_, i) => i + 1).flatMap((c) => [
        { classNumber: c, section: 'A', label: `Grade ${c}-A`, studentCount: 0 },
      ]);
    }

    return groups.map((g) => ({
      classNumber: g.current_class,
      section: g.current_section,
      label: `Grade ${g.current_class}-${g.current_section}`,
      studentCount: g._count.id,
    }));
  }

  async getSectionCapacityAndRollNumber(tenantId: string, classNumber: number) {
    const sections = ['A', 'B', 'C'];
    const result: Record<string, { enrolled: number; max: number; isFull: boolean; nextRollNumber: number }> = {};

    for (const sec of sections) {
      const students = await this.prisma.studentProfile.findMany({
        where: {
          tenant_id: tenantId,
          current_class: String(classNumber),
          current_section: sec,
          status: 'ACTIVE',
        },
        select: { roll_no: true },
      });

      const enrolled = students.length;
      const isFull = enrolled >= 40;

      const usedRolls = new Set(students.map((s) => s.roll_no));
      let nextRollNumber = 1;
      while (usedRolls.has(nextRollNumber)) {
        nextRollNumber++;
      }

      result[sec] = {
        enrolled,
        max: 40,
        isFull,
        nextRollNumber,
      };
    }

    return result;
  }

  async getStudentsByClassSection(tenantId: string, classNumber: number | string, section: string) {
    const students = await this.prisma.studentProfile.findMany({
      where: {
        user: { tenant_id: tenantId },
        current_class: String(classNumber),
        current_section: section.toUpperCase(),
        status: 'ACTIVE',
      },
      orderBy: { roll_no: 'asc' },
    });

    return students.map((s) => ({
      id: s.id,
      name: `${s.first_name} ${s.last_name}`,
      studentCode: s.current_student_code,
      rollNo: s.roll_no,
      classNumber: s.current_class,
      section: s.current_section,
      mobileNo: s.mobile_no,
    }));
  }
}
