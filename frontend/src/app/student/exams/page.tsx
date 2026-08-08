'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Award, TrendingUp, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

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

export default function StudentExamsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<any[]>([]);

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
      fetchScores(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchScores = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/student-portal/scores/self`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setScores(data);
      }
    } catch (e) {
      console.error('Failed to fetch scores', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Test Scores & Grades...
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
          title="My Examination Scores & Letter Grades"
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
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.01, y: -2, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-slate-900">
                  Examination Report & Grade Sheet ({scores.length})
                </h3>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <Award className="h-4 w-4" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
                  <thead className="bg-slate-50 text-slate-600 border-b-2 border-slate-200 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Examination Name</th>
                      <th className="px-6 py-4">Subject</th>
                      <th className="px-6 py-4">Exam Date</th>
                      <th className="px-6 py-4">Marks Obtained</th>
                      <th className="px-6 py-4">Letter Grade</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {scores.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-medium">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                          No examination scores logged yet for your profile.
                        </td>
                      </tr>
                    ) : (
                      scores.map((item, idx) => (
                        <motion.tr 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          key={item.scoreId} 
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-slate-900">
                            {item.examName}
                          </td>
                          <td className="px-6 py-4 text-slate-700 font-semibold text-[11px]">
                            {item.subjectName}
                          </td>
                          <td className="px-6 py-4 font-mono text-slate-500 text-[11px]">
                            {item.examDate}
                          </td>
                          <td className="px-6 py-4">
                            <span className="font-semibold text-slate-900">
                              {item.marksObtained}
                            </span>
                            <span className="text-slate-400 ml-1">/ {item.maxMarks}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-bold ${
                                ['A', 'A+', 'A-', 'O'].includes(item.gradeLabel)
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : ['B', 'B+', 'B-', 'C'].includes(item.gradeLabel)
                                  ? 'bg-indigo-50 text-indigo-700'
                                  : ['F', 'D', 'E'].includes(item.gradeLabel)
                                  ? 'bg-rose-50 text-rose-700'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {item.gradeLabel}
                            </span>
                          </td>
                        </motion.tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
