'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  ArrowLeft,
  CheckCircle2,
  Save,
  Clock,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AssignmentGradingPage() {
  const router = useRouter();
  const params = useParams();
  const assignmentId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [gradingState, setGradingState] = useState<any[]>([]);

  const [gradeSuccess, setGradeSuccess] = useState('');
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
      fetchSubmissions(token, assignmentId);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, assignmentId]);

  const fetchSubmissions = async (token: string, id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/teacher/assignments/${id}/submissions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
        setGradingState(
          resData.submissions.map((s: any) => ({
            studentProfileId: s.studentProfileId,
            name: s.name,
            studentCode: s.studentCode,
            submissionId: s.submissionId,
            isSubmitted: s.isSubmitted,
            submittedAt: s.submittedAt,
            marksObtained: s.marksObtained ?? '',
            feedback: s.feedback || '',
          })),
        );
      }
    } catch (e) {
      console.error('Failed to fetch assignment submissions', e);
    }
  };

  const handleGradeChange = (index: number, field: string, value: any) => {
    const updated = [...gradingState];
    updated[index][field] = value;
    setGradingState(updated);
  };

  const handleSaveGrade = async (index: number) => {
    const item = gradingState[index];
    if (!item || !item.submissionId) return;

    setError('');
    setGradeSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/teacher/assignments/submissions/${item.submissionId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          marksObtained: Number(item.marksObtained),
          feedback: item.feedback,
        }),
      });

      if (res.ok) {
        setGradeSuccess(`Grade saved for ${item.name}!`);
        const token = localStorage.getItem('access_token') || '';
        fetchSubmissions(token, assignmentId);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to save grade');
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Assignment Submissions...
      </div>
    );
  }

  const assignment = data.assignment;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar with TEACHER role */}
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-64">
        {/* Topbar */}
        <Topbar
          title="Grade Coursework Submissions"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-8 py-6 space-y-6 max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/teacher/assignments"
              className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Assignments</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{assignment.title}</span>
          </div>

          {/* Assignment Header Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Grade {assignment.class_number}-{assignment.section}
                </span>
                <span className="text-xs text-slate-400">
                  {assignment.subject?.subject_name || 'General Coursework'}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-slate-900">
                {assignment.title}
              </h2>
              <p className="text-xs text-slate-600">{assignment.description}</p>
            </div>

            <div className="text-right space-y-1 text-xs">
              <span className="block text-slate-500">Max Marks: <strong className="text-slate-900">{assignment.max_marks || 'N/A'} pts</strong></span>
              <span className="block text-slate-500">Due Date: <strong className="text-slate-900">{new Date(assignment.due_date).toISOString().split('T')[0]}</strong></span>
              <StatusPill status="active" label={`${data.submittedCount} / ${data.totalStudents} Submitted`} />
            </div>
          </div>

          {gradeSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{gradeSuccess}</span>
            </div>
          )}

          {/* Submissions Roster */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-serif text-base font-semibold text-slate-900">
                Student Roster & Submission Grading
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Student Code</th>
                    <th className="px-6 py-3">Submission Status</th>
                    <th className="px-6 py-3">Submitted At</th>
                    <th className="px-6 py-3">Marks Obtained</th>
                    <th className="px-6 py-3">Teacher Feedback</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {gradingState.map((item, idx) => (
                    <tr key={item.studentProfileId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-3.5">
                        <CodeBadge code={item.studentCode} />
                      </td>
                      <td className="px-6 py-3.5">
                        <StatusPill
                          status={item.isSubmitted ? 'active' : 'pending'}
                          label={item.isSubmitted ? 'Submitted' : 'Not Submitted'}
                        />
                      </td>
                      <td className="px-6 py-3.5 text-slate-500 font-mono">
                        {item.submittedAt ? item.submittedAt.split('T')[0] : '—'}
                      </td>
                      <td className="px-6 py-3.5">
                        <input
                          type="number"
                          value={item.marksObtained}
                          onChange={(e) => handleGradeChange(idx, 'marksObtained', e.target.value)}
                          placeholder="Marks"
                          className="w-20 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 font-semibold focus:border-amber-500"
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <input
                          type="text"
                          value={item.feedback}
                          onChange={(e) => handleGradeChange(idx, 'feedback', e.target.value)}
                          placeholder="Optional feedback..."
                          className="w-48 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-900 focus:border-amber-500"
                        />
                      </td>
                      <td className="px-6 py-3.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleSaveGrade(idx)}
                          disabled={!item.submissionId}
                          className="bg-slate-900 text-white rounded-md px-3 py-1 text-xs font-medium hover:bg-slate-800 disabled:opacity-40"
                        >
                          Save Grade
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
