'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  CheckCircle2,
  ArrowRight,
  Trash2,
  Eye,
  Bus,
  MapPin,
  Clock,
  Phone,
  UserCheck,
  AlertTriangle,
  X,
  FileText,
  Loader2
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function AdminRoutesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [routes, setRoutes] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);

  // Create Route Modal State
  const [showModal, setShowModal] = useState(false);
  const [routeName, setRouteName] = useState('');
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [description, setDescription] = useState('');

  const [stops, setStops] = useState<any[]>([
    { sequenceOrder: 1, stopName: 'Central Station', estimatedPickupTime: '07:15 AM', estimatedDropTime: '04:15 PM' },
    { sequenceOrder: 2, stopName: 'City Library', estimatedPickupTime: '07:30 AM', estimatedDropTime: '04:00 PM' },
  ]);

  // View Route Modal State
  const [viewRoute, setViewRoute] = useState<any | null>(null);

  // Delete Route Modal State
  const [deleteRouteTarget, setDeleteRouteTarget] = useState<any | null>(null);
  const [deleting, setDeleting] = useState(false);

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
      const [rRes, vRes] = await Promise.all([
        fetch(`${apiUrl}/transport/routes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/transport/vehicles`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (rRes.ok) setRoutes(await rRes.json());
      if (vRes.ok) {
        const vList = await vRes.json();
        setVehicles(vList);
        if (vList.length > 0) setSelectedVehicleId(vList[0].id);
      }
    } catch (e) {
      console.error('Failed to fetch routes data', e);
    }
  };

  const handleAddStopField = () => {
    const nextSeq = stops.length + 1;
    setStops([
      ...stops,
      { sequenceOrder: nextSeq, stopName: '', estimatedPickupTime: '07:45 AM', estimatedDropTime: '03:45 PM' },
    ]);
  };

  const handleRemoveStopField = (index: number) => {
    const updated = stops.filter((_, i) => i !== index).map((s, idx) => ({ ...s, sequenceOrder: idx + 1 }));
    setStops(updated);
  };

  const handleStopChange = (index: number, field: string, value: any) => {
    const updated = [...stops];
    updated[index][field] = value;
    setStops(updated);
  };

  const handleCreateRoute = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/transport/routes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          routeName,
          vehicleId: selectedVehicleId || undefined,
          description,
          stops,
        }),
      });

      if (res.ok) {
        toast.success(`Bus route "${routeName}" created successfully!`);
        setShowModal(false);
        setRouteName('');
        setDescription('');
        fetchData(token || '');
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to create bus route');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to create bus route');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteRouteConfirm = async () => {
    if (!deleteRouteTarget) return;
    setDeleting(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/transport/routes/${deleteRouteTarget.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (res.ok) {
        toast.success(`Route "${deleteRouteTarget.routeName || deleteRouteTarget.route_name}" deleted successfully!`);
        setDeleteRouteTarget(null);
        fetchData(token || '');
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to delete route');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete route');
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white text-sm font-medium">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
          <span>Loading School Bus Routes...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-slate-900 selection:text-white">
      <Toaster position="top-center" />
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Bus Routes & Sequence Stop Management"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Header Action Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                School Bus Routes Directory
              </h2>
              <p className="text-xs text-slate-500">
                Plan transport routes, assign vehicles & drivers, define sequenced pickup stops, and manage rosters.
              </p>
            </div>

            <div className="flex items-center gap-2.5">
              <Link
                href="/admin/transport/assign"
                className="border border-slate-300 bg-white text-slate-700 font-semibold rounded-xl px-3.5 py-2 text-xs hover:bg-slate-50 transition-all shadow-xs"
              >
                Assign Student to Transport
              </Link>
              <button
                onClick={() => setShowModal(true)}
                className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>+ Create Bus Route</span>
              </button>
            </div>
          </div>

          {/* Routes Table */}
          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
                <Bus className="h-5 w-5 text-indigo-600" />
                <h3>Configured Bus Routes ({routes.length})</h3>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                {routes.reduce((sum, r) => sum + (r.assignedStudentsCount || r._count?.assignments || 0), 0)} Enrolled Students
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="px-6 py-3.5">Route Name</th>
                    <th className="px-6 py-3.5">Assigned Vehicle</th>
                    <th className="px-6 py-3.5">Driver & Phone</th>
                    <th className="px-6 py-3.5">Total Stops</th>
                    <th className="px-6 py-3.5">Assigned Students</th>
                    <th className="px-6 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {routes.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Bus className="h-8 w-8 text-slate-300" />
                          <p className="font-bold text-slate-700 text-sm">No bus routes created yet</p>
                          <p className="text-xs text-slate-400">Click "+ Create Bus Route" to configure your first transport route.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    routes.map((r) => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          {r.routeName || r.route_name}
                          {r.description && (
                            <p className="text-[11px] text-slate-400 font-normal line-clamp-1">{r.description}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 font-mono font-bold text-indigo-600">
                          {r.vehicleRegistration || r.vehicle?.registration_number || 'Unassigned'}
                        </td>
                        <td className="px-6 py-4 text-slate-800 font-medium">
                          <p className="font-bold text-slate-900">{r.driverName || r.vehicle?.driver_name || 'N/A'}</p>
                          <p className="text-[11px] text-slate-500">{r.driverPhone || r.vehicle?.driver_phone || ''}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1 font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            <MapPin className="h-3 w-3 text-indigo-500" />
                            {r.stopsCount || r.stops?.length || 0} Stops
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600">
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                            {r.assignedStudentsCount || r._count?.assignments || 0} Students
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* View Route Details Button */}
                            <button
                              onClick={() => setViewRoute(r)}
                              title="View Route Details & Stops"
                              className="p-2 rounded-xl text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 border border-slate-200 hover:border-indigo-200 transition-all font-bold text-xs inline-flex items-center gap-1"
                            >
                              <Eye className="h-4 w-4" />
                              <span className="hidden sm:inline">View</span>
                            </button>

                            {/* Stops & Roster Link */}
                            <Link
                              href={`/admin/transport/routes/${r.id}`}
                              title="View Full Student Roster"
                              className="bg-slate-900 text-white rounded-xl px-3 py-2 text-xs font-bold hover:bg-slate-800 transition-all inline-flex items-center gap-1 shadow-xs"
                            >
                              <span>Roster</span>
                              <ArrowRight className="h-3.5 w-3.5" />
                            </Link>

                            {/* Delete Route Button */}
                            <button
                              onClick={() => setDeleteRouteTarget(r)}
                              title="Delete Bus Route"
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 transition-all"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* 👁️ VIEW ROUTE DETAILS MODAL */}
          <AnimatePresence>
            {viewRoute && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2 text-indigo-600 font-bold text-base">
                      <Bus className="h-5 w-5" />
                      <h3>Bus Route Details — {viewRoute.routeName || viewRoute.route_name}</h3>
                    </div>
                    <button
                      onClick={() => setViewRoute(null)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  {/* Summary Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200/80 text-xs">
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Vehicle</span>
                      <span className="font-bold text-slate-900 font-mono text-sm">
                        {viewRoute.vehicleRegistration || viewRoute.vehicle?.registration_number || 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Driver & Contact</span>
                      <span className="font-bold text-slate-900 block">
                        {viewRoute.driverName || viewRoute.vehicle?.driver_name || 'N/A'}
                      </span>
                      <span className="text-slate-500 font-mono text-[11px]">
                        {viewRoute.driverPhone || viewRoute.vehicle?.driver_phone || ''}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 font-semibold block text-[10px] uppercase">Enrolled Students</span>
                      <span className="font-bold text-emerald-600 text-sm">
                        {viewRoute.assignedStudentsCount || viewRoute._count?.assignments || 0} Students
                      </span>
                    </div>
                  </div>

                  {/* Stops Timeline */}
                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <MapPin className="h-4 w-4 text-indigo-600" />
                      <span>Sequenced Pickup / Drop Stops ({viewRoute.stops?.length || 0})</span>
                    </h4>

                    <div className="space-y-2">
                      {(!viewRoute.stops || viewRoute.stops.length === 0) ? (
                        <p className="text-xs text-slate-400 italic">No stops configured for this route.</p>
                      ) : (
                        viewRoute.stops.map((st: any, idx: number) => (
                          <div
                            key={st.id || idx}
                            className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 bg-white hover:bg-slate-50/50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 font-bold text-xs border border-indigo-100">
                                #{st.sequence_order || st.sequenceOrder || idx + 1}
                              </span>
                              <div>
                                <span className="font-bold text-slate-900 text-xs block">{st.stop_name || st.stopName}</span>
                                <span className="text-[11px] text-slate-500">Pickup: {st.estimated_pickup_time || st.estimatedPickupTime}</span>
                              </div>
                            </div>

                            <div className="text-right">
                              <span className="text-[11px] text-slate-600 font-medium block">
                                Drop: {st.estimated_drop_time || st.estimatedDropTime}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                    <Link
                      href={`/admin/transport/routes/${viewRoute.id}`}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-1.5"
                    >
                      <span>Open Full Student Roster</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                    <button
                      onClick={() => setViewRoute(null)}
                      className="border border-slate-300 bg-white text-slate-700 font-bold rounded-xl px-4 py-2 text-xs hover:bg-slate-50"
                    >
                      Close
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* 🗑️ CONFIRM DELETE ROUTE MODAL */}
          <AnimatePresence>
            {deleteRouteTarget && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-rose-600">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Delete Bus Route?</h3>
                      <p className="text-xs text-slate-500">This action cannot be undone.</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    Are you sure you want to delete route <strong className="text-slate-900">"{deleteRouteTarget.routeName || deleteRouteTarget.route_name}"</strong>? All associated stop schedules and student assignments for this route will be removed.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      disabled={deleting}
                      onClick={() => setDeleteRouteTarget(null)}
                      className="border border-slate-300 bg-white text-slate-700 font-bold rounded-xl px-4 py-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={deleting}
                      onClick={handleDeleteRouteConfirm}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Deleting...</span>
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />
                          <span>Delete Route</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* Create Route Modal */}
          <AnimatePresence>
            {showModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
                >
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                    <h3 className="font-bold text-slate-900 text-base">
                      Create Bus Route with Sequenced Stops
                    </h3>
                    <button
                      onClick={() => setShowModal(false)}
                      className="p-1 rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>

                  <form onSubmit={handleCreateRoute} className="space-y-4 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Route Name *</label>
                        <input
                          type="text"
                          required
                          value={routeName}
                          onChange={(e) => setRouteName(e.target.value)}
                          placeholder="e.g. Route A - North Campus"
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-slate-900 focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Assign Bus Vehicle</label>
                        <select
                          value={selectedVehicleId}
                          onChange={(e) => setSelectedVehicleId(e.target.value)}
                          className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-slate-900 focus:outline-hidden bg-white"
                        >
                          <option value="">-- Select Vehicle --</option>
                          {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.registration_number} (Driver: {v.driver_name})
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Description / Notes</label>
                      <input
                        type="text"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g. Covers Station Rd, Main Market, and Civil Lines"
                        className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold focus:border-slate-900 focus:outline-hidden"
                      />
                    </div>

                    {/* Ordered Route Stops */}
                    <div className="space-y-2 border-t border-slate-100 pt-3">
                      <div className="flex justify-between items-center">
                        <label className="block text-xs font-bold text-slate-900">
                          Sequenced Pickup / Drop Stops ({stops.length})
                        </label>
                        <button
                          type="button"
                          onClick={handleAddStopField}
                          className="text-[11px] font-bold text-indigo-600 hover:underline"
                        >
                          + Add Stop Location
                        </button>
                      </div>

                      <div className="space-y-2">
                        {stops.map((st, idx) => (
                          <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                            <span className="font-bold text-slate-500 shrink-0 text-[11px]">#{idx + 1}</span>
                            <input
                              type="text"
                              required
                              placeholder="Stop Location Name"
                              value={st.stopName}
                              onChange={(e) => handleStopChange(idx, 'stopName', e.target.value)}
                              className="flex-1 rounded-lg border border-slate-300 p-1.5 text-xs font-semibold focus:border-slate-900 focus:outline-hidden bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Pickup"
                              value={st.estimatedPickupTime}
                              onChange={(e) => handleStopChange(idx, 'estimatedPickupTime', e.target.value)}
                              className="w-20 rounded-lg border border-slate-300 p-1.5 text-[11px] font-mono focus:border-slate-900 focus:outline-hidden bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Drop"
                              value={st.estimatedDropTime}
                              onChange={(e) => handleStopChange(idx, 'estimatedDropTime', e.target.value)}
                              className="w-20 rounded-lg border border-slate-300 p-1.5 text-[11px] font-mono focus:border-slate-900 focus:outline-hidden bg-white"
                            />
                            {stops.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveStopField(idx)}
                                className="text-slate-400 hover:text-rose-600 p-1"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 border-t border-slate-100 pt-3">
                      <button
                        type="button"
                        onClick={() => setShowModal(false)}
                        className="border border-slate-300 bg-white text-slate-700 font-bold rounded-xl px-4 py-2 text-xs hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-slate-900 text-white font-bold rounded-xl px-4 py-2 text-xs hover:bg-slate-800 transition-all flex items-center gap-1.5 disabled:opacity-50"
                      >
                        {submitting ? 'Creating...' : 'Save Bus Route'}
                      </button>
                    </div>
                  </form>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
