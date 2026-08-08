import { Test, TestingModule } from '@nestjs/testing';
import { AssignmentsExamsService } from './assignments-exams.service';
import { TeacherScopingService } from './teacher-scoping.service';
import { PrismaService } from '../prisma/prisma.service';
import { ForbiddenException, NotFoundException } from '@nestjs/common';

describe('AssignmentsExamsService (Grade Derivation & Access Scoping)', () => {
  let service: AssignmentsExamsService;
  let scopingService: jest.Mocked<Partial<TeacherScopingService>>;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockStaff = { id: 'staff-ravindra-101' };

  beforeEach(async () => {
    prismaService = {
      staffProfile: {
        findUnique: jest.fn().mockResolvedValue(mockStaff),
        findFirst: jest.fn().mockResolvedValue(mockStaff),
      } as any,
      assignment: {
        create: jest.fn().mockResolvedValue({ id: 'assign-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      } as any,
      exam: {
        create: jest.fn().mockResolvedValue({ id: 'exam-1' }),
        findMany: jest.fn().mockResolvedValue([]),
      } as any,
    };

    scopingService = {
      enforceClassAccess: jest.fn().mockImplementation((tenantId, staffId, classNum, sec) => {
        if (classNum === 10 && sec === 'A') {
          return Promise.resolve(); // Access granted
        }
        return Promise.reject(new ForbiddenException('Security Access Denied: Unassigned class'));
      }),
      getAssignedClasses: jest.fn().mockResolvedValue([
        { classNumber: 10, section: 'A', roleType: 'CLASS_TEACHER' },
      ]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AssignmentsExamsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: TeacherScopingService, useValue: scopingService },
      ],
    }).compile();

    service = module.get<AssignmentsExamsService>(AssignmentsExamsService);
  });

  describe('Grade Label Derivation Logic', () => {
    it('should derive correct letter grades based on percentage ranges', () => {
      expect(service.deriveGradeLabel(95, 100)).toBe('A+');
      expect(service.deriveGradeLabel(85, 100)).toBe('A');
      expect(service.deriveGradeLabel(75, 100)).toBe('B');
      expect(service.deriveGradeLabel(65, 100)).toBe('C');
      expect(service.deriveGradeLabel(55, 100)).toBe('D');
      expect(service.deriveGradeLabel(45, 100)).toBe('F');
    });

    it('should handle scaled maxMarks correctly (e.g., 45 out of 50 = 90% = A+)', () => {
      expect(service.deriveGradeLabel(45, 50)).toBe('A+');
      expect(service.deriveGradeLabel(35, 50)).toBe('B'); // 70%
      expect(service.deriveGradeLabel(20, 50)).toBe('F'); // 40%
    });
  });

  describe('Assignment Security Access Scoping Enforcement', () => {
    it('should allow teacher to create assignment for assigned class Grade 10-A', async () => {
      const result = await service.createAssignment('tenant-123', 'user-teacher-1', {
        classNumber: 10,
        section: 'A',
        title: 'Algebra Worksheet',
        description: 'Solve problems 1 to 20',
        dueDate: '2026-08-10',
      });

      expect(scopingService.enforceClassAccess).toHaveBeenCalledWith('tenant-123', 'staff-ravindra-101', 10, 'A');
      expect(result).toBeDefined();
    });

    it('should DENY assignment creation (throw ForbiddenException) for unassigned class Grade 12-C', async () => {
      await expect(
        service.createAssignment('tenant-123', 'user-teacher-1', {
          classNumber: 12,
          section: 'C',
          title: 'Physics Homework',
          description: 'Quantum Mechanics',
          dueDate: '2026-08-10',
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('Exam & Test Scores Security Access Scoping Enforcement', () => {
    it('should allow teacher to create exam for assigned class Grade 10-A', async () => {
      const result = await service.createExam('tenant-123', 'user-teacher-1', {
        classNumber: 10,
        section: 'A',
        name: 'Mid-Term Mathematics',
        examDate: '2026-08-15',
        maxMarks: 100,
      });

      expect(scopingService.enforceClassAccess).toHaveBeenCalledWith('tenant-123', 'staff-ravindra-101', 10, 'A');
      expect(result).toBeDefined();
    });

    it('should DENY exam creation (throw ForbiddenException) for unassigned class Grade 12-C', async () => {
      await expect(
        service.createExam('tenant-123', 'user-teacher-1', {
          classNumber: 12,
          section: 'C',
          name: 'Final Organic Chemistry',
          examDate: '2026-08-15',
          maxMarks: 100,
        }),
      ).rejects.toThrow(ForbiddenException);
    });
  });
});
