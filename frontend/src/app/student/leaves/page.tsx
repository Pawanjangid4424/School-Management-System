'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CalendarOff,
  Plus,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar as CalendarIcon,
  FileText,
  UserCheck,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 15 },
  show: {
    opacity: 1,
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 },
  },
};

export default function StudentLeavesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaves, setLeaves] = useState<any[]>([]);

  // Modal state
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [reason, setReason] = useState('');
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
      setUser(parsedUser);
      fetchLeaves(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchLeaves = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/student-portal/leaves`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeaves(data);
      }
    } catch (e) {
      console.error('Failed to fetch student leaves', e);
    }
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSuccessMsg('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/student-portal/leaves`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fromDate,
          toDate,
          reason,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit leave application');

      setSuccessMsg('Leave application submitted successfully! It is now pending school approval.');
      setFromDate('');
      setToDate('');
      setReason('');
      setShowApplyModal(false);
      fetchLeaves(token || '');
    } catch (err: any) {
      setError(err.message || 'An error occurred while submitting leave.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Leave Portal...
      </div>
    );
  }

  const pendingCount = leaves.filter((l) => l.status === 'PENDING').length;
  const approvedCount = leaves.filter((l) => l.status === 'APPROVED').length;
  const rejectedCount = leaves.filter((l) => l.status === 'REJECTED').length;

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="STUDENT" tenantName={user?.tenant_name} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 md:pl-[var(--sidebar-width,256px)]">
        <Topbar
          title="My Leave Applications"
          userName={`Welcome, ${user?.name || user?.username || 'Student'}`}
          userRole="Enrolled Student Account"
        />

        <main className="px-4 md:px-8 py-6 max-w-[1400px] mx-auto w-full space-y-6">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Top Bar Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-xl font-semibold text-slate-900 flex items-center gap-2">
                  <CalendarOff className="h-5 w-5 text-amber-600" />
                  Leave Request Management
                </h2>
                <p className="text-xs text-slate-500">
                  Apply for student absence leaves and track school approval status in real time.
                </p>
              </div>

              <button
                onClick={() => {
                  setShowApplyModal(true);
                  setError('');
                  setSuccessMsg('');
                }}
                className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>+ Apply for Leave</span>
              </button>
            </div>

            {successMsg && (
              <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <motion.div variants={itemVariants} className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 font-medium">Total Applied</span>
                  <p className="text-lg font-bold text-slate-900">{leaves.length}</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="rounded-xl border border-amber-200/80 bg-amber-50/40 p-4 shadow-2xs flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-amber-800 font-medium">Pending Review</span>
                  <p className="text-lg font-bold text-amber-950">{pendingCount}</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 p-4 shadow-2xs flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-emerald-800 font-medium">Approved</span>
                  <p className="text-lg font-bold text-emerald-950">{approvedCount}</p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="rounded-xl border border-rose-200/80 bg-rose-50/40 p-4 shadow-2xs flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700">
                  <XCircle className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-rose-800 font-medium">Rejected</span>
                  <p className="text-lg font-bold text-rose-950">{rejectedCount}</p>
                </div>
              </motion.div>
            </div>

            {/* Leave Applications Table */}
            <motion.div variants={itemVariants} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
                <h3 className="font-semibold text-slate-800 text-sm">Submitted Leave History</h3>
                <span className="text-xs text-slate-500 font-medium">{leaves.length} Applications</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-6 py-3.5">Leave Duration</th>
                      <th className="px-6 py-3.5">Reason / Explanation</th>
                      <th className="px-6 py-3.5">Requested By</th>
                      <th className="px-6 py-3.5">Status</th>
                      <th className="px-6 py-3.5">Reviewed By</th>
                      <th className="px-6 py-3.5 text-right">Applied Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {leaves.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                          <CalendarOff className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                          <p className="font-medium text-xs text-slate-600">No leave applications submitted yet.</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">Click "+ Apply for Leave" to submit a new leave request.</p>
                        </td>
                      </tr>
                    ) : (
                      leaves.map((l) => (
                        <tr key={l.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="px-6 py-4 font-semibold text-slate-900">
                            <div className="flex items-center gap-1.5 text-xs">
                              <CalendarIcon className="h-3.5 w-3.5 text-slate-400" />
                              <span>
                                {new Date(l.from_date).toLocaleDateString()} — {new Date(l.to_date).toLocaleDateString()}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-medium max-w-xs truncate" title={l.reason}>
                            {l.reason}
                          </td>
                          <td className="px-6 py-4 text-slate-500 capitalize">
                            {l.requested_by || 'Student'}
                          </td>
                          <td className="px-6 py-4">
                            {l.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-[11px] font-bold">
                                <Clock className="h-3 w-3 text-amber-600" />
                                Pending Review
                              </span>
                            )}
                            {l.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-[11px] font-bold">
                                <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                                Approved
                              </span>
                            )}
                            {l.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-[11px] font-bold">
                                <XCircle className="h-3 w-3 text-rose-600" />
                                Rejected
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-slate-600">
                            {l.reviewed_by_staff ? (
                              <span className="flex items-center gap-1">
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                {l.reviewed_by_staff.name || `${l.reviewed_by_staff.first_name} ${l.reviewed_by_staff.last_name}`}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">Pending Staff Review</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right text-slate-500 font-mono text-[11px]">
                            {new Date(l.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </div>

      {/* Apply Leave Modal */}
      {showApplyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <h3 className="font-serif text-base font-semibold text-slate-900 flex items-center gap-2">
                <CalendarOff className="h-4 w-4 text-amber-600" />
                Submit Student Leave Request
              </h3>
              <button
                onClick={() => setShowApplyModal(false)}
                className="text-slate-400 hover:text-slate-700 text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSubmitLeave} className="space-y-4 text-xs">
              {error && (
                <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    From Date *
                  </label>
                  <input
                    type="date"
                    required
                    min="2024-01-01"
                    max="2099-12-31"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    To Date *
                  </label>
                  <input
                    type="date"
                    required
                    min="2024-01-01"
                    max="2099-12-31"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Reason for Absence / Application *
                </label>
                <textarea
                  required
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g. Requesting 2 days leave due to fever and doctor consultation."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowApplyModal(false)}
                  className="border border-slate-300 text-slate-600 rounded-lg px-3.5 py-2 text-xs font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-50"
                >
                  {submitting ? 'Submitting...' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
