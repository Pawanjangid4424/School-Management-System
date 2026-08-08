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
      take: 20,
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

    if (type === 'TRIP_CONSENT_REQUIRED') {
      const perm = await this.prisma.tripPermission.findUnique({
        where: { id: entityId },
        include: { trip: true, student_profile: true },
      });

      const destination = perm?.trip?.destination || 'School Field Trip';
      const tripDate = perm?.trip?.trip_date ? new Date(perm.trip.trip_date).toISOString().split('T')[0] : 'Upcoming Date';
      const studentName = perm?.student_profile ? `${perm.student_profile.first_name} ${perm.student_profile.last_name}` : 'your child';

      return {
        subject: `Consent needed: ${destination} on ${tripDate}`,
        htmlContent: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #d97706;">Action Required: Field Trip Legal Consent</h2>
            <p>Dear Parent / Guardian,</p>
            <p>A new official school field trip has been scheduled for <strong>${studentName}</strong>:</p>
            <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; borderRadius: 8px; margin: 15px 0;">
              <p><strong>Destination:</strong> ${destination}</p>
              <p><strong>Trip Date:</strong> ${tripDate}</p>
              <p><strong>Cost:</strong> ${perm?.trip?.cost ? `$${perm.trip.cost}` : 'Free'}</p>
            </div>
            <p>Please review safety guidelines and submit your consent online:</p>
            <p><a href="http://localhost:3000/parent/trips" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View & Respond to Trip Consent</a></p>
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
            <p><a href="http://localhost:3000/parent/assignments" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Homework Details</a></p>
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
            <p><a href="http://localhost:3000/parent/exams" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">View Grade Sheet</a></p>
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
          <p><a href="http://localhost:3000/parent/attendance" style="background-color: #0f172a; color: white; padding: 10px 20px; text-decoration: none; border-radius: 6px; display: inline-block;">Check Attendance Record</a></p>
        </div>
      `,
    };
  }
}
