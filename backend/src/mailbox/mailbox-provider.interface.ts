export interface MailboxProvider {
  createMailbox(
    email: string,
    username: string,
    displayName: string,
  ): Promise<{ success: boolean; providerId: string }>;

  deactivateMailbox(
    email: string,
  ): Promise<{ success: boolean }>;

  createForwarding(
    oldEmail: string,
    newEmail: string,
    expiryDate: Date,
  ): Promise<{ success: boolean }>;
}
