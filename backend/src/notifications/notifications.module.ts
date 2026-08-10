import { Module } from '@nestjs/common';
import { AdminNotificationsController, NotificationsController } from './notifications.controller';
import { NotificationProcessorService } from './notification-processor.service';
import { ResendEmailDispatchService } from './resend-email-dispatch.service';
import { BrevoEmailDispatchService } from './brevo-email-dispatch.service';

@Module({
  controllers: [AdminNotificationsController, NotificationsController],
  providers: [NotificationProcessorService, ResendEmailDispatchService, BrevoEmailDispatchService],
  exports: [NotificationProcessorService, ResendEmailDispatchService, BrevoEmailDispatchService],
})
export class NotificationsModule {}
