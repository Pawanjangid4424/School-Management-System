import { Module } from '@nestjs/common';
import { AdminNotificationsController, NotificationsController } from './notifications.controller';
import { NotificationProcessorService } from './notification-processor.service';
import { BrevoEmailDispatchService } from './brevo-email-dispatch.service';

@Module({
  controllers: [AdminNotificationsController, NotificationsController],
  providers: [NotificationProcessorService, BrevoEmailDispatchService],
  exports: [NotificationProcessorService, BrevoEmailDispatchService],
})
export class NotificationsModule {}
