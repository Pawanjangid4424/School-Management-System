'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  BookOpen,
  Plus,
  Calendar,
  CheckCircle2,
  FileText,
  ArrowRight,
  Filter,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';

export default function TeacherAssignmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState('ALL');

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
      fetchAssignments(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchAssignments = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/teacher/assignments`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAssignments(data);
      }
    } catch (e) {
      console.error('Failed to fetch assignments', e);
    }
  };

  const filteredAssignments = assignments.filter((a) => {
    if (selectedClass === 'ALL') return true;
    return `Grade ${a.class_number}-${a.section}` === selectedClass;
  });

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Assignments...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Assignments & Coursework Management"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">
                Created Coursework & Homework
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage homework tasks, track student submissions, and enter grades & feedback.
              </p>
            </div>

            <Link
              href="/teacher/assignments/new"
              className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Create Assignment</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden space-y-4">
            <div className="border-b border-slate-100 p-4 sm:p-5 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">
                Active Assignments ({filteredAssignments.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Assignment Title</th>
                    <th className="px-5 py-3.5">Target Class</th>
                    <th className="px-5 py-3.5">Subject</th>
                    <th className="px-5 py-3.5">Due Date</th>
                    <th className="px-5 py-3.5">Max Marks</th>
                    <th className="px-5 py-3.5">Submissions</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredAssignments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No assignments created yet. Click "+ Create Assignment" to publish coursework.
                      </td>
                    </tr>
                  ) : (
                    filteredAssignments.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-amber-500 shrink-0" strokeWidth={1.75} />
                          <span>{item.title}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-bold">
                          Grade {item.class_number}-{item.section}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          {item.subject?.subject_name || 'General Coursework'}
                        </td>
                        <td className="px-5 py-3.5 font-mono text-slate-700">
                          {item.due_date ? new Date(item.due_date).toLocaleDateString() : 'No Due Date'}
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                          {item.max_marks || 100} Pts
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill status="active" label={`${item._count?.submissions || 0} Submitted`} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/teacher/assignments/${item.id}`}
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1 font-bold text-xs"
                          >
                            <span>Grade</span>
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Link>
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
    </div>
  );
}
