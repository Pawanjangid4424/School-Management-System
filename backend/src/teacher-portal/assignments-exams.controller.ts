import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import {
  AssignmentsExamsService,
  CreateAssignmentDto,
  CreateExamDto,
  ExamScoreInputDto,
} from './assignments-exams.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('teacher')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('TEACHER', 'ADMIN')
export class AssignmentsExamsController {
  constructor(private readonly assignmentsExamsService: AssignmentsExamsService) {}

  // --- ASSIGNMENTS ---

  @Get('assignments')
  async getAssignments(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.assignmentsExamsService.getAssignments(tenantId, userId);
  }

  @Post('assignments')
  async createAssignment(@Request() req, @Body() body: CreateAssignmentDto) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.assignmentsExamsService.createAssignment(tenantId, userId, body);
  }

  @Get('assignments/:id/submissions')
  async getAssignmentSubmissions(@Request() req, @Param('id') assignmentId: string) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.assignmentsExamsService.getAssignmentSubmissions(tenantId, userId, assignmentId);
  }

  @Patch('assignments/submissions/:id')
  async gradeSubmission(
    @Request() req,
    @Param('id') submissionId: string,
    @Body() body: { marksObtained: number; feedback?: string },
  ) {
    const tenantId = req.user.tenant_id;
    return this.assignmentsExamsService.gradeSubmission(
      tenantId,
      submissionId,
      body.marksObtained,
      body.feedback,
    );
  }

  // --- EXAMS & SCORES ---

  @Get('exams')
  async getExams(@Request() req) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.assignmentsExamsService.getExams(tenantId, userId);
  }

  @Post('exams')
  async createExam(@Request() req, @Body() body: CreateExamDto) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.assignmentsExamsService.createExam(tenantId, userId, body);
  }

  @Get('exams/:id/scores')
  async getExamScores(@Request() req, @Param('id') examId: string) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.assignmentsExamsService.getExamScores(tenantId, userId, examId);
  }

  @Post('exams/:id/scores')
  async saveExamScores(
    @Request() req,
    @Param('id') examId: string,
    @Body() body: { scores: ExamScoreInputDto[] },
  ) {
    const tenantId = req.user.tenant_id;
    const userId = req.user.id;
    return this.assignmentsExamsService.saveExamScores(tenantId, userId, examId, body.scores);
  }
}
