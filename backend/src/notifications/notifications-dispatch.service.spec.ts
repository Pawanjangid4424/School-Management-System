import { Test, TestingModule } from '@nestjs/testing';
import { NotificationProcessorService } from './notification-processor.service';
import { BrevoEmailDispatchService } from './brevo-email-dispatch.service';
import { PrismaService } from '../prisma/prisma.service';

describe('NotificationProcessorService (Brevo Dispatch & Retry Engine)', () => {
  let processor: NotificationProcessorService;
  let brevoDispatch: jest.Mocked<Partial<BrevoEmailDispatchService>>;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  const mockTripPerm = {
    id: 'perm-1',
    trip: { destination: 'Science Observatory', trip_date: new Date('2026-09-15'), cost: 25 },
    student_profile: { first_name: 'Eleanor', last_name: 'Vance' },
  };

  const mockAssignment = {
    id: 'assign-1',
    title: 'Algebra Quadratic Equations',
    due_date: new Date('2026-09-20'),
    subject: { subject_name: 'Mathematics' },
  };

  const mockExamScore = {
    id: 'score-1',
    marks_obtained: 95,
    grade_label: 'A+',
    exam: { name: 'Midterm Science Exam', max_marks: 100 },
    student_profile: { first_name: 'Eleanor', last_name: 'Vance' },
  };

  const mockLeave = {
    id: 'leave-1',
    status: 'APPROVED',
    from_date: new Date('2026-08-01'),
    to_date: new Date('2026-08-03'),
  };

  beforeEach(async () => {
    brevoDispatch = {
      sendTransactionalEmail: jest.fn().mockResolvedValue({ messageId: 'brevo-msg-123' }),
    };

    prismaService = {
      notificationQueueItem: {
        findMany: jest.fn(),
        update: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'item-1', ...data.data })),
        create: jest.fn().mockImplementation((data) => Promise.resolve({ id: 'item-new', ...data.data })),
      } as any,
      tripPermission: {
        findUnique: jest.fn().mockResolvedValue(mockTripPerm),
      } as any,
      assignment: {
        findUnique: jest.fn().mockResolvedValue(mockAssignment),
      } as any,
      examScore: {
        findUnique: jest.fn().mockResolvedValue(mockExamScore),
      } as any,
      leaveRequest: {
        findUnique: jest.fn().mockResolvedValue(mockLeave),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationProcessorService,
        { provide: BrevoEmailDispatchService, useValue: brevoDispatch },
        { provide: PrismaService, useValue: prismaService },
      ],
    }).compile();

    processor = module.get<NotificationProcessorService>(NotificationProcessorService);
  });

  describe('Retry Engine Logic', () => {
    it('should retry item with retries=2, succeed on 3rd attempt, and update status to SENT', async () => {
      const mockPendingItem = {
        id: 'queue-item-1',
        recipient_email: 'sarah.vance.parent@gmail.com',
        recipient_name: 'Sarah Vance',
        type: 'TRIP_CONSENT_REQUIRED',
        related_entity_id: 'perm-1',
        retries: 2,
        status: 'FAILED',
      };

      (prismaService.notificationQueueItem.findMany as jest.Mock).mockResolvedValueOnce([mockPendingItem]);

      const result = await processor.processPendingNotifications();

      expect(brevoDispatch.sendTransactionalEmail).toHaveBeenCalledTimes(1);
      expect(prismaService.notificationQueueItem.update).toHaveBeenCalledWith({
        where: { id: 'queue-item-1' },
        data: expect.objectContaining({
          status: 'SENT',
          error_message: null,
        }),
      });
      expect(result.sent).toBe(1);
    });

    it('should increment retries count and mark FAILED when max 3 attempts are reached on error', async () => {
      (brevoDispatch.sendTransactionalEmail as jest.Mock).mockRejectedValueOnce(new Error('Brevo API 500 Error'));

      const mockFailingItem = {
        id: 'queue-item-2',
        recipient_email: 'parent@gmail.com',
        type: 'TRIP_CONSENT_REQUIRED',
        related_entity_id: 'perm-1',
        retries: 2,
        status: 'PENDING_DISPATCH',
      };

      (prismaService.notificationQueueItem.findMany as jest.Mock).mockResolvedValueOnce([mockFailingItem]);

      const result = await processor.processPendingNotifications();

      expect(prismaService.notificationQueueItem.update).toHaveBeenCalledWith({
        where: { id: 'queue-item-2' },
        data: expect.objectContaining({
          retries: 3,
          status: 'FAILED',
          error_message: 'Brevo API 500 Error',
        }),
      });
      expect(result.failed).toBe(1);
    });
  });

  describe('4 Email Templates Format Verification', () => {
    it('should format TRIP_CONSENT_REQUIRED template correctly', async () => {
      const formatted = await processor.formatEmailContent({
        type: 'TRIP_CONSENT_REQUIRED',
        related_entity_id: 'perm-1',
      });

      expect(formatted.subject).toContain('Consent needed: Science Observatory');
      expect(formatted.htmlContent).toContain('Science Observatory');
      expect(formatted.htmlContent).toContain('/parent/trips');
    });

    it('should format ASSIGNMENT_CREATED template correctly', async () => {
      const formatted = await processor.formatEmailContent({
        type: 'ASSIGNMENT_CREATED',
        related_entity_id: 'assign-1',
      });

      expect(formatted.subject).toContain('Algebra Quadratic Equations');
      expect(formatted.htmlContent).toContain('/parent/assignments');
    });

    it('should format EXAM_SCORE_PUBLISHED template correctly', async () => {
      const formatted = await processor.formatEmailContent({
        type: 'EXAM_SCORE_PUBLISHED',
        related_entity_id: 'score-1',
      });

      expect(formatted.subject).toContain('Grade A+');
      expect(formatted.htmlContent).toContain('Midterm Science Exam');
      expect(formatted.htmlContent).toContain('/parent/exams');
    });

    it('should format LEAVE_REQUEST_REVIEWED template correctly', async () => {
      const formatted = await processor.formatEmailContent({
        type: 'LEAVE_REQUEST_REVIEWED',
        related_entity_id: 'leave-1',
      });

      expect(formatted.subject).toContain('Leave Request APPROVED');
      expect(formatted.htmlContent).toContain('/parent/attendance');
    });
  });
});
