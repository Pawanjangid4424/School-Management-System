'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Plus,
  Search,
  Mail,
  BookOpen,
  Filter,
  X,
  AlertTriangle,
  Eye,
  Pencil,
  ShieldAlert,
  Trash2,
  User,
  UserCheck,
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

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">
                Enrolled Students Directory
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage student records, generated codes, and mailbox provisioning status.
              </p>
            </div>

            <Link
              href="/admin/students/new"
              className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-xs font-semibold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>New Student Registration</span>
            </Link>
          </div>

          {/* Directory Card & Controls */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden">
            {/* Search & Filter Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative w-full sm:w-80">
                <Search
                  className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by code, admission no, or name..."
                  className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:outline-none shadow-xs"
                />
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2 text-xs text-slate-500">
                <span>
                  Total Enrolled: <strong className="text-slate-900 font-bold">{filteredStudents.length}</strong> students
                </span>
              </div>
            </div>

            {/* Mobile & Tablet Card Layout (< lg) */}
            <div className="block lg:hidden divide-y divide-slate-100">
              {filteredStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No student records found matching "{search}".
                </div>
              ) : (
                filteredStudents.map((student) => (
                  <div key={student.id} className="p-4 space-y-3 hover:bg-slate-50/60 transition-colors">
                    {/* Student Info Row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 font-serif font-bold text-sm shrink-0">
                          {student.name ? student.name.charAt(0) : 'S'}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{student.name}</h4>
                          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                            <span>Grade {student.class}</span>
                            {student.stream && student.stream !== 'General' && (
                              <span className="text-[10px] text-slate-400">({student.stream})</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1">
                        <StatusPill status={student.status} />
                      </div>
                    </div>

                    {/* Codes & Email Bar */}
                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <span className="block text-[10px] text-slate-400 font-medium">Admission No</span>
                        <span className="font-mono font-bold text-slate-800">{student.permanentAdmissionNo}</span>
                      </div>
                      <div>
                        <span className="block text-[10px] text-slate-400 font-medium">Student Code</span>
                        <span className="font-mono font-bold text-amber-700">{student.studentCode}</span>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-200/60 truncate">
                        <span className="block text-[10px] text-slate-400 font-medium">System Email</span>
                        <span className="font-mono text-slate-700">{student.email}</span>
                      </div>
                    </div>

                    {/* Action Icon Bar */}
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <Link
                        href={`/admin/students/${student.id}/view`}
                        className="border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="h-3.5 w-3.5 text-blue-600" />
                        <span>View</span>
                      </Link>

                      <Link
                        href={`/admin/students/${student.id}`}
                        className="border border-amber-200 bg-amber-50/50 text-amber-800 hover:bg-amber-100/60 px-3 py-1.5 rounded-lg text-[11px] font-semibold flex items-center gap-1 shadow-2xs"
                      >
                        <Pencil className="h-3.5 w-3.5 text-amber-600" />
                        <span>Edit</span>
                      </Link>

                      <button
                        type="button"
                        onClick={() => { setSelectedStudent(student); setShowSuspendModal(true); }}
                        className="border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 p-1.5 rounded-lg text-[11px] font-semibold"
                        title="Suspend Student"
                      >
                        <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                      </button>

                      <button
                        type="button"
                        onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                        className="border border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100 p-1.5 rounded-lg text-[11px] font-semibold"
                        title="Delete Student"
                      >
                        <Trash2 className="h-3.5 w-3.5 text-rose-600" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View (>= lg) */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Admission No</th>
                    <th className="px-5 py-3.5">Student Code</th>
                    <th className="px-5 py-3.5">Student Name</th>
                    <th className="px-5 py-3.5">Class / Stream</th>
                    <th className="px-5 py-3.5">System Email</th>
                    <th className="px-5 py-3.5">Mailbox</th>
                    <th className="px-5 py-3.5">Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No student records found matching "{search}".
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map((student) => (
                      <tr
                        key={student.id}
                        className="hover:bg-slate-50/60 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <CodeBadge code={student.permanentAdmissionNo} />
                        </td>
                        <td className="px-5 py-3.5">
                          <CodeBadge code={student.studentCode} />
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {student.name}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          Grade {student.class}{' '}
                          {student.stream && student.stream !== 'General' && (
                            <span className="text-[11px] text-slate-400">
                              ({student.stream})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-mono text-[11px]">
                          {student.email}
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill
                            status={student.mailboxStatus === 'COMPLETED' ? 'active' : 'pending'}
                            label={student.mailboxStatus === 'COMPLETED' ? 'Active' : 'Provisioning'}
                          />
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill status={student.status} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Link
                              href={`/admin/students/${student.id}/view`}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                              title="View Student Profile"
                            >
                              <Eye className="h-3.5 w-3.5 text-blue-600" />
                            </Link>

                            <Link
                              href={`/admin/students/${student.id}`}
                              className="p-1.5 rounded-lg border border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 transition-colors"
                              title="Edit Student Details"
                            >
                              <Pencil className="h-3.5 w-3.5 text-amber-600" />
                            </Link>

                            <button
                              type="button"
                              onClick={() => { setSelectedStudent(student); setShowSuspendModal(true); }}
                              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors"
                              title="Suspend Student"
                            >
                              <ShieldAlert className="h-3.5 w-3.5 text-amber-500" />
                            </button>

                            <button
                              type="button"
                              onClick={() => { setSelectedStudent(student); setShowDeleteModal(true); }}
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 text-rose-700 hover:bg-rose-100 transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="h-3.5 w-3.5 text-rose-600" />
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
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 bg-slate-50">
              <h3 className="font-semibold text-slate-800 text-sm">Suspend Student</h3>
              <button onClick={() => setShowSuspendModal(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer"><X className="h-5 w-5" /></button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-amber-900 font-medium">
                You are about to suspend <strong>{selectedStudent.name}</strong> ({selectedStudent.studentCode}).
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Duration (Days)</label>
                <select value={suspendDays} onChange={(e) => setSuspendDays(Number(e.target.value))} className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none">
                  {[1, 2, 3, 4, 5, 6, 7, 10, 14, 30].map(d => <option key={d} value={d}>{d} Days</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Reason for Suspension *</label>
                <textarea rows={3} value={suspendReason} onChange={(e) => setSuspendReason(e.target.value)} placeholder="Provide a reason for the suspension..." className="w-full rounded-xl border border-slate-200 px-3.5 py-2 text-xs text-slate-900 focus:border-amber-500 focus:outline-none resize-none" />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 bg-slate-50">
              <button onClick={() => setShowSuspendModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={handleSuspend} disabled={isProcessing || !suspendReason} className="px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer">
                {isProcessing ? 'Processing...' : 'Confirm Suspension'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm px-4">
          <div className="w-full max-w-md rounded-2xl bg-white shadow-xl overflow-hidden">
            <div className="flex items-center gap-3 border-b border-rose-100 bg-rose-50 px-5 py-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0"><AlertTriangle className="h-4 w-4" /></div>
              <h3 className="font-semibold text-rose-900 text-sm">Delete Student Permanently</h3>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete <strong>{selectedStudent.name}</strong> ({selectedStudent.studentCode})?
              </p>
              <p className="text-rose-700 bg-rose-50 border border-rose-200 p-3 rounded-xl">
                <strong>Warning:</strong> This action cannot be undone. All related data will be permanently removed.
              </p>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-5 py-4 bg-slate-50">
              <button onClick={() => setShowDeleteModal(false)} className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors">Cancel</button>
              <button onClick={handleDelete} disabled={isProcessing} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition-colors disabled:opacity-50 cursor-pointer">
                {isProcessing ? 'Deleting...' : 'Yes, Delete Student'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
