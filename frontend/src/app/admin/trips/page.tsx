'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Eye,
  Lock,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  TripConsentDocumentView,
  TripFormData,
} from '@/components/trips/TripConsentDocumentView';

export default function AdminTripsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [trips, setTrips] = useState<any[]>([]);
  const [reviewSuccess, setReviewSuccess] = useState('');
  const [previewTrip, setPreviewTrip] = useState<any | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }

    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'ADMIN') {
        router.push('/login');
        return;
      }
      setUser(parsedUser);
      fetchTrips(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

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

  const handleReviewTrip = async (tripId: string, status: 'APPROVED' | 'REJECTED') => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/trips/${tripId}/review`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (res.ok) {
        setReviewSuccess(
          status === 'APPROVED'
            ? 'Trip approved successfully! Status is now APPROVED. Teacher can now dispatch consent forms to parents from Teacher Portal.'
            : 'Trip rejected.',
        );
        if (previewTrip && previewTrip.id === tripId) {
          setPreviewTrip(null);
        }
        fetchTrips(token || '');
      }
    } catch (e) {
      console.error('Error reviewing trip', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Field Trips Oversight...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Field Trips Oversight & Approval"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                School Trips & Consent Workflow Review
              </h2>
              <p className="text-xs text-slate-500">
                Approve field trips to lock details and trigger parent consent notification dispatching.
              </p>
            </div>
          </div>

          {reviewSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{reviewSuccess}</span>
            </div>
          )}

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4">
              <span className="text-xs font-semibold text-slate-900">
                All Field Trips ({trips.length})
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Destination</th>
                    <th className="px-6 py-3">Target Class</th>
                    <th className="px-6 py-3">Proposing Faculty</th>
                    <th className="px-6 py-3">Trip Date</th>
                    <th className="px-6 py-3">Cost</th>
                    <th className="px-6 py-3">Approval Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {trips.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No field trips submitted for review.
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
                        <td className="px-6 py-3.5 text-slate-600">
                          {item.created_by_staff
                            ? `${item.created_by_staff.first_name} ${item.created_by_staff.last_name}`
                            : 'Faculty Member'}
                        </td>
                        <td className="px-6 py-3.5 text-slate-900 font-mono">
                          {new Date(item.trip_date).toISOString().split('T')[0]}
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
                        <td className="px-6 py-3.5 text-right space-x-2">
                          {/* Eye / Preview Button */}
                          <button
                            type="button"
                            onClick={() => setPreviewTrip(item)}
                            className="border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
                            title="Preview Full Document & Consent Form"
                          >
                            <Eye className="h-3.5 w-3.5 text-blue-600" />
                            <span>Preview</span>
                          </button>

                          {item.status === 'PENDING_APPROVAL' ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleReviewTrip(item.id, 'APPROVED')}
                                className="bg-emerald-600 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-700 transition-colors flex items-center gap-1"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Approve</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleReviewTrip(item.id, 'REJECTED')}
                                className="border border-rose-200 bg-rose-50 text-rose-700 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-rose-100 transition-colors flex items-center gap-1"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>Reject</span>
                              </button>
                            </div>
                          ) : (
                            <Link
                              href={`/admin/trips/${item.id}/consent-status`}
                              className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                            >
                              <span>Consent Roster</span>
                              <ArrowRight className="h-3 w-3" />
                            </Link>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Admin Full Document Preview Modal */}
          {previewTrip && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
              <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-auto space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <h3 className="font-serif text-base font-bold text-slate-900">
                      Admin Document & Consent Form Oversight Preview
                    </h3>
                  </div>
                  <button
                    onClick={() => setPreviewTrip(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                {/* Render Full TripConsentDocumentView */}
                <TripConsentDocumentView
                  isEdit={false}
                  isStudentView={true}
                  formData={{
                    tripTitle: previewTrip.description || 'Science Park Field Trip',
                    destination: previewTrip.destination || '',
                    date: previewTrip.trip_date
                      ? new Date(previewTrip.trip_date).toISOString().split('T')[0]
                      : '',
                    departureTime: previewTrip.departure_time || '8:00 AM',
                    arrivalTime: previewTrip.arrival_time || '9:30 AM',
                    returnTime: previewTrip.return_time || '4:00 PM',
                    phone1: previewTrip.emergency_contact_phone1 || '+91 88753 33348',
                    phone2: previewTrip.emergency_contact_phone2 || '+91 89630 03348',
                    costBreakdown: previewTrip.cost_breakdown || [
                      { label: 'Transport', amount: previewTrip.cost ? Number(previewTrip.cost) : 150 },
                    ],
                    whatToBring: previewTrip.what_to_bring || ['Water bottle', 'School ID card'],
                    rules: previewTrip.rules || [
                      'Students must stay with their assigned group at all times.',
                      'No student may leave the group without teacher permission.',
                    ],
                    isLocked: previewTrip.is_locked,
                  }}
                  student={{
                    name: 'Target Student Name (Per-Recipient)',
                    code: '26MDA1000XX',
                    class: `Class ${previewTrip.class_number} Section ${previewTrip.section}`,
                  }}
                />

                {/* Admin Approval Actions at bottom of Modal */}
                <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                  <span className="text-xs text-slate-500">
                    Status:{' '}
                    <strong className="text-slate-900 font-semibold">{previewTrip.status}</strong>
                  </span>

                  <div className="flex items-center gap-3">
                    {previewTrip.status === 'PENDING_APPROVAL' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleReviewTrip(previewTrip.id, 'APPROVED')}
                          className="bg-emerald-600 text-white rounded-xl px-5 py-2 text-xs font-bold hover:bg-emerald-700 transition-colors flex items-center gap-1.5 shadow-md"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          <span>Approve & Lock Trip</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReviewTrip(previewTrip.id, 'REJECTED')}
                          className="border border-rose-200 bg-rose-50 text-rose-700 rounded-xl px-5 py-2 text-xs font-bold hover:bg-rose-100 transition-colors flex items-center gap-1.5"
                        >
                          <XCircle className="h-4 w-4" />
                          <span>Reject Trip</span>
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => setPreviewTrip(null)}
                      className="border border-slate-300 text-slate-700 rounded-xl px-4 py-2 text-xs font-medium hover:bg-slate-100"
                    >
                      Close Preview
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
