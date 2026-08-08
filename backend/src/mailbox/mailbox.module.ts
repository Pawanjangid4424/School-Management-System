import { Module } from '@nestjs/common';
import { MockMailboxProviderService } from './mock-mailbox-provider.service';
import { MailboxProcessorService } from './mailbox-processor.service';

@Module({
  providers: [MockMailboxProviderService, MailboxProcessorService],
  exports: [MockMailboxProviderService, MailboxProcessorService],
})
export class MailboxModule {}
