'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { Bus, MapPin, Clock, Users, ArrowLeft, Plus } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';

export default function AdminSingleRoutePage() {
  const router = useRouter();
  const params = useParams();
  const routeId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [rosterData, setRosterData] = useState<any>(null);

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
      if (routeId) fetchRoster(token, routeId);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, routeId]);

  const fetchRoster = async (token: string, id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/transport/routes/${id}/roster`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRosterData(data);
      }
    } catch (e) {
      console.error('Failed to fetch route roster', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Route Details & Roster...
      </div>
    );
  }

  if (!rosterData) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Route not found.
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Route Stops & Student Roster Detail"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Header Action Row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link href="/admin/transport/routes" className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 text-slate-600">
                <ArrowLeft className="h-4 w-4" />
              </Link>
              <div>
                <h2 className="font-serif text-xl font-semibold text-slate-900">
                  {rosterData.routeName}
                </h2>
                <p className="text-xs text-slate-500">
                  Ordered stops sequence and student bus pickup roster.
                </p>
              </div>
            </div>

            <Link
              href="/admin/transport/assign"
              className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>Assign Student to Route</span>
            </Link>
          </div>

          {/* Vehicle & Driver Summary */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm grid grid-cols-4 gap-4 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Assigned Vehicle</span>
              <span className="font-mono font-bold text-slate-900 block text-sm">
                {rosterData.vehicle?.registration_number || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Driver Name</span>
              <span className="font-semibold text-slate-900 block text-sm">
                {rosterData.vehicle?.driver_name || 'Unassigned'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Driver Contact</span>
              <span className="font-mono font-semibold text-slate-700 block text-sm">
                {rosterData.vehicle?.driver_phone || 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block mb-0.5">Total Passengers</span>
              <span className="font-serif text-lg font-bold text-amber-600 block">
                {rosterData.totalAssignedStudents} Students
              </span>
            </div>
          </div>

          {/* Sequenced Stops & Assigned Students Roster */}
          <div className="space-y-6">
            <h3 className="font-serif text-lg font-semibold text-slate-900">
              Bus Stops & Passenger Roster (Sequence 1 &rarr; {rosterData.stops.length})
            </h3>

            {rosterData.stops.map((stop: any) => (
              <div key={stop.stopId} className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-3">
                <div className="bg-slate-50 border-b border-slate-200/80 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-900 text-white font-mono font-bold text-xs">
                      #{stop.sequenceOrder}
                    </div>
                    <div>
                      <h4 className="font-serif text-base font-semibold text-slate-900">
                        {stop.stopName}
                      </h4>
                      <span className="text-[11px] text-slate-500 font-mono">
                        Pickup: {stop.estimatedPickupTime} | Drop: {stop.estimatedDropTime}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-xs font-semibold text-slate-700 bg-white px-3 py-1 rounded-full border border-slate-200">
                    {stop.studentCount} Assigned Student{stop.studentCount === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="p-4">
                  {stop.students.length === 0 ? (
                    <div className="text-slate-400 text-xs py-3 text-center italic">
                      No students assigned to pick up at this stop yet.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      {stop.students.map((st: any) => (
                        <div key={st.assignmentId} className="flex items-center justify-between p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                          <div>
                            <span className="font-semibold text-slate-900 block">
                              {st.name}
                            </span>
                            <span className="text-[11px] text-slate-500 font-mono">
                              {st.class}
                            </span>
                          </div>
                          <CodeBadge code={st.code} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
