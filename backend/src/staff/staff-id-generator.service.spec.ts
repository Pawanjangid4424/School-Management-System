import { Test, TestingModule } from '@nestjs/testing';
import { StaffIdGeneratorService } from './staff-id-generator.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException, NotFoundException } from '@nestjs/common';

describe('StaffIdGeneratorService', () => {
  let service: StaffIdGeneratorService;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockTenant = {
    id: 'tenant-123',
    school_name: 'St. Jude Academy',
    school_code: 'SJA001',
    domain: 'stjude.edu',
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
        StaffIdGeneratorService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    service = module.get<StaffIdGeneratorService>(StaffIdGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('Sequence ID & Email Generation', () => {
    it('should generate correct staff ID "101", username "ravindra.101", and email', async () => {
      const result = await service.generate({
        firstName: 'Ravindra',
        staffSequenceNumber: 101,
        tenantId: 'tenant-123',
      });

      expect(result.staffId).toBe('101');
      expect(result.username).toBe('ravindra.101');
      expect(result.email).toBe('ravindra.101@stjude.edu');
    });

    it('should format staff ID correctly for sequence number 102', async () => {
      const result = await service.generate({
        firstName: 'Anjali',
        staffSequenceNumber: 102,
        tenantId: 'tenant-123',
      });

      expect(result.staffId).toBe('102');
      expect(result.username).toBe('anjali.102');
      expect(result.email).toBe('anjali.102@stjude.edu');
    });
  });

  describe('Collision Handling', () => {
    it('should append numeric suffix "2" when username already exists', async () => {
      (prismaService.user.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing-staff-1' })
        .mockResolvedValueOnce(null);

      const result = await service.generate({
        firstName: 'Ravindra',
        staffSequenceNumber: 101,
        tenantId: 'tenant-123',
      });

      expect(result.staffId).toBe('101');
      expect(result.username).toBe('ravindra2.101');
      expect(result.email).toBe('ravindra2.101@stjude.edu');
    });

    it('should increment numeric suffix to "3" when ravindra and ravindra2 exist', async () => {
      (prismaService.user.findFirst as jest.Mock)
        .mockResolvedValueOnce({ id: 'existing-staff-1' })
        .mockResolvedValueOnce({ id: 'existing-staff-2' })
        .mockResolvedValueOnce(null);

      const result = await service.generate({
        firstName: 'Ravindra',
        staffSequenceNumber: 101,
        tenantId: 'tenant-123',
      });

      expect(result.username).toBe('ravindra3.101');
      expect(result.email).toBe('ravindra3.101@stjude.edu');
    });
  });

  describe('Invalid Input Validation', () => {
    it('should throw BadRequestException for empty first name', async () => {
      await expect(
        service.generate({
          firstName: '   ',
          staffSequenceNumber: 101,
          tenantId: 'tenant-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException for sequence number < 1', async () => {
      await expect(
        service.generate({
          firstName: 'Ravindra',
          staffSequenceNumber: 0,
          tenantId: 'tenant-123',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if tenant is not found', async () => {
      (prismaService.tenant.findUnique as jest.Mock).mockResolvedValueOnce(null);

      await expect(
        service.generate({
          firstName: 'Ravindra',
          staffSequenceNumber: 101,
          tenantId: 'non-existent-tenant',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
