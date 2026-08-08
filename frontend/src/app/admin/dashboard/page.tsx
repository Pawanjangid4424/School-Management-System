'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap,
  Users,
  BookOpen,
  CreditCard,
  TrendingUp,
  Plus,
  MoreHorizontal,
  ArrowUpRight,
  School,
  CheckCircle2,
  Clock,
  Shield,
  X,
  AlertTriangle,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';
import { CodeBadge } from '@/components/ui/CodeBadge';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalStudents: 0,
    activeStaff: 0,
    totalClasses: 0,
    feeCollections: 0,
  });
  const [recentStudents, setRecentStudents] = useState<any[]>([]);
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
      fetchDashboardData(token);
    } catch (e) {
      router.push('/login');
      setLoading(false);
    }
  }, [router]);

  const fetchDashboardData = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const [studentsRes, staffRes, classesRes, feesRes] = await Promise.all([
        fetch(`${apiUrl}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/staff`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/classes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/fees/dashboard-summary`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const [students, staff, classes, fees] = await Promise.all([
        studentsRes.ok ? studentsRes.json() : [],
        staffRes.ok ? staffRes.json() : [],
        classesRes.ok ? classesRes.json() : [],
        feesRes.ok ? feesRes.json() : { totalCollected: 0 },
      ]);

      setDashboardStats({
        totalStudents: students.length || 0,
        activeStaff: staff.length || 0,
        totalClasses: classes.length || 0,
        feeCollections: fees.totalCollected || 0,
      });

      // Keep only the 5 most recently added students for the table
      const sortedStudents = (students || []).sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setRecentStudents(sortedStudents.slice(0, 5));
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
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
        fetchDashboardData(token!);
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
        fetchDashboardData(token!);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs font-medium">
        Loading Admin Portal...
      </div>
    );
  }

  const stats = [
    {
      title: 'Total Students',
      value: dashboardStats.totalStudents.toLocaleString(),
      trend: 'Active enrolled',
      icon: GraduationCap,
      trendUp: true,
    },
    {
      title: 'Active Teaching Staff',
      value: dashboardStats.activeStaff.toLocaleString(),
      trend: 'Fully staffed',
      icon: Users,
      trendUp: true,
    },
    {
      title: 'Classes & Sections',
      value: dashboardStats.totalClasses.toLocaleString(),
      trend: 'Configured',
      icon: BookOpen,
      trendUp: true,
    },
    {
      title: 'Fee Collections',
      value: `$${dashboardStats.feeCollections.toLocaleString()}`,
      trend: 'Total collected',
      icon: CreditCard,
      trendUp: true,
    },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Left Sidebar */}
      <Sidebar role={user?.role} tenantName={user?.tenant_name || 'Marudhar Defence Academy'} />

      {/* Main Content Area */}
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar */}
        <Topbar
          title="Admin Dashboard"
          userName={user?.email === 'admin@school.com' ? 'Welcome, Admin' : user?.email}
          userRole="System Administrator"
        />

        {/* Content Container */}
        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Welcome Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4 sm:p-6 shadow-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <StatusPill status="active" label="System Online" />
                <span className="text-xs text-slate-400 font-mono">
                  Tenant: {user?.tenant_name || 'Marudhar Defence Academy'}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-slate-900">
                Welcome, Admin
              </h2>
              <p className="text-xs text-slate-600">
                Overview of school operations, student enrolments, and staff allocations.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => alert('Exporting dashboard report... (Implementation Pending)')}
                className="border border-dashed border-slate-300 text-slate-500 hover:border-slate-400 hover:text-slate-700 rounded-lg px-3 py-2 text-xs font-medium transition-colors"
              >
                + Export Report
              </button>
              <Link
                href="/admin/students/new"
                className="bg-slate-900 text-white rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={2} />
                <span>Quick Enrolment</span>
              </Link>
            </div>
          </div>

          {/* 4-Column Stat Cards Grid */}
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-500">
                      {stat.title}
                    </span>
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-50 border border-slate-100 text-slate-700">
                      <Icon className="h-4 w-4" strokeWidth={1.75} />
                    </div>
                  </div>

                  <div>
                    <div className="font-serif text-2xl font-semibold text-slate-900">
                      {stat.value}
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-medium text-emerald-600">
                      <TrendingUp className="h-3 w-3" strokeWidth={1.75} />
                      <span>{stat.trend}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Main Cards Row */}
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Table Panel (2 columns) */}
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Recent Enrolments & Student Profiles
                  </h3>
                  <p className="text-xs text-slate-500">
                    System-generated codes rendered with signature monospace pill badges.
                  </p>
                </div>
                <Link
                  href="/admin/students"
                  className="text-xs font-medium text-amber-600 hover:text-amber-700 flex items-center gap-0.5"
                >
                  <span>View All</span>
                  <ArrowUpRight className="h-3.5 w-3.5" strokeWidth={1.75} />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                    <tr>
                      <th className="px-6 py-3">Admission No</th>
                      <th className="px-6 py-3">Student Code</th>
                      <th className="px-6 py-3">Student Name</th>
                      <th className="px-6 py-3">Class / Stream</th>
                      <th className="px-6 py-3">Status</th>
                      <th className="px-6 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {recentStudents.map((student) => (
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
                          {student.stream && student.stream !== 'General' && (
                            <span className="text-[11px] text-slate-400">
                              ({student.stream})
                            </span>
                          )}
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
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Side Card / System Status (1 column) */}
            <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4">
                <School className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  School Information
                </h3>
              </div>

              <div className="space-y-4 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">School Code:</span>
                  <CodeBadge code="MDA" />
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Academic Year:</span>
                  <span className="font-medium text-slate-900">2026 - 2027</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Active Tenant ID:</span>
                  <span className="font-mono text-[11px] text-slate-600">
                    {user?.tenant_id?.slice(0, 13) || 'tenant-mda-01'}...
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Mail Provider:</span>
                  <span className="font-medium text-slate-900">Google Workspace</span>
                </div>
              </div>

              <div className="rounded-lg border border-slate-100 bg-slate-50 p-4 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                  <Shield className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                  <span>Role-based Guards Active</span>
                </div>
                <p className="text-[11px] text-slate-600">
                  JWT auth strategy and <code className="font-mono text-slate-800">@Roles(Role.ADMIN)</code> route guards protect this admin portal.
                </p>
                <div className="flex items-center gap-2 text-[11px] text-emerald-700 font-medium">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Authenticated as {user?.email}</span>
                </div>
              </div>
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
