import { Test, TestingModule } from '@nestjs/testing';
import { AttendanceCalculatorService } from './attendance-calculator.service';

describe('AttendanceCalculatorService', () => {
  let service: AttendanceCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AttendanceCalculatorService],
    }).compile();

    service = module.get<AttendanceCalculatorService>(AttendanceCalculatorService);
  });

  describe('Mid-Term Admission & Working Days Calculation', () => {
    it('should start denominator from student admission date, not term start for mid-term admits', () => {
      const termStart = new Date('2026-06-01'); // Monday
      const termEnd = new Date('2026-06-30');   // Tuesday
      const midTermAdmission = new Date('2026-06-15'); // Monday (joined mid-month)

      // Working days from June 15 to June 30 excluding weekends
      const studentWorkingDays = service.calculateWorkingDaysForStudent(
        termStart,
        termEnd,
        midTermAdmission,
        [],
      );

      // June 1 to June 30 has 22 working days.
      // June 15 to June 30 has 12 working days.
      expect(studentWorkingDays).toBe(12);
    });

    it('should exclude weekends and holidays from total working days denominator', () => {
      const termStart = new Date('2026-06-01'); // Monday
      const termEnd = new Date('2026-06-07');   // Sunday (7 days total: 5 weekdays, 2 weekend days)
      const holidays = ['2026-06-03']; // 1 holiday on Wednesday

      const workingDays = service.calculateWorkingDaysForStudent(
        termStart,
        termEnd,
        termStart,
        holidays,
      );

      // 5 weekdays minus 1 holiday = 4 working days
      expect(workingDays).toBe(4);
    });
  });

  describe('Attendance Percentage Calculation', () => {
    it('should calculate 100% for all PRESENT records', () => {
      const records = Array(100).fill({ status: 'PRESENT', date: '2026-06-01' });
      const result = service.calculateAttendance(records, 100, 0.5, 75.0);

      expect(result.attendancePercent).toBe(100.0);
      expect(result.isDefaulter).toBe(false);
    });

    it('should calculate 0% for all ABSENT records and flag as defaulter', () => {
      const records = Array(100).fill({ status: 'ABSENT', date: '2026-06-01' });
      const result = service.calculateAttendance(records, 100, 0.5, 75.0);

      expect(result.attendancePercent).toBe(0.0);
      expect(result.isDefaulter).toBe(true);
    });

    it('should correctly weight HALF_DAY as 0.5 by default', () => {
      const records = [
        ...Array(70).fill({ status: 'PRESENT', date: '2026-06-01' }),
        ...Array(10).fill({ status: 'HALF_DAY', date: '2026-06-02' }),
        ...Array(20).fill({ status: 'ABSENT', date: '2026-06-03' }),
      ];

      const result = service.calculateAttendance(records, 100, 0.5, 75.0);

      expect(result.effectiveWeightedDays).toBe(75.0);
      expect(result.attendancePercent).toBe(75.0);
      expect(result.isDefaulter).toBe(false);
    });
  });
});
