'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  Plus,
  Calendar,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';

export default function TeacherExamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exams, setExams] = useState<any[]>([]);

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
      fetchExams(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchExams = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/teacher/exams`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExams(data);
      }
    } catch (e) {
      console.error('Failed to fetch exams', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Exams & Test Scores...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Exams & Test Scores Portal"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">
                Created Examinations & Quizzes
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Create term exams, enter student marks, and derive letter grades (A+ to F).
              </p>
            </div>

            <Link
              href="/teacher/exams/new"
              className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Create Exam</span>
            </Link>
          </div>

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden space-y-4">
            <div className="border-b border-slate-100 p-4 sm:p-5 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">
                Active Exams & Tests ({exams.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Exam Name</th>
                    <th className="px-5 py-3.5">Target Class</th>
                    <th className="px-5 py-3.5">Subject</th>
                    <th className="px-5 py-3.5">Exam Date</th>
                    <th className="px-5 py-3.5">Max Marks</th>
                    <th className="px-5 py-3.5">Graded Count</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {exams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No exams created yet. Click "+ Create Exam" to add a test.
                      </td>
                    </tr>
                  ) : (
                    exams.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4 text-amber-500 shrink-0" strokeWidth={1.75} />
                          <span>{item.name}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-bold">
                          Grade {item.class_number}-{item.section}
                        </td>
                        <td className="px-5 py-3.5 text-slate-600 font-medium">
                          {item.subject?.subject_name || 'General Exam'}
                        </td>
                        <td className="px-5 py-3.5 text-slate-900 font-mono">
                          {new Date(item.exam_date).toISOString().split('T')[0]}
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {item.max_marks} pts
                        </td>
                        <td className="px-5 py-3.5">
                          <StatusPill status="active" label={`${item._count?.marks || 0} Graded`} />
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <Link
                            href={`/teacher/exams/${item.id}`}
                            className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1 font-bold text-xs"
                          >
                            <span>Enter Marks</span>
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
