import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Get()
  async getClasses(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.classesService.getClasses(tenantId);
  }

  @Post('assign-teacher')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async assignClassTeacher(
    @Request() req,
    @Body() body: { className: string; section: string; teacherId: string; teacherName: string },
  ) {
    const tenantId = req.user.tenant_id;
    return this.classesService.assignClassTeacher(
      tenantId,
      body.className,
      body.section,
      body.teacherId,
      body.teacherName,
    );
  }

  @Post('daily-assignment')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async assignDailyTeacher(
    @Request() req,
    @Body() body: {
      classNumber: number;
      section: string;
      date: string;
      periodNumber: number;
      subjectId: string | null;
      originalTeacherId: string | null;
      assignedTeacherId: string;
      reason: string;
    }
  ) {
    const tenantId = req.user.tenant_id;
    return this.classesService.assignDailyTeacher(
      tenantId,
      body.classNumber,
      body.section,
      body.date,
      body.periodNumber,
      body.subjectId,
      body.originalTeacherId,
      body.assignedTeacherId,
      body.reason
    );
  }

  @Post('daily-schedule')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getDailySchedule(
    @Request() req,
    @Body() body: { classNumber: number; section: string; date: string }
  ) {
    const tenantId = req.user.tenant_id;
    return this.classesService.getDailySchedule(
      tenantId,
      body.classNumber,
      body.section,
      body.date
    );
  }
}
