import { Test, TestingModule } from '@nestjs/testing';
import { TripsTimetableService } from './trips-timetable.service';
import { TeacherScopingService } from '../teacher-portal/teacher-scoping.service';
import { PrismaService } from '../prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

describe('TripsTimetableService (Workflow & Conflict Detection)', () => {
  let service: TripsTimetableService;
  let scopingService: jest.Mocked<Partial<TeacherScopingService>>;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockStaff = { id: 'staff-ravindra-101' };
  const mockStudents = [
    { id: 'student-1', first_name: 'Pawan', last_name: 'Sharma' },
    { id: 'student-2', first_name: 'Anita', last_name: 'Roy' },
  ];

  const mockTrip = {
    id: 'trip-101',
    tenant_id: 'tenant-123',
    class_number: 10,
    section: 'A',
    destination: 'Science Observatory',
    status: 'PENDING_APPROVAL',
    permissions: [
      { id: 'perm-1', student_profile_id: 'student-1', guardian_user_id: 'user-parent-1' },
      { id: 'perm-2', student_profile_id: 'student-2', guardian_user_id: 'user-parent-2' },
    ],
  };

  beforeEach(async () => {
    prismaService = {
      staffProfile: {
        findUnique: jest.fn().mockResolvedValue(mockStaff),
        findFirst: jest.fn().mockResolvedValue(mockStaff),
      } as any,
      trip: {
        create: jest.fn().mockResolvedValue(mockTrip),
        findUnique: jest.fn().mockResolvedValue(mockTrip),
        update: jest.fn().mockResolvedValue({ ...mockTrip, status: 'APPROVED' }),
      } as any,
      studentProfile: {
        findMany: jest.fn().mockResolvedValue(mockStudents),
        findUnique: jest.fn().mockResolvedValue({ id: 'student-1', user: { id: 'u1', current_email: 's1@school.com' }, first_name: 'Pawan', last_name: 'Sharma' }),
      } as any,
      tripPermission: {
        findFirst: jest.fn().mockResolvedValue(null),
        create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'perm-new', ...data })),
      } as any,
      notificationQueueItem: {
        create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'notif-new', ...data })),
      } as any,
      timetableSlot: {
        findFirst: jest.fn().mockResolvedValue(null),
        upsert: jest.fn().mockResolvedValue({ id: 'slot-1' }),
      } as any,
    };

    scopingService = {
      enforceClassAccess: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TripsTimetableService,
        { provide: PrismaService, useValue: prismaService },
        { provide: TeacherScopingService, useValue: scopingService },
      ],
    }).compile();

    service = module.get<TripsTimetableService>(TripsTimetableService);
  });

  describe('TripPermission Creation on Dispatch', () => {
    it('should create 1 TripPermission per selected active student on dispatchConsent', async () => {
      const result = await service.dispatchConsent('tenant-123', 'trip-101', ['student-1', 'student-2']);

      expect(prismaService.tripPermission.create).toHaveBeenCalledTimes(2);
      expect(result.dispatchedCount).toBe(2);
    });
  });

  describe('NotificationQueueItem Dispatch on Trip Approval', () => {
    it('should insert 1 NotificationQueueItem per TripPermission when Admin approves trip', async () => {
      const result = await service.reviewTrip('tenant-123', 'user-admin-1', 'trip-101', 'APPROVED');

      expect(prismaService.notificationQueueItem.create).toHaveBeenCalledTimes(2);
      expect(prismaService.notificationQueueItem.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'TRIP_CONSENT_REQUIRED',
          status: 'PENDING_DISPATCH',
        }),
      });
      expect(result.notificationsQueued).toBe(2);
    });

    it('should set is_locked = true when Admin approves trip', async () => {
      (prismaService.trip.update as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        status: 'APPROVED',
        is_locked: true,
      });

      const result = await service.reviewTrip('tenant-123', 'user-admin-1', 'trip-101', 'APPROVED');
      expect(prismaService.trip.update).toHaveBeenCalledWith({
        where: { id: 'trip-101' },
        data: expect.objectContaining({
          status: 'APPROVED',
          is_locked: true,
        }),
      });
      expect(result.trip.is_locked).toBe(true);
    });
  });

  describe('is_locked Enforcement on Edit', () => {
    it('should throw BadRequestException when attempting to edit a locked trip', async () => {
      (prismaService.trip.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        is_locked: true,
      });

      await expect(
        service.updateTrip('tenant-123', 'user-teacher-1', 'trip-101', {
          destination: 'Updated Destination',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should allow editing an un-locked trip', async () => {
      (prismaService.trip.findUnique as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        is_locked: false,
      });
      (prismaService.trip.update as jest.Mock).mockResolvedValueOnce({
        ...mockTrip,
        destination: 'New Destination',
      });

      const result = await service.updateTrip('tenant-123', 'user-teacher-1', 'trip-101', {
        destination: 'New Destination',
      });

      expect(result.destination).toBe('New Destination');
    });
  });

  describe('Timetable Slot Conflict Detection', () => {
    it('should create timetable slot when no conflict exists', async () => {
      const result = await service.createTimetableSlot('tenant-123', {
        classNumber: 10,
        section: 'A',
        dayOfWeek: 'MONDAY',
        periodNumber: 1,
        startTime: '08:00 AM',
        endTime: '09:00 AM',
        teacherId: 'staff-ravindra-101',
        roomNumber: 'Room 101',
      });

      expect(result).toBeDefined();
    });

    it('should throw BadRequestException on Teacher Conflict (same teacher, same day, same period)', async () => {
      (prismaService.timetableSlot.findFirst as jest.Mock).mockResolvedValueOnce({
        class_number: 11,
        section: 'B',
        teacher_id: 'staff-ravindra-101',
        day_of_week: 'MONDAY',
        period_number: 1,
      });

      await expect(
        service.createTimetableSlot('tenant-123', {
          classNumber: 10,
          section: 'A',
          dayOfWeek: 'MONDAY',
          periodNumber: 1,
          startTime: '08:00 AM',
          endTime: '09:00 AM',
          teacherId: 'staff-ravindra-101',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException on Room Conflict (same room, same day, same period)', async () => {
      (prismaService.timetableSlot.findFirst as jest.Mock).mockResolvedValueOnce({
        class_number: 9,
        section: 'C',
        room_number: 'Lab 2',
        day_of_week: 'TUESDAY',
        period_number: 3,
      });

      await expect(
        service.createTimetableSlot('tenant-123', {
          classNumber: 10,
          section: 'A',
          dayOfWeek: 'TUESDAY',
          periodNumber: 3,
          startTime: '10:00 AM',
          endTime: '11:00 AM',
          roomNumber: 'Lab 2',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
