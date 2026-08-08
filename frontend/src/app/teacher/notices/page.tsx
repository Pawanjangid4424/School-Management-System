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
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

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
      const token = localStorage.getItem('access_token');
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
          userName="Welcome, Faculty"
          userRole="Teaching Faculty"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="h-4 w-4" />
                <span>Faculty Alerts</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Notices & Notification Settings
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                View school-wide notices, circulars, and customize your email and portal notification preferences.
              </p>
            </div>

            {activeTab === 'settings' && (
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl px-5 py-3 text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/25 shrink-0 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{saving ? 'Saving...' : 'Save Preferences'}</span>
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('notices')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'notices'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Megaphone className="h-4 w-4 text-amber-600" />
              <span>School Circulars & Notices</span>
            </button>

            <button
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="h-4 w-4 text-indigo-600" />
              <span>Notification Settings</span>
            </button>
          </div>

          {/* Tab 1: Notices List */}
          {activeTab === 'notices' && (
            <div className="space-y-4">
              {notices.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
                  <Megaphone className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No Active Circulars</p>
                  <p className="text-xs text-slate-400">You are all caught up with official school notices.</p>
                </div>
              ) : (
                notices.map((n) => (
                  <div
                    key={n.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-sm transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pin className="h-4 w-4 text-amber-600" />
                        <h3 className="font-bold text-slate-900 text-sm">{n.title}</h3>
                      </div>
                      <span className="text-[11px] text-slate-400 font-medium">
                        {new Date(n.created_at || Date.now()).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed pl-6">{n.content}</p>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab 2: Notification Preferences */}
          {activeTab === 'settings' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-6">
              <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                <Bell className="h-5 w-5 text-indigo-600" />
                <div>
                  <h3 className="text-base font-bold text-slate-900">Personal Notification Preferences</h3>
                  <p className="text-xs text-slate-500">Choose how and when you receive automated updates.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                
                <div
                  onClick={() => toggleSetting('emailAlerts')}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-indigo-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Email Digest</span>
                      <span className="text-[10.5px] text-slate-500">Receive email alerts</span>
                    </div>
                  </div>
                  <input type="checkbox" checked={settings.emailAlerts} onChange={() => {}} className="h-4 w-4 rounded border-slate-300 text-slate-900" />
                </div>

                <div
                  onClick={() => toggleSetting('inAppAlerts')}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Bell className="h-5 w-5 text-emerald-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">In-App Popups</span>
                      <span className="text-[10.5px] text-slate-500">Topbar alerts</span>
                    </div>
                  </div>
                  <input type="checkbox" checked={settings.inAppAlerts} onChange={() => {}} className="h-4 w-4 rounded border-slate-300 text-slate-900" />
                </div>

                <div
                  onClick={() => toggleSetting('attendanceAlerts')}
                  className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-blue-600" />
                    <div>
                      <span className="text-xs font-bold text-slate-900 block">Attendance & Leaves</span>
                      <span className="text-[10.5px] text-slate-500">Class leave applications</span>
                    </div>
                  </div>
                  <input type="checkbox" checked={settings.attendanceAlerts} onChange={() => {}} className="h-4 w-4 rounded border-slate-300 text-slate-900" />
                </div>

              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
