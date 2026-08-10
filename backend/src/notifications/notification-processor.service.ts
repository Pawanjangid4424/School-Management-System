import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { BrevoEmailDispatchService } from './brevo-email-dispatch.service';

@Injectable()
export class NotificationProcessorService {
  private readonly logger = new Logger(NotificationProcessorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly brevoDispatch: BrevoEmailDispatchService,
  ) {}

  /**
   * Enqueues a notification item into NotificationQueueItem table.
   */
  async enqueueNotification(
    userId: string | null,
    recipientEmail: string,
    recipientName: string,
    type: 'TRIP_CONSENT_REQUIRED' | 'ASSIGNMENT_CREATED' | 'EXAM_SCORE_PUBLISHED' | 'LEAVE_REQUEST_REVIEWED',
    relatedEntityId: string,
  ) {
    return this.prisma.notificationQueueItem.create({
      data: {
        user_id: userId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        type,
        related_entity_id: relatedEntityId,
        status: 'PENDING_DISPATCH',
        retries: 0,
      },
    });
  }

  /**
   * Processes all PENDING_DISPATCH notification queue items.
   * Features automatic retry logic (up to 3 max attempts).
   */
  async processPendingNotifications(): Promise<{ processed: number; sent: number; failed: number }> {
    const pendingItems = await this.prisma.notificationQueueItem.findMany({
      where: {
        status: { in: ['PENDING_DISPATCH', 'FAILED'] },
        retries: { lt: 3 },
      },
      take: 50,
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const item of pendingItems) {
      try {
        const emailContent = await this.formatEmailContent(item);
        const recipientEmail = item.recipient_email || 'parent@gmail.com';
        const recipientName = item.recipient_name || 'Parent / Guardian';

        // Dispatch via Brevo REST API
        await this.brevoDispatch.sendTransactionalEmail({
          toEmail: recipientEmail,
          toName: recipientName,
          subject: emailContent.subject,
          htmlContent: emailContent.htmlContent,
        });

        // Mark as SENT on success
        await this.prisma.notificationQueueItem.update({
          where: { id: item.id },
          data: {
            status: 'SENT',
            error_message: null,
          },
        });

        sentCount++;
      } catch (error: any) {
        failedCount++;
        const nextRetries = item.retries + 1;
        const newStatus = nextRetries >= 3 ? 'FAILED' : 'PENDING_DISPATCH';

        await this.prisma.notificationQueueItem.update({
          where: { id: item.id },
          data: {
            retries: nextRetries,
            status: newStatus,
            error_message: error.message || 'Brevo Dispatch Error',
          },
        });
      }
    }

    return {
      processed: pendingItems.length,
      sent: sentCount,
      failed: failedCount,
    };
  }

  /**
   * Formats HTML email template based on notification type.
   */
  async formatEmailContent(item: any): Promise<{ subject: string; htmlContent: string }> {
    const type = item.type;
    const entityId = item.related_entity_id;
    const baseUrl = process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://school-management-system-pink-tau.vercel.app';

    if (type === 'TRIP_CONSENT_REQUIRED') {
      const perm = await this.prisma.tripPermission.findUnique({
        where: { id: entityId },
        include: { trip: true, student_profile: true },
      });

      const destination = perm?.trip?.destination || 'School Field Trip';
      const tripDate = perm?.trip?.trip_date ? new Date(perm.trip.trip_date).toISOString().split('T')[0] : 'Upcoming Date';
      const studentName = perm?.student_profile ? `${perm.student_profile.first_name} ${perm.student_profile.last_name}` : 'your child';
      const studentCode = perm?.student_profile?.current_student_code || '';
      const className = perm?.trip ? `Grade ${perm.trip.class_number}-${perm.trip.section}` : 'Class';
      const departureTime = perm?.trip?.departure_time || '8:00 AM';
      const returnTime = perm?.trip?.return_time || '4:00 PM';
      const costStr = perm?.trip?.cost ? `₹${perm.trip.cost}` : 'Free / Included';

      const consentUrl = `${baseUrl}/student/trips`;

      return {
        subject: `[ACTION REQUIRED] Official Field Trip Parent Consent Form for ${studentName}`,
        htmlContent: `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 16px; overflow: hidden; color: #0f172a; shadow: 0 4px 6px rgba(0,0,0,0.05);">
            
            <!-- Header Banner -->
            <div style="background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); color: #ffffff; padding: 24px 28px; text-align: center; border-bottom: 3px solid #f59e0b;">
              <div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #f59e0b; margin-bottom: 4px;">St. Jude Academic School</div>
              <h1 style="font-size: 20px; font-weight: 700; margin: 0; color: #ffffff;">Field Trip Parent Consent Request</h1>
            </div>

            <!-- Main Content Container -->
            <div style="padding: 28px;">
              <p style="font-size: 14px; color: #334155; margin-top: 0;">Dear Parent / Guardian,</p>
              <p style="font-size: 14px; color: #334155; line-height: 1.5;">An official educational field trip has been scheduled for <strong>${studentName}</strong> (${studentCode} • ${className}). Please review the trip details and submit your authorization online.</p>

              <!-- Trip Card Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin: 20px 0;">
                <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Destination:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${destination}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Trip Date:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${tripDate}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Schedule:</td>
                    <td style="padding: 6px 0; color: #0f172a; font-weight: 700; text-align: right;">${departureTime} - ${returnTime}</td>
                  </tr>
                  <tr>
                    <td style="padding: 6px 0; color: #64748b; font-weight: 500;">Total Cost:</td>
                    <td style="padding: 6px 0; color: #059669; font-weight: 700; text-align: right;">${costStr}</td>
                  </tr>
                </table>
              </div>

              <!-- Action Call to Action Button -->
              <div style="text-align: center; margin: 28px 0 20px 0;">
                <a href="${consentUrl}" style="background-color: #f59e0b; color: #0f172a; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 14px; display: inline-block; box-shadow: 0 2px 4px rgba(245, 158, 11, 0.3);">
                  ✅ Click Here to Grant Consent & Sign Online &rarr;
                </a>
              </div>

              <p style="font-size: 12px; color: #64748b; text-align: center; margin-top: 16px;">
                Alternatively, log into the Parent/Student Portal to review rules, cost breakdown, and submit digital signature.
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0;" />
              <p style="font-size: 11px; color: #94a3b8; text-align: center; margin: 0;">
                St. Jude Academic School Administration • Automated Notification System
              </p>
            </div>
          </div>
        `,
      };
    }

    if (type === 'ASSIGNMENT_CREATED') {
      const assignment = await this.prisma.assignment.findUnique({
        where: { id: entityId },
        include: { subject: true },
      });

      const title = assignment?.title || 'New Assignment';
      const subjectName = assignment?.subject?.subject_name || 'General';
      const dueDate = assignment?.due_date ? new Date(assignment.due_date).toISOString().split('T')[0] : 'TBD';

      return {
        subject: `New Assignment Posted: ${title} (${subjectName})`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #0f172a;">New Coursework Assigned</h2>
            <p>A new homework assignment has been posted for your child's class:</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; borderRadius: 8px; margin: 15px 0;">
              <p><strong>Subject:</strong> ${subjectName}</p>
              <p><strong>Title:</strong> ${title}</p>
              <p><strong>Due Date:</strong> ${dueDate}</p>
            </div>
            <p><a href="${baseUrl}/parent/assignments" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Homework Details</a></p>
          </div>
        `,
      };
    }

    if (type === 'EXAM_SCORE_PUBLISHED') {
      const score = await this.prisma.examScore.findUnique({
        where: { id: entityId },
        include: { exam: { include: { subject: true } }, student_profile: true },
      });

      const examName = score?.exam?.name || 'Examination';
      const grade = score?.grade_label || 'A';
      const studentName = score?.student_profile ? `${score.student_profile.first_name} ${score.student_profile.last_name}` : 'your child';

      return {
        subject: `Exam Score Published: ${examName} - Grade ${grade}`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #059669;">Test Results Published</h2>
            <p>Examination results for <strong>${studentName}</strong> are now available:</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; borderRadius: 8px; margin: 15px 0;">
              <p><strong>Exam:</strong> ${examName}</p>
              <p><strong>Score Obtained:</strong> ${score?.marks_obtained ?? 0} / ${score?.exam?.max_marks ?? 100}</p>
              <p><strong>Derived Grade:</strong> Grade ${grade}</p>
            </div>
            <p><a href="${baseUrl}/parent/exams" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Grade Sheet</a></p>
          </div>
        `,
      };
    }

    // LEAVE_REQUEST_REVIEWED
    const leave = await this.prisma.leaveRequest.findUnique({
      where: { id: entityId },
      include: { student_profile: true },
    });

    const status = leave?.status || 'APPROVED';
    const fromStr = leave?.from_date ? new Date(leave.from_date).toISOString().split('T')[0] : '';
    const toStr = leave?.to_date ? new Date(leave.to_date).toISOString().split('T')[0] : '';

    return {
      subject: `Leave Request ${status}: ${fromStr} to ${toStr}`,
      htmlContent: `
        <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
          <h2>Leave Request ${status}</h2>
          <p>Your leave request for ${fromStr} to ${toStr} has been reviewed and marked as <strong>${status}</strong>.</p>
          <p><a href="${baseUrl}/parent/attendance" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Check Attendance Record</a></p>
        </div>
      `,
    };
  }
}
