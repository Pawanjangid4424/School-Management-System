import { Module } from '@nestjs/common';
import { TripsTimetableController } from './trips-timetable.controller';
import { TripsTimetableService } from './trips-timetable.service';
import { TeacherPortalModule } from '../teacher-portal/teacher-portal.module';

@Module({
  imports: [TeacherPortalModule],
  controllers: [TripsTimetableController],
  providers: [TripsTimetableService],
  exports: [TripsTimetableService],
})
export class TripsTimetableModule {}
