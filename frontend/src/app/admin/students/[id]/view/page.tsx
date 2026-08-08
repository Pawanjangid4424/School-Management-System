'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { User, MapPin, Users, FileText, ArrowLeft, GraduationCap } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';

export default function AdminViewStudentProfilePage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);

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
      const res = await fetch(`${apiUrl}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      }
    } catch (e) {
      console.error('Failed to fetch student profile', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Student Profile...
      </div>
    );
  }

  // Define data parsing helpers
  const father = student?.guardian_links?.find((l: any) => l.guardian_profile.relation_to_student === 'FATHER')?.guardian_profile;
  const mother = student?.guardian_links?.find((l: any) => l.guardian_profile.relation_to_student === 'MOTHER')?.guardian_profile;
  const localGuardian = student?.guardian_links?.find((l: any) => l.guardian_profile.relation_to_student === 'GUARDIAN')?.guardian_profile;

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
        <Topbar title="Student Profile Preview" userName={`Welcome, ${user?.username}`} userRole={user?.role} />
        
        <main className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/admin/students" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> <span>Students Directory</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Profile Preview</span>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-serif font-semibold text-slate-900">Student Profile</h1>
              <p className="text-sm text-slate-500 mt-1">Detailed read-only preview of the student record.</p>
            </div>
            
            <div className="flex gap-3">
              <button onClick={() => window.print()} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg text-sm font-medium hover:bg-slate-50 transition-colors shadow-sm">
                <FileText className="h-4 w-4" />
                Print Profile
              </button>
              <Link href={`/admin/students/edit/${studentId}`} className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 transition-colors shadow-sm">
                Edit Details
              </Link>
            </div>
          </div>

          {student && (
            <div className="space-y-6">
              
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-200 border border-slate-300 flex justify-center items-center">
                    {student.photo_url ? (
                      <img src={student.photo_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="font-serif font-bold text-2xl text-slate-500">{student.first_name?.charAt(0)}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="font-serif text-2xl font-semibold text-slate-900">
                      {student.first_name} {student.last_name}
                    </h2>
                    <p className="text-xs text-slate-500">
                      Class: <strong>Grade {student.current_class}-{student.current_section}</strong> | Roll No: {student.roll_no}
                    </p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <CodeBadge code={student.current_student_code} />
                  <div className="text-xs text-slate-500 font-medium">Admission: {student.permanent_admission_no}</div>
                </div>
              </div>

              {/* Personal Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                  <User className="w-4 h-4 text-amber-500" />
                  <h3 className="font-serif font-semibold text-slate-900">Personal Details</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <ReadOnlyField label="First Name" value={student.first_name} />
                  <ReadOnlyField label="Middle Name" value={student.middle_name} />
                  <ReadOnlyField label="Last Name" value={student.last_name} />
                  <ReadOnlyField label="Gender" value={student.gender} />
                  
                  <ReadOnlyField label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : ''} />
                  <ReadOnlyField label="Blood Group" value={student.blood_group} />
                  <ReadOnlyField label="Mobile No." value={student.mobile_no} />
                  <ReadOnlyField label="Email ID" value={student.user?.current_email} />

                  <ReadOnlyField label="Religion" value={student.religion} />
                  <ReadOnlyField label="Category" value={student.category} />
                  <ReadOnlyField label="Nationality" value={student.nationality} />
                  <ReadOnlyField label="Aadhar No." value={student.aadhar_no} />
                </div>
              </div>

              {/* Address Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                  <MapPin className="w-4 h-4 text-amber-500" />
                  <h3 className="font-serif font-semibold text-slate-900">Address Details</h3>
                </div>
                
                <h4 className="text-sm font-medium text-slate-700 mb-3">Permanent Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="col-span-1 md:col-span-4">
                    <ReadOnlyField label="Address" value={student.permanent_address?.addressDetails} />
                  </div>
                  <ReadOnlyField label="City/Village" value={student.permanent_address?.city} />
                  <ReadOnlyField label="State" value={student.permanent_address?.state} />
                  <ReadOnlyField label="Pin Code" value={student.permanent_address?.pinCode} />
                </div>

                <h4 className="text-sm font-medium text-slate-700 mb-3 pt-4 border-t border-slate-100">Local Address</h4>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="col-span-1 md:col-span-4">
                    <ReadOnlyField label="Address" value={student.local_address?.addressDetails} />
                  </div>
                  <ReadOnlyField label="City/Village" value={student.local_address?.city} />
                  <ReadOnlyField label="State" value={student.local_address?.state} />
                  <ReadOnlyField label="Pin Code" value={student.local_address?.pinCode} />
                </div>
              </div>

              {/* Guardian Details */}
              <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
                  <Users className="w-4 h-4 text-amber-500" />
                  <h3 className="font-serif font-semibold text-slate-900">Guardian Details</h3>
                </div>

                {father && (
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Father's Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <ReadOnlyField label="Full Name" value={father.full_name} />
                      <ReadOnlyField label="Phone" value={father.phone} />
                      <ReadOnlyField label="Email" value={father.email} />
                      <ReadOnlyField label="Occupation" value={father.occupation} />
                    </div>
                  </div>
                )}

                {mother && (
                  <div className="pt-4 border-t border-slate-100 mb-6">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Mother's Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <ReadOnlyField label="Full Name" value={mother.full_name} />
                      <ReadOnlyField label="Phone" value={mother.phone} />
                      <ReadOnlyField label="Email" value={mother.email} />
                      <ReadOnlyField label="Occupation" value={mother.occupation} />
                    </div>
                  </div>
                )}
                
                {localGuardian && (
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-medium text-slate-700 mb-3">Local Guardian Details</h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <ReadOnlyField label="Full Name" value={localGuardian.full_name} />
                      <ReadOnlyField label="Phone" value={localGuardian.phone} />
                      <ReadOnlyField label="Email" value={localGuardian.email} />
                      <ReadOnlyField label="Relation" value={localGuardian.relation_to_student} />
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
