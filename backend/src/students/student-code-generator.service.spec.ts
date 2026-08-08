import { Test, TestingModule } from '@nestjs/testing';
import { StudentCodeGeneratorService } from './student-code-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StudentCodeGeneratorService', () => {
  let service: StudentCodeGeneratorService;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockTenant = {
    id: 'tenant-123',
    school_name: 'Model Demonstration Academy',
    school_code: 'MDA',
    domain: 'mda.edu',
    mail_provider: 'google',
    created_at: new Date(),
  };

  beforeEach(async () => {
    prismaService = {
      tenant: {
        findUnique: jest.fn().mockResolvedValue(mockTenant),
      } as any,
      user: {
        findFirst: jest.fn().mockResolvedValue(null),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentCodeGeneratorService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<StudentCodeGeneratorService>(StudentCodeGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Class without stream (1-10)', () => {
    it('should generate correct code format for Class 6', async () => {
      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 6,
        stream: null,
        rollNumber: 21,
        tenantId: 'tenant-123',
        firstName: 'Pawan',
      });

      expect(result.studentCode).toBe('26MDA060021');
      expect(result.username).toBe('pawan.26mda060021');
      expect(result.email).toBe('pawan.26mda060021@mda.edu');
    });

    it('should omit stream for Class 10 even if stream is provided', async () => {
      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 10,
        stream: 'SCIENCE',
        rollNumber: 5,
        tenantId: 'tenant-123',
        firstName: 'Anita',
      });

      expect(result.studentCode).toBe('26MDA100005');
      expect(result.username).toBe('anita.26mda100005');
    });
  });

  describe('Class with stream (11-12) for all 3 streams', () => {
    it('should generate S for SCIENCE stream in Class 11', async () => {
      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 11,
        stream: 'SCIENCE',
        rollNumber: 8,
        tenantId: 'tenant-123',
        firstName: 'Pawan',
      });

      expect(result.studentCode).toBe('26MDA11S0008');
      expect(result.username).toBe('pawan.26mda11s0008');
      expect(result.email).toBe('pawan.26mda11s0008@mda.edu');
    });

    it('should generate C for COMMERCE stream in Class 12', async () => {
      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 12,
        stream: 'COMMERCE',
        rollNumber: 15,
        tenantId: 'tenant-123',
        firstName: 'Rahul',
      });

      expect(result.studentCode).toBe('26MDA12C0015');
      expect(result.username).toBe('rahul.26mda12c0015');
    });

    it('should generate A for ARTS stream in Class 11', async () => {
      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 11,
        stream: 'ARTS',
        rollNumber: 100,
        tenantId: 'tenant-123',
        firstName: 'Meera',
      });

      expect(result.studentCode).toBe('26MDA11A0100');
      expect(result.username).toBe('meera.26mda11a0100');
    });
  });

  describe('Roll number padding', () => {
    it('should pad single-digit roll number 1 to 0001', async () => {
      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 5,
        rollNumber: 1,
        tenantId: 'tenant-123',
        firstName: 'John',
      });

      expect(result.studentCode).toBe('26MDA050001');
    });

    it('should pad two-digit roll number 21 to 0021', async () => {
      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 6,
        rollNumber: 21,
        tenantId: 'tenant-123',
        firstName: 'Jane',
      });

      expect(result.studentCode).toBe('26MDA060021');
    });

    it('should handle edge case 4-digit roll number 9999', async () => {
      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 8,
        rollNumber: 9999,
        tenantId: 'tenant-123',
        firstName: 'Alex',
      });

      expect(result.studentCode).toBe('26MDA089999');
    });
  });

  describe('Name collision handling', () => {
    it('should append numeric suffix when username/email already exists', async () => {
      // First check returns existing user, second check returns null
      (prismaService.user.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing-user-1' })
        .mockResolvedValueOnce(null);

      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 11,
        stream: 'SCIENCE',
        rollNumber: 8,
        tenantId: 'tenant-123',
        firstName: 'Pawan',
      });

      expect(result.studentCode).toBe('26MDA11S0008');
      expect(result.username).toBe('pawan2.26mda11s0008');
      expect(result.email).toBe('pawan2.26mda11s0008@mda.edu');
    });

    it('should increment suffix until unique username is found (e.g. pawan3)', async () => {
      (prismaService.user.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing-user-1' }) // pawan.code exists
        .mockResolvedValueOnce({ id: 'existing-user-2' }) // pawan2.code exists
        .mockResolvedValueOnce(null);                     // pawan3.code is free

      const result = await service.generate({
        admissionYear: 2026,
        classNumber: 11,
        stream: 'SCIENCE',
        rollNumber: 8,
        tenantId: 'tenant-123',
        firstName: 'Pawan',
      });

      expect(result.username).toBe('pawan3.26mda11s0008');
      expect(result.email).toBe('pawan3.26mda11s0008@mda.edu');
    });
  });

  describe('Invalid inputs validation', () => {
    it('should throw BadRequestException for class > 12', async () => {
      await expect(
        service.generate({
          admissionYear: 2026,
          classNumber: 13,
          rollNumber: 1,
          tenantId: 'tenant-123',
          firstName: 'Pawan',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for class < 1', async () => {
      await expect(
        service.generate({
          admissionYear: 2026,
          classNumber: 0,
          rollNumber: 1,
          tenantId: 'tenant-123',
          firstName: 'Pawan',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for Class 11 missing stream', async () => {
      await expect(
        service.generate({
          admissionYear: 2026,
          classNumber: 11,
          stream: null,
          rollNumber: 1,
          tenantId: 'tenant-123',
          firstName: 'Pawan',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for invalid stream name', async () => {
      await expect(
        service.generate({
          admissionYear: 2026,
          classNumber: 11,
          stream: 'INVALID_STREAM',
          rollNumber: 1,
          tenantId: 'tenant-123',
          firstName: 'Pawan',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for negative roll number', async () => {
      await expect(
        service.generate({
          admissionYear: 2026,
          classNumber: 6,
          rollNumber: -5,
          tenantId: 'tenant-123',
          firstName: 'Pawan',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for roll number > 9999', async () => {
      await expect(
        service.generate({
          admissionYear: 2026,
          classNumber: 6,
          rollNumber: 10000,
          tenantId: 'tenant-123',
          firstName: 'Pawan',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if tenant is not found', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.generate({
          admissionYear: 2026,
          classNumber: 6,
          rollNumber: 1,
          tenantId: 'non-existent-tenant',
          firstName: 'Pawan',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
