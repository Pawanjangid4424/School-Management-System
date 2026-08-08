'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowLeft,
  Calendar,
  User,
  Eye,
  CalendarOff,
  Filter,
  Check,
  X,
  MessageSquareQuote,
  GraduationCap,
  UserCheck
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';

export default function LeaveRequestsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [actionSuccess, setActionSuccess] = useState('');

  // Selected Request Modal State
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);

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
      fetchLeaveRequests(token, statusFilter);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, statusFilter]);

  const fetchLeaveRequests = async (token: string, filter: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/leave-requests?status=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLeaveRequests(data);
      }
    } catch (e) {
      console.error('Failed to fetch leave requests', e);
    }
  };

  const handleReview = async (requestId: string, status: 'APPROVED' | 'REJECTED') => {
    setReviewingId(requestId);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/leave-requests/${requestId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setActionSuccess(`Leave request successfully ${status.toLowerCase()}!`);
        if (selectedRequest?.id === requestId) {
          setSelectedRequest(null);
        }
        fetchLeaveRequests(token || '', statusFilter);
      }
    } catch (e) {
      console.error('Error reviewing leave request', e);
    } finally {
      setReviewingId(null);
    }
  };

  const formatDateRange = (fromStr: string, toStr: string) => {
    if (!fromStr || !toStr) return { range: '-', days: '-' };
    const d1 = new Date(fromStr);
    const d2 = new Date(toStr);
    
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    const opt: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' };
    const f1 = d1.toLocaleDateString('en-GB', opt);
    const f2 = d2.toLocaleDateString('en-GB', opt);

    if (f1 === f2) {
      return { range: f1, days: '1 Day' };
    }
    return { range: `${f1} – ${f2}`, days: `${diffDays} Days` };
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Leave Requests...
      </div>
    );
  }

  const pendingCount = leaveRequests.filter((r) => r.status === 'PENDING').length;
  const approvedCount = leaveRequests.filter((r) => r.status === 'APPROVED').length;
  const rejectedCount = leaveRequests.filter((r) => r.status === 'REJECTED').length;

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      {/* Sidebar */}
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 md:pl-[var(--sidebar-width,256px)]">
        {/* Topbar */}
        <Topbar
          title="Student Leave Requests Oversight"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/admin/attendance"
              className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Attendance Oversight</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-semibold">Leave Applications</span>
          </div>

          {/* Header & Filter Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-bold text-slate-900 flex items-center gap-2">
                <CalendarOff className="h-5 w-5 text-amber-600" />
                Student Leave Applications Oversight
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Review, verify full reasons, and manage leave applications submitted by students or parents.
              </p>
            </div>

            {/* Status Filter Tabs */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-2xs">
              {['ALL', 'PENDING', 'APPROVED', 'REJECTED'].map((filter) => (
                <button
                  key={filter}
                  onClick={() => setStatusFilter(filter)}
                  className={`rounded-lg px-3.5 py-1.5 font-semibold transition-all ${
                    statusFilter === filter
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {filter === 'ALL' ? 'All Applications' : filter}
                </button>
              ))}
            </div>
          </div>

          {actionSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-medium text-emerald-800 shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{actionSuccess}</span>
            </div>
          )}

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-700 shrink-0">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-slate-500 font-medium">Total Applications</span>
                <p className="text-lg font-bold text-slate-900">{leaveRequests.length}</p>
              </div>
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-2xs flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 text-amber-700 shrink-0">
                <Clock className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-amber-800 font-medium">Pending Approval</span>
                <p className="text-lg font-bold text-amber-950">{pendingCount}</p>
              </div>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-4 shadow-2xs flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700 shrink-0">
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-emerald-800 font-medium">Approved Leaves</span>
                <p className="text-lg font-bold text-emerald-950">{approvedCount}</p>
              </div>
            </div>

            <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 shadow-2xs flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-rose-100 text-rose-700 shrink-0">
                <XCircle className="h-5 w-5" />
              </div>
              <div>
                <span className="text-xs text-rose-800 font-medium">Rejected Leaves</span>
                <p className="text-lg font-bold text-rose-950">{rejectedCount}</p>
              </div>
            </div>
          </div>

          {/* Leave Requests Table */}
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Submitted Applications List</h3>
              <span className="text-xs text-slate-500 font-medium">{leaveRequests.length} record(s)</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-500 border-b border-slate-200 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-4">Student Details</th>
                    <th className="px-6 py-4">Class</th>
                    <th className="px-6 py-4">Leave Duration</th>
                    <th className="px-6 py-4 min-w-[280px]">Application Reason</th>
                    <th className="px-6 py-4">Requested By</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4">Reviewed By</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {leaveRequests.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        <CalendarOff className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                        <p className="font-medium text-xs text-slate-600">No leave requests match filter "{statusFilter}".</p>
                      </td>
                    </tr>
                  ) : (
                    leaveRequests.map((req) => {
                      const dateInfo = formatDateRange(req.fromDate, req.toDate);

                      return (
                        <tr key={req.id} className="hover:bg-slate-50/70 transition-colors group">
                          {/* Student Info */}
                          <td className="px-6 py-4 font-medium text-slate-900">
                            <div className="flex items-center gap-3">
                              <div className="h-9 w-9 rounded-full bg-amber-100/80 text-amber-800 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-200">
                                {req.studentName ? req.studentName.slice(0, 2).toUpperCase() : 'ST'}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-bold text-slate-900 text-xs">{req.studentName}</span>
                                <div className="mt-0.5">
                                  <CodeBadge code={req.studentCode} />
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Class & Section */}
                          <td className="px-6 py-4 text-slate-700 font-semibold whitespace-nowrap">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                              {req.class}
                            </span>
                          </td>

                          {/* Leave Dates */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex flex-col gap-1">
                              <div className="flex items-center gap-1.5 text-slate-900 font-medium">
                                <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                                <span>{dateInfo.range}</span>
                              </div>
                              <span className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 w-fit">
                                ⏱️ {dateInfo.days}
                              </span>
                            </div>
                          </td>

                          {/* Reason Column - Clean readable box */}
                          <td className="px-6 py-4">
                            <div
                              onClick={() => setSelectedRequest(req)}
                              className="group-hover:border-amber-300 rounded-lg border border-slate-200/80 bg-slate-50/60 p-2.5 text-xs text-slate-700 cursor-pointer hover:bg-amber-50/40 transition-all flex items-start gap-2 max-w-md"
                              title="Click to view full application details"
                            >
                              <MessageSquareQuote className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <p className="line-clamp-2 leading-relaxed text-slate-800 font-normal">
                                  "{req.reason}"
                                </p>
                                <span className="text-[10px] text-amber-700 font-semibold mt-1 inline-flex items-center gap-1 group-hover:underline">
                                  <Eye className="h-3 w-3" /> Read full details
                                </span>
                              </div>
                            </div>
                          </td>

                          {/* Requested By */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className="capitalize text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                              👤 {req.requestedBy || 'Student'}
                            </span>
                          </td>

                          {/* Status */}
                          <td className="px-6 py-4 whitespace-nowrap">
                            {req.status === 'PENDING' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-bold shadow-2xs">
                                <Clock className="h-3.5 w-3.5 text-amber-600" />
                                Pending
                              </span>
                            )}
                            {req.status === 'APPROVED' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold shadow-2xs">
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                Approved
                              </span>
                            )}
                            {req.status === 'REJECTED' && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-rose-50 text-rose-800 border border-rose-200 text-xs font-bold shadow-2xs">
                                <XCircle className="h-3.5 w-3.5 text-rose-600" />
                                Rejected
                              </span>
                            )}
                          </td>

                          {/* Reviewed By */}
                          <td className="px-6 py-4 whitespace-nowrap text-slate-600">
                            {req.reviewedBy ? (
                              <div className="flex items-center gap-1.5">
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                                <div>
                                  <span className="font-semibold text-slate-900 block text-xs">{req.reviewedBy}</span>
                                  <span className="text-[10px] text-slate-400 capitalize block">{req.reviewedByRole || 'Staff'}</span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Pending Review</span>
                            )}
                          </td>

                          {/* Actions Column */}
                          <td className="px-6 py-4 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedRequest(req)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-2xs"
                                title="View Full Application Modal"
                              >
                                <Eye className="h-4 w-4" />
                              </button>

                              {req.status === 'PENDING' ? (
                                <>
                                  <button
                                    type="button"
                                    disabled={reviewingId === req.id}
                                    onClick={() => handleReview(req.id, 'APPROVED')}
                                    className="bg-emerald-600 text-white rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-emerald-700 transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50"
                                  >
                                    <Check className="h-3.5 w-3.5" />
                                    <span>Approve</span>
                                  </button>
                                  <button
                                    type="button"
                                    disabled={reviewingId === req.id}
                                    onClick={() => handleReview(req.id, 'REJECTED')}
                                    className="border border-rose-200 bg-rose-50 text-rose-700 rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1 shadow-2xs disabled:opacity-50"
                                  >
                                    <X className="h-3.5 w-3.5" />
                                    <span>Reject</span>
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] text-slate-400 font-medium px-2 py-1 bg-slate-50 rounded border border-slate-200">
                                  Reviewed
                                </span>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Full Application Details Modal */}
      <AnimatePresence>
        {selectedRequest && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
            >
              {/* Modal Header */}
              <div className="flex justify-between items-start border-b border-slate-100 pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-900 flex items-center justify-center font-bold text-sm border border-amber-200 shrink-0">
                    {selectedRequest.studentName ? selectedRequest.studentName.slice(0, 2).toUpperCase() : 'ST'}
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-bold text-slate-900">
                      {selectedRequest.studentName}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <CodeBadge code={selectedRequest.studentCode} />
                      <span className="text-xs text-slate-500 font-medium">• {selectedRequest.class}</span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedRequest(null)}
                  className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Leave Details Grid */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] font-medium block">Leave Duration</span>
                  <p className="font-bold text-slate-900 mt-0.5">
                    {formatDateRange(selectedRequest.fromDate, selectedRequest.toDate).range}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-medium block">Total Days Requested</span>
                  <p className="font-bold text-amber-800 mt-0.5">
                    {formatDateRange(selectedRequest.fromDate, selectedRequest.toDate).days}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-medium block">Applicant Type</span>
                  <p className="font-semibold text-slate-700 capitalize mt-0.5">
                    {selectedRequest.requestedBy || 'Student'}
                  </p>
                </div>

                <div>
                  <span className="text-slate-400 text-[11px] font-medium block">Current Status</span>
                  <p className={`font-bold mt-0.5 ${
                    selectedRequest.status === 'APPROVED' ? 'text-emerald-700' :
                    selectedRequest.status === 'REJECTED' ? 'text-rose-700' : 'text-amber-700'
                  }`}>
                    {selectedRequest.status}
                  </p>
                </div>
              </div>

              {/* Complete Reason Text Box */}
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <MessageSquareQuote className="h-4 w-4 text-amber-600" />
                  Full Application Description / Reason:
                </span>
                <div className="rounded-xl border border-amber-200 bg-amber-50/40 p-4 text-xs leading-relaxed text-slate-900 font-normal shadow-2xs whitespace-pre-wrap">
                  "{selectedRequest.reason}"
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedRequest(null)}
                  className="border border-slate-300 text-slate-700 rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors"
                >
                  Close
                </button>

                {selectedRequest.status === 'PENDING' && (
                  <>
                    <button
                      type="button"
                      disabled={reviewingId === selectedRequest.id}
                      onClick={() => handleReview(selectedRequest.id, 'REJECTED')}
                      className="border border-rose-200 bg-rose-50 text-rose-700 rounded-lg px-4 py-2 text-xs font-semibold hover:bg-rose-100 transition-colors flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      <span>Reject Application</span>
                    </button>
                    <button
                      type="button"
                      disabled={reviewingId === selectedRequest.id}
                      onClick={() => handleReview(selectedRequest.id, 'APPROVED')}
                      className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-emerald-700 transition-colors shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Check className="h-4 w-4" />
                      <span>Approve Application</span>
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
