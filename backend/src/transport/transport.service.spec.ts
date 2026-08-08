import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { TransportService } from './transport.service';
import { PrismaService } from '../prisma/prisma.service';

describe('TransportService (Route Sequence Ordering & Student Transport Security)', () => {
  let service: TransportService;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockRouteStops = [
    { id: 'stop-3', stop_name: 'Green Park', sequence_order: 3, estimated_pickup_time: '07:45 AM', estimated_drop_time: '03:45 PM' },
    { id: 'stop-1', stop_name: 'Central Bus Terminal', sequence_order: 1, estimated_pickup_time: '07:15 AM', estimated_drop_time: '04:15 PM' },
    { id: 'stop-2', stop_name: 'City Library', sequence_order: 2, estimated_pickup_time: '07:30 AM', estimated_drop_time: '04:00 PM' },
  ];

  const mockAssignment = {
    id: 'assign-1',
    student_profile_id: 'child-101',
    academic_year: 2026,
    monthly_fee: 150,
    route: {
      route_name: 'North City Express (Route 12)',
      vehicle: { registration_number: 'KA-01-AB-1234', driver_name: 'Robert Brown', driver_phone: '+15550199' },
    },
    route_stop: {
      stop_name: 'City Library',
      sequence_order: 2,
      estimated_pickup_time: '07:30 AM',
      estimated_drop_time: '04:00 PM',
    },
    student_profile: { first_name: 'Leo', last_name: 'Vance' },
  };

  beforeEach(async () => {
    prismaService = {
      route: {
        create: jest.fn().mockImplementation((data) => {
          return Promise.resolve({
            id: 'route-new',
            ...data.data,
            stops: data.data.stops?.create || [],
          });
        }),
      } as any,
      studentTransportAssignment: {
        findFirst: jest.fn().mockImplementation(({ where }) => {
          if (where.student_profile_id === 'child-101') {
            return Promise.resolve(mockAssignment);
          }
          return Promise.resolve(null);
        }),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TransportService,
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    service = module.get<TransportService>(TransportService);
  });

  describe('RouteStop Sequence Ordering Engine', () => {
    it('should sort RouteStops by sequenceOrder (1, 2, 3) when provided out of order (3, 1, 2)', async () => {
      const unorderedStops = [
        { stopName: 'Green Park', sequenceOrder: 3, estimatedPickupTime: '07:45 AM', estimatedDropTime: '03:45 PM' },
        { stopName: 'Central Bus Terminal', sequenceOrder: 1, estimatedPickupTime: '07:15 AM', estimatedDropTime: '04:15 PM' },
        { stopName: 'City Library', sequenceOrder: 2, estimatedPickupTime: '07:30 AM', estimatedDropTime: '04:00 PM' },
      ];

      await service.createRoute('tenant-1', {
        routeName: 'North Express',
        stops: unorderedStops,
      });

      expect(prismaService.route.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          route_name: 'North Express',
          stops: {
            create: [
              expect.objectContaining({ stop_name: 'Central Bus Terminal', sequence_order: 1 }),
              expect.objectContaining({ stop_name: 'City Library', sequence_order: 2 }),
              expect.objectContaining({ stop_name: 'Green Park', sequence_order: 3 }),
            ],
          },
        }),
        include: expect.anything(),
      });
    });
  });

  describe('Student Transport Info Lookup', () => {
    it('should return transport details for an enrolled student', async () => {
      const studentUser = { id: 'student-user-1', tenant_id: 'tenant-123', role: 'STUDENT' };
      const info = await service.getStudentTransportInfo(studentUser, 'child-101');

      expect(info.assigned).toBe(true);
      expect(info.routeName).toBe('North City Express (Route 12)');
      expect(info.vehicleRegistration).toBe('KA-01-AB-1234');
      expect(info.driverName).toBe('Robert Brown');
    });

    it('should return unassigned message when no transport assignment exists', async () => {
      const studentUser = { id: 'student-user-1', tenant_id: 'tenant-123', role: 'STUDENT' };
      const info = await service.getStudentTransportInfo(studentUser, 'child-unassigned');

      expect(info.assigned).toBe(false);
      expect(info.message).toContain('No active transport route');
    });
  });
});
