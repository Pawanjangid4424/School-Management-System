import { Controller, Post, Get, Put, Body, UseGuards, Request, Param, Patch, Delete, Query, UnauthorizedException } from '@nestjs/common';
import { StudentsService } from './students.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('students')
@UseGuards(JwtAuthGuard)
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createStudent(@Request() req, @Body() dto: CreateStudentDto) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.createStudent(tenantId, dto);
  }

  @Get('section-capacity-and-roll')
  async getSectionCapacityAndRollNumber(
    @Request() req,
    @Query('classNumber') classNumberStr: string,
  ) {
    const tenantId = req.user.tenant_id;
    const classNumber = parseInt(classNumberStr, 10) || 1;
    return this.studentsService.getSectionCapacityAndRollNumber(tenantId, classNumber);
  }

  @Get()
  async findAll(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.findAll(tenantId);
  }

  @Get('by-class-section')
  async getStudentsByClassSection(
    @Request() req,
    @Query('classNumber') classNumber: string,
    @Query('section') section: string,
  ) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.getStudentsByClassSection(tenantId, classNumber, section);
  }

  @Get('active-class-sections')
  async getActiveClassSections(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.getActiveClassSections(tenantId);
  }

  @Get('me')
  async getMe(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id || req.user.userId;
    // We need a way to find a student profile by user_id
    return this.studentsService.findByUserId(userId, tenantId);
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id') id: string) {
    const tenantId = req.user.tenant_id;
    return this.studentsService.findOne(id, tenantId);
  }

  @Put(':id')
  async updateStudent(
    @Param('id') id: string,
    @Body() payload: CreateStudentDto,
    @Request() req
  ) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
      throw new UnauthorizedException('Only admins and teachers can edit students');
    }
    return this.studentsService.updateStudent(id, req.user.tenant_id, payload);
  }

  @Patch(':id/suspend')
  async suspendStudent(
    @Param('id') id: string,
    @Body() payload: { durationDays: number, reason: string },
    @Request() req
  ) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
      throw new UnauthorizedException('Only admins and teachers can suspend students');
    }
    return this.studentsService.suspendStudent(id, req.user.tenant_id, payload.durationDays, payload.reason);
  }

  @Delete(':id')
  async deleteStudent(
    @Param('id') id: string,
    @Request() req
  ) {
    if (req.user.role !== 'ADMIN' && req.user.role !== 'TEACHER') {
      throw new UnauthorizedException('Only admins and teachers can delete students');
    }
    return this.studentsService.deleteStudent(id, req.user.tenant_id, req.user.id || req.user.userId, req.user.username);
  }
}
