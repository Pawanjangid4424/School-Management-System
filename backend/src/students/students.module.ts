import { Module } from '@nestjs/common';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { StudentCodeGeneratorService } from './student-code-generator.service';
import { MailboxModule } from '../mailbox/mailbox.module';

@Module({
  imports: [MailboxModule],
  controllers: [StudentsController],
  providers: [StudentsService, StudentCodeGeneratorService],
  exports: [StudentsService, StudentCodeGeneratorService],
})
export class StudentsModule {}
