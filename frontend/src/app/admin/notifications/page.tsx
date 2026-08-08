'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  Mail,
  Smartphone,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  AlertTriangle,
  Send,
  Sparkles,
  Sliders,
  FileText,
  CalendarOff,
  BookOpen,
  Award,
  Bus,
  Compass,
  Megaphone,
  Save
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AdminNotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'settings' | 'queue'>('settings');

  // Queue State
  const [queueItems, setQueueItems] = useState<any[]>([]);
  const [processing, setProcessing] = useState(false);

  // Notification Preference Toggles State
  const [settings, setSettings] = useState({
    emailAlerts: true,
    smsAlerts: false,
    inAppAlerts: true,
    attendanceAlerts: true,
    assignmentAlerts: true,
    examAlerts: true,
    tripAlerts: true,
    noticeAlerts: true,
    feeAlerts: true,
  });
  const [savingSettings, setSavingSettings] = useState(false);

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
      fetchQueue(token);
      fetchSettings(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchQueue = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/admin/notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setQueueItems(data);
      }
    } catch (e) {
      console.error('Failed to fetch notification queue', e);
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
      console.error('Failed to fetch notification settings', e);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
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
        toast.success('Notification settings & channel preferences updated!');
      } else {
        toast.error('Failed to update notification preferences.');
      }
    } catch (e: any) {
      toast.error('An error occurred while saving settings.');
    } finally {
      setSavingSettings(false);
    }
  };

  const handleProcessQueue = async () => {
    setProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/admin/notifications/process-queue`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(`Queue processed: ${data.sent} sent via Brevo REST API, ${data.failed} failed.`);
        fetchQueue(token || '');
      }
    } catch (e) {
      toast.error('Error processing notification queue');
    } finally {
      setProcessing(false);
    }
  };

  const handleRetryItem = async (id: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/admin/notifications/${id}/retry`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        toast.success('Notification queue item reset & retried!');
        fetchQueue(token || '');
      }
    } catch (e) {
      toast.error('Error retrying notification');
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
          <span>Loading Notifications Control Center...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-slate-900 selection:text-white">
      <Toaster position="top-center" />
      {/* Sidebar */}
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      {/* Main Content */}
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Notification Settings & Dispatch Monitor"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="h-4 w-4" />
                <span>Global Communication Hub</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Notifications & Alerts Control Center
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Configure automated email, SMS, and in-app alerts across Admin, Teacher, Student, and Parent portals.
              </p>
            </div>

            {/* Save Button for Settings */}
            {activeTab === 'settings' && (
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl px-5 py-3 text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/25 shrink-0 disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{savingSettings ? 'Saving...' : 'Save Notification Settings'}</span>
              </button>
            )}

            {/* Process Queue Button for Queue Tab */}
            {activeTab === 'queue' && (
              <button
                onClick={handleProcessQueue}
                disabled={processing}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl px-5 py-3 text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/25 shrink-0 disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 ${processing ? 'animate-spin' : ''}`} />
                <span>{processing ? 'Dispatching...' : 'Process Queue Now'}</span>
              </button>
            )}
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center gap-2 bg-slate-200/70 p-1.5 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTab('settings')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'settings'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sliders className="h-4 w-4 text-indigo-600" />
              <span>Channel & Category Settings</span>
            </button>

            <button
              onClick={() => setActiveTab('queue')}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                activeTab === 'queue'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="h-4 w-4 text-amber-600" />
              <span>Brevo Email Queue Monitor ({queueItems.length})</span>
            </button>
          </div>

          {/* Tab 1: Settings Panel */}
          {activeTab === 'settings' && (
            <div className="space-y-6">
              
              {/* Master Notification Delivery Channels */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Bell className="h-5 w-5 text-indigo-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Notification Delivery Channels</h3>
                    <p className="text-xs text-slate-500">Enable or disable primary alert channels across all portals.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  
                  {/* Email Alerts */}
                  <div
                    onClick={() => toggleSetting('emailAlerts')}
                    className={`rounded-2xl p-5 border cursor-pointer transition-all flex items-center justify-between ${
                      settings.emailAlerts
                        ? 'bg-indigo-50/50 border-indigo-200 ring-2 ring-indigo-500/20'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold">
                        <Mail className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">Transactional Email</span>
                        <span className="text-[11px] text-slate-500">Brevo REST API Dispatch</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      settings.emailAlerts ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {settings.emailAlerts ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>

                  {/* In-App Alerts */}
                  <div
                    onClick={() => toggleSetting('inAppAlerts')}
                    className={`rounded-2xl p-5 border cursor-pointer transition-all flex items-center justify-between ${
                      settings.inAppAlerts
                        ? 'bg-emerald-50/50 border-emerald-200 ring-2 ring-emerald-500/20'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                        <Bell className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">In-App Portal Alerts</span>
                        <span className="text-[11px] text-slate-500">Topbar Bell & Popups</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      settings.inAppAlerts ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {settings.inAppAlerts ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>

                  {/* SMS Alerts */}
                  <div
                    onClick={() => toggleSetting('smsAlerts')}
                    className={`rounded-2xl p-5 border cursor-pointer transition-all flex items-center justify-between ${
                      settings.smsAlerts
                        ? 'bg-purple-50/50 border-purple-200 ring-2 ring-purple-500/20'
                        : 'bg-slate-50 border-slate-200 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-sm block">SMS Gateway</span>
                        <span className="text-[11px] text-slate-500">Mobile Phone Alerts</span>
                      </div>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                      settings.smsAlerts ? 'bg-purple-600 text-white' : 'bg-slate-200 text-slate-600'
                    }`}>
                      {settings.smsAlerts ? 'ENABLED' : 'DISABLED'}
                    </span>
                  </div>

                </div>
              </div>

              {/* Event Category Trigger Preferences */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
                <div className="flex items-center gap-2.5 border-b border-slate-100 pb-3">
                  <Megaphone className="h-5 w-5 text-amber-600" />
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Event Trigger Preferences</h3>
                    <p className="text-xs text-slate-500">Specify which school events automatically generate notifications.</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
                  
                  {/* Attendance & Leave */}
                  <div
                    onClick={() => toggleSetting('attendanceAlerts')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <CalendarOff className="h-5 w-5 text-slate-700" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Attendance & Leaves</span>
                        <span className="text-[10.5px] text-slate-500">Daily absences & approval</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.attendanceAlerts}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                    />
                  </div>

                  {/* Coursework & Homework */}
                  <div
                    onClick={() => toggleSetting('assignmentAlerts')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <BookOpen className="h-5 w-5 text-slate-700" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Assignments & Homework</span>
                        <span className="text-[10.5px] text-slate-500">New tasks & submission alerts</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.assignmentAlerts}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                    />
                  </div>

                  {/* Exam Scores */}
                  <div
                    onClick={() => toggleSetting('examAlerts')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Award className="h-5 w-5 text-slate-700" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Exam Scores & Grades</span>
                        <span className="text-[10.5px] text-slate-500">Report cards publishing</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.examAlerts}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                    />
                  </div>

                  {/* Field Trips */}
                  <div
                    onClick={() => toggleSetting('tripAlerts')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Compass className="h-5 w-5 text-slate-700" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Field Trips & Consents</span>
                        <span className="text-[10.5px] text-slate-500">Trip consent forms to parents</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.tripAlerts}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                    />
                  </div>

                  {/* Notice Board */}
                  <div
                    onClick={() => toggleSetting('noticeAlerts')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Megaphone className="h-5 w-5 text-slate-700" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Notice Board Announcements</span>
                        <span className="text-[10.5px] text-slate-500">Broadcast circulars to all</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.noticeAlerts}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                    />
                  </div>

                  {/* Fee Management */}
                  <div
                    onClick={() => toggleSetting('feeAlerts')}
                    className="p-4 rounded-xl border border-slate-200/80 bg-slate-50/60 hover:bg-slate-50 transition-colors flex items-center justify-between cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-slate-700" />
                      <div>
                        <span className="text-xs font-bold text-slate-900 block">Fee Due & Payment Receipts</span>
                        <span className="text-[10.5px] text-slate-500">Fee reminders & invoices</span>
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      checked={settings.feeAlerts}
                      onChange={() => {}}
                      className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-800"
                    />
                  </div>

                </div>
              </div>

            </div>
          )}

          {/* Tab 2: Queue Monitor */}
          {activeTab === 'queue' && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
              <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center bg-slate-50">
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Transactional Queue Records ({queueItems.length})
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  Brevo REST API Endpoint: v3/smtp/email
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 border-b border-slate-100 font-bold uppercase text-[10.5px]">
                      <th className="px-6 py-4">Recipient Email</th>
                      <th className="px-6 py-4">Notification Type</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Retries</th>
                      <th className="px-6 py-4">Error Trace / Log</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {queueItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400 text-xs">
                          No notification items queued yet.
                        </td>
                      </tr>
                    ) : (
                      queueItems.map((item) => (
                        <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">
                            {item.recipient_email || 'guardian@parent.com'}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200 font-semibold">
                              {item.type}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill
                              status={item.status === 'SENT' ? 'active' : item.status === 'FAILED' ? 'error' : 'pending'}
                              label={item.status}
                            />
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-700 font-bold">
                            {item.retries} / 3
                          </td>
                          <td className="px-6 py-4 text-slate-500 max-w-xs truncate font-mono text-[11px]">
                            {item.error_message || '—'}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {item.status === 'FAILED' && (
                              <button
                                onClick={() => handleRetryItem(item.id)}
                                className="bg-amber-500 text-slate-950 font-bold rounded-xl px-3 py-1.5 text-xs hover:bg-amber-400 transition-colors inline-flex items-center gap-1 shadow-xs"
                              >
                                <RefreshCw className="h-3.5 w-3.5" />
                                <span>Retry</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
