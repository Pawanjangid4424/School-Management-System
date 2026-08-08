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
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

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
      const token = localStorage.getItem('access_token') || '';
      fetchRoster(token, cls.classNumber, cls.section, selectedDate);
    }
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setSelectedDate(newDate);
    const cls = assignedClasses[selectedClassIdx];
    if (cls) {
      const token = localStorage.getItem('access_token') || '';
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
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/teacher/attendance/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classNumber: cls.classNumber,
          section: cls.section,
          date: selectedDate,
          records: studentMarks.map((m) => ({
            studentProfileId: m.studentProfileId,
            status: m.status,
            remarks: m.remarks,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit attendance');

      setSubmitSuccess(`Attendance for Grade ${cls.classNumber}-${cls.section} on ${selectedDate} saved!`);
    } catch (err: any) {
      setError(err.message || 'Error submitting attendance.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Attendance Sheet...
      </div>
    );
  }

  const currentClass = assignedClasses[selectedClassIdx];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar with TEACHER role */}
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-64">
        {/* Topbar */}
        <Topbar
          title="Daily Attendance Marking Roster"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-8 py-6 space-y-6 max-w-5xl">
          {/* Header Controls Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div>
                <h2 className="font-serif text-lg font-semibold text-slate-900">
                  Select Assigned Class & Date
                </h2>
                <p className="text-xs text-slate-500">
                  Only classes assigned to you are accessible. One-click status marking per student.
                </p>
              </div>

              {rosterData?.isAlreadyMarked && (
                <StatusPill status="active" label="Attendance Previously Marked (Editable)" />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Assigned Class / Subject *
                </label>
                <select
                  value={selectedClassIdx}
                  onChange={handleClassSelectionChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-medium focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
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
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Attendance Date *
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-medium focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>
            </div>

            {submitSuccess && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>{submitSuccess}</span>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                {error}
              </div>
            )}
          </div>

          {/* Roster Table Card */}
          {currentClass && (
            <form onSubmit={handleSubmitAttendance} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
              <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Grade {currentClass.classNumber}-{currentClass.section} Roster ({studentMarks.length} Students)
                  </h3>
                  <p className="text-xs text-slate-500">
                    Click status pill to toggle Present / Absent / Half-Day.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={submitting || studentMarks.length === 0}
                  className="bg-amber-500 text-slate-950 font-semibold rounded-lg px-5 py-2 text-xs hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{submitting ? 'Saving Marks...' : 'Submit Daily Attendance'}</span>
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                    <tr>
                      <th className="px-6 py-3">Roll No</th>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Student Code</th>
                      <th className="px-6 py-3">One-Click Attendance Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {studentMarks.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-8 text-center text-slate-400 text-xs">
                          No active students found in Grade {currentClass.classNumber}-{currentClass.section}.
                        </td>
                      </tr>
                    ) : (
                      studentMarks.map((item, idx) => (
                        <tr key={item.studentProfileId} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-slate-500">
                            #{item.rollNo}
                          </td>
                          <td className="px-6 py-3.5 font-medium text-slate-900">
                            {item.name}
                          </td>
                          <td className="px-6 py-3.5">
                            <CodeBadge code={item.studentCode} />
                          </td>
                          <td className="px-6 py-3.5">
                            <div className="flex items-center gap-2">
                              {['PRESENT', 'ABSENT', 'HALF_DAY'].map((status) => {
                                const isSelected = item.status === status;
                                return (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleStatusChange(idx, status)}
                                    className={`rounded-md px-3 py-1 text-xs font-semibold transition-all ${
                                      isSelected
                                        ? status === 'PRESENT'
                                          ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600'
                                          : status === 'ABSENT'
                                          ? 'bg-rose-600 text-white shadow-sm ring-1 ring-rose-600'
                                          : 'bg-amber-500 text-slate-950 shadow-sm ring-1 ring-amber-500'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                    }`}
                                  >
                                    {status}
                                  </button>
                                );
                              })}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
}
