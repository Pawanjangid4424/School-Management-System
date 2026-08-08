import { Injectable, Logger } from '@nestjs/common';
import { MailboxProvider } from './mailbox-provider.interface';

@Injectable()
export class MockMailboxProviderService implements MailboxProvider {
  private readonly logger = new Logger(MockMailboxProviderService.name);

  async createMailbox(
    email: string,
    username: string,
    displayName: string,
  ): Promise<{ success: boolean; providerId: string }> {
    this.logger.log(`[MOCK MAILBOX] Creating mailbox for ${displayName} (${email}, username: ${username})`);
    
    // Simulate API latency (~500ms)
    await new Promise((resolve) => setTimeout(resolve, 500));

    const providerId = `mock-mbox-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    this.logger.log(`[MOCK MAILBOX] Successfully created mailbox. Provider ID: ${providerId}`);

    return {
      success: true,
      providerId,
    };
  }

  async deactivateMailbox(email: string): Promise<{ success: boolean }> {
    this.logger.log(`[MOCK MAILBOX] Deactivating mailbox for ${email}`);
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  }

  async createForwarding(
    oldEmail: string,
    newEmail: string,
    expiryDate: Date,
  ): Promise<{ success: boolean }> {
    this.logger.log(
      `[MOCK MAILBOX] Creating email forwarding from ${oldEmail} -> ${newEmail} (expires: ${expiryDate.toISOString()})`,
    );
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { success: true };
  }
}
