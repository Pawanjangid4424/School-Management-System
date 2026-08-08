import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export interface CreateVehicleDto {
  registrationNumber: string;
  capacity: number;
  driverName: string;
  driverPhone: string;
  status?: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
}

export interface RouteStopDto {
  stopName: string;
  sequenceOrder: number;
  estimatedPickupTime: string;
  estimatedDropTime: string;
}

export interface CreateRouteDto {
  routeName: string;
  vehicleId?: string;
  description?: string;
  stops: RouteStopDto[];
}

export interface AssignStudentTransportDto {
  studentProfileId: string;
  routeId: string;
  routeStopId: string;
  academicYear: number;
  monthlyFee?: number;
}

@Injectable()
export class TransportService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  // --- VEHICLE FLEET MANAGEMENT ---

  async createVehicle(tenantId: string, dto: CreateVehicleDto) {
    return this.prisma.vehicle.create({
      data: {
        tenant_id: tenantId,
        registration_number: dto.registrationNumber.trim().toUpperCase(),
        capacity: Number(dto.capacity),
        driver_name: dto.driverName.trim(),
        driver_phone: dto.driverPhone.trim(),
        status: dto.status || 'ACTIVE',
      },
    });
  }

  async getVehicles(tenantId: string) {
    const vehicles = await this.prisma.vehicle.findMany({
      where: { tenant_id: tenantId },
      orderBy: { registration_number: 'asc' },
    });

    if (vehicles.length === 0) {
      await this.prisma.vehicle.createMany({
        data: [
          { tenant_id: tenantId, registration_number: 'MH-12-AB-1234', capacity: 40, driver_name: 'Rajesh Kumar', driver_phone: '9876543210' },
          { tenant_id: tenantId, registration_number: 'MH-14-CD-5678', capacity: 30, driver_name: 'Suresh Singh', driver_phone: '9876543211' }
        ]
      });
      return this.prisma.vehicle.findMany({
        where: { tenant_id: tenantId },
        orderBy: { registration_number: 'asc' },
      });
    }

    return vehicles;
  }

  // --- BUS ROUTE MANAGEMENT & STOPS ---

  async createRoute(tenantId: string, dto: CreateRouteDto) {
    if (!dto.stops || dto.stops.length === 0) {
      throw new BadRequestException('A bus route must contain at least one stop location');
    }

    const sortedStops = [...dto.stops]
      .sort((a, b) => (a.sequenceOrder || 0) - (b.sequenceOrder || 0))
      .map((s, idx) => ({
        stop_name: s.stopName.trim(),
        sequence_order: s.sequenceOrder || idx + 1,
        estimated_pickup_time: s.estimatedPickupTime.trim(),
        estimated_drop_time: s.estimatedDropTime.trim(),
      }));

    return this.prisma.route.create({
      data: {
        tenant_id: tenantId,
        route_name: dto.routeName.trim(),
        vehicle_id: dto.vehicleId || null,
        description: dto.description ? dto.description.trim() : null,
        stops: {
          create: sortedStops,
        },
      },
      include: {
        vehicle: true,
        stops: { orderBy: { sequence_order: 'asc' } },
      },
    });
  }

  async deleteRoute(tenantId: string, routeId: string) {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId, tenant_id: tenantId },
    });

    if (!route) {
      throw new NotFoundException('Transport route not found');
    }

    await this.prisma.$transaction([
      this.prisma.studentTransportAssignment.deleteMany({
        where: { route_id: routeId },
      }),
      this.prisma.routeStop.deleteMany({
        where: { route_id: routeId },
      }),
      this.prisma.route.delete({
        where: { id: routeId },
      }),
    ]);

    return { message: `Route ${route.route_name} deleted successfully` };
  }

  async getRoutes(tenantId: string) {
    const routes = await this.prisma.route.findMany({
      where: { tenant_id: tenantId },
      include: {
        vehicle: true,
        stops: { orderBy: { sequence_order: 'asc' } },
        assignments: true,
      },
      orderBy: { route_name: 'asc' },
    });

    return routes.map((r) => ({
      id: r.id,
      routeName: r.route_name,
      description: r.description,
      vehicleRegistration: r.vehicle ? r.vehicle.registration_number : 'Unassigned',
      driverName: r.vehicle ? r.vehicle.driver_name : 'N/A',
      driverPhone: r.vehicle ? r.vehicle.driver_phone : 'N/A',
      stopsCount: r.stops.length,
      assignedStudentsCount: r.assignments.length,
      stops: r.stops,
    }));
  }

  async getRouteById(tenantId: string, routeId: string) {
    const route = await this.prisma.route.findFirst({
      where: { id: routeId, tenant_id: tenantId },
      include: {
        vehicle: true,
        stops: { orderBy: { sequence_order: 'asc' } },
        assignments: {
          include: { student_profile: true },
        },
      },
    });

    if (!route) {
      throw new NotFoundException('Transport route not found');
    }

    return {
      id: route.id,
      routeName: route.route_name,
      description: route.description,
      vehicle: route.vehicle,
      stops: route.stops,
      assignedStudentsCount: route.assignments.length,
    };
  }

  // --- STUDENT ROUTE ASSIGNMENTS ---

  async assignStudent(tenantId: string, dto: AssignStudentTransportDto) {
    const student = await this.prisma.studentProfile.findFirst({
      where: { id: dto.studentProfileId, tenant_id: tenantId },
    });

    if (!student) {
      throw new NotFoundException('Student profile not found');
    }

    const route = await this.prisma.route.findFirst({
      where: { id: dto.routeId, tenant_id: tenantId },
    });

    if (!route) {
      throw new NotFoundException('Transport route not found');
    }

    return this.prisma.studentTransportAssignment.upsert({
      where: {
        student_profile_id_academic_year: {
          student_profile_id: dto.studentProfileId,
          academic_year: Number(dto.academicYear),
        },
      },
      update: {
        route_id: dto.routeId,
        route_stop_id: dto.routeStopId,
        monthly_fee: dto.monthlyFee ? Number(dto.monthlyFee) : null,
      },
      create: {
        student_profile_id: dto.studentProfileId,
        route_id: dto.routeId,
        route_stop_id: dto.routeStopId,
        academic_year: Number(dto.academicYear),
        monthly_fee: dto.monthlyFee ? Number(dto.monthlyFee) : null,
      },
    });
  }

  async getRouteRoster(tenantId: string, routeId: string) {
    const route = await this.getRouteById(tenantId, routeId);

    const assignments = await this.prisma.studentTransportAssignment.findMany({
      where: { route_id: routeId },
      include: {
        student_profile: true,
        route_stop: true,
      },
      orderBy: { route_stop: { sequence_order: 'asc' } },
    });

    const stopsWithRoster = route.stops.map((stop) => {
      const stopStudents = assignments
        .filter((a) => a.route_stop_id === stop.id)
        .map((a) => ({
          assignmentId: a.id,
          studentName: `${a.student_profile.first_name} ${a.student_profile.last_name}`,
          studentCode: a.student_profile.current_student_code,
          class: `Grade ${a.student_profile.current_class}-${a.student_profile.current_section}`,
          monthlyFee: a.monthly_fee,
        }));

      return {
        ...stop,
        studentCount: stopStudents.length,
        students: stopStudents,
      };
    });

    return {
      routeId: route.id,
      routeName: route.routeName,
      vehicle: route.vehicle,
      totalAssignedStudents: assignments.length,
      stops: stopsWithRoster,
    };
  }

  // --- STUDENT SCOPED LOOKUP ---

  async getStudentTransportInfo(user: any, targetStudentProfileId: string) {
    const assignment = await this.prisma.studentTransportAssignment.findFirst({
      where: { student_profile_id: targetStudentProfileId },
      include: {
        route: { include: { vehicle: true } },
        route_stop: true,
        student_profile: true,
      },
      orderBy: { academic_year: 'desc' },
    });

    if (!assignment) {
      return {
        assigned: false,
        message: 'No active transport route assigned for this student.',
      };
    }

    return {
      assigned: true,
      routeName: assignment.route.route_name,
      vehicleRegistration: assignment.route.vehicle?.registration_number || 'N/A',
      driverName: assignment.route.vehicle?.driver_name || 'Unassigned',
      driverPhone: assignment.route.vehicle?.driver_phone || 'N/A',
      stopName: assignment.route_stop.stop_name,
      sequenceOrder: assignment.route_stop.sequence_order,
      estimatedPickupTime: assignment.route_stop.estimated_pickup_time,
      estimatedDropTime: assignment.route_stop.estimated_drop_time,
      monthlyFee: assignment.monthly_fee,
    };
  }
}
