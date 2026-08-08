'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  Percent,
  Sliders,
  Save,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function AttendanceSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Policy Form State
  const [minPercent, setMinPercent] = useState<number>(75.0);
  const [halfDayWeight, setHalfDayWeight] = useState<number>(0.5);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
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
      if (parsedUser.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
      setUser(parsedUser);
      fetchPolicy(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchPolicy = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/attendance/policy`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMinPercent(data.min_attendance_percent || 75.0);
        setHalfDayWeight(data.half_day_counts_as || 0.5);
      }
    } catch (e) {
      console.error('Failed to fetch attendance policy', e);
    }
  };

  const handleSavePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSuccessMsg('');
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/attendance/policy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          minPercent: Number(minPercent),
          halfDayWeight: Number(halfDayWeight),
        }),
      });

      if (!res.ok) throw new Error('Failed to update attendance policy');

      setSuccessMsg('Attendance policy rules updated successfully!');
    } catch (err: any) {
      setError(err.message || 'Error saving settings');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Policy Settings...
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
          title="Attendance Policy Configuration"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-4xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/admin/attendance"
              className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Attendance Dashboard</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Policy Configuration</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-5">
              <div className="flex items-center gap-2">
                <Sliders className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
                <h2 className="font-serif text-lg font-semibold text-slate-900">
                  School Attendance Rules & Weighting Policy
                </h2>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Configure minimum attendance percentage thresholds and half-day weighting parameters used to determine defaulters.
              </p>
            </div>

            <form onSubmit={handleSavePolicy} className="space-y-6">
              {successMsg && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>{successMsg}</span>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-medium text-slate-900 mb-1.5">
                    Minimum Required Attendance Threshold (%)
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      required
                      value={minPercent}
                      onChange={(e) => setMinPercent(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                    <Percent className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Students below this threshold over the term are flagged on the Defaulters Oversight list.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-900 mb-1.5">
                    Half-Day Attendance Weighting (decimal)
                  </label>
                  <select
                    value={halfDayWeight}
                    onChange={(e) => setHalfDayWeight(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                  >
                    <option value={0.5}>0.5 (Half Day = 50% Day)</option>
                    <option value={0.75}>0.75 (Half Day = 75% Day)</option>
                    <option value={0.25}>0.25 (Half Day = 25% Day)</option>
                    <option value={0.0}>0.0 (Half Day = Uncounted/Absent)</option>
                  </select>
                  <p className="text-[11px] text-slate-500 mt-1">
                    Weight used in the formula: Total Weight = (PRESENT &times; 1.0) + (HALF_DAY &times; weight).
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-slate-100 pt-5">
                <Link
                  href="/admin/attendance"
                  className="border border-dashed border-slate-300 text-slate-600 rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 text-white rounded-lg px-5 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-2"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span>{submitting ? 'Saving...' : 'Save Policy Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
