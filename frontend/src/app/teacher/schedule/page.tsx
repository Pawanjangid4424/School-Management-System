'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CalendarCheck, ArrowRight } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';

export default function TeacherSchedulePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

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
        Loading Daily Schedule...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Daily Schedule"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">
                Today's Assigned Class Periods
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Your full day itinerary of periods and classes.
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

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden space-y-4">
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
                  {dashboardData?.todaySchedule?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No periods assigned for today.
                      </td>
                    </tr>
                  ) : (
                    dashboardData?.todaySchedule?.map((period: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5">
                          <span className="font-bold text-slate-900">{period.period}</span>
                          <span className="block text-[11px] text-slate-400">{period.time}</span>
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {period.className}
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-medium">
                          {period.subject}
                        </td>
                        <td className="px-5 py-3.5 text-slate-500 font-mono">
                          {period.room}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill
                            status={period.role === 'CLASS_TEACHER' ? 'active' : 'pending'}
                            label={period.role === 'CLASS_TEACHER' ? 'Class Teacher' : 'Subject Faculty'}
                          />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href="/teacher/attendance"
                            className="bg-slate-900 text-white rounded-xl px-3 py-1.5 text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-1 shadow-xs"
                          >
                            <span>Mark Attendance</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
