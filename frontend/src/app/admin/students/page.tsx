'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Plus,
  Search,
  MoreHorizontal,
  Mail,
  BookOpen,
  Filter,
  X,
  AlertTriangle,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function StudentsDirectoryPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [students, setStudents] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [showSuspendModal, setShowSuspendModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [suspendDays, setSuspendDays] = useState(2);
  const [suspendReason, setSuspendReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

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
      fetchStudents(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchStudents = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/students`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      }
    } catch (e) {
      console.error('Failed to fetch students', e);
    }
  };

  const handleSuspend = async () => {
    if (!selectedStudent || !suspendReason) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/students/${selectedStudent.id}/suspend`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ durationDays: suspendDays, reason: suspendReason }),
      });
      if (res.ok) {
        setShowSuspendModal(false);
        setSuspendReason('');
        fetchStudents(token!);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent) return;
    setIsProcessing(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/students/${selectedStudent.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        setShowDeleteModal(false);
        fetchStudents(token!);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  const filteredStudents = students.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.studentCode.toLowerCase().includes(search.toLowerCase()) ||
      s.permanentAdmissionNo.toLowerCase().includes(search.toLowerCase()) ||
      s.email.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Directory...
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
          title="Students Directory"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Enrolled Students
              </h2>
              <p className="text-xs text-slate-500">
                Manage student records, generated codes, and mailbox provisioning status.
              </p>
            </div>

            <Link
              href="/admin/students/new"
              className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>New Student Registration </span>
            </Link>
          </div>

          {/* Directory Card & Controls */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            {/* Search & Filter Bar */}
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div className="relative w-80">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by code, admission no, or name..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">
                  Total: <strong className="text-slate-900 font-semibold">{filteredStudents.length}</strong> students
                </span>
              </div>
            </div>

            {/* Students Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Admission No</th>
                    <th className="px-6 py-3">Student Code</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Class / Stream</th>
                    <th className="px-6 py-3">System Email</th>
                    <th className="px-6 py-3">Mailbox Status</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No student records found. Click "+ Add Student" to register a new student.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-6 py-3.5">
                          <CodeBadge code={student.permanentAdmissionNo} />
                        </td>
                        <td className="px-6 py-3.5">
                          <CodeBadge code={student.studentCode} />
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {student.name}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {student.class}{' '}
                          {student.stream !== 'General' && (
                            <span className="text-[11px] text-slate-400">
                              ({student.stream})
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 font-mono text-[11px]">
                          {student.email}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill
                            status={student.mailboxStatus === 'COMPLETED' ? 'active' : 'pending'}
                            label={student.mailboxStatus === 'COMPLETED' ? 'Active' : 'Provisioning'}
                          />
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill status={student.status} />
                        </td>
                        <td className="px-6 py-3.5 text-right relative group">
                          <button
                            type="button"
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          >
                            <MoreHorizontal className="h-4 w-4" strokeWidth={1.75} />
                          </button>

                          {/* Dropdown Menu */}
                          <div className="absolute right-6 top-full z-10 hidden w-32 flex-col rounded-lg border border-slate-200 bg-white shadow-lg group-hover:flex group-focus-within:flex overflow-hidden">
                            <Link href={`/admin/students/${student.id}/view`} className="px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors">
                              View Profile
                            </Link>
                            <Link href={`/admin/students/${student.id}`} className="px-4 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:text-slate-900 transition-colors border-t border-slate-100 block">
                              Edit Details
                            </Link>
                            <button type="button" onClick={() => { setSelectedStudent(student); setShowSuspendModal(true); }} className="px-4 py-2 text-left text-xs text-amber-600 hover:bg-amber-50 transition-colors border-t border-slate-100">
                              Suspend
                            </button>
                            <button type="button" onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }} className="px-4 py-2 text-left text-xs text-rose-600 hover:bg-rose-50 transition-colors border-t border-slate-100">
                              Delete
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
      {showSuspendModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h3 className="font-semibold text-slate-800">Suspend Student</h3>
              <button onClick={() => setShowSuspendModal(false)} className="text-slate-400 hover:text-slate-600"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                You are about to suspend <strong>{selectedStudent.name}</strong> ({selectedStudent.studentCode}).
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Duration (Days)</label>
                <select value={suspendDays} onChange={(e) => setSuspendDays(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none">
                  {[1, 2, 3, 4, 5, 6, 7, 10, 14, 30].map(d => <option key={d} value={d}>{d} Days</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Reason for Suspension *</label>
                <textarea rows={3} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Provide a reason for the suspension..." className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs focus:border-amber-500 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50">
              <button onClick={() => setShowSuspendModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={handleSuspend} disabled={isProcessing || !suspendReason} className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-medium hover:bg-amber-700 transition-colors disabled:opacity-50">
                {isProcessing ? 'Processing...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-6 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600"><AlertTriangle className="h-4 w-4" /></div>
              <h3 className="font-semibold text-rose-800 text-sm">Delete Student Permanently</h3>
            </div>
            <div className="p-6 space-y-4">
              <p className="text-sm text-slate-600">
                Are you sure you want to permanently delete <strong>{selectedStudent.name}</strong> ({selectedStudent.studentCode})?
              </p>
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-100 p-3 rounded-lg">
                <strong>Warning:</strong> This action cannot be undone. All related data will be permanently removed. A record of this deletion will be stored in the audit logs.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={isProcessing} className="px-4 py-2 bg-rose-600 text-white rounded-lg text-xs font-medium hover:bg-rose-700 transition-colors disabled:opacity-50">
                {isProcessing ? 'Deleting...' : 'Yes, Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
