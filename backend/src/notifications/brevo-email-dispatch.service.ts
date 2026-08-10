import { Injectable, Logger } from '@nestjs/common';

export interface SendEmailPayload {
  toEmail: string;
  toName: string;
  subject: string;
  htmlContent: string;
}

export interface SendSmsPayload {
  toPhone: string;
  content: string;
  sender?: string;
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
    const senderEmail = process.env.BREVO_SENDER_EMAIL || 'pawanjangid77734@gmail.com';

    if (!apiKey) {
      this.logger.warn('BREVO_API_KEY is missing in process.env. Skipping live API call in dev mode.');
      return { messageId: `mock-brevo-msg-${Date.now()}` };
    }

    let targetEmail = payload.toEmail;
    // If target email is missing or placeholder (e.g. placeholder.com or example.com), fallback to BREVO_SENDER_EMAIL so actual test emails land in owner's real inbox during testing!
    if (
      !targetEmail ||
      targetEmail.includes('placeholder.com') ||
      targetEmail.includes('example.com') ||
      targetEmail.includes('mock')
    ) {
      targetEmail = senderEmail;
      this.logger.log(`Redirecting placeholder student email ${payload.toEmail} to live test mailbox ${senderEmail}`);
    }

    const requestBody = {
      sender: {
        email: senderEmail,
        name: 'St. Jude Academic School ERP',
      },
      to: [
        {
          email: targetEmail,
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
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.code === 'permission_denied' || (data.message && data.message.includes('not yet activated'))) {
          this.logger.error(`BREVO ACCOUNT ACTIVATION REQUIRED: ${data.message}`);
          throw new Error(`Brevo Account Activation Needed: Log into https://app.brevo.com and click 'Activate Transactional Emails'. (${data.message})`);
        }
        throw new Error(data.message || `Brevo API HTTP Error ${response.status}`);
      }

      this.logger.log(`Transactional Email sent via Brevo to ${targetEmail} (MessageId: ${data.messageId})`);
      return { messageId: data.messageId || 'success' };
    } catch (error: any) {
      this.logger.error(`Brevo Email Dispatch Failed to ${targetEmail}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Sends transactional SMS using Brevo's REST API.
   * Endpoint: POST https://api.brevo.com/v3/transactionalSMS/sms
   */
  async sendTransactionalSMS(payload: SendSmsPayload): Promise<{ messageId?: string }> {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      this.logger.warn('BREVO_API_KEY is missing. Skipping SMS API call.');
      return {};
    }

    let formattedPhone = payload.toPhone ? payload.toPhone.trim() : '';
    if (formattedPhone && !formattedPhone.startsWith('+')) {
      const clean = formattedPhone.replace(/\D/g, '');
      formattedPhone = clean.length === 10 ? `+91${clean}` : `+${clean}`;
    }

    if (!formattedPhone || formattedPhone.length < 10) {
      this.logger.warn(`Invalid recipient phone: ${payload.toPhone}. Skipping SMS.`);
      return {};
    }

    const requestBody = {
      sender: payload.sender || 'SchoolERP',
      recipient: formattedPhone,
      content: payload.content,
    };

    try {
      const response = await fetch('https://api.brevo.com/v3/transactionalSMS/sms', {
        method: 'POST',
        headers: {
          accept: 'application/json',
          'api-key': apiKey,
          'content-type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();
      if (response.ok) {
        this.logger.log(`Transactional SMS sent via Brevo to ${formattedPhone}`);
        return { messageId: data.messageId };
      } else {
        this.logger.warn(`Brevo SMS API Response: ${JSON.stringify(data)}`);
      }
    } catch (error: any) {
      this.logger.error(`Brevo SMS Dispatch Failed to ${formattedPhone}: ${error.message}`);
    }
    return {};
  }
}
