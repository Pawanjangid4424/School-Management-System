import { Controller, Get, Post, Body, Query, UseGuards, Request } from '@nestjs/common';
import { TeacherPortalService, MarkAttendanceRecordDto } from './teacher-portal.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class TeacherPortalController {
  constructor(private readonly teacherPortalService: TeacherPortalService) {}

  @Get('classes')
  async getAssignedClasses(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.teacherPortalService.getAssignedClasses(tenantId, userId);
  }

  @Get('dashboard')
  async getDashboard(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.teacherPortalService.getTeacherDashboard(tenantId, userId);
  }

  @Get('attendance/roster')
  async getAttendanceRoster(
    @Request() req,
    @Query('classNumber') classNumber: number,
    @Query('section') section: string,
    @Query('date') dateStr: string,
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.teacherPortalService.getAttendanceRoster(
      tenantId,
      userId,
      Number(classNumber),
      section,
      dateStr,
    );
  }

  @Post('attendance/mark')
  async markAttendance(
    @Request() req,
    @Body()
    body: {
      classNumber: number;
      section: string;
      date: string;
      records: MarkAttendanceRecordDto[];
    },
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.teacherPortalService.markAttendance(
      tenantId,
      userId,
      Number(body.classNumber),
      body.section,
      body.date,
      body.records,
    );
  }
}
