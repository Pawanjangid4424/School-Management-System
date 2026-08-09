'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Calendar,
  Clock,
  Plus,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  UserCheck,
  Layers,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AdminTimetablePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Timetable State
  const [classNum, setClassNum] = useState<number | ''>('');
  const [section, setSection] = useState<string>('');
  const [slots, setSlots] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);

  // Mobile View Active Day Tab
  const [activeDayTab, setActiveDayTab] = useState<string>('MONDAY');

  // Add Slot Modal State
  const [showAddModal, setShowAddModal] = useState(false);
  const [dayOfWeek, setDayOfWeek] = useState<string>('MONDAY');
  const [periodNumber, setPeriodNumber] = useState<number>(1);
  const [startTime, setStartTime] = useState('08:00 AM');
  const [endTime, setEndTime] = useState('09:00 AM');
  const [subjectId, setSubjectId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [roomNumber, setRoomNumber] = useState('Room 101');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

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
      if (classNum && section) {
        fetchTimetable(token, classNum, section);
      } else {
        setSlots([]);
      }
      fetchMetadata(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, classNum, section]);

  const fetchTimetable = async (token: string, cNum: number | '', sec: string) => {
    if (!cNum || !sec) {
      setSlots([]);
      return;
    }

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/timetable?classNumber=${cNum}&section=${sec}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (e) {
      console.error('Failed to fetch timetable', e);
    }
  };

  const fetchMetadata = async (token: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const [subRes, stfRes] = await Promise.all([
        fetch(`${apiUrl}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/staff`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (subRes.ok) setSubjects(await subRes.json());
      if (stfRes.ok) setStaffList(await stfRes.json());
    } catch (e) {
      console.error('Failed to fetch metadata', e);
    }
  };

  const handleSaveSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!classNum || !section) {
      setError('Please select a Class and Section first.');
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/timetable`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classNumber: Number(classNum),
          section,
          subjectId: subjectId || undefined,
          teacherId: teacherId || undefined,
          dayOfWeek,
          periodNumber: Number(periodNumber),
          startTime,
          endTime,
          roomNumber,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save slot');

      setSuccessMsg(`Timetable slot saved for ${dayOfWeek} Period ${periodNumber}!`);
      setShowAddModal(false);
      fetchTimetable(token || '', classNum, section);
    } catch (err: any) {
      setError(err.message || 'Timetable conflict error.');
    } finally {
      setSubmitting(false);
    }
  };

  const getSlotForDayAndPeriod = (day: string, period: number) => {
    return slots.find((s) => s.day_of_week === day && s.period_number === period);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Timetable Manager...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar */}
        <Topbar
          title="Weekly Timetable & Schedule Management"
          userName={`Welcome, ${user?.username || 'Admin'}`}
          userRole={user?.role || 'Administrator'}
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          {/* Header Action Controls - Fully Mobile Responsive Flex Layout */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">
                Class Weekly Timetable Grid
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Interactive schedule builder with real-time teacher and room conflict detection.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-xs w-full sm:w-auto">
                <select
                  value={classNum}
                  onChange={(e) => setClassNum(e.target.value ? Number(e.target.value) : '')}
                  className="bg-white font-semibold text-slate-900 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 shrink-0"
                >
                  <option value="">-- Select Class --</option>
                  {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                    <option key={c} value={c}>
                      Grade {c}
                    </option>
                  ))}
                </select>

                <select
                  value={section}
                  onChange={(e) => setSection(e.target.value)}
                  className="bg-white font-semibold text-slate-900 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs focus:outline-none focus:border-amber-500 shrink-0"
                >
                  <option value="">-- Section --</option>
                  <option value="A">Section A</option>
                  <option value="B">Section B</option>
                  <option value="C">Section C</option>
                </select>
              </div>

              <button
                onClick={() => {
                  if (!classNum || !section) {
                    setError('Please select a Class / Grade and Section first.');
                    return;
                  }
                  setShowAddModal(true);
                  setError('');
                  setSuccessMsg('');
                }}
                className="bg-slate-900 text-white rounded-xl px-4 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-sm w-full sm:w-auto cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Add / Edit Slot</span>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Weekly Timetable Grid Table or Empty State */}
          {!classNum || !section ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 sm:p-12 text-center shadow-xs space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-amber-50 text-amber-600">
                <Calendar className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-base sm:text-lg font-semibold text-slate-900">No Class Selected</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Please select a <strong>Class / Grade</strong> and <strong>Section</strong> from the dropdown controls above to view or build the weekly timetable grid.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              
              {/* Mobile View Day Tab Switcher (Visible on Mobile < lg) */}
              <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                {days.map((day) => (
                  <button
                    key={day}
                    onClick={() => setActiveDayTab(day)}
                    className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
                      activeDayTab === day
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {day}
                  </button>
                ))}
              </div>

              {/* Mobile Vertical Schedule List (Visible on Mobile < lg) */}
              <div className="lg:hidden space-y-3">
                <div className="flex items-center justify-between px-1">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    {activeDayTab} Schedule (Grade {classNum}-{section})
                  </h4>
                  <span className="text-[11px] text-slate-400 font-mono">8 Periods Total</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {periods.map((p) => {
                    const slot = getSlotForDayAndPeriod(activeDayTab, p);
                    return (
                      <div
                        key={p}
                        className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 font-bold text-xs flex items-center justify-center shrink-0">
                            P{p}
                          </div>
                          <div>
                            <h5 className="font-bold text-xs text-slate-900">
                              {slot?.subject?.subject_name || 'Free / Activity Period'}
                            </h5>
                            <p className="text-[11px] text-slate-500 mt-0.5">
                              {slot?.teacher ? `${slot.teacher.first_name} ${slot.teacher.last_name}` : 'Unassigned'}
                            </p>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10.5px] font-mono">
                            {slot?.room_number || 'Room 101'}
                          </span>
                          <button
                            onClick={() => {
                              setDayOfWeek(activeDayTab);
                              setPeriodNumber(p);
                              setShowAddModal(true);
                            }}
                            className="block mt-1 text-[11px] font-semibold text-amber-600 hover:text-amber-700"
                          >
                            {slot ? 'Edit' : '+ Add'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Desktop Full Weekly Grid Table (Visible on Desktop >= lg) */}
              <div className="hidden lg:block rounded-2xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                      <tr>
                        <th className="px-4 py-3.5 border-r border-slate-100 w-24">Day / Period</th>
                        {periods.map((p) => (
                          <th key={p} className="px-4 py-3.5 border-r border-slate-100 text-center min-w-[120px]">
                            Period {p}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {days.map((day) => (
                        <tr key={day} className="hover:bg-slate-50/50">
                          <td className="px-4 py-4 font-bold text-slate-900 border-r border-slate-100 bg-slate-50/60">
                            {day.slice(0, 3)}
                          </td>
                          {periods.map((p) => {
                            const slot = getSlotForDayAndPeriod(day, p);
                            return (
                              <td key={p} className="p-2 border-r border-slate-100 text-center align-top">
                                {slot ? (
                                  <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-2 space-y-1 text-[11px]">
                                    <span className="font-semibold text-amber-900 block truncate">
                                      {slot.subject?.subject_name || 'Class Period'}
                                    </span>
                                    <span className="text-[10px] text-amber-700 block truncate">
                                      {slot.teacher ? `${slot.teacher.first_name} ${slot.teacher.last_name}` : 'TBD'}
                                    </span>
                                    <span className="text-[10px] font-mono text-slate-500 block">
                                      {slot.room_number || 'Room 101'}
                                    </span>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => {
                                      setDayOfWeek(day);
                                      setPeriodNumber(p);
                                      setShowAddModal(true);
                                    }}
                                    className="w-full h-16 rounded-xl border border-dashed border-slate-200 text-slate-400 hover:border-amber-400 hover:text-amber-600 hover:bg-amber-50/30 transition-all flex items-center justify-center text-[11px] font-medium cursor-pointer"
                                  >
                                    + Slot
                                  </button>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Add Slot Modal - 100% Mobile Responsive */}
          {showAddModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-3 sm:p-4 backdrop-blur-xs">
              <div className="w-[94vw] sm:max-w-md max-h-[90vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Assign Timetable Slot (Grade {classNum}-{section})
                  </h3>
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="text-slate-400 hover:text-slate-700 text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSaveSlot} className="space-y-4 text-xs">
                  {error && (
                    <div className="flex items-start gap-2 rounded-xl bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                      <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600 mt-0.5" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Day of Week *
                      </label>
                      <select
                        value={dayOfWeek}
                        onChange={(e) => setDayOfWeek(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-medium"
                      >
                        {days.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        Period Number *
                      </label>
                      <select
                        value={periodNumber}
                        onChange={(e) => setPeriodNumber(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-medium"
                      >
                        {periods.map((p) => (
                          <option key={p} value={p}>
                            Period {p}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Subject
                    </label>
                    <select
                      value={subjectId}
                      onChange={(e) => setSubjectId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-medium"
                    >
                      <option value="">-- Choose Subject --</option>
                      {subjects.map((sub) => (
                        <option key={sub.id} value={sub.id}>
                          {sub.subject_name} ({sub.subject_code})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Assigned Teacher Faculty
                    </label>
                    <select
                      value={teacherId}
                      onChange={(e) => setTeacherId(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-medium"
                    >
                      <option value="">-- Choose Teacher --</option>
                      {staffList.map((stf) => (
                        <option key={stf.id} value={stf.id}>
                          {stf.first_name} {stf.last_name} ({stf.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Room / Lab Identifier
                    </label>
                    <input
                      type="text"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="e.g. Room 101 or Physics Lab"
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-medium"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="border border-slate-300 text-slate-600 rounded-xl px-4 py-2 text-xs font-semibold hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-slate-900 text-white rounded-xl px-5 py-2 text-xs font-semibold hover:bg-slate-800 shadow-sm"
                    >
                      {submitting ? 'Saving...' : 'Save Slot'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
