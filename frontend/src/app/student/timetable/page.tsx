'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarDays, Clock } from 'lucide-react';
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

const hover3DEffect = {
  scale: 1.02,
  y: -2,
  boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)",
  transition: { type: 'spring', stiffness: 400, damping: 15 }
};

export default function StudentTimetablePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [slots, setSlots] = useState<any[]>([]);

  const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
  const periods = [1, 2, 3, 4, 5, 6, 7, 8];

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
      fetchTimetable(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchTimetable = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/student-portal/timetable/self`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSlots(data);
      }
    } catch (e) {
      console.error('Failed to fetch timetable', e);
    }
  };

  const getSlotForDayAndPeriod = (day: string, period: number) => {
    return slots.find((s) => s.day_of_week === day && s.period_number === period);
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Weekly Timetable...
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen bg-slate-50 overflow-hidden">
      <Sidebar role="STUDENT" tenantName={user?.tenant_name} />

      <div className="flex-1 flex flex-col h-screen overflow-hidden transition-all duration-300 md:pl-[var(--sidebar-width,256px)]">
        <Topbar
          title="My Weekly Class Timetable"
          userName={`Welcome, ${user?.name || user?.username || 'Student'}`}
          userRole="Enrolled Student Account"
        />

        <main className="px-4 py-3 flex-1 flex flex-col min-h-0 overflow-hidden">
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Header */}
            <div className="border-b border-slate-100 px-5 py-2.5 flex items-center justify-between bg-white shrink-0">
              <h3 className="font-semibold text-sm text-slate-900 flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-slate-500" />
                Weekly Class Timetable
              </h3>
              <span className="text-[11px] font-medium text-slate-500 bg-slate-100 px-2.5 py-0.5 rounded-full">
                Full 6-Day Schedule
              </span>
            </div>

            {/* Desktop View: No Scrollbar Grid */}
            <div className="hidden md:flex flex-col flex-1 min-h-0 w-full overflow-hidden">
              {/* Grid Header */}
              <div className="grid grid-cols-[90px_repeat(8,minmax(0,1fr))] border-b border-slate-200 bg-slate-50/95 shrink-0">
                <div className="px-2 py-1.5 border-r border-slate-200 flex items-center justify-center bg-slate-50/95">
                  <span className="text-[10px] uppercase tracking-wider font-bold text-slate-500">Day</span>
                </div>
                {periods.map((p) => (
                  <div key={p} className="px-1 py-1.5 text-center border-r border-slate-100 last:border-r-0 flex items-center justify-center">
                    <span className="text-[11px] font-semibold text-slate-700">Period {p}</span>
                  </div>
                ))}
              </div>

              {/* Grid Body: Proportional 6 Rows */}
              <div className="bg-white flex-1 flex flex-col min-h-0 divide-y divide-slate-100">
                {days.map((day, idx) => (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.03 * idx }}
                    key={day} 
                    className="grid grid-cols-[90px_repeat(8,minmax(0,1fr))] flex-1 min-h-0 group hover:bg-slate-50/40 transition-colors items-stretch"
                  >
                    {/* Day Label Column */}
                    <div className="px-2 border-r border-slate-200 bg-slate-50/50 group-hover:bg-slate-100/50 flex items-center justify-center transition-colors">
                      <span className="text-[12px] font-bold text-slate-700 uppercase tracking-wider">
                        {day.slice(0, 3)}
                      </span>
                    </div>

                    {/* Period Slots */}
                    {periods.map((p) => {
                      const slot = getSlotForDayAndPeriod(day, p);
                      const periodTimes = [
                        '08:00 – 09:00', '09:00 – 10:00', '10:15 – 11:15', '11:15 – 12:15',
                        '13:00 – 14:00', '14:00 – 15:00', '15:15 – 16:15', '16:15 – 17:15'
                      ];
                      const timeStr = periodTimes[p - 1] || '00:00 – 00:00';

                      return (
                        <div key={p} className="border-r border-slate-100 last:border-r-0 p-1 flex items-center justify-center min-h-0 overflow-hidden">
                          {slot ? (
                            <div className="w-full h-full rounded-lg bg-amber-50/90 border border-amber-200/80 px-2 py-1 flex flex-col justify-center items-center text-center shadow-2xs overflow-hidden">
                              <span className="font-semibold text-amber-950 text-[11px] leading-tight truncate w-full" title={slot.subject?.subject_name}>
                                {slot.subject?.subject_name || 'Class'}
                              </span>
                              <span className="text-[10px] text-amber-800 font-medium truncate w-full leading-tight">
                                {slot.teacher ? `${slot.teacher.first_name} ${slot.teacher.last_name}` : 'TBD'}
                              </span>
                              <span className="text-[9px] font-mono text-slate-500 truncate w-full leading-tight">
                                {timeStr} • {slot.room_number || 'Room 101'}
                              </span>
                            </div>
                          ) : (
                            <div className="w-full h-full rounded-lg border border-dashed border-slate-150 bg-slate-50/30 flex items-center justify-center text-slate-300 text-[11px]">
                              —
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Mobile View: Scrollable Cards for Small Screens */}
            <div className="block md:hidden flex-1 overflow-y-auto bg-slate-50/50 p-4 space-y-4">
              {days.map((day) => {
                const daySlots = periods.map(p => ({ p, slot: getSlotForDayAndPeriod(day, p) })).filter(x => x.slot);
                if (daySlots.length === 0) return null;

                return (
                  <div key={day} className="space-y-2">
                    <h4 className="font-bold text-slate-700 text-xs border-b border-slate-200 pb-1">{day}</h4>
                    <div className="space-y-2">
                      {daySlots.map(({ p, slot }) => {
                        const periodTimes = [
                          '08:00 – 09:00', '09:00 – 10:00', '10:15 – 11:15', '11:15 – 12:15',
                          '13:00 – 14:00', '14:00 – 15:00', '15:15 – 16:15', '16:15 – 17:15'
                        ];
                        const timeStr = periodTimes[p - 1] || '00:00 – 00:00';

                        return (
                          <div key={p} className="bg-white rounded-lg border border-slate-200 shadow-2xs p-3 flex flex-col gap-1 relative overflow-hidden">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-amber-500 rounded-l"></div>
                            <div className="flex items-start justify-between gap-2">
                              <span className="font-semibold text-slate-800 text-xs">
                                {slot?.subject?.subject_name || 'Class'}
                              </span>
                              <span className="text-[10px] font-medium bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                                Period {p}
                              </span>
                            </div>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                              <span className="text-xs text-slate-600">
                                {slot?.teacher ? `${slot.teacher.first_name} ${slot.teacher.last_name}` : 'Faculty TBD'}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-500">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {timeStr}</span>
                                <span>📍 {slot?.room_number || 'Room 101'}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
              {slots.length === 0 && (
                <div className="text-center text-slate-400 text-xs py-8">No classes scheduled yet.</div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
