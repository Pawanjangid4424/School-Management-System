import { Controller, Get, Post, Patch, Body, Query, Param, UseGuards, Request } from '@nestjs/common';
import { AttendanceService } from './attendance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller()
@UseGuards(JwtAuthGuard)
export class AttendanceController {
  constructor(private readonly attendanceService: AttendanceService) {}

  @Get('attendance/summary')
  async getSummary(
    @Request() req,
    @Query('date') dateStr?: string
  ) {
    const tenantId = req.user.tenant_id;
    return this.attendanceService.getSummary(tenantId, dateStr);
  }

  @Get('attendance/defaulters')
  async getDefaulters(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.attendanceService.getDefaulters(tenantId);
  }

  @Get('attendance/policy')
  async getPolicy(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.attendanceService.getPolicy(tenantId);
  }

  @Post('attendance/policy')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updatePolicy(
    @Request() req,
    @Body() body: { minPercent: number; halfDayWeight: number },
  ) {
    const tenantId = req.user.tenant_id;
    return this.attendanceService.updatePolicy(tenantId, body.minPercent, body.halfDayWeight);
  }

  @Get('leave-requests')
  async getLeaveRequests(
    @Request() req,
    @Query('status') statusFilter?: string,
  ) {
    const tenantId = req.user.tenant_id;
    return this.attendanceService.getLeaveRequests(tenantId, statusFilter);
  }

  @Patch('leave-requests/:id/review')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'TEACHER')
  async reviewLeaveRequest(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { status: 'APPROVED' | 'REJECTED' },
  ) {
    const reviewerUserId = req.user.userId || req.user.id;
    return this.attendanceService.reviewLeaveRequest(id, reviewerUserId, body.status);
  }
}
