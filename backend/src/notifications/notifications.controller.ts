import { Controller, Get, Post, Patch, Body, Param, Request, UseGuards } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationProcessorService } from './notification-processor.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('admin/notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminNotificationsController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly processor: NotificationProcessorService,
  ) {}

  @Get()
  async getNotificationsQueue() {
    return this.prisma.notificationQueueItem.findMany({
      orderBy: { created_at: 'desc' },
      take: 50,
    });
  }

  @Post('process-queue')
  async processQueue() {
    return this.processor.processPendingNotifications();
  }

  @Post(':id/retry')
  async retryNotification(@Param('id') id: string) {
    await this.prisma.notificationQueueItem.update({
      where: { id },
      data: {
        status: 'PENDING_DISPATCH',
        retries: 0,
        error_message: null,
      },
    });

    return this.processor.processPendingNotifications();
  }
}

// In-Memory Notification Settings Store per user role/session
const userNotificationPreferencesMap = new Map<string, any>();

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get('my-notifications')
  async getMyNotifications(@Request() req: any) {
    const tenantId = req.user.tenant_id;

    try {
      const [notices, leaves, assignments, trips, queueItems] = await Promise.all([
        this.prisma.notice.findMany({
          where: tenantId ? { tenant_id: tenantId } : {},
          orderBy: { created_at: 'desc' },
          take: 5,
        }).catch(() => []),
        this.prisma.leaveRequest.findMany({
          orderBy: { created_at: 'desc' },
          take: 5,
        }).catch(() => []),
        this.prisma.assignment.findMany({
          orderBy: { created_at: 'desc' },
          take: 5,
        }).catch(() => []),
        this.prisma.trip.findMany({
          orderBy: { created_at: 'desc' },
          take: 5,
        }).catch(() => []),
        this.prisma.notificationQueueItem.findMany({
          orderBy: { created_at: 'desc' },
          take: 5,
        }).catch(() => []),
      ]);

      const items: any[] = [];

      // Notices
      notices.forEach((n) => {
        items.push({
          id: `notice-${n.id}`,
          type: 'NOTICE',
          icon: '📢',
          title: n.title || 'School Notice',
          content: n.content || 'New official circular published',
          date: n.created_at || new Date(),
        });
      });

      // Leaves
      leaves.forEach((l) => {
        items.push({
          id: `leave-${l.id}`,
          type: 'LEAVE',
          icon: l.status === 'APPROVED' ? '✅' : l.status === 'REJECTED' ? '❌' : '⏳',
          title: `Leave Application — ${l.reason || 'Staff Leave'}`,
          content: `Status: ${l.status || 'PENDING'} (Dates: ${new Date(l.start_date).toLocaleDateString()} - ${new Date(l.end_date).toLocaleDateString()})`,
          date: l.created_at || new Date(),
        });
      });

      // Assignments
      assignments.forEach((a) => {
        items.push({
          id: `assignment-${a.id}`,
          type: 'ASSIGNMENT',
          icon: '📚',
          title: `New Assignment — ${a.title}`,
          content: `Max Marks: ${a.max_marks || 100} | Due Date: ${a.due_date ? new Date(a.due_date).toLocaleDateString() : 'N/A'}`,
          date: a.created_at || new Date(),
        });
      });

      // Trips
      trips.forEach((t) => {
        items.push({
          id: `trip-${t.id}`,
          type: 'TRIP',
          icon: '🏕️',
          title: `Field Trip — ${t.destination_name || 'Excursion'}`,
          content: `Trip Code: ${t.trip_code} | Date: ${new Date(t.start_date).toLocaleDateString()}`,
          date: t.created_at || new Date(),
        });
      });

      // Queue items
      queueItems.forEach((q) => {
        items.push({
          id: `email-${q.id}`,
          type: 'EMAIL',
          icon: '✉️',
          title: `Email Dispatch — ${q.type}`,
          content: `Recipient: ${q.recipient_email} | Status: ${q.status}`,
          date: q.created_at || new Date(),
        });
      });

      // Sort by date descending
      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      return items.slice(0, 10);
    } catch (e) {
      console.error('Error fetching real-time notifications', e);
      return [];
    }
  }

  @Get('settings')
  async getNotificationSettings(@Request() req: any) {
    const userId = req.user.id;
    const existing = userNotificationPreferencesMap.get(userId);

    if (existing) {
      return existing;
    }

    const defaultSettings = {
      emailAlerts: true,
      smsAlerts: false,
      inAppAlerts: true,
      attendanceAlerts: true,
      assignmentAlerts: true,
      examAlerts: true,
      tripAlerts: true,
      noticeAlerts: true,
      feeAlerts: true,
    };

    userNotificationPreferencesMap.set(userId, defaultSettings);
    return defaultSettings;
  }

  @Patch('settings')
  async updateNotificationSettings(@Request() req: any, @Body() body: any) {
    const userId = req.user.id;
    const current = userNotificationPreferencesMap.get(userId) || {};
    const updated = { ...current, ...body };
    userNotificationPreferencesMap.set(userId, updated);
    return { message: 'Notification settings updated successfully', settings: updated };
  }
}
