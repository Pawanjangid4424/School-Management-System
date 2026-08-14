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

// Canvas image compression for mobile edit uploads
const compressImage = (file: File, maxDim = 600, quality = 0.75): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxDim) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          }
        } else {
          if (height > maxDim) {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(event.target?.result as string);
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
        resolve(compressedBase64);
      };
      img.onerror = (err) => reject(err);
      img.src = event.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

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
      
          fatherDetails: (() => {
            const g = data.guardian_links?.find((l:any) => l.guardian_profile.relation_to_student === 'FATHER')?.guardian_profile;
            return g ? { firstName: g.first_name || '', lastName: g.last_name || '', phone: g.phone || '', email: g.email || '', occupation: g.occupation || '', officePhone: g.office_phone || '', annualIncome: g.annual_income ? String(g.annual_income) : '' } : { firstName: '', lastName: '', phone: '', email: '', occupation: '' };
          })(),
          motherDetails: (() => {
            const g = data.guardian_links?.find((l:any) => l.guardian_profile.relation_to_student === 'MOTHER')?.guardian_profile;
            return g ? { firstName: g.first_name || '', lastName: g.last_name || '', phone: g.phone || '', email: g.email || '', occupation: g.occupation || '', officePhone: g.office_phone || '', annualIncome: g.annual_income ? String(g.annual_income) : '' } : { firstName: '', lastName: '', phone: '', email: '', occupation: '' };
          })(),
          localGuardianDetails: (() => {
            const g = data.guardian_links?.find((l:any) => l.guardian_profile.relation_to_student === 'GUARDIAN')?.guardian_profile;
            return g ? { firstName: g.first_name || '', lastName: g.last_name || '', phone: g.phone || '', email: g.email || '', relation: g.relation_to_student || '' } : { firstName: '', lastName: '', phone: '', email: '', relation: '' };
          })(),
      
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError('');
      const compressed = await compressImage(file, 600, 0.75);
      handleChange('root', 'photoUrl', compressed);
    } catch (err) {
      setError('Failed to process image file.');
    }
  };

  const handleSignatureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      setError('');
      const compressed = await compressImage(file, 600, 0.75);
      handleChange('root', 'signatureUrl', compressed);
    } catch (err) {
      setError('Failed to process signature file.');
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
      setError(err.message || 'An error occurred while updating the student.');
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
        <main className="px-3 sm:px-6 lg:px-8 py-5 space-y-5 max-w-6xl mx-auto">
          
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link href="/admin/students" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> <span>Students Directory</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Edit Student Profile</span>
          </div>

          {createdResult ? (
            <div className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-8 shadow-xl space-y-5">
              <div className="flex items-center gap-4 bg-emerald-50 border border-emerald-200 p-4 sm:p-6 rounded-xl text-emerald-900">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-600 text-white shrink-0">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold text-slate-900">
                    Student Profile Updated Successfully!
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    All personal details and guardian linkages have been saved.
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <Link
                  href="/admin/students"
                  className="bg-slate-900 text-white rounded-xl px-5 py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors"
                >
                  Return to Students Directory
                </Link>
                <Link
                  href={`/admin/students/${studentId}/view`}
                  className="border border-slate-300 text-slate-700 rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors"
                >
                  View Profile Preview &rarr;
                </Link>
              </div>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-5 lg:gap-6">
              
              {/* Step Navigation Bar for Mobile & Tablet (< lg) */}
              <div className="lg:hidden flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar bg-white p-2 rounded-2xl border border-slate-200 shadow-xs">
                {[
                  { step: 1, label: 'Personal', icon: User },
                  { step: 2, label: 'Address', icon: MapPin },
                  { step: 3, label: 'Guardian', icon: Users },
                  { step: 4, label: 'Photo', icon: FileText }
                ].map((item) => (
                  <button
                    key={item.step}
                    type="button"
                    onClick={() => setCurrentStep(item.step)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                      currentStep === item.step
                        ? 'bg-amber-600 text-white shadow-xs'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <item.icon className="h-3.5 w-3.5 shrink-0" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>

              {/* Sidebar Navigation for Form Steps (Desktop >= lg) */}
              <div className="hidden lg:block lg:w-64 shrink-0">
                <div className="rounded-2xl border border-slate-200/80 bg-white shadow-xs overflow-hidden sticky top-24">
                  <div className="p-4 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="font-semibold text-sm text-slate-800">Edit Steps</h3>
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
                        className={`flex items-center gap-3 px-5 py-4 text-xs font-medium transition-colors border-l-2 cursor-pointer ${
                          currentStep === item.step
                            ? 'border-amber-500 bg-amber-50/30 text-amber-700 font-semibold'
                            : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                        }`}
                      >
                        <item.icon className={`h-4 w-4 shrink-0 ${currentStep === item.step ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span>{item.label}</span>
                      </button>
                    ))}
                  </nav>
                </div>
              </div>

              {/* Main Form Area */}
              <div className="flex-1 rounded-2xl border border-slate-200/80 bg-white p-4 sm:p-6 lg:p-8 shadow-xs min-w-0">
                <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">
                  {error && <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">{error}</div>}

                  {/* STEP 1: Personal Details */}
                  {currentStep === 1 && (
                    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="border-b border-slate-100 pb-3 mb-4">
                        <h2 className="text-base sm:text-lg font-serif font-semibold text-slate-900">Student Personal Details</h2>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">First Name *</label>
                          <input type="text" required value={formData.firstName} onChange={(e) => handleChange('root', 'firstName', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Middle Name</label>
                          <input type="text" value={formData.middleName} onChange={(e) => handleChange('root', 'middleName', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name *</label>
                          <input type="text" required value={formData.lastName} onChange={(e) => handleChange('root', 'lastName', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Class *</label>
                          <select required value={formData.classNumber} onChange={(e) => handleChange('root', 'classNumber', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none">
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(c => <option key={c} value={c}>Grade {c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Section *</label>
                          <select required value={formData.section} onChange={(e) => handleChange('root', 'section', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none">
                            {['A','B','C','D'].map(s => <option key={s} value={s}>Section {s}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                            <span>Stream</span>
                            {formData.classNumber < 11 && (
                              <span className="text-[10px] text-slate-400 font-normal">(Grade 11 & 12 only)</span>
                            )}
                          </label>
                          <select
                            disabled={formData.classNumber < 11}
                            value={formData.stream}
                            onChange={(e) => handleChange('root', 'stream', e.target.value)}
                            className={`w-full rounded-xl border px-3.5 py-2.5 text-xs focus:outline-none ${
                              formData.classNumber >= 11
                                ? 'border-slate-200 bg-slate-50 text-slate-900 focus:border-amber-500 focus:bg-white'
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
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Roll Number *</label>
                          <input type="number" required min="1" value={formData.rollNumber} onChange={(e) => handleChange('root', 'rollNumber', Number(e.target.value))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                          <input type="date" value={formData.dateOfBirth} onChange={(e) => handleChange('root', 'dateOfBirth', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile No. *</label>
                          <div className="flex rounded-xl border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-amber-500 focus-within:bg-white">
                            <span className="px-3 py-2.5 bg-slate-200/70 text-slate-600 text-xs font-semibold border-r border-slate-200 flex items-center">+91</span>
                            <input
                              type="text"
                              required
                              maxLength={10}
                              value={formData.mobileNo}
                              onChange={(e) => handleChange('root', 'mobileNo', e.target.value.replace(/\D/g, '').slice(0, 10))}
                              className="w-full bg-transparent px-3.5 py-2.5 text-xs focus:outline-none font-medium"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                          <select value={formData.gender} onChange={(e) => handleChange('root', 'gender', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option>Male</option><option>Female</option><option>Other</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Blood Group</label>
                          <select value={formData.bloodGroup} onChange={(e) => handleChange('root', 'bloodGroup', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option value="">Select...</option>
                            {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => <option key={bg}>{bg}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Aadhar No.</label>
                          <input type="text" maxLength={14} value={formData.aadharNo} onChange={(e) => handleChange('root', 'aadharNo', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 2: Address Details */}
                  {currentStep === 2 && (
                    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="border-b border-slate-100 pb-3 mb-4">
                        <h2 className="text-base sm:text-lg font-serif font-semibold text-slate-900">Address Details</h2>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">Permanent Address</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
                        <div className="col-span-1 sm:col-span-2 lg:col-span-3">
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Address Details</label>
                          <textarea rows={2} value={formData.permanentAddress.addressDetails} onChange={(e) => handleChange('permanentAddress', 'addressDetails', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">City / Village</label>
                          <input type="text" value={formData.permanentAddress.city} onChange={(e) => handleChange('permanentAddress', 'city', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">State</label>
                          <input type="text" value={formData.permanentAddress.state} onChange={(e) => handleChange('permanentAddress', 'state', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Pin Code</label>
                          <input type="text" value={formData.permanentAddress.pinCode} onChange={(e) => handleChange('permanentAddress', 'pinCode', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none font-mono" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 3: Guardian Details */}
                  {currentStep === 3 && (
                    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="border-b border-slate-100 pb-3 mb-4">
                        <h2 className="text-base sm:text-lg font-serif font-semibold text-slate-900">Guardian Details</h2>
                      </div>

                      <h3 className="text-xs sm:text-sm font-bold text-slate-800 uppercase tracking-wider">Father's Details</h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">First Name</label>
                          <input type="text" value={formData.fatherDetails.firstName} onChange={(e) => handleChange('fatherDetails', 'firstName', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Last Name</label>
                          <input type="text" value={formData.fatherDetails.lastName} onChange={(e) => handleChange('fatherDetails', 'lastName', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile No.</label>
                          <input type="text" maxLength={10} value={formData.fatherDetails.phone} onChange={(e) => handleChange('fatherDetails', 'phone', e.target.value.replace(/\D/g, '').slice(0, 10))} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1">Email ID</label>
                          <input type="email" value={formData.fatherDetails.email} onChange={(e) => handleChange('fatherDetails', 'email', e.target.value)} className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Photo & Signature */}
                  {currentStep === 4 && (
                    <div className="space-y-5 sm:space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="border-b border-slate-100 pb-3 mb-4">
                        <h2 className="text-base sm:text-lg font-serif font-semibold text-slate-900">Photo & Signature Upload</h2>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6">
                        {/* Student Photo Upload */}
                        <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center gap-4 text-center">
                          <div className="w-32 h-32 bg-white rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shadow-xs relative group">
                            {formData.photoUrl ? (
                              <img src={formData.photoUrl} alt="Student" className="w-full h-full object-cover" />
                            ) : (
                              <User className="w-9 h-9 opacity-40 text-slate-500" />
                            )}
                          </div>
                          <div className="w-full space-y-2">
                            <label className="block text-xs font-semibold text-slate-800">Upload Student Photo</label>
                            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs w-full sm:w-auto">
                              <span>Choose Image File</span>
                              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            </label>
                          </div>
                        </div>

                        {/* Student Signature Upload */}
                        <div className="p-5 border border-slate-200 rounded-2xl bg-slate-50 flex flex-col items-center gap-4 text-center">
                          <div className="w-48 h-28 bg-white rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shadow-xs relative group">
                            {formData.signatureUrl ? (
                              <img src={formData.signatureUrl} alt="Signature" className="w-full h-full object-contain p-2" />
                            ) : (
                              <FileText className="w-8 h-8 opacity-40 text-slate-500" />
                            )}
                          </div>
                          <div className="w-full space-y-2">
                            <label className="block text-xs font-semibold text-slate-800">Upload Student Signature</label>
                            <label className="cursor-pointer inline-flex items-center justify-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-semibold hover:bg-slate-800 transition-colors shadow-xs w-full sm:w-auto">
                              <span>Choose Signature File</span>
                              <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-5">
                    <button
                      type="button"
                      disabled={currentStep === 1 || submitting}
                      onClick={handlePrev}
                      className="border border-slate-300 text-slate-700 rounded-xl px-4 sm:px-5 py-2 sm:py-2.5 text-xs font-semibold hover:bg-slate-50 disabled:opacity-30 flex items-center gap-2 cursor-pointer"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Prev
                    </button>

                    {currentStep < 4 ? (
                      <button
                        type="button"
                        onClick={handleNext}
                        className="bg-slate-900 text-white rounded-xl px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-semibold hover:bg-slate-800 flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        Next <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        type="submit"
                        disabled={submitting}
                        className="bg-amber-600 text-white rounded-xl px-5 sm:px-6 py-2 sm:py-2.5 text-xs font-bold hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2 shadow-xs cursor-pointer"
                      >
                        {submitting ? 'Saving Changes...' : 'Update Student Profile'} <CheckCircle2 className="h-4 w-4" />
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
