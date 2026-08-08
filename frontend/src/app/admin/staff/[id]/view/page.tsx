'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { User, MapPin, Users, FileText, ArrowLeft, GraduationCap } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';

export default function AdminViewStaffProfilePage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [staff, setStaff] = useState<any>(null);

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
      if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'STAFF') {
        router.push('/login');
        return;
      }
      fetchProfile(token);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  const fetchProfile = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/staff/${staffId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStaff(data);
      }
    } catch (e) {
      console.error('Failed to fetch staff profile', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Staff Profile...
      </div>
    );
  }

  // Define data parsing helpers (if any)

  const ReadOnlyField = ({ label, value }: { label: string, value: any }) => {
    if (!value) return null;
    return (
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">{label}</span>
        <span className="text-[13px] font-medium text-slate-900">{value}</span>
      </div>
    );
  };

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar title="Staff Profile Preview" userName={`Welcome, ${user?.username}`} userRole={user?.role} />
        
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/admin/staff" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> <span>Staff Directory</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Profile Preview</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-semibold text-slate-900">Staff Profile</h1>
              <p className="text-sm text-slate-500 mt-1">Detailed read-only preview of the staff record.</p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                <FileText className="h-4 w-4" />
                Print Profile
              </button>
              <Link href={`/admin/staff/edit/${staffId}`} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm">
                Edit Details
              </Link>
            </div>
          </div>

          {staff && (
            <div className="space-y-6">
              
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex justify-center items-center">
                    {staff.photo_url ? (
                      <img src={staff.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-serif font-bold text-2xl text-slate-500">{staff.first_name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-slate-900">
                      {staff.first_name} {staff.last_name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Department: <strong>{staff.department}</strong> | Designation: {staff.designation}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <CodeBadge code={staff.staff_id} />
                  <div className="text-xs text-slate-500 font-medium">Joined: {new Date(staff.joining_date).toLocaleDateString()}</div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                  <User className="w-4 h-4 text-amber-500" />
                  <h3 className="font-serif font-semibold text-slate-900">Personal Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ReadOnlyField label="First Name" value={staff.first_name} />
                  <ReadOnlyField label="Last Name" value={staff.last_name} />
                  <ReadOnlyField label="Email ID" value={staff.user?.current_email} />
                  <ReadOnlyField label="Department" value={staff.department} />
                  <ReadOnlyField label="Designation" value={staff.designation} />
                  <ReadOnlyField label="Status" value={staff.status} />
                  <ReadOnlyField label="Mailbox Status" value={staff.user?.mailbox_jobs?.[0]?.status || 'COMPLETED'} />
                  {staff.status === 'SUSPENDED' && (
                    <>
                      <ReadOnlyField label="Suspended Until" value={staff.suspension_end_date ? new Date(staff.suspension_end_date).toLocaleDateString() : ''} />
                      <ReadOnlyField label="Suspension Reason" value={staff.suspension_reason} />
                    </>
                  )}
                </div>
              </div>

            </div>
          )}
        </main>
      </div>
    </div>
  );
}
