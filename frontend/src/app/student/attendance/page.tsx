'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarCheck, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

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

export default function StudentAttendancePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [attendanceData, setAttendanceData] = useState<any>(null);

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
      fetchAttendance(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchAttendance = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/student-portal/attendance/self`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setAttendanceData(data);
      }
    } catch (e) {
      console.error('Failed to fetch attendance data', e);
    }
  };

  if (loading || !attendanceData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Student Attendance Report...
      </div>
    );
  }

  const stats = attendanceData.stats;
  const student = attendanceData.student;

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="STUDENT" tenantName={user?.tenant_name} />

      <motion.div 
        className="flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 md:pl-[var(--sidebar-width,256px)]"
      >
        <Topbar
          title="My Attendance Report"
          userName={`Welcome, ${user?.name || user?.username || 'Student'}`}
          userRole="Enrolled Student Account"
        />

        <main className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Header Card */}
            <motion.div variants={itemVariants} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h2 className="font-serif text-xl sm:text-2xl font-semibold text-slate-900">
                  {student.name} ({student.class})
                </h2>
                <p className="text-xs text-slate-500">
                  Your Personal Attendance Log & Policy Compliance Evaluation
                </p>
              </div>

              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-4 text-center shrink-0 min-w-[140px] shadow-sm">
                <span className="block text-[11px] text-emerald-700 font-bold uppercase tracking-wider mb-1">Monthly Attendance</span>
                <span className="font-serif text-3xl font-bold text-emerald-800">
                  {stats.monthlyAttendancePercent}%
                </span>
              </div>
            </motion.div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-slate-200 bg-white p-5 text-center shadow-sm">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-2">Working Days</span>
                <span className="font-serif text-3xl font-bold text-slate-800">{stats.totalWorkingDays}</span>
              </motion.div>
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-emerald-100/50 p-5 text-center shadow-sm">
                <span className="text-xs uppercase tracking-wider font-bold text-emerald-700 block mb-2">Days Present</span>
                <span className="font-serif text-3xl font-bold text-emerald-800">{stats.presentCount}</span>
              </motion.div>
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-rose-200 bg-gradient-to-br from-rose-50 to-rose-100/50 p-5 text-center shadow-sm">
                <span className="text-xs uppercase tracking-wider font-bold text-rose-700 block mb-2">Days Absent</span>
                <span className="font-serif text-3xl font-bold text-rose-800">{stats.absentCount}</span>
              </motion.div>
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 text-center shadow-sm">
                <span className="text-xs uppercase tracking-wider font-bold text-amber-700 block mb-2">Approved Leaves</span>
                <span className="font-serif text-3xl font-bold text-amber-800">{stats.leaveCount}</span>
              </motion.div>
            </div>

            {/* History Table */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.01, y: -2, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              <div className="border-b border-slate-100 px-6 py-5 flex items-center justify-between">
                <h3 className="font-serif text-lg font-semibold text-slate-900">
                  Detailed Attendance History
                </h3>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                  <CalendarCheck className="h-4 w-4" />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 min-w-[600px]">
                  <thead className="bg-slate-50 text-slate-600 border-b-2 border-slate-200 font-semibold uppercase text-xs tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {attendanceData.records.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-6 py-12 text-center text-slate-400 font-medium">
                          <AlertTriangle className="h-8 w-8 mx-auto mb-3 text-slate-300" />
                          No attendance logs recorded yet.
                        </td>
                      </tr>
                    ) : (
                      attendanceData.records.map((r: any, idx: number) => (
                        <motion.tr 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.1 * idx }}
                          key={r.id} 
                          className="hover:bg-slate-50 transition-colors"
                        >
                          <td className="px-6 py-4 font-mono font-medium text-slate-800">
                            {new Date(r.date).toLocaleDateString(undefined, { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                          </td>
                          <td className="px-6 py-4">
                            <StatusPill
                              status={r.status === 'PRESENT' ? 'active' : r.status === 'ABSENT' ? 'error' : 'pending'}
                              label={r.status}
                            />
                          </td>
                          <td className="px-6 py-4 text-slate-500 text-xs font-medium">
                            {r.remarks || '—'}
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
