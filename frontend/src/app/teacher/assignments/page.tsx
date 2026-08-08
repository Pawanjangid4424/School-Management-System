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
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

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
      {/* Sidebar with TEACHER role */}
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-64">
        {/* Topbar */}
        <Topbar
          title="Assignments & Coursework Management"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-8 py-6 space-y-6">
          {/* Header Action Row */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Created Coursework & Homework
              </h2>
              <p className="text-xs text-slate-500">
                Manage homework tasks, track student submissions, and enter grades & feedback.
              </p>
            </div>

            <Link
              href="/teacher/assignments/new"
              className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>+ Create Assignment</span>
            </Link>
          </div>

          {/* Assignments Grid */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <span className="text-xs font-semibold text-slate-900">
                Active Assignments ({filteredAssignments.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Assignment Title</th>
                    <th className="px-6 py-3">Target Class</th>
                    <th className="px-6 py-3">Subject</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Max Marks</th>
                    <th className="px-6 py-3">Submissions</th>
                    <th className="px-6 py-3 text-right">Actions</th>
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
                        <td className="px-6 py-3.5 font-medium text-slate-900 flex items-center gap-2">
                          <FileText className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                          <span>{item.title}</span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 font-medium">
                          Grade {item.class_number}-{item.section}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {item.subject?.subject_name || 'General Coursework'}
                        </td>
                        <td className="px-6 py-3.5 text-slate-900 font-mono">
                          {new Date(item.due_date).toISOString().split('T')[0]}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900">
                          {item.max_marks || 'N/A'} pts
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          <StatusPill
                            status={item.submissions?.length > 0 ? 'active' : 'pending'}
                            label={`${item.submissions?.length || 0} Submissions`}
                          />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            href={`/teacher/assignments/${item.id}`}
                            className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Grade Submissions</span>
                            <ArrowRight className="h-3 w-3" />
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
