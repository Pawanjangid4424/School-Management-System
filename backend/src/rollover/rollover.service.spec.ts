import { Test, TestingModule } from '@nestjs/testing';
import { RolloverService } from './rollover.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudentCodeGeneratorService } from '../students/student-code-generator.service';
import { MailboxProcessorService } from '../mailbox/mailbox-processor.service';
import { BadRequestException } from '@nestjs/common';

describe('RolloverService (Stress Test & Edge Cases)', () => {
  let service: RolloverService;
  let prismaService: jest.Mocked<Partial<PrismaService>>;
  let codeGenerator: jest.Mocked<Partial<StudentCodeGeneratorService>>;
  let mailboxProcessor: jest.Mocked<Partial<MailboxProcessorService>>;

  const mockGrade10Student = {
    id: 'student-profile-10',
    user_id: 'user-10',
    tenant_id: 'tenant-123',
    permanent_admission_no: 'ADM-2026-1010',
    current_student_code: '26SJA100005',
    current_class: '10',
    current_section: 'A',
    stream: null,
    roll_no: 5,
    admission_year: 2026,
    first_name: 'Anita',
    last_name: 'Roy',
    status: 'ACTIVE',
    user: {
      id: 'user-10',
      current_email: 'anita.26sja100005@stjude.edu',
      current_username: 'anita.26sja100005',
    },
  };

  const mockGrade12Student = {
    id: 'student-profile-12',
    user_id: 'user-12',
    tenant_id: 'tenant-123',
    permanent_admission_no: 'ADM-2026-1012',
    current_student_code: '26SJA12S0003',
    current_class: '12',
    current_section: 'A',
    stream: 'SCIENCE',
    roll_no: 3,
    admission_year: 2026,
    first_name: 'Liam',
    last_name: 'Chen',
    status: 'ACTIVE',
    user: {
      id: 'user-12',
      current_email: 'liam.26sja12s0003@stjude.edu',
      current_username: 'liam.26sja12s0003',
    },
  };

  beforeEach(async () => {
    prismaService = {
      studentProfile: {
        findMany: jest.fn().mockResolvedValue([mockGrade10Student, mockGrade12Student]),
        findUnique: jest.fn().mockImplementation(({ where }) => {
          if (where.id === 'student-profile-10') return Promise.resolve(mockGrade10Student);
          if (where.id === 'student-profile-12') return Promise.resolve(mockGrade12Student);
          return Promise.resolve(null);
        }),
        update: jest.fn().mockResolvedValue({}),
      } as any,
      studentCodeHistory: {
        create: jest.fn().mockResolvedValue({ id: 'history-1' }),
      } as any,
      user: {
        update: jest.fn().mockResolvedValue({}),
      } as any,
      mailboxProvisioningJob: {
        create: jest.fn().mockResolvedValue({ id: 'job-1' }),
      } as any,
      $transaction: jest.fn().mockImplementation((cb) => cb(prismaService)),
    };

    codeGenerator = {
      generate: jest.fn().mockResolvedValue({
        studentCode: '27SJA11S0005',
        username: 'anita.27sja11s0005',
        email: 'anita.27sja11s0005@stjude.edu',
      }),
    };

    mailboxProcessor = {
      processJobAsync: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolloverService,
        { provide: PrismaService, useValue: prismaService },
        { provide: StudentCodeGeneratorService, useValue: codeGenerator },
        { provide: MailboxProcessorService, useValue: mailboxProcessor },
      ],
    }).compile();

    service = module.get<RolloverService>(RolloverService);
  });

  describe('Class 10 -> 11 Transition & Stream Assignment', () => {
    it('should promote Grade 10 student to Grade 11 with chosen Science stream', async () => {
      const result = await service.executeRollover('tenant-123', 2026, 2027, [
        {
          studentProfileId: 'student-profile-10',
          action: 'PROMOTE',
          targetClass: 11,
          targetSection: 'A',
          targetStream: 'SCIENCE',
          targetRollNo: 5,
          targetYear: 2027,
        },
      ]);

      expect(codeGenerator.generate).toHaveBeenCalledWith({
        admissionYear: 2027,
        classNumber: 11,
        stream: 'SCIENCE',
        rollNumber: 5,
        tenantId: 'tenant-123',
        firstName: 'Anita',
      });
      expect(result.processedCount).toBe(1);
      expect(result.details[0].newCode).toBe('27SJA11S0005');
    });

    it('should throw BadRequestException if Grade 11 promotion is missing stream selection', async () => {
      await expect(
        service.executeRollover('tenant-123', 2026, 2027, [
          {
            studentProfileId: 'student-profile-10',
            action: 'PROMOTE',
            targetClass: 11,
            targetSection: 'A',
            targetStream: undefined,
            targetRollNo: 5,
            targetYear: 2027,
          },
        ]),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('Class 12 Graduation Handling', () => {
    it('should mark Class 12 student as GRADUATED and set status to INACTIVE', async () => {
      const result = await service.executeRollover('tenant-123', 2026, 2027, [
        {
          studentProfileId: 'student-profile-12',
          action: 'GRADUATE',
          targetClass: 12,
          targetSection: 'A',
          targetStream: 'SCIENCE',
          targetRollNo: 3,
          targetYear: 2027,
        },
      ]);

      expect(prismaService.studentProfile.update).toHaveBeenCalledWith({
        where: { id: 'student-profile-12' },
        data: { status: 'INACTIVE' },
      });
      expect(result.details[0].status).toBe('GRADUATED');
    });
  });

  describe('Selective Repeat & Exclusion', () => {
    it('should handle student repeat grade without promoting to next class', async () => {
      const result = await service.executeRollover('tenant-123', 2026, 2027, [
        {
          studentProfileId: 'student-profile-10',
          action: 'REPEAT',
          targetClass: 10,
          targetSection: 'A',
          targetRollNo: 5,
          targetYear: 2027,
        },
      ]);

      expect(codeGenerator.generate).toHaveBeenCalledWith(
        expect.objectContaining({
          classNumber: 10,
          admissionYear: 2027,
        }),
      );
      expect(result.details[0].status).toBe('REPEATED');
    });

    it('should skip excluded students completely', async () => {
      const result = await service.executeRollover('tenant-123', 2026, 2027, [
        {
          studentProfileId: 'student-profile-10',
          action: 'EXCLUDE',
          targetClass: 11,
          targetSection: 'A',
          targetRollNo: 5,
          targetYear: 2027,
        },
      ]);

      expect(result.processedCount).toBe(0);
    });
  });

  describe('Atomic Transaction Safety', () => {
    it('should roll back entire batch if any student in the batch encounters a DB error', async () => {
      (prismaService.$transaction as jest.Mock).mockRejectedValueOnce(
        new Error('DB Constraint Error on Student #23'),
      );

      await expect(
        service.executeRollover('tenant-123', 2026, 2027, [
          {
            studentProfileId: 'student-profile-10',
            action: 'PROMOTE',
            targetClass: 11,
            targetSection: 'A',
            targetStream: 'SCIENCE',
            targetRollNo: 5,
            targetYear: 2027,
          },
        ]),
      ).rejects.toThrow('DB Constraint Error on Student #23');
    });
  });
});
