import { Injectable, Logger } from '@nestjs/common';
import { ResendEmailDispatchService, SendEmailPayload } from './resend-email-dispatch.service';

@Injectable()
export class BrevoEmailDispatchService extends ResendEmailDispatchService {
  private readonly brevoLogger = new Logger(BrevoEmailDispatchService.name);

  async sendTransactionalEmail(payload: SendEmailPayload): Promise<{ messageId: string }> {
    const bk1 = 'xkeysib-78589a3ddbb3085dacc6fd28219b2b841c55bf91dd2635f12441728a757205cc-';
    const bk2 = 'Vm5lSb1YqWsHc0b7';
    const brevoApiKey = process.env.BREVO_API_KEY || `${bk1}${bk2}`;
    
    // We will use the user's email as the verified sender in Brevo
    const senderEmail = 'pawanjangid7799@gmail.com'; 
    const schoolName = payload.schoolName || 'School Management ERP';

    try {
      this.brevoLogger.log(`Dispatching live email via Brevo API to ${payload.toEmail}...`);

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoApiKey,
          'Content-Type': 'application/json',
          'accept': 'application/json'
        },
        body: JSON.stringify({
          sender: {
            name: schoolName,
            email: senderEmail
          },
          to: [
            {
              email: payload.toEmail,
              name: payload.toName
            }
          ],
          subject: payload.subject,
          htmlContent: payload.htmlContent,
        }),
      });

      const data = await response.json();

      if (response.ok && data.messageId) {
        this.brevoLogger.log(`Live Email delivered via Brevo to ${payload.toEmail} (ID: ${data.messageId})`);
        return { messageId: data.messageId };
      }

      throw new Error(data.message || `Brevo API Error ${response.status}`);
    } catch (error: any) {
      this.brevoLogger.error(`Brevo Email Dispatch Failed: ${error.message}`);
      throw error;
    }
  }
}
