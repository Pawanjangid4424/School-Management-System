'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  Plus,
  CheckCircle2,
  ArrowRight,
  Send,
  Lock,
  Pencil,
  Eye,
  Trash2,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  TripConsentDocumentView,
  TripFormData,
} from '@/components/trips/TripConsentDocumentView';

const ALL_SCHOOL_CLASSES_FALLBACK = [
  ...Array.from({ length: 10 }).flatMap((_, i) => [
    { classNumber: i + 1, section: 'A', label: `Class ${i + 1} Section A` },
    { classNumber: i + 1, section: 'B', label: `Class ${i + 1} Section B` },
  ]),
  ...['Science', 'Commerce', 'Arts'].flatMap((stream) => [
    { classNumber: 11, section: 'A', stream, label: `Class 11 ${stream} Section A` },
    { classNumber: 11, section: 'B', stream, label: `Class 11 ${stream} Section B` },
    { classNumber: 12, section: 'A', stream, label: `Class 12 ${stream} Section A` },
    { classNumber: 12, section: 'B', stream, label: `Class 12 ${stream} Section B` },
  ]),
];

const initialFormDefault: TripFormData = {
  tripTitle: 'Science Park Field Trip',
  destination: 'Jaipur Science Park',
  date: 'Wednesday, August 12, 2026',
  departureTime: '8:00 AM',
  arrivalTime: '9:30 AM',
  returnTime: '4:00 PM',
  phone1: '+91 88753 33348',
  phone2: '+91 89630 03348',
  costBreakdown: [
    { label: 'Transport', amount: 150 },
    { label: 'Entry & workshop fee', amount: 250 },
    { label: 'Refreshments', amount: 50 },
  ],
  whatToBring: ['Water bottle', 'Packed lunch', 'School ID card', 'Comfortable shoes'],
  rules: [
    'Students must stay with their assigned group at all times.',
    'No student may leave the group without teacher permission.',
    'School uniform (or as instructed) must be worn throughout the trip.',
    'Mobile phones are allowed only for emergency use.',
    'Any medical condition must be disclosed to the accompanying teacher in advance.',
  ],
};

