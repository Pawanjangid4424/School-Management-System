'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { BookOpen, Upload, CheckCircle2, FileText } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { 
    opacity: 1, 
    y: 0,
    transition: { type: 'spring', stiffness: 300, damping: 24 }
  }
};

const hover3DEffect: any = {
  scale: 1.02,
  y: -5,
  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
  transition: { type: 'spring', stiffness: 400, damping: 15 }
};

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<any[]>([]);

  // Submission Modal State
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [fileUrl, setFileUrl] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
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
      const res = await fetch(`${apiUrl}/student-portal/assignments/self`, {
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

  const handleSubmitFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment) return;

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/student-portal/assignments/${selectedAssignment.id}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ fileUrl }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Submission failed');

      setSuccessMsg(`Assignment "${selectedAssignment.title}" submitted successfully!`);
      setSelectedAssignment(null);
      setFileUrl('');
      fetchAssignments(token || '');
    } catch (err: any) {
      setError(err.message || 'Error submitting assignment.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Coursework & Homework...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="STUDENT" tenantName={user?.tenant_name} />

      <motion.div 
        className="flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 md:pl-[var(--sidebar-width,256px)]"
      >
        <Topbar
          title="My Coursework & Homework Assignments"
          userName={`Welcome, ${user?.username || 'Student'}`}
          userRole="Enrolled Student Account"
        />

        <main className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {successMsg && (
              <motion.div variants={itemVariants} className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-4 shadow-sm text-sm font-medium text-emerald-700">
                <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                <span>{successMsg}</span>
              </motion.div>
            )}

            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.01, y: -2, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-serif text-base font-semibold text-slate-900">
                Assigned Class Coursework ({assignments.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[600px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Subject & Title</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3">Marks Obtained</th>
                    <th className="px-6 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {assignments.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium text-sm">
                        No coursework assigned for your class yet.
                      </td>
                    </tr>
                  ) : (
                    assignments.map((item, idx) => (
                      <motion.tr 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.1 * idx }}
                        key={item.id} 
                        className="hover:bg-slate-50/80 transition-colors"
                      >
                        <td className="px-6 py-4 space-y-1">
                          <span className="text-[11px] font-semibold text-amber-600 block">
                            {item.subjectName}
                          </span>
                          <span className="font-medium text-slate-900 block">
                            {item.title}
                          </span>
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-700">
                          {item.dueDate}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill
                            status={item.submissionStatus === 'GRADED' ? 'active' : item.submissionStatus === 'SUBMITTED' ? 'active' : 'pending'}
                            label={item.submissionStatus}
                          />
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900">
                          {item.marksObtained !== null ? `${item.marksObtained} / ${item.maxMarks}` : '—'}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {item.submissionStatus === 'PENDING' ? (
                            <button
                              onClick={() => {
                                setSelectedAssignment(item);
                                setSuccessMsg('');
                                setError('');
                              }}
                              className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                            >
                              <Upload className="h-3.5 w-3.5" />
                              <span>Submit File</span>
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Submitted</span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* Student Submission Modal */}
          <AnimatePresence>
            {selectedAssignment && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4 backdrop-blur-sm"
              >
                <motion.div 
                  initial={{ scale: 0.95, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.95, y: 20 }}
                  className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5"
                >
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Submit Homework: {selectedAssignment.title}
                  </h3>
                  <button
                    onClick={() => setSelectedAssignment(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleSubmitFile} className="space-y-4 text-xs">
                  {error && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Uploaded File URL / Document Link *
                    </label>
                    <input
                      type="url"
                      required
                      value={fileUrl}
                      onChange={(e) => setFileUrl(e.target.value)}
                      placeholder="https://drive.google.com/file/... or URL"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedAssignment(null)}
                      className="border border-dashed border-slate-300 text-slate-600 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800"
                    >
                      {submitting ? 'Submitting...' : 'Upload & Turn In'}
                    </button>
                  </div>
                </form>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
