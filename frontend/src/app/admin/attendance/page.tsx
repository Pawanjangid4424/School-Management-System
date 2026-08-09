'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CalendarCheck,
  Users,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Settings,
  FileText,
  BookOpen,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AttendanceDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);
  const [defaulters, setDefaulters] = useState<any[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
      setUser(parsedUser);
      fetchAttendanceData(token, selectedDate);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchAttendanceData = async (token: string, date: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const [sumRes, defRes] = await Promise.all([
        fetch(`${apiUrl}/attendance/summary?date=${date}`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/attendance/defaulters`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (sumRes.ok) {
        const sumData = await sumRes.json();
        setSummaryData(sumData);
      }
      if (defRes.ok) {
        const defData = await defRes.json();
        setDefaulters(defData);
      }
    } catch (e) {
      console.error('Failed to fetch attendance summary', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Attendance Oversight...
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
          title="Attendance Oversight & Analytics"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          {/* Header Action Row - Fully Mobile Responsive */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">
                School-wide Attendance Dashboard
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Real-time attendance statistics, class breakdown, and low attendance defaulter alerts.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <input
                type="date"
                min="2020-01-01"
                max="2099-12-31"
                value={selectedDate}
                onChange={(e) => {
                  setSelectedDate(e.target.value);
                  const token = localStorage.getItem('access_token');
                  if (token) fetchAttendanceData(token, e.target.value);
                }}
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 shadow-xs focus:border-amber-500 focus:outline-none shrink-0"
              />

              <Link
                href="/admin/leave-requests"
                className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 rounded-xl px-3 py-2 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
              >
                <FileText className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                <span>Leave Requests</span>
              </Link>

              <Link
                href="/admin/settings/attendance"
                className="bg-slate-900 text-white rounded-xl px-3.5 py-2 text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
              >
                <Settings className="h-4 w-4" strokeWidth={1.75} />
                <span>Policy Config</span>
              </Link>
            </div>
          </div>

          {/* 3 Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">School Attendance ({selectedDate})</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 shrink-0">
                  <CalendarCheck className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div className="font-serif text-2xl font-semibold text-slate-900">
                {summaryData ? summaryData.todayPercent : 0}%
              </div>
              {summaryData && (
                <div className={`flex items-center gap-1 text-[11px] font-semibold ${summaryData.trendPercent >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {summaryData.trendPercent >= 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <TrendingDown className="h-3 w-3" />
                  )}
                  <span>
                    {summaryData.trendPercent >= 0 ? '+' : ''}{summaryData.trendPercent}% vs yesterday
                  </span>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">This Week's Average</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-50 text-slate-700 border border-slate-100 shrink-0">
                  <Users className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div className="font-serif text-2xl font-semibold text-slate-900">
                {summaryData ? summaryData.weekAveragePercent : 0}%
              </div>
              <div className="text-[11px] text-slate-400">
                Min Policy Threshold: {summaryData?.minPolicyThreshold || 75}%
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-2 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">Defaulter Students (&lt;{summaryData?.minPolicyThreshold || 75}%)</span>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100 shrink-0">
                  <AlertTriangle className="h-4 w-4" strokeWidth={1.75} />
                </div>
              </div>
              <div className="font-serif text-2xl font-semibold text-rose-600">
                {defaulters.length}
              </div>
              <div className="text-[11px] text-rose-600 font-semibold">
                Requires Academic Intervention
              </div>
            </div>
          </div>

          {/* Main Grid Layout: Class-wise Table (2 cols) & Defaulters List (1 col) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Class-wise Breakdown Table */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
              <div className="border-b border-slate-100 p-4 sm:p-5 flex justify-between items-center">
                <div>
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Class-wise Attendance Breakdown ({selectedDate})
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Live present vs total count per section.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                    <tr>
                      <th className="px-4 sm:px-6 py-3.5">Class & Section</th>
                      <th className="px-4 sm:px-6 py-3.5">Present / Total</th>
                      <th className="px-4 sm:px-6 py-3.5">Attendance %</th>
                      <th className="px-4 sm:px-6 py-3.5">Policy Compliance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {summaryData?.classBreakdown?.slice(0, 10).map((item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 sm:px-6 py-3.5 font-semibold text-slate-900 flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-amber-500 shrink-0" strokeWidth={1.75} />
                          <span>{item.className}-{item.section}</span>
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 text-slate-600 font-medium">
                          {item.presentCount} / {item.totalCount}
                        </td>
                        <td className="px-4 sm:px-6 py-3.5 font-bold text-slate-900">
                          {item.attendancePercent}%
                        </td>
                        <td className="px-4 sm:px-6 py-3.5">
                          <StatusPill
                            status={item.trendUp ? 'active' : 'error'}
                            label={item.trendUp ? 'Compliant' : 'Below Threshold'}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Defaulters Side Panel */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0" strokeWidth={1.75} />
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  Attendance Defaulters List
                </h3>
              </div>

              <p className="text-xs text-slate-500">
                Calculated over term working days using <code className="font-mono text-slate-800 bg-slate-100 px-1 py-0.5 rounded">halfDayCountsAs={summaryData?.halfDayWeighting || 0.5}</code> policy.
              </p>

              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {defaulters.length === 0 ? (
                  <p className="text-xs text-slate-400 py-6 text-center">
                    No students currently below the {summaryData?.minPolicyThreshold || 75}% threshold.
                  </p>
                ) : (
                  defaulters.map((def, idx) => (
                    <div
                      key={idx}
                      className="rounded-xl border border-rose-100 bg-rose-50/50 p-3 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-slate-900 truncate">{def.name}</span>
                        <CodeBadge code={def.studentCode} />
                      </div>

                      <div className="flex items-center justify-between text-slate-600 text-[11px]">
                        <span>{def.class}</span>
                        <span className="font-bold text-rose-700">
                          {def.attendancePercent}% (Min: {def.thresholdPercent}%)
                        </span>
                      </div>

                      <div className="flex justify-between items-center pt-1.5 border-t border-rose-100/60 text-[10.5px] text-slate-500">
                        <span>Absents: {def.absentCount} | Half-days: {def.halfDayCount}</span>
                        <span className="text-amber-700 font-semibold hover:underline cursor-pointer">
                          View Details &rarr;
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
