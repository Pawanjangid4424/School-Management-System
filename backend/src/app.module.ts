import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { TenantsModule } from './tenants/tenants.module';
import { StudentsModule } from './students/students.module';
import { StaffModule } from './staff/staff.module';
import { ClassesModule } from './classes/classes.module';
import { SubjectsModule } from './subjects/subjects.module';
import { RolloverModule } from './rollover/rollover.module';
import { AttendanceModule } from './attendance/attendance.module';
import { TeacherPortalModule } from './teacher-portal/teacher-portal.module';
import { TripsTimetableModule } from './trips-timetable/trips-timetable.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FeesModule } from './fees/fees.module';
import { TransportModule } from './transport/transport.module';
import { StudentPortalModule } from './student-portal/student-portal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    StudentsModule,
    StaffModule,
    ClassesModule,
    SubjectsModule,
    RolloverModule,
    AttendanceModule,
    TeacherPortalModule,
    TripsTimetableModule,
    NotificationsModule,
    FeesModule,
    TransportModule,
    StudentPortalModule,
  ],
})
export class AppModule {}
