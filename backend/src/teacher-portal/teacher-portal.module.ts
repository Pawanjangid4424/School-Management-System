import { Module } from '@nestjs/common';
import { TeacherPortalController } from './teacher-portal.controller';
import { TeacherPortalService } from './teacher-portal.service';
import { TeacherScopingService } from './teacher-scoping.service';
import { AssignmentsExamsController } from './assignments-exams.controller';
import { AssignmentsExamsService } from './assignments-exams.service';

@Module({
  controllers: [TeacherPortalController, AssignmentsExamsController],
  providers: [TeacherPortalService, TeacherScopingService, AssignmentsExamsService],
  exports: [TeacherPortalService, TeacherScopingService, AssignmentsExamsService],
})
export class TeacherPortalModule {}
