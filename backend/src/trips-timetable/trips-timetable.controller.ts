import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import {
  TripsTimetableService,
  CreateTripDto,
  UpdateTripDto,
  CreateTimetableSlotDto,
} from './trips-timetable.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class TripsTimetableController {
  constructor(private readonly service: TripsTimetableService) {}

  // --- TRIPS & CONSENT FORM WORKFLOW ---

  @Get('trips')
  async getTrips(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    const isTeacher = req.user.role === 'TEACHER';
    return this.service.getTrips(tenantId, userId, isTeacher);
  }

  @Post('trips')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async createTrip(@Request() req, @Body() body: CreateTripDto) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.service.createTrip(tenantId, userId, body);
  }

  @Patch('trips/:id')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async updateTrip(@Request() req, @Param('id') tripId: string, @Body() body: UpdateTripDto) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.service.updateTrip(tenantId, userId, tripId, body);
  }

  @Delete('trips/:id')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async deleteTrip(@Request() req, @Param('id') tripId: string) {
    const tenantId = req.user.tenant_id;
    return this.service.deleteTrip(tenantId, tripId);
  }

  @Patch('trips/:id/review')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async reviewTrip(
    @Request() req,
    @Param('id') tripId: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    const tenantId = req.user.tenant_id;
    const reviewerUserId = req.user.id;
    return this.service.reviewTrip(tenantId, reviewerUserId, tripId, body.status);
  }

  @Post('trips/:id/save-roster')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async saveTripRoster(
    @Request() req,
    @Param('id') tripId: string,
    @Body() body: { studentIds: string[] },
  ) {
    const tenantId = req.user.tenant_id;
    return this.service.saveTripRoster(tenantId, tripId, body.studentIds);
  }

  @Post('trips/:id/dispatch-consent')
  @UseGuards(RolesGuard)
  @Roles('TEACHER', 'ADMIN')
  async dispatchConsent(
    @Request() req,
    @Param('id') tripId: string,
    @Body() body: { studentIds: string[] },
  ) {
    const tenantId = req.user.tenant_id;
    return this.service.dispatchConsent(tenantId, tripId, body.studentIds);
  }

  @Get('trips/:id/consent-status')
  async getConsentStatus(@Request() req, @Param('id') tripId: string) {
    const tenantId = req.user.tenant_id;
    return this.service.getConsentStatus(tenantId, tripId);
  }

  @Post('trips/permission/:permissionId/respond')
  async respondToTripPermission(
    @Param('permissionId') permissionId: string,
    @Body() body: { status: 'GRANTED' | 'DENIED'; respondedByName: string; signatureId?: string },
  ) {
    return this.service.respondToTripPermission(permissionId, body.status, body.respondedByName, body.signatureId);
  }

  // --- TIMETABLE & SCHEDULE MANAGEMENT ---

  @Get('timetable')
  async getTimetable(
    @Request() req,
    @Query('classNumber') classNumber?: number,
    @Query('section') section?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    const tenantId = req.user.tenant_id;
    return this.service.getTimetable(tenantId, classNumber, section, teacherId);
  }

  @Post('timetable')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  async createTimetableSlot(@Request() req, @Body() body: CreateTimetableSlotDto) {
    const tenantId = req.user.tenant_id;
    return this.service.createTimetableSlot(tenantId, body);
  }
}

@Controller('public/trips/permission')
export class PublicTripsPermissionController {
  constructor(private readonly service: TripsTimetableService) {}

  @Get(':permissionId')
  async getPublicPermission(@Param('permissionId') permissionId: string) {
    return this.service.getPublicPermission(permissionId);
  }

  @Post(':permissionId/respond')
  async respondPublic(
    @Param('permissionId') permissionId: string,
    @Body() body: { status: 'GRANTED' | 'DENIED'; respondedByName: string; signatureId?: string },
  ) {
    return this.service.respondToTripPermission(permissionId, body.status, body.respondedByName, body.signatureId);
  }
}
