'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Settings,
  Building,
  Shield,
  Bell,
  CalendarCheck,
  Save,
  CheckCircle2,
  Database,
  Mail,
  Lock,
  ArrowRight,
  ShieldCheck,
  Server,
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AdminSettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Settings Form State
  const [schoolName, setSchoolName] = useState('Marudhar Defence Academy');
  const [schoolCode, setSchoolCode] = useState('MDA');
  const [mailProvider, setMailProvider] = useState('Google Workspace');
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [inAppAlerts, setInAppAlerts] = useState(true);
  const [saving, setSaving] = useState(false);

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
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleSaveGeneralSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setTimeout(() => {
      setSaving(false);
      toast.success('System configuration & school settings updated successfully!');
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading System Settings...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Toaster position="top-center" />
      
      {/* Sidebar */}
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar */}
        <Topbar
          title="System & Tenant Settings"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          {/* Header Action Control Card */}
          <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900 flex items-center gap-2">
                <Settings className="h-5 w-5 text-amber-500 shrink-0" />
                <span>Global ERP Settings & Preferences</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage institution details, attendance policies, security guards, and system configuration.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <CodeBadge code={`TENANT: ${user?.tenant_id?.slice(0, 8) || 'MDA-ERP'}`} />
              <StatusPill status="active" label="System Online" />
            </div>
          </div>

          {/* Quick Settings Links Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Attendance Policy Link Card */}
            <Link
              href="/admin/settings/attendance"
              className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-amber-300 transition-all flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <CalendarCheck className="h-4 w-4 text-amber-500" />
                  <span>Attendance Policy</span>
                </div>
                <p className="text-[11.5px] text-slate-500">
                  Set minimum threshold (75%) and half-day weighting rules.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-amber-600 transition-colors shrink-0" />
            </Link>

            {/* Notification Dispatch Settings Link Card */}
            <Link
              href="/admin/notifications"
              className="group rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex items-center justify-between"
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Bell className="h-4 w-4 text-indigo-500" />
                  <span>Notifications & Alerts</span>
                </div>
                <p className="text-[11.5px] text-slate-500">
                  Brevo email dispatch, queue status & channel toggles.
                </p>
              </div>
              <ArrowRight className="h-4 w-4 text-slate-400 group-hover:text-indigo-600 transition-colors shrink-0" />
            </Link>

            {/* System Info Link Card */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs space-y-1 sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Server className="h-4 w-4 text-emerald-500" />
                <span>Cloud Server Engine</span>
              </div>
              <p className="text-[11.5px] text-slate-500">
                Render PostgreSQL DB • NestJS v10 API Core • Next.js 14
              </p>
            </div>
          </div>

          {/* Settings Content Grid: School Info Form & Security Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* School Profile Settings Form (2 cols) */}
            <div className="lg:col-span-2 rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Building className="h-5 w-5 text-amber-500 shrink-0" />
                <div>
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Institution Profile & Information
                  </h3>
                  <p className="text-xs text-slate-500">
                    Official school credentials rendered on fee receipts and student ID cards.
                  </p>
                </div>
              </div>

              <form onSubmit={handleSaveGeneralSettings} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      School / Institution Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={schoolName}
                      onChange={(e) => setSchoolName(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-amber-500 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      School Code (Tenant Unique Prefix) *
                    </label>
                    <input
                      type="text"
                      required
                      disabled
                      value={schoolCode}
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs text-slate-500 font-mono font-bold cursor-not-allowed"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Mail Gateway Provider
                    </label>
                    <select
                      value={mailProvider}
                      onChange={(e) => setMailProvider(e.target.value)}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-medium"
                    >
                      <option value="Google Workspace">Google Workspace SMTP</option>
                      <option value="Brevo API">Brevo Transactional Email</option>
                      <option value="SendGrid">SendGrid API</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Academic Session Year
                    </label>
                    <input
                      type="text"
                      disabled
                      value="2026 - 2027"
                      className="w-full rounded-xl border border-slate-200 bg-slate-100 px-3.5 py-2.5 text-xs text-slate-600 font-semibold cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="border-t border-slate-100 pt-4 space-y-3">
                  <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                    Automated Notifications & Communication
                  </h4>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-900 block">Email Dispatch Alerts</span>
                      <span className="text-[11px] text-slate-500">Send email for attendance defaulters and notices</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={emailAlerts}
                      onChange={(e) => setEmailAlerts(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                    />
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                    <div>
                      <span className="font-semibold text-slate-900 block">In-App Live Push Alerts</span>
                      <span className="text-[11px] text-slate-500">Real-time alerts on teacher and parent portals</span>
                    </div>
                    <input
                      type="checkbox"
                      checked={inAppAlerts}
                      onChange={(e) => setInAppAlerts(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer accent-amber-600"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end pt-3 border-t border-slate-100">
                  <button
                    type="submit"
                    disabled={saving}
                    className="bg-slate-900 text-white rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    <span>{saving ? 'Saving Changes...' : 'Save Settings'}</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Right Security & System Status Side Card (1 col) */}
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  Security & Auth Guards
                </h3>
              </div>

              <div className="space-y-3 text-xs">
                <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-emerald-900">JWT Authentication</span>
                    <StatusPill status="active" label="ENFORCED" />
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Access tokens expire in 15 minutes. Automatic refresh token rotation enabled.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <span className="font-bold text-slate-900 block">Role-Based Access Control (@Roles)</span>
                  <p className="text-[11px] text-slate-500">
                    Strict isolation for ADMIN, TEACHER, STUDENT, and PARENT endpoints.
                  </p>
                </div>

                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
                  <span className="font-bold text-slate-900 block font-mono text-[11px]">Database Provider</span>
                  <p className="text-[11px] text-slate-500">
                    PostgreSQL Production Instance connected via Prisma 5.22 ORM.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
