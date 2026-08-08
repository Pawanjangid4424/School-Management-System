import { Module } from '@nestjs/common';
import { RolloverController } from './rollover.controller';
import { RolloverService } from './rollover.service';
import { StudentsModule } from '../students/students.module';
import { MailboxModule } from '../mailbox/mailbox.module';

@Module({
  imports: [StudentsModule, MailboxModule],
  controllers: [RolloverController],
  providers: [RolloverService],
  exports: [RolloverService],
})
export class RolloverModule {}
