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
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function TeacherDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [currentTime, setCurrentTime] = useState<Date>(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000); // Check every minute
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
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

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
      {/* Sidebar with TEACHER role */}
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-64">
        {/* Topbar */}
        <Topbar
          title="Teacher Dashboard & Portal"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-8 py-6 space-y-6">
          {/* Welcome Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Today's Teaching Schedule & Quick Actions
              </h2>
              <p className="text-xs text-slate-500">
                Access your assigned classes, mark daily attendance, and view upcoming periods.
              </p>
            </div>

            <Link
              href="/teacher/attendance"
              className="bg-amber-500 text-slate-950 font-semibold rounded-lg px-4 py-2 text-xs hover:bg-amber-400 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <CalendarCheck className="h-4 w-4" />
              <span>Mark Today's Attendance &rarr;</span>
            </Link>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Assigned Classes</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                  <BookOpen className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div className="font-serif text-2xl font-semibold text-slate-900">
                {dashboardData?.assignedClassesCount || 2} Classes
              </div>
              <div className="text-[11px] text-slate-400">Class & Subject Teacher</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Total Students</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                  <Users className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div className="font-serif text-2xl font-semibold text-slate-900">
                {dashboardData?.totalStudents || 70} Enrolled
              </div>
              <div className="text-[11px] text-emerald-600 font-medium">Active Roster</div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Pending Submissions</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 text-slate-700 border border-slate-100">
                  <Clock className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div className="font-serif text-2xl font-semibold text-slate-900">
                {dashboardData?.pendingAssignments || 3} Tasks
              </div>
              <div className="text-[11px] text-slate-400">Assignments & Grading</div>
            </div>
          </div>

          {/* Today's Schedule Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  Today's Assigned Class Periods
                </h3>
                <p className="text-xs text-slate-500">
                  Class schedule derived strictly from your assigned subject and class teacher mappings.
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Period & Time</th>
                    <th className="px-6 py-3">Class & Section</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Room</th>
                    <th className="px-6 py-3">Faculty Role</th>
                    <th className="px-6 py-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {dashboardData?.todaySchedule?.map((period: any, idx: number) => {
                    const status = getPeriodStatus(period.time);
                    const isCompleted = status === 'COMPLETED';
                    const isOngoing = status === 'ONGOING';

                    return (
                      <tr key={idx} className={`transition-colors ${isCompleted ? 'bg-slate-50/50 opacity-75' : 'hover:bg-slate-50/60'}`}>
                        <td className="px-6 py-3.5">
                          <span className={`font-semibold ${isCompleted ? 'text-slate-500 line-through' : 'text-slate-900'}`}>{period.period}</span>
                          <span className={`block text-[11px] ${isOngoing ? 'text-amber-600 font-bold animate-pulse' : 'text-slate-400'}`}>
                            {period.time} {isOngoing && '(Live Now)'}
                          </span>
                        </td>
                        <td className={`px-6 py-3.5 font-medium ${isCompleted ? 'text-slate-500' : 'text-slate-900'}`}>
                          {period.className}
                        </td>
                        <td className={`px-6 py-3.5 ${isCompleted ? 'text-slate-400' : 'text-slate-700'}`}>
                          {period.subject}
                        </td>
                        <td className={`px-6 py-3.5 ${isCompleted ? 'text-slate-400' : 'text-slate-500'} font-mono`}>
                          {period.room}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill
                            status={isCompleted ? 'inactive' : (period.role === 'CLASS_TEACHER' ? 'active' : 'pending')}
                            label={period.role === 'CLASS_TEACHER' ? 'Class Teacher' : 'Subject Faculty'}
                          />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {isCompleted ? (
                            <span className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700">
                              <CheckCircle2 className="h-4 w-4" /> Completed
                            </span>
                          ) : (
                            <Link
                              href="/teacher/attendance"
                              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors inline-flex items-center gap-1 ${isOngoing ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-sm' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
                            >
                              <span>{isOngoing ? 'Join Class' : 'Mark Attendance'}</span>
                              <ArrowRight className="h-3 w-3" />
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
