'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  CalendarCheck,
  Clock,
  Users,
  CheckCircle2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const getPeriodStatus = (timeStr: string) => {
    try {
      const [startStr, endStr] = timeStr.split(' - ');
      const parseTime = (time: string) => {
        const [timePart, ampm] = time.trim().split(' ');
        let [hours, minutes] = timePart.split(':').map(Number);
        if (ampm === 'PM' && hours !== 12) hours += 12;
        if (ampm === 'AM' && hours === 12) hours = 0;
        const d = new Date();
        d.setHours(hours, minutes, 0, 0);
        return d;
      };

      const startTime = parseTime(startStr);
      const endTime = parseTime(endStr);
      
      if (currentTime > endTime) return 'COMPLETED';
      if (currentTime >= startTime && currentTime <= endTime) return 'ONGOING';
      return 'UPCOMING';
    } catch {
      return 'UPCOMING';
    }
  };

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
      fetchDashboard(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchDashboard = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/teacher/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDashboardData(data);
      }
    } catch (e) {
      console.error('Failed to fetch teacher dashboard', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Teacher Portal...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Teacher Dashboard & Portal"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          {/* Welcome Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">
                Today's Teaching Schedule & Quick Actions
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Access your assigned classes, mark daily attendance, and view upcoming periods.
              </p>
            </div>

            <Link
              href="/teacher/attendance"
              className="bg-amber-500 text-slate-950 font-bold rounded-xl px-4 py-2.5 text-xs hover:bg-amber-400 transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Mark Today's Attendance &rarr;</span>
            </Link>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Assigned Classes</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100 shrink-0">
                  <BookOpen className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-slate-900">
                {dashboardData?.assignedClassesCount || 2} Classes
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Class & Subject Teacher</div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Total Students</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                  <Users className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-slate-900">
                {dashboardData?.totalStudents || 70} Enrolled
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold">Active Roster</div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-2 col-span-1 sm:col-span-2 md:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500">Pending Submissions</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 border border-slate-200 shrink-0">
                  <Clock className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div className="font-serif text-2xl font-bold text-slate-900">
                {dashboardData?.pendingAssignments || 3} Tasks
              </div>
              <div className="text-[11px] text-slate-400 font-medium">Assignments & Grading</div>
            </div>
          </div>

          {/* Today's Schedule Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden space-y-4">
            <div className="border-b border-slate-100 p-4 sm:p-5 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  Today's Assigned Class Periods
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Class schedule derived strictly from your assigned subject and class teacher mappings.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Period & Time</th>
                    <th className="px-5 py-3.5">Class & Section</th>
                    <th className="px-5 py-3.5">Subject</th>
                    <th className="px-5 py-3.5">Room</th>
                    <th className="px-5 py-3.5">Faculty Role</th>
                    <th className="px-5 py-3.5 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dashboardData?.todaySchedule?.map((period: any, idx: number) => {
                    const status = getPeriodStatus(period.time);
                    const isCompleted = status === 'COMPLETED';
                    const isOngoing = status === 'ONGOING';

                    return (
                      <tr key={idx} className={`transition-colors ${isCompleted ? 'bg-slate-50/50 opacity-75' : 'hover:bg-slate-50/60'}`}>
                        <td className="px-5 py-3.5">
                          <span className={`font-bold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{period.period}</span>
                          <span className={`block text-[11px] ${isOngoing ? 'text-amber-600 font-bold animate-pulse' : 'text-slate-400'}`}>
                            {period.time} {isOngoing && '(Live Now)'}
                          </span>
                        </td>
                        <td className={`px-5 py-3.5 font-bold ${isCompleted ? 'text-slate-500' : 'text-slate-900'}`}>
                          {period.className}
                        </td>
                        <td className={`px-5 py-3.5 ${isCompleted ? 'text-slate-400' : 'text-slate-700'}`}>
                          {period.subject}
                        </td>
                        <td className={`px-5 py-3.5 ${isCompleted ? 'text-slate-400' : 'text-slate-500'} font-mono`}>
                          {period.room}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill
                            status={isCompleted ? 'inactive' : (period.role === 'CLASS_TEACHER' ? 'active' : 'pending')}
                            label={period.role === 'CLASS_TEACHER' ? 'Class Teacher' : 'Subject Faculty'}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" /> Completed
                            </span>
                          ) : (
                            <Link
                              href="/teacher/attendance"
                              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-colors inline-flex items-center gap-1 ${isOngoing ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-xs' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                              <span>{isOngoing ? 'Join Class' : 'Mark Attendance'}</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
