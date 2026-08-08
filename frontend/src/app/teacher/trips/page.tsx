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
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

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
      setError('Trip details become frozen once approved and sent to parents.');
      return;
    }
    setEditingTripId(trip.id);
    const clsIdx = schoolClasses.findIndex(
      (c: any) => c.classNumber === trip.class_number && c.section === trip.section
    );
    setSelectedClassIdx(clsIdx >= 0 ? clsIdx : 0);

    setFormData({
      tripTitle: trip.description || 'Science Park Field Trip',
      destination: trip.destination || '',
      date: trip.trip_date ? new Date(trip.trip_date).toISOString().split('T')[0] : '',
      departureTime: trip.departure_time || '8:00 AM',
      arrivalTime: trip.arrival_time || '9:30 AM',
      returnTime: trip.return_time || '4:00 PM',
      phone1: trip.emergency_contact_phone1 || '+91 88753 33348',
      phone2: trip.emergency_contact_phone2 || '+91 89630 03348',
      costBreakdown: trip.cost_breakdown || initialFormDefault.costBreakdown,
      whatToBring: trip.what_to_bring || initialFormDefault.whatToBring,
      rules: trip.rules || initialFormDefault.rules,
      isLocked: trip.is_locked,
    });

    setStep('PROPOSAL');
    setError('');
    setShowCreateModal(true);
  };

  const handleSaveTrip = async (e: React.FormEvent) => {
    e.preventDefault();
    const cls = schoolClasses[selectedClassIdx];
    if (!cls) return;

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const payload = {
        classNumber: cls.classNumber,
        section: cls.section,
        destination: formData.destination,
        tripDate: formData.date,
        departureTime: formData.departureTime,
        arrivalTime: formData.arrivalTime,
        returnTime: formData.returnTime,
        cost: formData.costBreakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0),
        costBreakdown: formData.costBreakdown,
        whatToBring: formData.whatToBring,
        rules: formData.rules,
        description: formData.tripTitle,
        emergencyInstructions: `Contact Phone 1: ${formData.phone1}, Phone 2: ${formData.phone2}`,
        emergencyContactPhone1: formData.phone1,
        emergencyContactPhone2: formData.phone2,
      };

      const url = editingTripId ? `${apiUrl}/trips/${editingTripId}` : `${apiUrl}/trips`;
      const method = editingTripId ? 'PATCH' : 'POST';

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

      const targetTripId = editingTripId || data.trip?.id;
      setCreatedTripId(targetTripId);

      if (editingTripId) {
        setCreateSuccess('Field trip updated successfully!');
        setShowCreateModal(false);
        fetchTrips(token as string);
      } else {
        // Fetch students for this class for dispatch step
        const studentsRes = await fetch(`${apiUrl}/students`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const allStudents = await studentsRes.json();

        const filtered = allStudents.filter(
          (s: any) =>
            String(s.current_class) === String(cls.classNumber) &&
            s.current_section === cls.section
        );

        setClassStudents(filtered);
        setSelectedStudentIds(filtered.map((s: any) => s.id));
        setStep('STUDENT_SELECTION');
        fetchTrips(token as string);
      }
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
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/trips/${createdTripId}/dispatch-consent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ studentIds: selectedStudentIds }),
      });

      if (res.ok) {
        setCreateSuccess(`Trip proposed & ${selectedStudentIds.length} consent forms dispatched!`);
        setShowCreateModal(false);
        fetchTrips(token as string);
      }
    } catch (err: any) {
      setError('Failed to dispatch consent forms');
    } finally {
      setSubmitting(false);
    }
  };

  const currentClass = schoolClasses[selectedClassIdx] || schoolClasses[0];

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="TEACHER" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-64">
        <Topbar
          title="Field Trips & Consent Form Management"
          userName={`Welcome, ${user?.username || 'Faculty Member'}`}
          userRole="Class & Subject Faculty"
        />

        <main className="px-8 py-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                School Trips & Consent Form Roster
              </h2>
              <p className="text-xs text-slate-500">
                Organize educational field trips, generate parent consent forms, and track permissions.
              </p>
            </div>

            <button
              onClick={handleOpenNewTripModal}
              className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>+ Propose New Field Trip</span>
            </button>
          </div>

          {createSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{createSuccess}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4">
              <span className="text-xs font-semibold text-slate-900">
                Your Field Trips ({trips.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Destination</th>
                    <th className="px-6 py-3">Target Class</th>
                    <th className="px-6 py-3">Trip Date & Schedule</th>
                    <th className="px-6 py-3">Cost</th>
                    <th className="px-6 py-3">Admin Approval</th>
                    <th className="px-6 py-3">Lock Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
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
                        <td className="px-6 py-3.5 font-medium text-slate-900 flex items-center gap-2">
                          <Compass className="h-4 w-4 text-amber-500" strokeWidth={1.75} />
                          <span>{item.destination}</span>
                        </td>
                        <td className="px-6 py-3.5 text-slate-700 font-medium">
                          Grade {item.class_number}-{item.section}
                        </td>
                        <td className="px-6 py-3.5 text-slate-900 font-mono">
                          {new Date(item.trip_date).toISOString().split('T')[0]} ({item.departure_time})
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-slate-900">
                          {item.cost ? `₹${item.cost}` : 'Free'}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill
                            status={item.status === 'APPROVED' ? 'active' : item.status === 'REJECTED' ? 'error' : 'pending'}
                            label={item.status}
                          />
                        </td>
                        <td className="px-6 py-3.5">
                          {item.is_locked ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                              <Lock className="h-3 w-3" /> Locked
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Editable</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right space-x-2">
                          <button
                            type="button"
                            onClick={() => {
                              const clsIdx = schoolClasses.findIndex(
                                (c) => c.classNumber === item.class_number && c.section === item.section
                              );
                              setSelectedClassIdx(clsIdx >= 0 ? clsIdx : 0);
                              setFormData({
                                tripTitle: item.description || 'Science Park Field Trip',
                                destination: item.destination || '',
                                date: item.trip_date ? new Date(item.trip_date).toISOString().split('T')[0] : '',
                                departureTime: item.departure_time || '8:00 AM',
                                arrivalTime: item.arrival_time || '9:30 AM',
                                returnTime: item.return_time || '4:00 PM',
                                phone1: item.emergency_contact_phone1 || '+91 88753 33348',
                                phone2: item.emergency_contact_phone2 || '+91 89630 03348',
                                costBreakdown: item.cost_breakdown || initialFormDefault.costBreakdown,
                                whatToBring: item.what_to_bring || initialFormDefault.whatToBring,
                                rules: item.rules || initialFormDefault.rules,
                                isLocked: item.is_locked,
                              });
                              setEditingTripId(item.id);
                              setShowCreateModal(true);
                            }}
                            className="border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 transition-colors inline-flex items-center gap-1"
                          >
                            <Eye className="h-3 w-3 text-blue-600" />
                            <span>{item.is_locked ? 'Preview' : 'View / Edit'}</span>
                          </button>
                          <Link
                            href={`/admin/trips/${item.id}/consent-status`}
                            className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Consent Roster</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create / Edit Trip Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
              <div className="w-full max-w-5xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-auto">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-bold text-slate-900">
                    {editingTripId
                      ? 'Edit Trip Details (Teacher Edit Mode)'
                      : step === 'PROPOSAL'
                      ? 'Propose Field Trip — Teacher Edit Mode'
                      : 'Select Students & Dispatch Forms'}
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                {error && (
                  <div className="mt-4 rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                    {error}
                  </div>
                )}

                {step === 'PROPOSAL' ? (
                  <form onSubmit={handleSaveTrip} className="mt-4 space-y-6">
                    {/* Class Selector */}
                    <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4">
                      <label className="block text-xs font-bold uppercase tracking-wider text-blue-900 mb-1">
                        Select Target Class & Section *
                      </label>
                      <select
                        value={selectedClassIdx}
                        onChange={(e) => setSelectedClassIdx(Number(e.target.value))}
                        className="w-full rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm text-slate-900 font-semibold outline-none focus:border-blue-500"
                      >
                        {schoolClasses.map((cls, idx) => (
                          <option key={idx} value={idx}>
                            {cls.label}
                          </option>
                        ))}
                      </select>
                      <p className="mt-1 text-[11px] text-slate-500">
                        Student details are derived automatically per-recipient from the class roster at dispatch time.
                      </p>
                    </div>

                    {/* Integrated Document View in Edit Mode */}
                    <TripConsentDocumentView
                      isEdit={true}
                      formData={formData}
                      onChange={(updated) => setFormData(updated)}
                    />

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        onClick={() => setShowCreateModal(false)}
                        className="border border-slate-300 text-slate-600 rounded-xl px-4 py-2.5 text-xs font-medium hover:bg-slate-50"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-slate-900 text-white rounded-xl px-6 py-2.5 text-xs font-bold hover:bg-slate-800 flex items-center gap-2 shadow-md"
                      >
                        {submitting
                          ? 'Saving...'
                          : editingTripId
                          ? 'Save Changes'
                          : 'Propose Trip & Select Students'}
                        {!submitting && <ArrowRight className="h-4 w-4" />}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="mt-4 space-y-4 text-xs">
                    <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-1">
                      <p className="font-bold text-blue-900">Select Students to Dispatch Forms</p>
                      <p className="text-blue-700">
                        Trip proposed successfully! Select students in {currentClass.label} who will receive this digital consent form.
                      </p>
                    </div>

                    <div className="border border-slate-200 rounded-xl overflow-hidden h-72 overflow-y-auto bg-white">
                      <div className="bg-slate-100 px-4 py-2.5 border-b border-slate-200 flex items-center justify-between sticky top-0">
                        <span className="font-bold text-slate-800">
                          {classStudents.length} Students in {currentClass.label}
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
                          className="text-xs font-bold text-blue-600 hover:text-blue-800"
                        >
                          {selectedStudentIds.length === classStudents.length
                            ? 'Deselect All'
                            : 'Select All'}
                        </button>
                      </div>
                      <div className="divide-y divide-slate-100">
                        {classStudents.length === 0 ? (
                          <div className="p-6 text-center text-slate-400">
                            No active students found in this class.
                          </div>
                        ) : (
                          classStudents.map((student) => (
                            <label
                              key={student.id}
                              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                                checked={selectedStudentIds.includes(student.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentIds([...selectedStudentIds, student.id]);
                                  } else {
                                    setSelectedStudentIds(
                                      selectedStudentIds.filter((id) => id !== student.id)
                                    );
                                  }
                                }}
                              />
                              <div className="flex-1">
                                <p className="font-bold text-slate-900">
                                  {student.first_name} {student.last_name}
                                </p>
                                <p className="text-[11px] text-slate-500">
                                  Roll No: {student.roll_no} • Code: {student.current_student_code}
                                </p>
                              </div>
                            </label>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={handleDispatchConsent}
                        className="bg-slate-900 text-white rounded-xl px-6 py-2.5 text-xs font-bold hover:bg-slate-800 flex items-center gap-2 shadow-md"
                      >
                        <Send className="h-4 w-4" />
                        {submitting
                          ? 'Dispatching...'
                          : `Dispatch Forms (${selectedStudentIds.length})`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