export default function TeacherTripsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [schoolClasses, setSchoolClasses] = useState<any[]>(ALL_SCHOOL_CLASSES_FALLBACK);

  // Create / Edit Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingTripId, setEditingTripId] = useState<string | null>(null);
  const [step, setStep] = useState<'PROPOSAL' | 'STUDENT_SELECTION'>('PROPOSAL');
  const [createdTripId, setCreatedTripId] = useState('');

  const [selectedClassIdx, setSelectedClassIdx] = useState<number>(0);
  const [formData, setFormData] = useState<TripFormData>(initialFormDefault);

  // Student Selection State
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState<string[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
    const storedUser = sessionStorage.getItem('user') || localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      fetchTrips(token);
      fetchActiveClassSections(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchActiveClassSections = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/students/active-class-sections`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setSchoolClasses(data);
        }
      }
    } catch (e) {
      console.error('Failed to fetch active class sections', e);
    }
  };

  const fetchTrips = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/trips`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setTrips(data);
      }
    } catch (e) {
      console.error('Failed to fetch trips', e);
    }
  };

  const handleOpenNewTripModal = () => {
    setEditingTripId(null);
    setFormData(initialFormDefault);
    setSelectedClassIdx(0);
    setStep('PROPOSAL');
    setCreateSuccess('');
    setError('');
    setShowCreateModal(true);
  };

  const handleOpenEditTripModal = (trip: any) => {
    if (trip.is_locked) {
      setError('Locked trips cannot be edited.');
      return;
    }
    setEditingTripId(trip.id);
    setFormData({
      tripTitle: trip.destination || 'Field Trip',
      destination: trip.destination || '',
      date: trip.trip_date ? new Date(trip.trip_date).toISOString().split('T')[0] : '',
      departureTime: trip.departure_time || '',
      arrivalTime: trip.arrival_time || '',
      returnTime: trip.return_time || '',
      phone1: trip.phone1 || '+91 88753 33348',
      phone2: trip.phone2 || '+91 89630 03348',
      costBreakdown: trip.cost_breakdown || initialFormDefault.costBreakdown,
      whatToBring: trip.what_to_bring || initialFormDefault.whatToBring,
      rules: trip.rules || initialFormDefault.rules,
    });
    setStep('PROPOSAL');
    setError('');
    setShowCreateModal(true);
  };

  const handleSaveProposal = async () => {
    const cls = schoolClasses[selectedClassIdx];
    if (!cls) return;

    setSubmitting(true);
    setError('');

    try {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const payload = {
        classNumber: cls.classNumber,
        section: cls.section,
        stream: cls.stream,
        destination: formData.destination,
        tripDate: formData.date,
        departureTime: formData.departureTime,
        returnTime: formData.returnTime,
        cost: formData.costBreakdown.reduce((acc, item) => acc + (Number(item.amount) || 0), 0),
        phone1: formData.phone1,
        phone2: formData.phone2,
        costBreakdown: formData.costBreakdown,
        whatToBring: formData.whatToBring,
        rules: formData.rules,
      };

      const url = editingTripId ? `${apiUrl}/trips/${editingTripId}` : `${apiUrl}/trips`;
      const method = editingTripId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to save trip');

      const tripId = data.id || data.trip?.id || editingTripId;
      setCreatedTripId(tripId);
      
      // Fetch students for selection step
      const studsRes = await fetch(
        `${apiUrl}/students/by-class-section?classNumber=${cls.classNumber}&section=${cls.section}`,
        { headers: { Authorization: `Bearer ${token}` } },
      );
      if (studsRes.ok) {
        const studs = await studsRes.json();
        setClassStudents(studs);
        setSelectedStudentIds(studs.map((s: any) => s.id));
      }

      setStep('STUDENT_SELECTION');
    } catch (err: any) {
      setError(err.message || 'Error saving trip');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDispatchConsent = async () => {
    if (selectedStudentIds.length === 0) {
      setError('Please select at least one student to dispatch forms to.');
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/trips/${createdTripId}/save-roster`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });

      if (res.ok) {
        setCreateSuccess(`Trip proposed with ${selectedStudentIds.length} target students! Submitted for Admin Approval. (Emails/SMS will be sent ONLY after Admin approves and you click "Dispatch Consent").`);
        setShowCreateModal(false);
        fetchTrips(token as string);
      } else {
        const errorData = await res.json().catch(() => ({}));
        setError(errorData.message || 'Failed to save student roster for proposal.');
      }
    } catch (err: any) {
      setError('Failed to save student roster for proposal');
    } finally {
      setSubmitting(false);
    }
  };

  const handleTeacherManualDispatch = async (tripId: string) => {
    if (!confirm('Are you sure you want to dispatch digital consent forms via Email & SMS to parents for this approved trip?')) {
      return;
    }

    setSubmitting(true);
    try {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/trips/${tripId}/dispatch-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({}),
      });

      const data = await res.json();
      if (res.ok) {
        setCreateSuccess(`Consent forms successfully dispatched via Email & SMS to ${data.dispatchedCount || 'selected'} parents!`);
        fetchTrips(token as string);
      } else {
        setError(data.message || 'Failed to dispatch consent forms.');
      }
    } catch (err: any) {
      setError('Error dispatching consent forms to parents');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTrip = async (tripId: string) => {
    if (!confirm('Are you sure you want to delete this field trip proposal?')) {
      return;
    }

    try {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/trips/${tripId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setCreateSuccess('Field trip deleted successfully.');
        fetchTrips(token as string);
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to delete trip');
      }
    } catch (e) {
      setError('Error deleting field trip');
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Field Trips Portal...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Field Trips & Consent Form Management"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs">
            <div>
              <h2 className="font-serif text-lg sm:text-xl font-semibold text-slate-900">
                School Trips & Consent Form Roster
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Organize educational field trips, generate parent consent forms, and track permissions.
              </p>
            </div>

            <button
              onClick={handleOpenNewTripModal}
              className="bg-slate-900 text-white rounded-xl px-4 py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 shadow-xs shrink-0 cursor-pointer"
            >
              <Plus className="h-4 w-4" />
              <span>Propose New Field Trip</span>
            </button>
          </div>

          {createSuccess && (
            <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 p-3.5 text-xs font-semibold text-emerald-800">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{createSuccess}</span>
            </div>
          )}

          <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden space-y-4">
            <div className="border-b border-slate-100 p-4 sm:p-5 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-900">
                Your Field Trips ({trips.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Destination</th>
                    <th className="px-5 py-3.5">Target Class</th>
                    <th className="px-5 py-3.5">Trip Date & Schedule</th>
                    <th className="px-5 py-3.5">Cost</th>
                    <th className="px-5 py-3.5">Admin Approval</th>
                    <th className="px-5 py-3.5">Lock Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No field trips proposed yet. Click "+ Propose New Field Trip" to get started.
                      </td>
                    </tr>
                  ) : (
                    trips.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-2">
                          <Compass className="h-4 w-4 text-amber-500 shrink-0" strokeWidth={1.75} />
                          <span>{item.destination}</span>
                        </td>
                        <td className="px-5 py-3.5 text-slate-700 font-bold">
                          Grade {item.class_number}-{item.section}
                        </td>
                        <td className="px-5 py-3.5 text-slate-900 font-mono">
                          {new Date(item.trip_date).toISOString().split('T')[0]} ({item.departure_time})
                        </td>
                        <td className="px-5 py-3.5 font-bold text-slate-900">
                          {item.cost ? `₹${item.cost}` : 'Free'}
                        </td>
                        <td className="px-5 py-3.5">
                          {item.status === 'DISPATCHED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              📩 Sent to Parents
                            </span>
                          ) : item.status === 'APPROVED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl border border-blue-200">
                              ✅ Approved by Admin
                            </span>
                          ) : item.status === 'REJECTED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-50 px-2.5 py-1 rounded-xl border border-rose-200">
                              ❌ Rejected
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                              ⏳ Awaiting Admin Approval
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5">
                          {item.is_locked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-xl border border-emerald-200">
                              Unlocked
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {item.status === 'APPROVED' && (
                              <button
                                type="button"
                                onClick={() => handleTeacherManualDispatch(item.id)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition-colors shadow-xs flex items-center gap-1 cursor-pointer"
                                title="Send Consent Forms to Parents"
                              >
                                <span>Send Consent</span>
                                <ArrowRight className="h-3.5 w-3.5" />
                              </button>
                            )}

                            {item.status === 'PENDING_APPROVAL' && (
                              <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                                🔒 Awaiting Admin Approval
                              </span>
                            )}

                            <Link
                              href={`/teacher/trips/${item.id}`}
                              className="p-1.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 transition-colors inline-flex items-center gap-1 font-bold text-xs"
                              title="View Consent Tracking Roster"
                            >
                              <Eye className="h-3.5 w-3.5 text-slate-600" />
                            </Link>

                            {!item.is_locked && item.status !== 'DISPATCHED' && (
                              <button
                                type="button"
                                onClick={() => handleOpenEditTripModal(item)}
                                className="p-1.5 rounded-xl border border-amber-200 bg-amber-50/50 text-amber-700 hover:bg-amber-100 transition-colors cursor-pointer"
                                title="Edit Trip Details"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={() => handleDeleteTrip(item.id)}
                              className="p-1.5 rounded-xl border border-rose-200 bg-rose-50/50 text-rose-600 hover:bg-rose-100 transition-colors cursor-pointer"
                              title="Delete Trip Proposal"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
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
        </main>
      </div>

      {/* Proposal & Student Selection Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="w-full max-w-3xl rounded-2xl bg-white shadow-xl overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-slate-50">
              <h3 className="font-semibold text-slate-900 text-sm sm:text-base">
                {step === 'PROPOSAL' ? 'Propose New Educational Field Trip' : 'Select Target Students for Consent Dispatch'}
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <div className="p-4 sm:p-6 space-y-5 max-h-[75vh] overflow-y-auto">
              {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">{error}</div>}

              {step === 'PROPOSAL' ? (
                <div className="space-y-4 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Target Class & Section *</label>
                    <select
                      value={selectedClassIdx}
                      onChange={(e) => setSelectedClassIdx(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-medium focus:border-amber-500 focus:outline-none"
                    >
                      {schoolClasses.map((cls, idx) => (
                        <option key={idx} value={idx}>
                          Grade {cls.classNumber}-{cls.section} {cls.stream ? `(${cls.stream})` : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <TripConsentDocumentView
                    formData={formData}
                    isEdit={true}
                    onChange={(updated) => setFormData(updated)}
                  />
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                    <span className="font-semibold text-slate-800">
                      Roster: Grade {schoolClasses[selectedClassIdx]?.classNumber}-{schoolClasses[selectedClassIdx]?.section} ({classStudents.length} Students)
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedStudentIds.length === classStudents.length) {
                          setSelectedStudentIds([]);
                        } else {
                          setSelectedStudentIds(classStudents.map((s) => s.id));
                        }
                      }}
                      className="text-xs text-amber-700 font-bold hover:underline"
                    >
                      {selectedStudentIds.length === classStudents.length ? 'Deselect All' : 'Select All'}
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto border border-slate-200 rounded-xl p-2">
                    {classStudents.map((s) => (
                      <label key={s.id} className="flex items-center justify-between p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <div className="flex items-center gap-3">
                          <input
                            type="checkbox"
                            checked={selectedStudentIds.includes(s.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedStudentIds((prev) => [...prev, s.id]);
                              } else {
                                setSelectedStudentIds((prev) => prev.filter((id) => id !== s.id));
                              }
                            }}
                            className="h-4 w-4 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                          />
                          <span className="font-semibold text-slate-900">{s.name} ({s.studentCode})</span>
                        </div>
                        <span className="text-slate-400 font-mono">Roll #{s.rollNo}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-100 px-6 py-4 bg-slate-50">
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 transition-colors"
              >
                Cancel
              </button>

              {step === 'PROPOSAL' ? (
                <button
                  type="button"
                  onClick={handleSaveProposal}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving Proposal...' : 'Continue to Student Selection &rarr;'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleDispatchConsent}
                  disabled={submitting}
                  className="px-5 py-2.5 bg-amber-600 text-white rounded-xl text-xs font-bold hover:bg-amber-700 transition-colors disabled:opacity-50 cursor-pointer flex items-center gap-1.5"
                >
                  <Send className="h-4 w-4" />
                  <span>{submitting ? 'Dispatching...' : 'Dispatch Consent Forms'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
