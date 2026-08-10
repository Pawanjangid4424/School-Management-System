'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Compass,
  ArrowLeft,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Eye,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';
import {
  TripConsentDocumentView,
  TripFormData,
} from '@/components/trips/TripConsentDocumentView';

export default function ConsentStatusRosterPage() {
  const router = useRouter();
  const params = useParams();
  const tripId = params.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);

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
      fetchConsentStatus(token, tripId);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, tripId]);

  const fetchConsentStatus = async (token: string, id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/trips/${id}/consent-status`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const resData = await res.json();
        setData(resData);
      }
    } catch (e) {
      console.error('Failed to fetch consent status', e);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Consent Status Roster...
      </div>
    );
  }

  const trip = data.trip;

  const formData: TripFormData = {
    tripTitle: trip.description || 'Science Park Field Trip',
    destination: trip.destination || '',
    date: trip.trip_date ? new Date(trip.trip_date).toISOString().split('T')[0] : '',
    departureTime: trip.departure_time || '8:00 AM',
    arrivalTime: trip.arrival_time || '9:30 AM',
    returnTime: trip.return_time || '4:00 PM',
    phone1: trip.emergency_contact_phone1 || '+91 88753 33348',
    phone2: trip.emergency_contact_phone2 || '+91 89630 03348',
    costBreakdown: trip.cost_breakdown || [
      { label: 'Transport', amount: trip.cost ? Number(trip.cost) : 150 },
    ],
    whatToBring: trip.what_to_bring || ['Water bottle', 'School ID card'],
    rules: trip.rules || [
      'Students must stay with their assigned group at all times.',
      'No student may leave the group without teacher permission.',
    ],
    isLocked: trip.is_locked,
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Parent Consent Roster Tracking"
          userName={`Welcome, ${user?.username || 'User'}`}
          userRole={user?.role || 'Administrator'}
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href={user?.role === 'TEACHER' ? '/teacher/trips' : '/admin/trips'}
              className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Trips List</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Consent Status Roster</span>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                  Grade {trip.class_number}-{trip.section}
                </span>
                <span className="text-xs text-slate-400">
                  Proposer:{' '}
                  {trip.created_by_staff
                    ? `${trip.created_by_staff.first_name} ${trip.created_by_staff.last_name}`
                    : 'Faculty Member'}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h2 className="font-serif text-2xl font-semibold text-slate-900">
                  {trip.destination}
                </h2>
                <button
                  type="button"
                  onClick={() => setShowPreviewModal(true)}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  <Eye className="h-3.5 w-3.5 text-blue-600" />
                  <span>Preview Consent Document</span>
                </button>
              </div>
              <p className="text-xs text-slate-600">{trip.description}</p>
            </div>

            <div className="flex items-center gap-3 text-xs">
              <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-center">
                <span className="block text-[11px] text-emerald-700 font-medium">Granted Consents</span>
                <span className="font-serif text-lg font-bold text-emerald-800">
                  {data.grantedCount} / {data.totalStudents}
                </span>
              </div>

              <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-center">
                <span className="block text-[11px] text-amber-700 font-medium">Pending Response</span>
                <span className="font-serif text-lg font-bold text-amber-800">
                  {data.pendingCount}
                </span>
              </div>

              <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-center">
                <span className="block text-[11px] text-rose-700 font-medium">Denied Consents</span>
                <span className="font-serif text-lg font-bold text-rose-800">
                  {data.deniedCount}
                </span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-serif text-base font-semibold text-slate-900">
                Student Parent Consent Status Roster ({data.roster.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Roll No</th>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Student Code</th>
                    <th className="px-6 py-3">Guardian Name</th>
                    <th className="px-6 py-3">Responded Date</th>
                    <th className="px-6 py-3">Permission Status</th>
                    <th className="px-6 py-3 text-right">Quick Share</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {data.roster.map((item: any) => {
                    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://school-management-system-iota-flax.vercel.app';
                    const shareText = `Marudhar Defence Academy: Action Required - Field Trip Parent Consent for ${item.name} (${trip.destination}). Please review & sign online: ${baseUrl}/consent/${item.permissionId}`;
                    const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

                    return (
                      <tr key={item.permissionId} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5 font-mono text-slate-500">
                          #{item.rollNo}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {item.name}
                        </td>
                        <td className="px-6 py-3.5">
                          <CodeBadge code={item.studentCode} />
                        </td>
                        <td className="px-6 py-3.5 text-slate-600 font-medium">
                          {item.guardianName}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500 font-mono">
                          {item.respondedAt ? item.respondedAt.split('T')[0] : '—'}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill
                            status={item.permissionStatus === 'GRANTED' ? 'active' : item.permissionStatus === 'DENIED' ? 'error' : 'pending'}
                            label={item.permissionStatus}
                          />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <a
                            href={whatsappUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] transition-colors shadow-xs"
                            title="Share Direct Consent Link on WhatsApp (100% Free)"
                          >
                            <span>💬 Send WhatsApp</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Full Document Preview Modal */}
          {showPreviewModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 overflow-y-auto">
              <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl my-auto space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div className="flex items-center gap-2">
                    <Eye className="h-5 w-5 text-blue-600" />
                    <h3 className="font-serif text-base font-bold text-slate-900">
                      Official Field Trip Consent Form Preview
                    </h3>
                  </div>
                  <button
                    onClick={() => setShowPreviewModal(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold px-2 py-1"
                  >
                    ✕
                  </button>
                </div>

                <TripConsentDocumentView
                  isEdit={false}
                  isStudentView={true}
                  formData={formData}
                  student={{
                    name: 'Target Student Name (Per-Recipient)',
                    code: '26MDA1000XX',
                    class: `Class ${trip.class_number} Section ${trip.section}`,
                  }}
                />

                <div className="flex justify-end pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => setShowPreviewModal(false)}
                    className="border border-slate-300 text-slate-700 rounded-xl px-5 py-2 text-xs font-medium hover:bg-slate-100"
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
