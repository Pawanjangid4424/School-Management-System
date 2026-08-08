'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Bus, Plus, CheckCircle2, Phone, User } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AdminVehiclesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [vehicles, setVehicles] = useState<any[]>([]);

  // Add Vehicle Modal State
  const [showModal, setShowModal] = useState(false);
  const [regNum, setRegNum] = useState('');
  const [capacity, setCapacity] = useState<number>(40);
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [status, setStatus] = useState<string>('ACTIVE');

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
      fetchVehicles(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchVehicles = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/transport/vehicles`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setVehicles(data);
      }
    } catch (e) {
      console.error('Failed to fetch vehicles', e);
    }
  };

  const handleCreateVehicle = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/transport/vehicles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          registrationNumber: regNum,
          capacity: Number(capacity),
          driverName,
          driverPhone,
          status,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Vehicle "${regNum}" registered successfully!`);
        setShowModal(false);
        setRegNum('');
        setDriverName('');
        setDriverPhone('');
        fetchVehicles(token || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to add vehicle');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Bus Fleet Roster...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Vehicle Fleet & Driver Roster"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                School Transport Fleet Management
              </h2>
              <p className="text-xs text-slate-500">
                Register school buses, seating capacities, and assigned driver details.
              </p>
            </div>

            <button
              onClick={() => setShowModal(true)}
              className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>+ Add Vehicle to Fleet</span>
            </button>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Vehicles Fleet Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-serif text-base font-semibold text-slate-900">
                Registered Vehicles ({vehicles.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Registration Number</th>
                    <th className="px-6 py-3">Seating Capacity</th>
                    <th className="px-6 py-3">Driver Name</th>
                    <th className="px-6 py-3">Driver Phone</th>
                    <th className="px-6 py-3">Fleet Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {vehicles.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No vehicles registered in fleet. Click "+ Add Vehicle to Fleet" to start.
                      </td>
                    </tr>
                  ) : (
                    vehicles.map((v) => (
                      <tr key={v.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3.5 font-mono font-bold text-slate-900">
                          {v.registration_number}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-700">
                          {v.capacity} Seats
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {v.driver_name}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">
                          {v.driver_phone}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill
                            status={v.status === 'ACTIVE' ? 'active' : v.status === 'MAINTENANCE' ? 'pending' : 'error'}
                            label={v.status}
                          />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Vehicle Modal */}
          {showModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Register Vehicle to Fleet
                  </h3>
                  <button onClick={() => setShowModal(false)} className="text-slate-400 text-xs font-bold">✕</button>
                </div>
                <form onSubmit={handleCreateVehicle} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Registration Number *</label>
                    <input
                      type="text"
                      required
                      value={regNum}
                      onChange={(e) => setRegNum(e.target.value)}
                      placeholder="e.g. KA-01-AB-1234"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 uppercase font-mono text-slate-900"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Seating Capacity *</label>
                      <input
                        type="number"
                        required
                        value={capacity}
                        onChange={(e) => setCapacity(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Status *</label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                      >
                        <option value="ACTIVE">ACTIVE</option>
                        <option value="MAINTENANCE">MAINTENANCE</option>
                        <option value="INACTIVE">INACTIVE</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Driver Name *</label>
                    <input
                      type="text"
                      required
                      value={driverName}
                      onChange={(e) => setDriverName(e.target.value)}
                      placeholder="Full name of bus driver"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Driver Contact Phone *</label>
                    <input
                      type="text"
                      required
                      value={driverPhone}
                      onChange={(e) => setDriverPhone(e.target.value)}
                      placeholder="Mobile phone number..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-mono text-slate-900"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setShowModal(false)} className="border border-slate-300 text-slate-600 rounded-lg px-3 py-2">Cancel</button>
                    <button type="submit" disabled={submitting} className="bg-slate-900 text-white rounded-lg px-4 py-2">Register Vehicle</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
