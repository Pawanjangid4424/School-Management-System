import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TeacherScopingService } from '../teacher-portal/teacher-scoping.service';

export interface CostItemDto {
  label: string;
  amount: number;
}

export interface CreateTripDto {
  classNumber: number;
  section: string;
  destination: string;
  tripDate: string;
  departureTime: string;
  arrivalTime?: string;
  returnTime: string;
  cost?: number;
  costBreakdown?: CostItemDto[];
  whatToBring?: string[];
  rules?: string[];
  description: string;
  emergencyInstructions?: string;
  emergencyContactPhone1?: string;
  emergencyContactPhone2?: string;
}

export interface UpdateTripDto extends Partial<CreateTripDto> {}

export interface CreateTimetableSlotDto {
  classNumber: number;
  section: string;
  subjectId?: string;
  teacherId?: string;
  dayOfWeek: 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY';
  periodNumber: number;
  startTime: string;
  endTime: string;
  roomNumber?: string;
}

@Injectable()
export class TripsTimetableService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly scopingService: TeacherScopingService,
  ) {}

  /**
   * Helper to get StaffProfile ID for logged-in user.
   */
  async getStaffProfileId(userId: string): Promise<string> {
    const staff = await this.prisma.staffProfile.findUnique({
      where: { user_id: userId },
    });
    if (!staff) {
      const firstStaff = await this.prisma.staffProfile.findFirst();
      return firstStaff ? firstStaff.id : 'staff-mock-id';
    }
    return staff.id;
  }

  // --- TRIPS & CONSENT FORM WORKFLOW ---

  async createTrip(tenantId: string, userId: string, dto: CreateTripDto) {
    const staffId = await this.getStaffProfileId(userId);
    
    let parsedDate: Date;
    try {
      parsedDate = new Date(dto.tripDate);
      if (isNaN(parsedDate.getTime())) {
        parsedDate = new Date();
      }
    } catch {
      parsedDate = new Date();
    }

    // 1. Create Trip record
    const trip = await this.prisma.trip.create({
      data: {
        tenant_id: tenantId,
        class_number: Number(dto.classNumber),
        section: (dto.section || 'A').toUpperCase(),
        created_by_staff_id: staffId,
        destination: (dto.destination || 'School Field Trip').trim(),
        trip_date: parsedDate,
        departure_time: dto.departureTime || '8:00 AM',
        arrival_time: dto.arrivalTime || null,
        return_time: dto.returnTime || '4:00 PM',
        cost: dto.cost ? Number(dto.cost) : null,
        cost_breakdown: dto.costBreakdown ? (dto.costBreakdown as any) : null,
        what_to_bring: dto.whatToBring ? (dto.whatToBring as any) : null,
        rules: dto.rules ? (dto.rules as any) : null,
        description: dto.description ? dto.description.trim() : (dto.destination || 'School Field Trip Proposal'),
        emergency_instructions: dto.emergencyInstructions ? dto.emergencyInstructions.trim() : null,
        emergency_contact_phone1: dto.emergencyContactPhone1 || (dto as any).phone1 || null,
        emergency_contact_phone2: dto.emergencyContactPhone2 || (dto as any).phone2 || null,
        status: 'PENDING_APPROVAL',
        is_locked: false,
      },
    });

    return {
      id: trip.id,
      trip,
      permissionsCreated: 0,
    };
  }

  async updateTrip(tenantId: string, userId: string, tripId: string, dto: UpdateTripDto) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
    });

    if (!trip || trip.tenant_id !== tenantId) {
      throw new NotFoundException('Trip not found');
    }

    if (trip.is_locked) {
      throw new BadRequestException('Trip is locked and cannot be modified once approved and sent to parents');
    }

    const dataToUpdate: any = {};
    if (dto.classNumber !== undefined) dataToUpdate.class_number = dto.classNumber;
    if (dto.section !== undefined) dataToUpdate.section = dto.section.toUpperCase();
    if (dto.destination !== undefined) dataToUpdate.destination = dto.destination.trim();
    if (dto.tripDate !== undefined) dataToUpdate.trip_date = new Date(dto.tripDate);
    if (dto.departureTime !== undefined) dataToUpdate.departure_time = dto.departureTime;
    if (dto.arrivalTime !== undefined) dataToUpdate.arrival_time = dto.arrivalTime;
    if (dto.returnTime !== undefined) dataToUpdate.return_time = dto.returnTime;
    if (dto.cost !== undefined) dataToUpdate.cost = dto.cost ? Number(dto.cost) : null;
    if (dto.costBreakdown !== undefined) dataToUpdate.cost_breakdown = dto.costBreakdown;
    if (dto.whatToBring !== undefined) dataToUpdate.what_to_bring = dto.whatToBring;
    if (dto.rules !== undefined) dataToUpdate.rules = dto.rules;
    if (dto.description !== undefined) dataToUpdate.description = dto.description.trim();
    if (dto.emergencyInstructions !== undefined) dataToUpdate.emergency_instructions = dto.emergencyInstructions;
    if (dto.emergencyContactPhone1 !== undefined) dataToUpdate.emergency_contact_phone1 = dto.emergencyContactPhone1;
    if (dto.emergencyContactPhone2 !== undefined) dataToUpdate.emergency_contact_phone2 = dto.emergencyContactPhone2;

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: dataToUpdate,
    });

    return updatedTrip;
  }

  async dispatchConsent(tenantId: string, tripId: string, studentIds: string[]) {
    // 1. Fetch trip to ensure it exists
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId, tenant_id: tenantId },
    });

    if (!trip) {
      throw new NotFoundException('Trip not found in this tenant');
    }

    // 2. Create permissions for selected students
    const permissions = [];
    for (const studentId of studentIds) {
      const existing = await this.prisma.tripPermission.findFirst({
        where: { trip_id: trip.id, student_profile_id: studentId },
      });

      if (!existing) {
        const perm = await this.prisma.tripPermission.create({
          data: {
            trip_id: trip.id,
            student_profile_id: studentId,
            permission_status: 'PENDING',
          },
        });
        permissions.push(perm);

        // Queue Notification
        const student = await this.prisma.studentProfile.findUnique({
          where: { id: studentId },
          include: { user: true },
        });

        if (student && student.user) {
          await this.prisma.notificationQueueItem.create({
            data: {
              user_id: student.user.id,
              recipient_email: student.user.current_email,
              recipient_name: `${student.first_name} ${student.last_name}`,
              type: 'TRIP_CONSENT_REQUIRED',
              related_entity_id: perm.id,
              status: 'PENDING_DISPATCH',
            },
          });
        }
      }
    }

    return { dispatchedCount: permissions.length };
  }

  async getTrips(tenantId: string, userId: string, isTeacher: boolean = false) {
    if (isTeacher) {
      const staffId = await this.getStaffProfileId(userId);
      return this.prisma.trip.findMany({
        where: {
          tenant_id: tenantId,
          created_by_staff_id: staffId,
        },
        include: {
          permissions: true,
          created_by_staff: true,
        },
        orderBy: { created_at: 'desc' },
      });
    }

    // Admin sees ALL trips
    return this.prisma.trip.findMany({
      where: { tenant_id: tenantId },
      include: {
        permissions: true,
        created_by_staff: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  /**
   * Admin approves or rejects a trip.
   * On APPROVED: sets is_locked = true, inserts NotificationQueueItem row for every TripPermission created for this trip.
   */
  async reviewTrip(tenantId: string, reviewerUserId: string, tripId: string, status: 'APPROVED' | 'REJECTED') {
    const reviewerStaffId = await this.getStaffProfileId(reviewerUserId);

    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: { permissions: true },
    });

    if (!trip || trip.tenant_id !== tenantId) {
      throw new NotFoundException(`Trip not found`);
    }

    const isApproved = status.toUpperCase() === 'APPROVED';

    const updatedTrip = await this.prisma.trip.update({
      where: { id: tripId },
      data: {
        status: status.toUpperCase(),
        is_locked: isApproved ? true : trip.is_locked,
        reviewed_by_staff_id: reviewerStaffId,
      },
    });

    const notificationsCreated = [];

    // If APPROVED, enqueue NotificationQueueItem rows
    if (isApproved) {
      for (const perm of trip.permissions) {
        const notif = await this.prisma.notificationQueueItem.create({
          data: {
            user_id: perm.guardian_user_id || null,
            type: 'TRIP_CONSENT_REQUIRED',
            related_entity_id: perm.id,
            status: 'PENDING_DISPATCH',
          },
        });
        notificationsCreated.push(notif);
      }
    }

    return {
      trip: updatedTrip,
      notificationsQueued: notificationsCreated.length,
    };
  }

  async getConsentStatus(tenantId: string, tripId: string) {
    const trip = await this.prisma.trip.findUnique({
      where: { id: tripId },
      include: {
        created_by_staff: true,
      },
    });

    if (!trip || trip.tenant_id !== tenantId) {
      throw new NotFoundException(`Trip not found`);
    }

    const permissions = await this.prisma.tripPermission.findMany({
      where: { trip_id: tripId },
      include: {
        student_profile: true,
      },
      orderBy: { student_profile: { roll_no: 'asc' } },
    });

    const roster = permissions.map((p) => ({
      permissionId: p.id,
      studentProfileId: p.student_profile_id,
      name: `${p.student_profile.first_name} ${p.student_profile.last_name}`,
      studentCode: p.student_profile.current_student_code,
      rollNo: p.student_profile.roll_no,
      guardianName: p.responded_by_name || 'Parent/Guardian',
      permissionStatus: p.permission_status,
      respondedAt: p.responded_at ? p.responded_at.toISOString() : null,
    }));

    const grantedCount = roster.filter((r) => r.permissionStatus === 'GRANTED').length;
    const deniedCount = roster.filter((r) => r.permissionStatus === 'DENIED').length;
    const pendingCount = roster.filter((r) => r.permissionStatus === 'PENDING').length;

    return {
      trip,
      totalStudents: roster.length,
      grantedCount,
      deniedCount,
      pendingCount,
      roster,
    };
  }

  // --- TIMETABLE & SCHEDULE MANAGEMENT ---

  async createTimetableSlot(tenantId: string, dto: CreateTimetableSlotDto) {
    // 1. Conflict Check: Teacher overlap check (same teacher, same day, same period)
    if (dto.teacherId) {
      const teacherConflict = await this.prisma.timetableSlot.findFirst({
        where: {
          tenant_id: tenantId,
          teacher_id: dto.teacherId,
          day_of_week: dto.dayOfWeek,
          period_number: Number(dto.periodNumber),
        },
      });

      if (teacherConflict) {
        throw new BadRequestException(
          `Timetable Conflict: Teacher is already scheduled for Grade ${teacherConflict.class_number}-${teacherConflict.section} during Period ${dto.periodNumber} on ${dto.dayOfWeek}.`,
        );
      }
    }

    // 2. Conflict Check: Room overlap check (same room, same day, same period)
    if (dto.roomNumber) {
      const roomConflict = await this.prisma.timetableSlot.findFirst({
        where: {
          tenant_id: tenantId,
          room_number: dto.roomNumber.trim(),
          day_of_week: dto.dayOfWeek,
          period_number: Number(dto.periodNumber),
        },
      });

      if (roomConflict) {
        throw new BadRequestException(
          `Timetable Conflict: Room ${dto.roomNumber} is already occupied by Grade ${roomConflict.class_number}-${roomConflict.section} during Period ${dto.periodNumber} on ${dto.dayOfWeek}.`,
        );
      }
    }

    // 3. Upsert slot using unique constraint @@unique([class_number, section, day_of_week, period_number])
    return this.prisma.timetableSlot.upsert({
      where: {
        class_number_section_day_of_week_period_number: {
          class_number: Number(dto.classNumber),
          section: dto.section.toUpperCase(),
          day_of_week: dto.dayOfWeek,
          period_number: Number(dto.periodNumber),
        },
      },
      update: {
        subject_id: dto.subjectId || null,
        teacher_id: dto.teacherId || null,
        start_time: dto.startTime,
        end_time: dto.endTime,
        room_number: dto.roomNumber || null,
      },
      create: {
        tenant_id: tenantId,
        class_number: Number(dto.classNumber),
        section: dto.section.toUpperCase(),
        subject_id: dto.subjectId || null,
        teacher_id: dto.teacherId || null,
        day_of_week: dto.dayOfWeek,
        period_number: Number(dto.periodNumber),
        start_time: dto.startTime,
        end_time: dto.endTime,
        room_number: dto.roomNumber || null,
      },
      include: {
        subject: true,
        teacher: true,
      },
    });
  }

  async getTimetable(tenantId: string, classNumber?: number, section?: string, teacherId?: string) {
    return this.prisma.timetableSlot.findMany({
      where: {
        tenant_id: tenantId,
        ...(classNumber ? { class_number: Number(classNumber) } : {}),
        ...(section ? { section: section.toUpperCase() } : {}),
        ...(teacherId ? { teacher_id: teacherId } : {}),
      },
      include: {
        subject: true,
        teacher: true,
      },
      orderBy: [{ day_of_week: 'asc' }, { period_number: 'asc' }],
    });
  }
}
