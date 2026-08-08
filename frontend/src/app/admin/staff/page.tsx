'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users,
  Plus,
  Search,
  Mail,
  Briefcase,
  X,
  AlertTriangle,
  Eye,
  Trash2,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Filter,
  Calendar,
  ShieldAlert,
  Sparkles,
  RefreshCw
} from 'lucide-react';

import { toast, Toaster } from 'sonner';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';

export default function StaffDirectoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; staff: any | null }>({ open: false, staff: null });
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; staff: any | null }>({ open: false, staff: null });
  const [suspendDays, setSuspendDays] = useState(1);
  const [suspendReason, setSuspendReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

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
      fetchStaff(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchStaff = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/staff`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStaffList(data);
      }
    } catch (e) {
      console.error('Failed to fetch staff directory', e);
    }
  };

  const handleSuspendStaff = async () => {
    if (!suspendModal.staff) return;
    setActionLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/staff/${suspendModal.staff.id}/suspend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          durationDays: suspendDays,
          reason: suspendReason,
        }),
      });

      if (res.ok) {
        toast.success(`Staff ${suspendModal.staff.name} suspended successfully`);
        setSuspendModal({ open: false, staff: null });
        setSuspendDays(1);
        setSuspendReason('');
        if (token) fetchStaff(token);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Failed to suspend staff');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'An error occurred while suspending staff');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteStaff = async () => {
    if (!deleteModal.staff) return;
    setActionLoading(true);
    const token = localStorage.getItem('access_token');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/staff/${deleteModal.staff.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success(`Staff ${deleteModal.staff.name} deleted successfully`);
        setDeleteModal({ open: false, staff: null });
        if (token) fetchStaff(token);
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Failed to delete staff');
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e.message || 'An error occurred while deleting staff');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.staffId.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      selectedStatus === 'ALL'
        ? true
        : s.status?.toUpperCase() === selectedStatus.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  // KPI Calculations
  const totalStaff = staffList.length;
  const activeStaff = staffList.filter((s) => s.status?.toUpperCase() === 'ACTIVE').length;
  const suspendedStaff = staffList.filter((s) => s.status?.toUpperCase() === 'SUSPENDED').length;
  const mailboxesActive = staffList.filter((s) => s.mailboxStatus === 'COMPLETED').length;

  const getInitials = (name: string) => {
    if (!name) return 'ST';
    const parts = name.split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white text-sm font-medium">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
          <span>Loading Staff Directory...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-slate-900 selection:text-white">
      <Toaster position="top-center" />
      {/* Sidebar */}
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar */}
        <Topbar
          title="Staff Directory"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Header Banner Row */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="h-4 w-4" />
                <span>Faculty Management</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Staff & Faculty Directory
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Oversee teaching faculty, admin staff, assigned classes, permanent staff IDs, and school email mailboxes.
              </p>
            </div>

            <Link
              href="/admin/staff/new"
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl px-5 py-3 text-xs sm:text-sm transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-amber-500/25 shrink-0"
            >
              <Plus className="h-4 w-4" strokeWidth={2.5} />
              <span>Add Staff Member</span>
            </Link>
          </div>

          {/* 📊 KPI Analytics Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Staff</span>
                <p className="text-2xl font-bold text-slate-900">{totalStaff}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Active Faculty</span>
                <p className="text-2xl font-bold text-emerald-600">{activeStaff}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mailboxes Active</span>
                <p className="text-2xl font-bold text-blue-600">{mailboxesActive}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Mail className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Suspended</span>
                <p className="text-2xl font-bold text-amber-600">{suspendedStaff}</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <ShieldAlert className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Directory Filter Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              
              {/* Search Bar */}
              <div className="relative w-full sm:w-80">
                <Search
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={2}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by ID, name, department..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none transition-all"
                />
              </div>

              {/* Status Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full sm:w-auto overflow-x-auto">
                {['ALL', 'ACTIVE', 'SUSPENDED'].map((status) => (
                  <button
                    key={status}
                    onClick={() => setSelectedStatus(status)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedStatus === status
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {status === 'ALL' ? 'All Staff' : status}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Staff Table Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-6 py-4">Staff Member</th>
                    <th className="px-6 py-4">Staff ID</th>
                    <th className="px-6 py-4">Designation & Department</th>
                    <th className="px-6 py-4">System Email</th>
                    <th className="px-6 py-4">Joining Date</th>
                    <th className="px-6 py-4">Mailbox</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStaff.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Users className="h-8 w-8 text-slate-300" />
                          <p className="font-medium text-slate-600 text-sm">No staff records found</p>
                          <p className="text-xs text-slate-400">Try adjusting your search query or filter criteria.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredStaff.map((staff) => (
                      <tr
                        key={staff.id}
                        className="hover:bg-slate-50/80 transition-colors group"
                      >
                        {/* Member Avatar + Name */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                              {getInitials(staff.name)}
                            </div>
                            <div>
                              <span className="font-bold text-slate-900 block text-sm group-hover:text-indigo-600 transition-colors">
                                {staff.name}
                              </span>
                              <span className="text-[11px] text-slate-400 font-medium">
                                {staff.department}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Staff ID */}
                        <td className="px-6 py-4">
                          <CodeBadge code={staff.staffId} />
                        </td>

                        {/* Designation & Department */}
                        <td className="px-6 py-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-800">{staff.designation}</span>
                            <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                              <Building2 className="h-3 w-3 text-slate-400" /> {staff.department}
                            </span>
                          </div>
                        </td>

                        {/* System Email */}
                        <td className="px-6 py-4">
                          <span className="font-mono text-[11.5px] text-slate-700 font-medium bg-slate-100 px-2 py-1 rounded-md border border-slate-200/60 inline-flex items-center gap-1.5">
                            <Mail className="h-3 w-3 text-slate-400" />
                            {staff.email}
                          </span>
                        </td>

                        {/* Joining Date */}
                        <td className="px-6 py-4">
                          <span className="text-slate-600 font-medium flex items-center gap-1 text-[11.5px]">
                            <Calendar className="h-3 w-3 text-slate-400" />
                            {staff.joiningDate}
                          </span>
                        </td>

                        {/* Mailbox Status */}
                        <td className="px-6 py-4">
                          {staff.mailboxStatus === 'COMPLETED' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Active Mailbox
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                              <Clock className="h-3 w-3" /> Provisioning
                            </span>
                          )}
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          {staff.status?.toUpperCase() === 'ACTIVE' ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                              ACTIVE
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-600" />
                              {staff.status?.toUpperCase()}
                            </span>
                          )}
                        </td>

                        {/* Direct Action Icons */}
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/staff/${staff.id}/view`}
                              className="p-2 rounded-xl text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition-all"
                              title="View Profile"
                            >
                              <Eye className="h-4 w-4" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => setSuspendModal({ open: true, staff })}
                              className="p-2 rounded-xl text-slate-500 hover:text-amber-600 hover:bg-amber-50 border border-transparent hover:border-amber-100 transition-all"
                              title="Suspend Account"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </button>

                            <button
                              type="button"
                              onClick={() => setDeleteModal({ open: true, staff })}
                              className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-transparent hover:border-red-100 transition-all"
                              title="Delete Permanently"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
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

      {/* Suspend Modal */}
      <AnimatePresence>
        {suspendModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSuspendModal({ open: false, staff: null })}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-amber-600">
                  <ShieldAlert className="h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">Suspend Staff Account</h3>
                </div>
                <button
                  onClick={() => setSuspendModal({ open: false, staff: null })}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                <p className="text-xs text-slate-600 leading-relaxed">
                  You are about to suspend <strong className="text-slate-900">{suspendModal.staff?.name}</strong>.
                  They will lose portal login access until the suspension duration completes.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Suspension Duration (Days)</label>
                    <input
                      type="number"
                      min="1"
                      value={suspendDays}
                      onChange={(e) => setSuspendDays(parseInt(e.target.value) || 1)}
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Suspension</label>
                    <textarea
                      rows={3}
                      value={suspendReason}
                      onChange={(e) => setSuspendReason(e.target.value)}
                      placeholder="Enter specific reason..."
                      className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs font-medium text-slate-900 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setSuspendModal({ open: false, staff: null })}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSuspendStaff}
                  disabled={actionLoading || !suspendReason.trim()}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  {actionLoading ? 'Suspending...' : 'Confirm Suspension'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {deleteModal.open && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeleteModal({ open: false, staff: null })}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-red-600">
                  <AlertTriangle className="h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">Delete Staff Member</h3>
                </div>
                <button
                  onClick={() => setDeleteModal({ open: false, staff: null })}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-3">
                <p className="text-xs text-slate-600 leading-relaxed">
                  Are you sure you want to permanently delete <strong className="text-slate-900">{deleteModal.staff?.name}</strong>?
                </p>
                <div className="bg-red-50 border border-red-200/80 rounded-xl p-3 text-xs text-red-700 font-medium">
                  ⚠️ This action is permanent. All linked class teacher assignments and user login access will be safely cleaned up and logged in the audit trail.
                </div>
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <button
                  onClick={() => setDeleteModal({ open: false, staff: null })}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteStaff}
                  disabled={actionLoading}
                  className="px-4 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                >
                  {actionLoading ? 'Deleting...' : 'Delete Permanently'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
