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
        Loading Daily Schedule...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-64">
        <Topbar
          title="Daily Schedule"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-8 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Today's Assigned Class Periods
              </h2>
              <p className="text-xs text-slate-500">
                Your full day itinerary of periods and classes.
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

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
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
                  {dashboardData?.todaySchedule?.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No periods assigned for today.
                      </td>
                    </tr>
                  ) : (
                    dashboardData?.todaySchedule?.map((period: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5">
                          <span className="font-semibold text-slate-900">{period.period}</span>
                          <span className="block text-[11px] text-slate-400">{period.time}</span>
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {period.className}
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">
                          {period.subject}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 font-mono">
                          {period.room}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill
                            status={period.role === 'CLASS_TEACHER' ? 'active' : 'pending'}
                            label={period.role === 'CLASS_TEACHER' ? 'Class Teacher' : 'Subject Faculty'}
                          />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            href="/teacher/attendance"
                            className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Mark Attendance</span>
                            <ArrowRight className="h-3 w-3" />
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
