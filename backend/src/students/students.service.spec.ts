import { Test, TestingModule } from '@nestjs/testing';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { StudentCodeGeneratorService } from './student-code-generator.service';
import { MailboxProcessorService } from '../mailbox/mailbox-processor.service';

describe('StudentsService - getActiveClassSections', () => {
  let service: StudentsService;
  let prismaService: jest.Mocked<Partial<PrismaService>>;

  beforeEach(async () => {
    prismaService = {
      studentProfile: {
        groupBy: jest.fn(),
      } as any,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StudentsService,
        { provide: PrismaService, useValue: prismaService },
        { provide: StudentCodeGeneratorService, useValue: {} },
        { provide: MailboxProcessorService, useValue: {} },
      ],
    }).compile();

    service = module.get<StudentsService>(StudentsService);
  });

  it('should return grouped active class sections when students exist', async () => {
    (prismaService.studentProfile.groupBy as jest.Mock).mockResolvedValue([
      { current_class: 10, current_section: 'A', _count: { id: 15 } },
      { current_class: 10, current_section: 'C', _count: { id: 5 } },
    ]);

    const result = await service.getActiveClassSections('tenant-123');
    expect(result).toEqual([
      { classNumber: 10, section: 'A', label: 'Grade 10-A', studentCount: 15 },
      { classNumber: 10, section: 'C', label: 'Grade 10-C', studentCount: 5 },
    ]);
  });

  it('should return default fallback list when no students exist in tenant', async () => {
    (prismaService.studentProfile.groupBy as jest.Mock).mockResolvedValue([]);

    const result = await service.getActiveClassSections('tenant-empty');
    expect(result.length).toBe(12);
    expect(result[0]).toEqual({ classNumber: 1, section: 'A', label: 'Grade 1-A', studentCount: 0 });
  });
});
