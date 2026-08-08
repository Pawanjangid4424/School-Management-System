import { Injectable } from '@nestjs/common';

export interface AttendanceRecordItem {
  date: Date | string;
  status: 'PRESENT' | 'ABSENT' | 'HALF_DAY' | 'LEAVE' | string;
}

export interface AttendanceCalculationResult {
  presentCount: number;
  absentCount: number;
  halfDayCount: number;
  leaveCount: number;
  totalRecords: number;
  effectiveWorkingDays: number;
  effectiveWeightedDays: number;
  attendancePercent: number;
  isDefaulter: boolean;
}

@Injectable()
export class AttendanceCalculatorService {
  /**
   * Calculates effective working days for a student based on admission date, term range, weekends, and holidays.
   * If a student is admitted mid-term, their denominator starts from their admission date (not term start).
   */
  calculateWorkingDaysForStudent(
    termStartDate: Date,
    termEndDate: Date,
    studentAdmissionDate?: Date,
    holidays: string[] = [], // YYYY-MM-DD
  ): number {
    const today = new Date();
    const endDate = termEndDate < today ? termEndDate : today;

    let startDate = new Date(termStartDate);
    if (studentAdmissionDate && new Date(studentAdmissionDate) > startDate) {
      startDate = new Date(studentAdmissionDate);
    }

    let workingDays = 0;
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayOfWeek = current.getDay(); // 0 = Sunday, 6 = Saturday
      const dateStr = current.toISOString().split('T')[0];

      // Exclude weekends (Sunday = 0, Saturday = 6) and official school holidays
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isHoliday = holidays.includes(dateStr);

      if (!isWeekend && !isHoliday) {
        workingDays++;
      }

      current.setDate(current.getDate() + 1);
    }

    return Math.max(workingDays, 1);
  }

  /**
   * Calculates attendance percentage based on weighted days and policy configuration.
   * Total Weight = (PRESENT * 1.0) + (HALF_DAY * halfDayCountsAs) + (LEAVE * leaveCountsAs)
   * Attendance % = (Total Weight / workingDays) * 100
   */
  calculateAttendance(
    records: AttendanceRecordItem[],
    totalWorkingDays: number,
    halfDayCountsAs: number = 0.5,
    minAttendancePercent: number = 75.0,
    leaveCountsAs: number = 1.0,
  ): AttendanceCalculationResult {
    let presentCount = 0;
    let absentCount = 0;
    let halfDayCount = 0;
    let leaveCount = 0;

    for (const record of records) {
      const status = record.status.toUpperCase();
      if (status === 'PRESENT') {
        presentCount++;
      } else if (status === 'ABSENT') {
        absentCount++;
      } else if (status === 'HALF_DAY') {
        halfDayCount++;
      } else if (status === 'LEAVE') {
        leaveCount++;
      }
    }

    const workingDays = totalWorkingDays > 0 ? totalWorkingDays : Math.max(records.length, 1);

    const effectiveWeightedDays =
      presentCount * 1.0 +
      halfDayCount * halfDayCountsAs +
      leaveCount * leaveCountsAs;

    const rawPercent = (effectiveWeightedDays / workingDays) * 100;
    const attendancePercent = Math.round(rawPercent * 100) / 100;

    const isDefaulter = attendancePercent < minAttendancePercent;

    return {
      presentCount,
      absentCount,
      halfDayCount,
      leaveCount,
      totalRecords: records.length,
      effectiveWorkingDays: workingDays,
      effectiveWeightedDays,
      attendancePercent,
      isDefaulter,
    };
  }
}
