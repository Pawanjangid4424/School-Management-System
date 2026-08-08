'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, User, Mail, BookOpen, Hash, Calendar, CheckCircle2, ArrowLeft,
  Sparkles, RefreshCw, Plus, ArrowRight, MapPin, Users, FileText
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function EditStudentPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Steps: 1 - Personal, 2 - Address, 3 - Guardian, 4 - Photo/Signature
  const [currentStep, setCurrentStep] = useState(1);

  // Form State - Personal
  const [formData, setFormData] = useState({
    firstName: '',
    middleName: '',
    lastName: '',
    classNumber: 6,
    section: 'A',
    stream: '',
    rollNumber: 1,
    admissionYear: 2026,
    dateOfBirth: '',
    gender: 'Male',
    bloodGroup: '',
    religion: '',
    category: '',
    aadharNo: '',
    mobileNo: '',
    alternateMobileNo: '',
    
    // Address
    permanentAddress: { addressDetails: '', city: '', state: '', pinCode: '' },
    localAddress: { addressDetails: '', city: '', state: '', pinCode: '' },
    sameAsPermanent: false,

    // Guardians
    fatherDetails: { firstName: '', lastName: '', phone: '', email: '', occupation: '' },
    motherDetails: { firstName: '', lastName: '', phone: '', email: '', occupation: '' },
    localGuardianDetails: { firstName: '', lastName: '', phone: '', email: '', relation: '' },

    // Photo
    photoUrl: '',
    signatureUrl: ''
  });

  // Submit & Result State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState<any>(null);

  useEffect(() => {
    if (formData.classNumber <= 10) {
      handleChange('root', 'stream', '');
    } else if (!formData.stream) {
      handleChange('root', 'stream', 'SCIENCE');
    }
  }, [formData.classNumber]);

  useEffect(() => {
    const token = localStorage.getItem('access_token');
    const storedUser = localStorage.getItem('user');

    if (!token || !storedUser) {
      router.push('/login');
      return;
    }
    try {
      const parsedUser = JSON.parse(storedUser);
      if (parsedUser.role !== 'ADMIN' && parsedUser.role !== 'TEACHER') {
        router.push('/login');
        return;
      }
      setUser(parsedUser);
      fetchStudent(token);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  const fetchStudent = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/students/${studentId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        
        // Populate formData
        setFormData({
          firstName: data.first_name || '',
          middleName: data.middle_name || '',
          lastName: data.last_name || '',
          classNumber: Number(data.current_class) || 6,
          section: data.current_section || 'A',
          stream: data.stream || '',
          rollNumber: data.roll_no || 1,
          admissionYear: data.admission_year || 2026,
          dateOfBirth: data.date_of_birth ? data.date_of_birth.split('T')[0] : '',
          gender: data.gender || 'Male',
          bloodGroup: data.blood_group || '',
          religion: data.religion || '',
          category: data.category || '',
          aadharNo: data.aadhar_no || '',
          mobileNo: data.mobile_no || '',
          alternateMobileNo: data.alternate_mobile_no || '',
          
          permanentAddress: data.permanent_address || { addressDetails: '', city: '', state: '', pinCode: '' },
          localAddress: data.local_address || { addressDetails: '', city: '', state: '', pinCode: '' },
          sameAsPermanent: false,
      
          fatherDetails: data.guardian_links?.find((l:any) => l.guardian_profile.relation_to_student === 'FATHER')?.guardian_profile || { firstName: '', lastName: '', phone: '', email: '', occupation: '' },
          motherDetails: data.guardian_links?.find((l:any) => l.guardian_profile.relation_to_student === 'MOTHER')?.guardian_profile || { firstName: '', lastName: '', phone: '', email: '', occupation: '' },
          localGuardianDetails: data.guardian_links?.find((l:any) => l.guardian_profile.relation_to_student === 'GUARDIAN')?.guardian_profile || { firstName: '', lastName: '', phone: '', email: '', relation: '' },
      
          photoUrl: data.photo_url || '',
          signatureUrl: data.signature_url || ''
        });
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => setCurrentStep(prev => Math.min(prev + 1, 4));
  const handlePrev = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleChange = (section: string, field: string, value: any) => {
    if (section === 'root') {
      setFormData(prev => ({ ...prev, [field]: value }));
    } else {
      setFormData(prev => ({
        ...prev,
        [section]: {
          ...(prev as any)[section],
          [field]: value
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 4) {
      handleNext();
      return;
    }
    
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const payload = {
        firstName: formData.firstName,
        middleName: formData.middleName,
        lastName: formData.lastName,
        classNumber: Number(formData.classNumber),
        section: formData.section,
        stream: formData.classNumber >= 11 && formData.stream ? formData.stream : undefined,
        rollNumber: Number(formData.rollNumber),
        admissionYear: Number(formData.admissionYear),
        dateOfBirth: formData.dateOfBirth || undefined,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        religion: formData.religion,
        category: formData.category,
        aadharNo: formData.aadharNo,
        mobileNo: formData.mobileNo,
        
        permanentAddress: formData.permanentAddress,
        localAddress: formData.sameAsPermanent ? formData.permanentAddress : formData.localAddress,
        
        fatherDetails: formData.fatherDetails,
        motherDetails: formData.motherDetails,
        localGuardianDetails: formData.localGuardianDetails,
        
        photoUrl: formData.photoUrl,
        signatureUrl: formData.signatureUrl
      };

      const res = await fetch(`${apiUrl}/students/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update student profile');
      setCreatedResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the student.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar title="Edit Student Profile" userName={`Welcome, ${user?.username}`} userRole="System Administrator" />
        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-6xl mx-auto">
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/admin/students" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> <span>Students Directory</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Edit Student</span>
          </div>

          {createdResult ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm space-y-6">
              {/* Success Result Component (Keep existing code from here) */}
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-serif text-xl font-semibold text-slate-900">Student Profile Successfully Updated!</h2>
                </div>
              </div>
              <div className="rounded-xl border border-slate-100 bg-slate-50/80 p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">Generated Student Code:</span>
                    <CodeBadge code={createdResult.studentCode} className="bg-white px-3 py-1.5" />
                  </div>
                  <div>
                    <span className="block text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-1">System Username:</span>
                    <CodeBadge code={createdResult.username} className="bg-white px-3 py-1.5" />
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button type="button" onClick={() => window.location.reload()} className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium">Add Another Student</button>
                <Link href="/admin/students" className="border border-dashed border-slate-300 text-slate-600 rounded-lg px-4 py-2 text-xs font-medium">View Directory</Link>
              </div>
            </div>
          ) : (
            <div className="flex gap-6">
              {/* Sidebar Navigation for Form Steps */}
              <div className="w-64 shrink-0">
                <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden sticky top-24">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-sm text-slate-800">Enrollment Steps</h3>
                  </div>
                  <nav className="flex flex-col">
                    {[
                      { step: 1, label: 'Personal Details', icon: User },
                      { step: 2, label: 'Address Details', icon: MapPin },
                      { step: 3, label: 'Guardian Details', icon: Users },
                      { step: 4, label: 'Photo & Signature', icon: FileText }
                    ].map((item) => (
                      <button
                        key={item.step}
                        type="button"
                        onClick={() => setCurrentStep(item.step)}
                        className={`flex items-center gap-3 px-5 py-4 text-xs font-medium transition-colors border-l-2 ${
                          currentStep === item.step
                            ? 'border-amber-500 bg-amber-50/30 text-amber-700'
                            : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 ${currentStep === item.step ? 'text-amber-600' : 'text-slate-400'}`} />
                        {item.label}
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Main Form Area */}
              <div className="flex-1 rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
                <form onSubmit={handleSubmit} className="space-y-8">
                  {error && <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">{error}</div>}

                  {/* STEP 1: Personal Details */}
                  {currentStep === 1 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="border-b border-slate-100 pb-4 mb-6">
                        <h2 className="text-lg font-serif font-semibold text-slate-900">Student Personal Details</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                          <input type="text" required value={formData.firstName} onChange={(e) => handleChange('root', 'firstName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Middle Name</label>
                          <input type="text" value={formData.middleName} onChange={(e) => handleChange('root', 'middleName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                          <input type="text" required value={formData.lastName} onChange={(e) => handleChange('root', 'lastName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Class *</label>
                          <select required value={formData.classNumber} onChange={(e) => handleChange('root', 'classNumber', Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(c => <option key={c} value={c}>Grade {c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Section *</label>
                          <select required value={formData.section} onChange={(e) => handleChange('root', 'section', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                            <span>Stream</span>
                            {formData.classNumber < 11 && (
                              <span className="text-[10px] text-slate-400 font-normal">(Grade 11 & 12 only)</span>
                            )}
                          </label>
                          <select
                            disabled={formData.classNumber < 11}
                            value={formData.stream}
                            onChange={(e) => handleChange('root', 'stream', e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                              formData.classNumber >= 11
                                ? 'border-slate-200 bg-slate-50 focus:border-amber-500 focus:bg-white'
                                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {formData.classNumber < 11 ? (
                              <option value="">N/A</option>
                            ) : (
                              <>
                                <option value="SCIENCE">Science (S)</option>
                                <option value="COMMERCE">Commerce (C)</option>
                                <option value="ARTS">Arts (A)</option>
                              </>
                            )}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Roll Number *</label>
                          <input type="number" required min="1" value={formData.rollNumber} onChange={(e) => handleChange('root', 'rollNumber', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                          <input type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('root', 'dateOfBirth', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Gender</label>
                          <select value={formData.gender} onChange={(e) => handleChange('root', 'gender', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option>Male</option><option>Female</option><option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Blood Group</label>
                          <select value={formData.bloodGroup} onChange={(e) => handleChange('root', 'bloodGroup', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option value="">Select...</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg}>{bg}</option>)}
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Religion</label>
                          <select value={formData.religion} onChange={(e) => handleChange('root', 'religion', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option value="">Select...</option>
                            <option>Hindu</option><option>Muslim</option><option>Christian</option><option>Sikh</option><option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Category</label>
                          <select value={formData.category} onChange={(e) => handleChange('root', 'category', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option value="">Select...</option>
                            <option>General</option><option>OBC</option><option>SC</option><option>ST</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Aadhar No.</label>
                          <input type="text" value={formData.aadharNo} onChange={(e) => handleChange('root', 'aadharNo', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Address Details */}
                  {currentStep === 2 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="border-b border-slate-100 pb-4 mb-6">
                        <h2 className="text-lg font-serif font-semibold text-slate-900">Address Details</h2>
                      </div>

                      <h3 className="text-sm font-medium text-slate-800">Permanent Address</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="col-span-1 md:col-span-2">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Address Details</label>
                          <textarea rows={2} value={formData.permanentAddress.addressDetails} onChange={(e) => handleChange('permanentAddress', 'addressDetails', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">City / Village</label>
                          <input type="text" value={formData.permanentAddress.city} onChange={(e) => handleChange('permanentAddress', 'city', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                          <input type="text" value={formData.permanentAddress.state} onChange={(e) => handleChange('permanentAddress', 'state', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Pin Code</label>
                          <input type="text" value={formData.permanentAddress.pinCode} onChange={(e) => handleChange('permanentAddress', 'pinCode', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                      </div>

                      <div className="pt-6 mt-6 border-t border-slate-100">
                        <div className="flex items-center gap-3 mb-4">
                          <h3 className="text-sm font-medium text-slate-800">Local Address</h3>
                          <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer">
                            <input type="checkbox" checked={formData.sameAsPermanent} onChange={(e) => handleChange('root', 'sameAsPermanent', e.target.checked)} className="rounded border-slate-300 text-amber-600 focus:ring-amber-500" />
                            Same as Permanent Address
                          </label>
                        </div>

                        {!formData.sameAsPermanent && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                              <label className="block text-xs font-medium text-slate-700 mb-1">Address Details</label>
                              <textarea rows={2} value={formData.localAddress.addressDetails} onChange={(e) => handleChange('localAddress', 'addressDetails', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">City / Village</label>
                              <input type="text" value={formData.localAddress.city} onChange={(e) => handleChange('localAddress', 'city', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Pin Code</label>
                              <input type="text" value={formData.localAddress.pinCode} onChange={(e) => handleChange('localAddress', 'pinCode', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Guardian Details */}
                  {currentStep === 3 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="border-b border-slate-100 pb-4 mb-6">
                        <h2 className="text-lg font-serif font-semibold text-slate-900">Guardian Details</h2>
                      </div>
                      
                      <h3 className="text-sm font-medium text-slate-800">Father's Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                          <input type="text" value={formData.fatherDetails.firstName} onChange={(e) => handleChange('fatherDetails', 'firstName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                          <input type="text" value={formData.fatherDetails.lastName} onChange={(e) => handleChange('fatherDetails', 'lastName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Mobile No.</label>
                          <input type="text" value={formData.fatherDetails.phone} onChange={(e) => handleChange('fatherDetails', 'phone', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                      </div>

                      <h3 className="text-sm font-medium text-slate-800 pt-4 border-t border-slate-100">Mother's Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                          <input type="text" value={formData.motherDetails.firstName} onChange={(e) => handleChange('motherDetails', 'firstName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                          <input type="text" value={formData.motherDetails.lastName} onChange={(e) => handleChange('motherDetails', 'lastName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Mobile No.</label>
                          <input type="text" value={formData.motherDetails.phone} onChange={(e) => handleChange('motherDetails', 'phone', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Photo & Signature */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="border-b border-slate-100 pb-4 mb-6">
                        <h2 className="text-lg font-serif font-semibold text-slate-900">Photo & Signature</h2>
                      </div>
                      
                      <div className="bg-blue-50 text-blue-800 text-xs p-4 rounded-lg flex items-start gap-3 mb-6">
                        <span className="font-semibold text-blue-600">Note:</span>
                        <span>Only JPG, JPEG, PNG files are allowed up to 150 KB for Photo and Signature. (Testing phase: You may leave this blank or input a mock image URL).</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-4">
                          <div className="w-32 h-32 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center text-slate-400">
                            {formData.photoUrl ? (
                              <img src={formData.photoUrl} alt="Student" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-10 h-10 opacity-50" />
                            )}
                          </div>
                          <div className="w-full">
                            <label className="block text-xs font-medium text-slate-700 mb-1 text-center">Photo URL (Mock)</label>
                            <input type="text" placeholder="https://example.com/photo.jpg" value={formData.photoUrl} onChange={(e) => handleChange('root', 'photoUrl', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-amber-500 focus:outline-none" />
                          </div>
                        </div>

                        <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-4">
                          <div className="w-48 h-20 bg-slate-200 rounded-lg overflow-hidden border border-slate-300 flex items-center justify-center text-slate-400">
                            {formData.signatureUrl ? (
                              <img src={formData.signatureUrl} alt="Signature" className="w-full h-full object-contain" />
                            ) : (
                              <span className="text-xs font-medium">Signature Area</span>
                            )}
                          </div>
                          <div className="w-full">
                            <label className="block text-xs font-medium text-slate-700 mb-1 text-center">Signature URL (Mock)</label>
                            <input type="text" placeholder="https://example.com/sig.png" value={formData.signatureUrl} onChange={(e) => handleChange('root', 'signatureUrl', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs focus:border-amber-500 focus:outline-none" />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                    <button
                      type="button"
                      disabled={currentStep === 1 || submitting}
                      onClick={handlePrev}
                      className="border border-slate-300 text-slate-600 rounded-lg px-5 py-2 text-xs font-medium hover:bg-slate-50 disabled:opacity-30 flex items-center gap-2"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Prev
                    </button>

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="bg-slate-900 text-white rounded-lg px-5 py-2 text-xs font-medium hover:bg-slate-800 flex items-center gap-2"
                      >
                        Next <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-emerald-600 text-white rounded-lg px-6 py-2 text-xs font-medium hover:bg-emerald-700 disabled:opacity-50 flex items-center gap-2 shadow-sm"
                      >
                        {submitting ? 'Saving...' : 'Complete Enrollment'} <CheckCircle2 className="h-4 w-4" />
                      </button>
                    )}
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
