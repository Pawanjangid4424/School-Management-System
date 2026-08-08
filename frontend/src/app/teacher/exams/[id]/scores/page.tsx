'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  FileSpreadsheet,
  ArrowLeft,
  CheckCircle2,
  Save,
  Award,
  TrendingUp,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function ExamScoresEntryPage() {
  const router = useRouter();
  const params = useParams();
  const examId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [examData, setExamData] = useState<any>(null);
  const [scoresState, setScoresState] = useState<any[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState('');
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
      fetchExamScores(token, examId);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, examId]);

  const fetchExamScores = async (token: string, id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/teacher/exams/${id}/scores`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setExamData(data);
        setScoresState(
          data.scores.map((s: any) => ({
            studentProfileId: s.studentProfileId,
            name: s.name,
            studentCode: s.studentCode,
            rollNo: s.rollNo,
            marksObtained: s.marksObtained ?? 0,
            gradeLabel: s.gradeLabel || 'F',
          })),
        );
      }
    } catch (e) {
      console.error('Failed to fetch exam scores', e);
    }
  };

  const handleScoreChange = (index: number, newMarks: number) => {
    const updated = [...scoresState];
    const maxMarks = examData?.exam?.max_marks || 100;
    updated[index].marksObtained = newMarks;

    // Derived grade calculation
    const percent = (newMarks / maxMarks) * 100;
    let label = 'F';
    if (percent >= 90) label = 'A+';
    else if (percent >= 80) label = 'A';
    else if (percent >= 70) label = 'B';
    else if (percent >= 60) label = 'C';
    else if (percent >= 50) label = 'D';

    updated[index].gradeLabel = label;
    setScoresState(updated);
  };

  const handleSaveAllScores = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    setSaveSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/teacher/exams/${examId}/scores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          scores: scoresState.map((s) => ({
            studentProfileId: s.studentProfileId,
            marksObtained: Number(s.marksObtained),
          })),
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.message || 'Failed to save scores');

      setSaveSuccess(`Exam scores for ${examData.exam.name} saved!`);
      const tokenStr = localStorage.getItem('access_token') || '';
      fetchExamScores(tokenStr, examId);
    } catch (err: any) {
      setError(err.message || 'Error saving exam scores.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !examData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Exam Scores Grid...
      </div>
    );
  }

  const exam = examData.exam;

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar with TEACHER role */}
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-64">
        {/* Topbar */}
        <Topbar
          title="Bulk Test Scores Entry Grid"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-8 py-6 space-y-6 max-w-6xl">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/teacher/exams"
              className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Exams & Test Scores</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">{exam.name}</span>
          </div>

          {/* Exam Header Banner & Analytics */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Grade {exam.class_number}-{exam.section}
                </span>
                <span className="text-xs text-slate-400">
                  {exam.subject?.subject_name || 'General Exam'}
                </span>
              </div>
              <h2 className="font-serif text-2xl font-semibold text-slate-900">
                {exam.name}
              </h2>
              <p className="text-xs text-slate-500">
                Max Marks: <strong className="text-slate-900 font-semibold">{exam.max_marks} pts</strong> | Date: {new Date(exam.exam_date).toISOString().split('T')[0]}
              </p>
            </div>

            {/* Quick Stats Cards */}
            <div className="flex items-center gap-4 text-xs">
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 text-center">
                <span className="block text-[11px] text-slate-400">Class Average</span>
                <span className="font-serif text-lg font-bold text-slate-900">
                  {examData.classAverage} / {exam.max_marks}
                </span>
              </div>

              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                <span className="block text-[11px] text-emerald-700 font-medium">Highest Score</span>
                <span className="font-serif text-lg font-bold text-emerald-800">
                  {examData.highestScore}
                </span>
              </div>
            </div>
          </div>

          {saveSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {error && (
            <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
              {error}
            </div>
          )}

          {/* Bulk Scores Grid */}
          <form onSubmit={handleSaveAllScores} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="font-serif text-base font-semibold text-slate-900">
                  Class Marks Entry Grid ({scoresState.length} Students)
                </h3>
                <p className="text-xs text-slate-500">
                  Type student marks; letter grades (A+ to F) derive automatically.
                </p>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="bg-amber-500 text-slate-950 font-semibold rounded-lg px-5 py-2 text-xs hover:bg-amber-400 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{submitting ? 'Saving Scores...' : 'Save All Exam Scores'}</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Roll No</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Student Code</th>
                    <th className="px-6 py-3">Marks Obtained (Out of {exam.max_marks})</th>
                    <th className="px-6 py-3">Derived Grade Label</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {scoresState.map((item, idx) => (
                    <tr key={item.studentProfileId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3.5 font-mono text-slate-500">
                        #{item.rollNo}
                      </td>
                      <td className="px-6 py-3.5 font-medium text-slate-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-3.5">
                        <CodeBadge code={item.studentCode} />
                      </td>
                      <td className="px-6 py-3.5">
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={exam.max_marks}
                          value={item.marksObtained}
                          onChange={(e) => handleScoreChange(idx, Number(e.target.value))}
                          className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 font-bold focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </td>
                      <td className="px-6 py-3.5">
                        <span
                          className={`inline-block rounded-md px-2.5 py-1 text-xs font-bold font-mono ${
                            item.gradeLabel === 'A+' || item.gradeLabel === 'A'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : item.gradeLabel === 'B' || item.gradeLabel === 'C'
                              ? 'bg-amber-100 text-amber-900 border border-amber-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          Grade {item.gradeLabel}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </form>
        </main>
      </div>
    </div>
  );
}
