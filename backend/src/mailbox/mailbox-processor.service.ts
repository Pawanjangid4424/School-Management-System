import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { MockMailboxProviderService } from './mock-mailbox-provider.service';

@Injectable()
export class MailboxProcessorService {
  private readonly logger = new Logger(MailboxProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailboxProvider: MockMailboxProviderService,
  ) {}

  /**
   * Triggers background processing of a queued mailbox provisioning job.
   */
  async processJobAsync(jobId: string) {
    // Process in background without blocking caller thread
    setImmediate(async () => {
      try {
        this.logger.log(`Starting processing for mailbox job: ${jobId}`);

        // Update status to PROCESSING
        const job = await this.prisma.mailboxProvisioningJob.update({
          where: { id: jobId },
          data: { status: 'PROCESSING' },
          include: { user: true },
        });

        if (!job || !job.user) {
          throw new Error(`Job or associated User not found for job ID: ${jobId}`);
        }

        // Call Mailbox Provider
        const result = await this.mailboxProvider.createMailbox(
          job.user.current_email,
          job.user.current_username,
          job.user.current_username,
        );

        // Update status to COMPLETED
        await this.prisma.mailboxProvisioningJob.update({
          where: { id: jobId },
          data: {
            status: result.success ? 'COMPLETED' : 'FAILED',
            provider_response: JSON.stringify(result),
          },
        });

        this.logger.log(`Completed processing for mailbox job: ${jobId}`);
      } catch (error: any) {
        this.logger.error(`Failed processing for mailbox job: ${jobId}`, error);
        await this.prisma.mailboxProvisioningJob.update({
          where: { id: jobId },
          data: {
            status: 'FAILED',
            provider_response: JSON.stringify({ error: error.message || String(error) }),
            retries: { increment: 1 },
          },
        }).catch(() => {});
      }
    });
  }
}
