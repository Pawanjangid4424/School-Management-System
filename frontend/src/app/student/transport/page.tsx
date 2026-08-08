'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bus, MapPin, Clock, Phone, AlertTriangle } from 'lucide-react';
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

export default function StudentTransportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [transportInfo, setTransportInfo] = useState<any>(null);

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
      if (parsedUser.student_profile_id) {
        fetchTransport(token, parsedUser.student_profile_id);
      }
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchTransport = async (token: string, studentId: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/transport/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTransportInfo(data);
      }
    } catch (e) {
      console.error('Failed to fetch transport details', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Transport Details...
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
          title="My Bus Route & Pickup Schedule"
          userName={`Welcome, ${user?.username || 'Student'}`}
          userRole="Enrolled Student Account"
        />

        <main className="px-4 md:px-8 py-6 max-w-3xl mx-auto w-full">
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-6"
          >
            {!transportInfo || !transportInfo.assigned ? (
              <motion.div variants={itemVariants} className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-400 font-medium text-sm flex flex-col items-center shadow-sm">
                <AlertTriangle className="h-8 w-8 mb-3 text-slate-300" />
                No bus transport route assigned to your student profile.
              </motion.div>
            ) : (
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="space-y-6">
                <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
                <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600 border border-amber-100">
                      <Bus className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-serif text-lg font-semibold text-slate-900">
                        {transportInfo.routeName}
                      </h3>
                      <span className="text-xs text-slate-500 font-mono">
                        Bus Registration: {transportInfo.vehicleRegistration}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Pickup & Drop Times Card */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">My Assigned Stop</span>
                    <span className="font-serif text-base font-semibold text-slate-900 block">
                      {transportInfo.stopName}
                    </span>
                    <span className="text-[11px] font-mono text-emerald-600 font-bold block">
                      Pickup: {transportInfo.estimatedPickupTime}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <span className="text-slate-400 font-medium block">My Return Drop</span>
                    <span className="font-serif text-base font-semibold text-slate-900 block">
                      {transportInfo.stopName}
                    </span>
                    <span className="text-[11px] font-mono text-amber-600 font-bold block">
                      Drop: {transportInfo.estimatedDropTime}
                    </span>
                  </div>
                </div>

                {/* Driver Contact Box */}
                <div className="border-t border-slate-100 pt-4 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-400 block mb-0.5">Driver Name</span>
                    <span className="font-semibold text-slate-900 block">
                      {transportInfo.driverName}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block mb-0.5">Driver Phone</span>
                    <span className="font-mono font-bold text-amber-700 block">
                      {transportInfo.driverPhone}
                    </span>
                  </div>
                </div>
                </div>
              </motion.div>
            )}
          </motion.div>
        </main>
      </motion.div>
    </div>
  );
}
