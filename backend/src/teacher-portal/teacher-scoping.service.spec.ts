import { Test, TestingModule } from '@nestjs/testing';
import { TeacherScopingService } from './teacher-scoping.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException } from '@nestjs/common';

describe('TeacherScopingService (Security Access Control)', () => {
  let service: TeacherScopingService;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockClassTeacherSection = {
    id: 'cs-1',
    tenant_id: 'tenant-123',
    class_number: 10,
    section: 'A',
    stream: null,
    capacity: 40,
    class_teacher_id: 'staff-ravindra-101',
  };

  const mockSubjectMapping = {
    id: 'scm-1',
    tenant_id: 'tenant-123',
    subject_id: 'sub-phy',
    class_number: 11,
    section: 'B',
    stream: 'SCIENCE',
    teacher_id: 'staff-ravindra-101',
    subject: {
      subject_name: 'Physics',
      subject_code: 'PHY101',
    },
  };

  beforeEach(async () => {
    prismaService = {
      classSection: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.class_teacher_id === 'staff-ravindra-101') {
            return Promise.resolve([mockClassTeacherSection]);
          }
          return Promise.resolve([]);
        }),
      } as any,
      subjectClassMapping: {
        findMany: jest.fn().mockImplementation(({ where }) => {
          if (where.teacher_id === 'staff-ravindra-101') {
            return Promise.resolve([mockSubjectMapping]);
          }
          return Promise.resolve([]);
        }),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeacherScopingService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<TeacherScopingService>(TeacherScopingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getAssignedClasses', () => {
    it('should derive both Class Teacher and Subject Teacher assigned classes', async () => {
      const assigned = await service.getAssignedClasses('tenant-123', 'staff-ravindra-101');

      expect(assigned.length).toBe(2);
      expect(assigned[0]).toEqual({
        classNumber: 10,
        section: 'A',
        stream: undefined,
        roleType: 'CLASS_TEACHER',
      });
      expect(assigned[1]).toEqual({
        classNumber: 11,
        section: 'B',
        stream: 'SCIENCE',
        roleType: 'SUBJECT_TEACHER',
        subjectName: 'Physics',
        subjectCode: 'PHY101',
      });
    });
  });

  describe('Security Access Guard Checks', () => {
    it('should allow access to assigned Grade 10-A (Class Teacher)', async () => {
      const canAccess = await service.canAccessClass('tenant-123', 'staff-ravindra-101', 10, 'A');
      expect(canAccess).toBe(true);

      await expect(
        service.enforceClassAccess('tenant-123', 'staff-ravindra-101', 10, 'A'),
      ).resolves.not.toThrow();
    });

    it('should allow access to assigned Grade 11-B (Subject Teacher)', async () => {
      const canAccess = await service.canAccessClass('tenant-123', 'staff-ravindra-101', 11, 'B');
      expect(canAccess).toBe(true);
    });

    it('should DENY access (throw ForbiddenException) when teacher attempts to access unassigned Grade 12-C', async () => {
      const canAccess = await service.canAccessClass('tenant-123', 'staff-ravindra-101', 12, 'C');
      expect(canAccess).toBe(false);

      await expect(
        service.enforceClassAccess('tenant-123', 'staff-ravindra-101', 12, 'C'),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
