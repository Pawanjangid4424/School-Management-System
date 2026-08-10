import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { StudentPortalService } from './student-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('student-portal')
@UseGuards(JwtAuthGuard)
export class StudentPortalController {
  constructor(private readonly studentPortalService: StudentPortalService) {}

  @Get('dashboard-summary')
  async getDashboardSummary(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.userId || req.user.id;
    return this.studentPortalService.getDashboardSummary(tenantId, userId);
  }

  @Get('timetable/self')
  async getTimetableSelf(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.userId || req.user.id;
    return this.studentPortalService.getTimetableSelf(tenantId, userId);
  }

  @Get('attendance/self')
  async getAttendanceSelf(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.userId || req.user.id;
    return this.studentPortalService.getAttendanceSelf(tenantId, userId);
  }

  @Get('leaves')
  async getMyLeaveRequests(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.userId || req.user.id;
    return this.studentPortalService.getMyLeaveRequests(tenantId, userId);
  }

  @Post('leaves')
  async submitLeaveRequest(
    @Request() req,
    @Body() body: { fromDate: string; toDate: string; reason: string },
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.userId || req.user.id;
    return this.studentPortalService.submitLeaveRequest(
      tenantId,
      userId,
      body.fromDate,
      body.toDate,
      body.reason,
    );
  }
}
