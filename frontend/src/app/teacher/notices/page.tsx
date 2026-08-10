'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Mail, Megaphone, CheckCircle2, RefreshCw, Sliders, Save, Sparkles, Pin } from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function TeacherNoticesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'notices' | 'settings'>('notices');
  const [notices, setNotices] = useState<any[]>([]);

  // Notification Preferences State
  const [settings, setSettings] = useState({
    emailAlerts: true,
    inAppAlerts: true,
    attendanceAlerts: true,
    assignmentAlerts: true,
    examAlerts: true,
    tripAlerts: true,
    noticeAlerts: true,
  });
  const [saving, setSaving] = useState(false);

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
      fetchNotices(token);
      fetchSettings(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchNotices = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/student-portal/notices`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setNotices(data);
      }
    } catch (e) {
      console.error('Failed to fetch notices', e);
    }
  };

  const fetchSettings = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/notifications/settings`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch (e) {
      console.error('Failed to fetch settings', e);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/notifications/settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        toast.success('Notification preferences updated!');
      } else {
        toast.error('Failed to save preferences');
      }
    } catch (e) {
      toast.error('An error occurred while saving preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof typeof settings) => {
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white text-sm font-medium">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
          <span>Loading Teacher Notices & Notification Hub...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-slate-900 selection:text-white">
      <Toaster position="top-center" />
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Teacher Notices & Notification Hub"
          userName={`Welcome, ${user?.username || 'Faculty'}`}
          userRole="Teaching Faculty"
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-5 sm:p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="h-4 w-4" />
                <span>Faculty Alerts</span>
              </div>
              <h2 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
                Notices & Notification Settings
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                View school-wide notices, circulars, and customize your email and portal notification preferences.
              </p>
            </div>

            <div className="flex items-center gap-2 bg-slate-950/60 p-1.5 rounded-xl border border-slate-700/80 backdrop-blur-md self-start md:self-auto shrink-0">
              <button
                onClick={() => setActiveTab('notices')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'notices'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Megaphone className="h-4 w-4" />
                <span>Official Notices</span>
              </button>
              <button
                onClick={() => setActiveTab('settings')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  activeTab === 'settings'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                }`}
              >
                <Sliders className="h-4 w-4" />
                <span>Preferences</span>
              </button>
            </div>
          </div>

          {activeTab === 'notices' ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="font-serif text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Pin className="h-5 w-5 text-amber-500" />
                  School Circulars & Staff Announcements
                </h3>
                <span className="text-xs font-semibold text-slate-500 bg-white px-3 py-1 rounded-xl border border-slate-200 shadow-xs">
                  {notices.length} Active Notice(s)
                </span>
              </div>

              {notices.length === 0 ? (
                <div className="rounded-2xl border border-slate-200/80 bg-white p-8 text-center text-slate-400 space-y-2">
                  <Bell className="h-8 w-8 mx-auto text-slate-300" />
                  <p className="text-xs font-medium text-slate-600">No active circulars published at this moment.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {notices.map((n) => (
                    <div key={n.id} className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs hover:border-amber-300 transition-all space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <h4 className="font-bold text-slate-900 text-sm leading-snug">{n.title}</h4>
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                          {n.created_at ? new Date(n.created_at).toLocaleDateString() : 'Recent'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 leading-relaxed font-normal">{n.content || n.description}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 shadow-xs space-y-6 max-w-3xl">
              <div>
                <h3 className="font-serif text-lg font-bold text-slate-900">Configure Alert Channels & Events</h3>
                <p className="text-xs text-slate-500 mt-0.5">Toggle instant push notifications and email dispatch alerts.</p>
              </div>

              <div className="space-y-4 text-xs">
                {[
                  { key: 'emailAlerts', title: 'Email Notifications', desc: 'Receive instant email dispatches for critical updates' },
                  { key: 'inAppAlerts', title: 'In-App Portal Bell Alerts', desc: 'Receive realtime floating bell notifications in topbar' },
                  { key: 'attendanceAlerts', title: 'Attendance Marking Reminders', desc: 'Daily alerts if class attendance is pending' },
                  { key: 'assignmentAlerts', title: 'Assignment Submission Alerts', desc: 'Notify when students submit coursework' },
                  { key: 'examAlerts', title: 'Exam Grading Reminders', desc: 'Reminders for entering test scores' },
                  { key: 'tripAlerts', title: 'Field Trip Consent Form Updates', desc: 'Notify when parents sign trip permission slips' },
                ].map((item) => (
                  <div key={item.key} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-slate-50/60">
                    <div>
                      <h4 className="font-bold text-slate-900 text-xs">{item.title}</h4>
                      <p className="text-[11px] text-slate-500">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={(settings as any)[item.key]}
                      onChange={() => toggleSetting(item.key as any)}
                      className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-slate-100 flex justify-end">
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveSettings}
                  className="bg-amber-600 text-white rounded-xl px-5 py-2.5 text-xs font-bold hover:bg-amber-700 transition-colors shadow-xs flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
                >
                  <Save className="h-4 w-4" />
                  <span>{saving ? 'Saving Preferences...' : 'Save Notification Preferences'}</span>
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
