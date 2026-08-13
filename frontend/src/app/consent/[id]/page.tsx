'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  TripConsentDocumentView,
  TripFormData,
} from '@/components/trips/TripConsentDocumentView';

export default function PublicConsentPage() {
  const params = useParams();
  const permissionId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const fetchConsentData = async () => {
    if (!permissionId) return;
    try {
      setLoading(true);
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/public/trips/permission/${permissionId}`);
      if (!res.ok) {
        throw new Error('Trip permission document not found or link expired.');
      }
      const json = await res.json();
      setData(json);
      setError(null);
    } catch (e: any) {
      setError(e.message || 'Failed to load trip consent document.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsentData();
  }, [permissionId]);

  const handleRespond = async (status: 'GRANTED' | 'DENIED', name: string, signatureData?: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/public/trips/permission/${permissionId}/respond`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, respondedByName: name, signatureData }),
      });

      if (res.ok) {
        fetchConsentData();
      }
    } catch (e) {
      console.error('Error submitting consent response', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-slate-300 text-sm">
        Loading Field Trip Parent Consent Document...
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 px-4">
        <div className="max-w-md w-full rounded-2xl bg-white p-8 text-center space-y-4 shadow-xl border border-slate-200">
          <div className="h-12 w-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto text-xl font-bold">
            !
          </div>
          <h2 className="text-xl font-bold text-slate-800">Consent Form Unavailable</h2>
          <p className="text-sm text-slate-500">{error || 'Invalid or expired consent form link.'}</p>
        </div>
      </div>
    );
  }

  const trip = data.trip || {};
  const formData: TripFormData = {
    tripTitle: trip.description || trip.destination || 'School Field Trip',
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
    <div className="min-h-screen bg-slate-950 py-10 px-4 flex justify-center items-start">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-4xl w-full"
      >
        <div className="mb-6 text-center text-slate-400 text-xs tracking-wider uppercase">
          Official Educational Field Trip • Digital Consent Portal
        </div>

        <TripConsentDocumentView
          isEdit={false}
          formData={formData}
          student={
            data.student || {
              name: 'Student Name',
              code: '26MDA100021',
              class: `Class ${trip.class_number} Section ${trip.section}`,
            }
          }
          permissionStatus={data.permissionStatus}
          respondedByName={data.respondedByName}
          signatureId={data.signatureId}
          signatureData={data.signatureData}
          respondedAt={data.respondedAt}
          isStudentView={false}
          onRespond={handleRespond}
        />
      </motion.div>
    </div>
  );
}
