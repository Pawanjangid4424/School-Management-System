'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  Save,
  Users,
  Search,
  BookOpen,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function TeacherAttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form & Selection State
  const [assignedClasses, setAssignedClasses] = useState<any[]>([]);
  const [selectedClassIdx, setSelectedClassIdx] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0],
  );

  // Roster State
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterData, setRosterData] = useState<any>(null);
  const [studentMarks, setStudentMarks] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchClasses(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchClasses = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/teacher/classes`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const classes = await res.json();
        setAssignedClasses(classes);
        if (classes.length > 0) {
          fetchRoster(token, classes[0].classNumber, classes[0].section, selectedDate);
        }
      }
    } catch (e) {
      console.error('Failed to fetch assigned classes', e);
    }
  };

  const fetchRoster = async (
    token: string,
    classNum: number,
    sec: string,
    dateStr: string,
  ) => {
    setRosterLoading(true);
    setError('');
    setSubmitSuccess('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(
        `${apiUrl}/teacher/attendance/roster?classNumber=${classNum}&section=${sec}&date=${dateStr}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to fetch roster');

      setRosterData(data);
      setStudentMarks(
        data.students.map((s: any) => ({
          studentProfileId: s.studentProfileId,
          name: s.name,
          studentCode: s.studentCode,
          rollNo: s.rollNo,
          status: s.status || 'PRESENT',
          remarks: s.remarks || '',
        })),
      );
    } catch (err: any) {
      setError(err.message || 'Error fetching student roster');
    } finally {
      setRosterLoading(false);
    }
  };

  const handleStatusChange = (index: number, newStatus: string) => {
    const updated = [...studentMarks];
    updated[index].status = newStatus;
    setStudentMarks(updated);
  };

  const handleClassSelectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idx = Number(e.target.value);
    setSelectedClassIdx(idx);
    const cls = assignedClasses[idx];
    if (cls) {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token') || '';
      fetchRoster(token, cls.classNumber, cls.section, selectedDate);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    const cls = assignedClasses[selectedClassIdx];
    if (cls) {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token') || '';
      fetchRoster(token, cls.classNumber, cls.section, newDate);
    }
  };

  const handleSubmitAttendance = async (e: React.FormEvent) => {
    e.preventDefault();
    const cls = assignedClasses[selectedClassIdx];
    if (!cls || studentMarks.length === 0) return;

    setSubmitting(true);
    setError('');
    setSubmitSuccess('');

    try {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const payload = {
        classNumber: cls.classNumber,
        section: cls.section,
        date: selectedDate,
        records: studentMarks.map((s) => ({
          studentProfileId: s.studentProfileId,
          status: s.status,
          remarks: s.remarks,
        })),
      };

      const res = await fetch(`${apiUrl}/teacher/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit attendance');

      setSubmitSuccess('Attendance saved and submitted successfully!');
    } catch (err: any) {
      setError(err.message || 'An error occurred while saving attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Attendance Module...
      </div>
    );
  }

  const selectedClass = assignedClasses[selectedClassIdx];
  const presentCount = studentMarks.filter((s) => s.status === 'PRESENT').length;
  const absentCount = studentMarks.filter((s) => s.status === 'ABSENT').length;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Daily Attendance Marking Roster"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-6xl mx-auto">
          {/* Header Controls Card */}
          <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-serif text-lg font-semibold text-slate-900">
                  Select Assigned Class & Date
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Only classes assigned to you are accessible. One-click status marking per student.
                </p>
              </div>

              {rosterData?.isAlreadyMarked && (
                <StatusPill status="active" label="Attendance Previously Marked (Editable)" />
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assigned Class / Subject *
                </label>
                <select
                  value={selectedClassIdx}
                  onChange={handleClassSelectionChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-amber-500 focus:bg-white focus:outline-none"
                >
                  {assignedClasses.length === 0 ? (
                    <option value={0}>No Assigned Classes Found</option>
                  ) : (
                    assignedClasses.map((cls, idx) => (
                      <option key={idx} value={idx}>
                        Grade {cls.classNumber}-{cls.section} ({cls.roleType === 'CLASS_TEACHER' ? 'Class Teacher' : cls.subjectName})
                      </option>
                    ))
                  )}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Attendance Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3.5 text-xs text-rose-700 font-medium">{error}</div>}
          {submitSuccess && <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs text-emerald-800 font-semibold">{submitSuccess}</div>}

          {/* Roster Area */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden space-y-4">
            <div className="border-b border-slate-100 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
              <div className="flex items-center gap-3">
                <span className="font-serif font-bold text-slate-900 text-sm sm:text-base">
                  Roster: Grade {selectedClass?.classNumber}-{selectedClass?.section}
                </span>
                <span className="text-xs text-slate-500 font-medium">({studentMarks.length} Total Enrolled)</span>
              </div>

              <div className="flex items-center gap-2 text-xs font-bold">
                <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl">Present: {presentCount}</span>
                <span className="px-3 py-1 bg-rose-50 text-rose-800 border border-rose-200 rounded-xl">Absent: {absentCount}</span>
              </div>
            </div>

            {rosterLoading ? (
              <div className="p-8 text-center text-slate-400 text-xs font-medium">Loading Roster...</div>
            ) : studentMarks.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs">No students enrolled in this class section.</div>
            ) : (
              <form onSubmit={handleSubmitAttendance} className="space-y-4">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs min-w-[550px]">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                      <tr>
                        <th className="px-5 py-3">Roll No</th>
                        <th className="px-5 py-3">Student Name</th>
                        <th className="px-5 py-3">Student Code</th>
                        <th className="px-5 py-3">Status Action</th>
                        <th className="px-5 py-3">Remarks</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {studentMarks.map((s, idx) => (
                        <tr key={s.studentProfileId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-5 py-3 font-mono font-bold text-slate-800">#{s.rollNo}</td>
                          <td className="px-5 py-3 font-bold text-slate-900">{s.name}</td>
                          <td className="px-5 py-3"><CodeBadge code={s.studentCode} /></td>
                          <td className="px-5 py-3">
                            <div className="flex items-center gap-1.5">
                              {['PRESENT', 'ABSENT', 'HALF_DAY', 'LATE'].map((st) => (
                                <button
                                  key={st}
                                  type="button"
                                  onClick={() => handleStatusChange(idx, st)}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${
                                    s.status === st
                                      ? st === 'PRESENT'
                                        ? 'bg-emerald-600 text-white shadow-2xs'
                                        : st === 'ABSENT'
                                        ? 'bg-rose-600 text-white shadow-2xs'
                                        : 'bg-amber-600 text-white shadow-2xs'
                                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                  }`}
                                >
                                  {st.replace('_', ' ')}
                                </button>
                              ))}
                            </div>
                          </td>
                          <td className="px-5 py-3">
                            <input
                              type="text"
                              placeholder="Add remark..."
                              value={s.remarks}
                              onChange={(e) => {
                                const updated = [...studentMarks];
                                updated[idx].remarks = e.target.value;
                                setStudentMarks(updated);
                              }}
                              className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-xs focus:bg-white focus:border-amber-500 focus:outline-none"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-amber-600 text-white font-bold px-6 py-2.5 rounded-xl text-xs hover:bg-amber-700 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{submitting ? 'Submitting...' : 'Save & Submit Attendance'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
