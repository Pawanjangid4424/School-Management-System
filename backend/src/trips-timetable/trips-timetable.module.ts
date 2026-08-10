import { Module } from '@nestjs/common';
import { TripsTimetableController, PublicTripsPermissionController } from './trips-timetable.controller';
import { TripsTimetableService } from './trips-timetable.service';
import { TeacherPortalModule } from '../teacher-portal/teacher-portal.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [TeacherPortalModule, NotificationsModule],
  controllers: [TripsTimetableController, PublicTripsPermissionController],
  providers: [TripsTimetableService],
  exports: [TripsTimetableService],
})
export class TripsTimetableModule {}
