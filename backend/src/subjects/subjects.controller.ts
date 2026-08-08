import { Controller, Get, Post, Put, Delete, Body, Param, Patch, UseGuards, Request } from '@nestjs/common';
import { SubjectsService } from './subjects.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('subjects')
@UseGuards(JwtAuthGuard)
export class SubjectsController {
  constructor(private readonly subjectsService: SubjectsService) {}

  @Get()
  async getSubjects(@Request() req) {
    const tenantId = req.user.tenant_id;
    return this.subjectsService.getSubjects(tenantId);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async createSubject(
    @Request() req,
    @Body() body: { name: string; code: string; department: string },
  ) {
    const tenantId = req.user.tenant_id;
    return this.subjectsService.createSubject(tenantId, body.name, body.code, body.department);
  }

  @Post('map-class')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async mapSubjectToClass(
    @Request() req,
    @Body()
    body: {
      subjectId: string;
      classNumber: number;
      section: string;
      stream?: string;
      teacherId?: string;
    },
  ) {
    const tenantId = req.user.tenant_id;
    return this.subjectsService.mapSubjectToClass(
      tenantId,
      body.subjectId,
      body.classNumber,
      body.section,
      body.stream,
      body.teacherId,
    );
  }

  @Patch('mapping/:id/teacher')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async assignSubjectTeacher(
    @Param('id') mappingId: string,
    @Body() body: { teacherId: string },
  ) {
    return this.subjectsService.assignSubjectTeacher(mappingId, body.teacherId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async updateSubject(
    @Request() req,
    @Param('id') id: string,
    @Body() body: { name: string; code: string; department: string },
  ) {
    const tenantId = req.user.tenant_id;
    return this.subjectsService.updateSubject(tenantId, id, body.name, body.code, body.department);
  }

  @Delete('mapping/:mappingId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteClassMapping(
    @Param('mappingId') mappingId: string,
  ) {
    return this.subjectsService.deleteClassMapping(mappingId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async deleteSubject(
    @Request() req,
    @Param('id') id: string,
  ) {
    const tenantId = req.user.tenant_id;
    return this.subjectsService.deleteSubject(tenantId, id);
  }
}
