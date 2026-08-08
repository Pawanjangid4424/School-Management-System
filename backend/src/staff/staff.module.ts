import { Module } from '@nestjs/common';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';
import { StaffIdGeneratorService } from './staff-id-generator.service';
import { MailboxModule } from '../mailbox/mailbox.module';

@Module({
  imports: [MailboxModule],
  controllers: [StaffController],
  providers: [StaffService, StaffIdGeneratorService],
  exports: [StaffService, StaffIdGeneratorService],
})
export class StaffModule {}
