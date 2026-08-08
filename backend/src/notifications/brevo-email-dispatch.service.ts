import { Injectable, Logger } from '@nestjs/common';

export interface SendEmailPayload {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

@Injectable()
export class BrevoEmailDispatchService {
  private readonly logger = new Logger(BrevoEmailDispatchService.name);

  /**
   * Sends transactional email using Brevo's REST API.
   * Endpoint: POST https://api.brevo.com/v3/smtp/email
   */
  async sendTransactionalEmail(payload: SendEmailPayload): Promise<{ messageId: string }> {
    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'noreply@school.com';

    if (!apiKey) {
      this.logger.warn('BREVO_API_KEY is missing in process.env. Skipping live API call in dev mode.');
      return { messageId: `mock-brevo-msg-${Date.now()}` };
    }

    const requestBody = {
      sender: {
        email: senderEmail,
        name: 'St. Jude Academic School ERP',
      },
      to: [
        {
          email: payload.toEmail,
          name: payload.toName || 'Recipient',
        },
      ],
      subject: payload.subject,
      htmlContent: payload.htmlContent,
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || `Brevo API HTTP Error ${response.status}`);
      }

      this.logger.log(`Transactional Email sent via Brevo to ${payload.toEmail} (MessageId: ${data.messageId})`);
      return { messageId: data.messageId || 'success' };
    } catch (error: any) {
      this.logger.error(`Brevo Email Dispatch Failed to ${payload.toEmail}: ${error.message}`);
      throw error;
    }
  }
}
