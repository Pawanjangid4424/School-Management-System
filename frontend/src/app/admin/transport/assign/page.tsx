'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Bus, CheckCircle2, UserCheck, ArrowLeft, ChevronDown, Search } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';

export default function AdminAssignTransportPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [students, setStudents] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);

  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [selectedRouteId, setSelectedRouteId] = useState<string>('');
  const [selectedStopId, setSelectedStopId] = useState<string>('');
  const [academicYear, setAcademicYear] = useState<number>(2026);
  const [monthlyFee, setMonthlyFee] = useState<number>(150);

  const [searchQuery, setSearchQuery] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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
      fetchData(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchData = async (token: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const [stRes, rRes] = await Promise.all([
        fetch(`${apiUrl}/students`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/transport/routes`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (stRes.ok) {
        const stList = await stRes.json();
        setStudents(stList);
        if (stList.length > 0) setSelectedStudentId(stList[0].id);
      }
      if (rRes.ok) {
        const rList = await rRes.json();
        setRoutes(rList);
        if (rList.length > 0) {
          setSelectedRouteId(rList[0].id);
          if (rList[0].stops && rList[0].stops.length > 0) {
            setSelectedStopId(rList[0].stops[0].id);
          }
        }
      }
    } catch (e) {
      console.error('Failed to fetch assignment data', e);
    }
  };

  const handleRouteSelect = (routeId: string) => {
    setSelectedRouteId(routeId);
    const target = routes.find((r) => r.id === routeId);
    if (target && target.stops && target.stops.length > 0) {
      setSelectedStopId(target.stops[0].id);
    } else {
      setSelectedStopId('');
    }
  };

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/transport/assignments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          studentProfileId: selectedStudentId,
          routeId: selectedRouteId,
          routeStopId: selectedStopId,
          academicYear: Number(academicYear),
          monthlyFee: Number(monthlyFee),
        }),
      });

      if (res.ok) {
        setSuccessMsg('Student transport route & stop assigned successfully!');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to assign transport');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Transport Assignment Form...
      </div>
    );
  }

  const activeRoute = routes.find((r) => r.id === selectedRouteId);
  const activeStudent = students.find((s) => s.id === selectedStudentId);

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Student Transport Route Assignment"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
            <Link
              href="/admin/transport/routes"
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-sm"
              title="Back to Routes"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Assign Student to Bus Route & Stop
              </h2>
              <p className="text-xs text-slate-500">
                Select student profile and assign to a specific sequenced pickup stop.
              </p>
            </div>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <form onSubmit={handleAssign} className="space-y-4 text-xs">
              <div ref={dropdownRef} className="relative">
                <label className="block text-xs font-medium text-slate-700 mb-1">Select Student Profile *</label>
                <div
                  className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 cursor-pointer"
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                >
                  <span className={`text-sm ${!activeStudent ? 'text-slate-400' : 'text-slate-900 font-medium'}`}>
                    {activeStudent ? `${activeStudent.name} (${activeStudent.studentCode}) — ${activeStudent.class}` : 'Search for a student...'}
                  </span>
                  <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                    <div className="flex items-center gap-2 border-b border-slate-100 p-2">
                      <Search className="h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        autoFocus
                        placeholder="Type to search by name or code..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full text-sm outline-none placeholder:text-slate-400"
                      />
                    </div>
                    <ul className="max-h-60 overflow-y-auto py-1">
                      {students
                        .filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentCode.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(s => (
                          <li
                            key={s.id}
                            onClick={() => {
                              setSelectedStudentId(s.id);
                              setSearchQuery('');
                              setIsDropdownOpen(false);
                            }}
                            className={`cursor-pointer px-3 py-2 text-sm hover:bg-slate-50 ${selectedStudentId === s.id ? 'bg-slate-50 font-medium' : ''}`}
                          >
                            {s.name} ({s.studentCode}) — {s.class}
                          </li>
                        ))}
                      {students.filter(s => s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.studentCode.toLowerCase().includes(searchQuery.toLowerCase())).length === 0 && (
                        <li className="px-3 py-4 text-center text-sm text-slate-500">No students found.</li>
                      )}
                    </ul>
                  </div>
                )}
                {activeStudent && (
                  <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
                    <span>Code Badge:</span>
                    <CodeBadge code={activeStudent.studentCode} />
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Bus Route *</label>
                  <select
                    value={selectedRouteId}
                    onChange={(e) => handleRouteSelect(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
                  >
                    {routes.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.route_name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Specific Pickup Stop *</label>
                  <select
                    value={selectedStopId}
                    onChange={(e) => setSelectedStopId(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
                  >
                    {activeRoute?.stops?.map((stop: any) => (
                      <option key={stop.id} value={stop.id}>
                        Stop #{stop.sequence_order}: {stop.stop_name} ({stop.estimated_pickup_time})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Academic Year *</label>
                  <input
                    type="number"
                    value={academicYear}
                    onChange={(e) => setAcademicYear(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Monthly Transport Fee ($)</label>
                  <input
                    type="number"
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex justify-end">
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-slate-900 text-white rounded-lg px-6 py-2.5 font-semibold text-xs hover:bg-slate-800 transition-colors shadow-sm"
                >
                  Save Transport Assignment
                </button>
              </div>
            </form>
          </div>
        </main>
      </div>
    </div>
  );
}
