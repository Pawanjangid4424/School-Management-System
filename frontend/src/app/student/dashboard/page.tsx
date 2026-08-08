'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CalendarCheck, BookOpen, Users, Compass, GraduationCap, 
  RefreshCw, FileText, Bell, Calendar as CalendarIcon, Clock, Link as LinkIcon
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
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

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summaryData, setSummaryData] = useState<any>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'STUDENT') {
        router.push('/login');
        return;
      }
      setUser(parsedUser);
      fetchSummary(token);
    } catch (e) {
      router.push('/login');
      setLoading(false);
    }
  }, [router]);

  const fetchSummary = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/student-portal/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummaryData(data);
      }
    } catch (e) {
      console.error('Failed to fetch student dashboard summary', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Student Portal...
      </div>
    );
  }

  const student = summaryData?.student;
  const metrics = summaryData?.metrics;
  const widgets = summaryData?.widgets || {};

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="STUDENT" tenantName={user?.tenant_name} />

      <motion.div 
        className="flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 md:pl-[var(--sidebar-width,256px)]"
      >
        <Topbar
          title="Student Portal Dashboard"
          userName={`Welcome, ${student?.name || user?.name || user?.username || 'Student'}`}
          userRole="Enrolled Student Account"
        />

        <main className="px-4 md:px-8 py-6 max-w-[1600px] mx-auto w-full">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {/* Row 1: Institute Details | Today's Time Table | Attendance */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
              {/* 1. Institute Details */}
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[250px]">
                <div className="px-8 h-16 border-b border-slate-200 bg-white flex items-center justify-between">
                  <h3 className="font-medium text-slate-700">Institute Details</h3>
                  <button onClick={() => fetchSummary(localStorage.getItem('access_token') || '')} className="p-1.5 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors">
                    <RefreshCw size={14} />
                  </button>
                </div>
                <div className="p-5 grid grid-cols-2 gap-4 flex-1">
                  <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-center items-center gap-2 bg-slate-50/50">
                    <div className="text-blue-600"><Users size={24} /></div>
                    <span className="text-xs text-slate-500 font-medium">Attendance</span>
                    <span className="text-xl font-bold text-slate-800">{metrics?.monthlyAttendancePercent || '0.00'}%</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-center items-center gap-2 bg-slate-50/50">
                    <div className="text-rose-500"><BookOpen size={24} /></div>
                    <span className="text-xs text-slate-500 font-medium">Assignments</span>
                    <span className="text-xl font-bold text-slate-800">{metrics?.pendingAssignments || 0}</span>
                  </div>
                  <div className="border border-slate-200 rounded-lg p-4 flex flex-col justify-center items-center gap-2 bg-slate-50/50 col-span-2">
                    <div className="text-emerald-500"><Bell size={24} /></div>
                    <span className="text-xs text-slate-500 font-medium">New Announcements</span>
                    <span className="text-xl font-bold text-slate-800">{metrics?.announcementCount || 0}</span>
                  </div>
                </div>
              </motion.div>

              {/* 2. Today's Time Table */}
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[250px]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="font-medium text-slate-700">Today's Time Table</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-50 text-indigo-600 border border-indigo-100">
                    <Clock className="h-4 w-4" />
                  </div>
                </div>
                <div className="p-5 flex-1 overflow-auto max-h-[350px]">
                  <table className="w-full text-left text-sm text-slate-600">
                    <thead className="bg-slate-50 text-slate-600 border-b-2 border-slate-200 font-semibold uppercase text-xs tracking-wider">
                      <tr>
                        <th className="px-6 py-4">Slot</th>
                        <th className="px-6 py-4">CCode</th>
                      </tr>
                    </thead>
                    <tbody>
                      {widgets.todayTimeTable?.length > 0 ? (
                        widgets.todayTimeTable.map((slot: any, idx: number) => (
                          <motion.tr 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.1 * idx }}
                            key={idx} 
                            className="border-b border-slate-50 hover:bg-slate-50/80 transition-colors"
                          >
                            <td className="px-6 py-4 text-xs text-slate-500 font-medium whitespace-nowrap">{slot.slot}</td>
                            <td className="px-6 py-4 font-semibold text-slate-800">{slot.ccode}</td>
                          </motion.tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={2} className="py-8 text-center text-slate-400">No classes today</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </motion.div>

              {/* 3. Attendance */}
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[250px]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="font-medium text-slate-700">Subject Attendance</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 border border-emerald-100">
                    <CalendarCheck className="h-4 w-4" />
                  </div>
                </div>
                <div className="p-5 flex-1 overflow-auto max-h-[350px] space-y-5">
                  <div className="grid grid-cols-4 text-xs font-semibold text-slate-500 border-b-2 border-slate-100 pb-2">
                    <span className="col-span-2 uppercase tracking-wider">Subject</span>
                    <span className="text-center uppercase tracking-wider">Lectures</span>
                    <span className="text-right uppercase tracking-wider">%</span>
                  </div>
                  {widgets.subjectAttendance?.map((subj: any, idx: number) => (
                    <motion.div 
                      key={idx} 
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * idx }}
                      className="space-y-2 group"
                    >
                      <div className="flex justify-between text-xs font-medium text-slate-700">
                        <span className="truncate w-32 font-semibold" title={subj.subject}>{subj.subject}</span>
                        <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">{subj.lectures}</span>
                        <span className={subj.percentage >= 75 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{subj.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden shadow-inner">
                        <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: `${subj.percentage}%` }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, ease: "easeOut" }}
                          className={`h-2 rounded-full shadow-sm ${subj.percentage >= 75 ? 'bg-gradient-to-r from-emerald-400 to-emerald-500' : 'bg-gradient-to-r from-rose-400 to-rose-500'}`} 
                        />
                      </div>
                    </motion.div>
                  ))}
                  {!widgets.subjectAttendance?.length && (
                    <div className="text-center text-slate-400 py-6 text-sm">No attendance data</div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Row 2: Class Time Table */}
            {/* 4. Class Time Table */}
            <motion.div 
              variants={itemVariants} 
              whileHover={{ scale: 1.005, y: -2, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col overflow-hidden"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-white">
                <div>
                  <h3 className="font-semibold text-slate-800 text-sm">
                    Weekly Class Time Table {student?.class ? `(Grade ${student.class}-${student.section || 'A'})` : ''}
                  </h3>
                  <p className="text-[11px] text-slate-500">Your assigned class timetable schedule</p>
                </div>
                <span className="text-xs bg-amber-50 text-amber-800 font-bold px-3 py-1 rounded-full border border-amber-200/60">
                  Grade {student?.class || 'N/A'}-{student?.section || 'A'}
                </span>
              </div>

              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-600 min-w-[900px]">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3 sticky left-0 z-10 bg-slate-50 border-r border-slate-200">Day / Period</th>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => (
                        <th key={p} className="px-4 py-3 border-r border-slate-100 text-center min-w-[110px]">
                          Period {p}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'].map((day) => (
                      <tr key={day} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-slate-900 border-r border-slate-200 bg-slate-50/60 sticky left-0 z-10">
                          {day.slice(0, 3)}
                        </td>
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((p) => {
                          const slot = widgets.classTimeTable?.find(
                            (s: any) => (s.day === day || s.day_of_week === day) && (s.period === p || s.period_number === p)
                          );
                          return (
                            <td key={p} className="p-2 border-r border-slate-100 text-center align-top">
                              {slot ? (
                                <div className="rounded-lg bg-amber-50/90 border border-amber-200/80 p-2 space-y-1 text-center shadow-xs">
                                  <span className="font-semibold text-amber-950 block truncate text-[11px]" title={slot.subject}>
                                    {slot.subject || 'Subject'}
                                  </span>
                                  <span className="text-[10px] text-amber-800 block truncate">
                                    {slot.faculty || 'Faculty'}
                                  </span>
                                  <span className="text-[9.5px] font-mono text-slate-500 block truncate">
                                    {slot.room || 'Room'}
                                  </span>
                                </div>
                              ) : (
                                <div className="h-14 rounded-lg border border-dashed border-slate-200/80 flex items-center justify-center text-[10px] text-slate-300">
                                  -
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>

            {/* Row 3: Holiday List | Notifications */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(320px,1fr))] gap-6">
              {/* 5. Holiday List */}
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[300px] relative overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="font-medium text-slate-700">Holiday List</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-sky-50 text-sky-600 border border-sky-100">
                    <CalendarIcon className="h-4 w-4" />
                  </div>
                </div>
                <div className="p-5 flex-1 overflow-auto">
                  {widgets.holidays?.length > 0 ? (
                    <div className="space-y-4">
                      {widgets.holidays.map((h: any, idx: number) => (
                        <motion.div 
                          key={h.id} 
                          initial={{ opacity: 0, x: -20 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 * idx }}
                          className="flex justify-between items-center text-sm p-3 rounded-lg border border-slate-100 bg-slate-50 hover:bg-slate-100 transition-colors"
                        >
                          <div>
                            <p className="font-semibold text-slate-800">{h.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                              <CalendarIcon size={12} />
                              {new Date(h.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                            </p>
                          </div>
                          <span className={`px-2.5 py-1 text-[10px] rounded-full uppercase font-bold tracking-wider ${h.type === 'PUBLIC' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                            {h.type}
                          </span>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                      <CalendarIcon size={32} className="opacity-20" />
                      <p className="text-sm">No upcoming holidays</p>
                    </div>
                  )}
                </div>

                {/* Floating Action Buttons */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col gap-2 p-2">
                  <button className="p-2 bg-indigo-500 text-white rounded-l-md hover:bg-indigo-600 shadow-md transition-transform hover:-translate-x-1"><CalendarIcon size={16} /></button>
                  <button className="p-2 bg-rose-500 text-white rounded-l-md hover:bg-rose-600 shadow-md transition-transform hover:-translate-x-1"><Clock size={16} /></button>
                  <button className="p-2 bg-emerald-500 text-white rounded-l-md hover:bg-emerald-600 shadow-md transition-transform hover:-translate-x-1"><FileText size={16} /></button>
                  <button className="p-2 bg-amber-500 text-white rounded-l-md hover:bg-amber-600 shadow-md transition-transform hover:-translate-x-1"><LinkIcon size={16} /></button>
                </div>
              </motion.div>

              {/* 6. Notifications */}
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col min-h-[300px]">
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                  <h3 className="font-medium text-slate-700">Notifications</h3>
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-50 text-amber-600 border border-amber-100">
                    <Bell className="h-4 w-4" />
                  </div>
                </div>
                <div className="p-5 flex-1 overflow-auto">
                  {widgets.notifications?.length > 0 ? (
                    <div className="space-y-4">
                      {widgets.notifications.map((n: any, idx: number) => (
                        <motion.div 
                          key={n.id} 
                          initial={{ opacity: 0, y: 10 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.1 * idx }}
                          className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-900 rounded-lg border border-blue-100/50 shadow-sm relative overflow-hidden"
                        >
                          <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                          <div className="font-semibold text-sm pr-4">{n.title}</div>
                          <div className="text-xs text-blue-600/70 mt-1.5 flex items-center gap-1.5">
                            <Clock size={12} />
                            {new Date(n.date).toLocaleDateString()}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-2">
                      <Bell size={32} className="opacity-20" />
                      <p className="text-sm">No new notifications</p>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>

            {/* Row 4: Exam Time Table (Last) */}
            {/* 7. Exam Time Table */}
            <motion.div 
              variants={itemVariants}
              whileHover={{ scale: 1.01, y: -2, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
              className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col"
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
                <h3 className="font-medium text-slate-700">Exam Time Table</h3>
              </div>
              <div className="p-0 overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-600 min-w-[800px]">
                  <thead className="bg-slate-50 text-slate-600 border-b-2 border-slate-200 font-semibold uppercase text-[11px] tracking-wider">
                    <tr>
                      <th className="px-6 py-4">Exam Date</th>
                      <th className="px-6 py-4">Slot</th>
                      <th className="px-6 py-4">CCode</th>
                      <th className="px-6 py-4">Course</th>
                      <th className="px-6 py-4">Semester</th>
                      <th className="px-6 py-4">Regular / Backlog</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {widgets.examTimeTable?.length > 0 ? (
                      widgets.examTimeTable.map((exam: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-4 font-medium">{new Date(exam.date).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td className="p-4">
                            <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md text-xs font-semibold">{exam.slot}</span>
                          </td>
                          <td className="p-4 font-semibold text-slate-800">{exam.ccode}</td>
                          <td className="p-4">{exam.course}</td>
                          <td className="p-4">{exam.semester}</td>
                          <td className="p-4">
                            <span className="bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full text-xs font-bold uppercase">{exam.type}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400">
                          No upcoming exams scheduled.
                        </td>
                      </tr>
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
