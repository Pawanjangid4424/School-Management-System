'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import {
  TripConsentDocumentView,
  TripFormData,
} from '@/components/trips/TripConsentDocumentView';

export default function StudentTripsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState<any[]>([]);

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
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchTrips = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/student-portal/trips/self`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setPermissions(data);
      }
    } catch (e) {
      console.error('Failed to fetch trips', e);
    }
  };

  const handleRespondConsent = async (permissionId: string, status: 'GRANTED' | 'DENIED', name: string, signatureData?: string) => {
    try {
      const token = sessionStorage.getItem('access_token') || localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      const res = await fetch(`${apiUrl}/trips/permission/${permissionId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, respondedByName: name, signatureData }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        fetchTrips(token as string);
      }
    } catch (e: any) {
      console.error('Error responding to trip consent', e);
      if (e.name === 'AbortError') {
        alert('Server timeout! The backend took too long to respond. Please check if your NEXT_PUBLIC_API_URL is correct or if the backend is offline.');
      } else {
        alert('Failed to submit consent. Network error or backend is unreachable.');
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Field Trips...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="STUDENT" tenantName={user?.tenant_name} />

      <div className="flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 md:pl-[var(--sidebar-width,256px)]">
        <Topbar
          title="Class Field Trips & Permission Status"
          userName={`Welcome, ${user?.username || 'Student'}`}
          userRole="Enrolled Student Account"
        />

        <main className="px-4 md:px-8 py-6 max-w-5xl mx-auto w-full space-y-8">
          {permissions.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center text-slate-400 text-sm">
              No field trip consent forms issued for your class yet.
            </div>
          ) : (
            permissions.map((item) => {
              const trip = item.trip;

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
                <div key={item.permissionId}>
                  <TripConsentDocumentView
                    isEdit={false}
                    formData={formData}
                    student={
                      item.student || {
                        name: `${user?.first_name || 'Student'} ${user?.last_name || ''}`,
                        code: user?.student_code || '26MDA100021',
                        class: `Class ${trip.class_number} Section ${trip.section}`,
                      }
                    }
                    permissionStatus={item.permissionStatus}
                    respondedByName={item.respondedByName || ''}
                    signatureId={item.signatureId || ''}
                    signatureData={item.signatureData || ''}
                    respondedAt={item.respondedAt || ''}
                    isStudentView={false}
                    onRespond={(status, name, sigData) => handleRespondConsent(item.permissionId, status, name, sigData)}
                  />
                </div>
              );
            })
          )}
        </main>
      </div>
    </div>
  );
}
