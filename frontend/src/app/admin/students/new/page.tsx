'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  GraduationCap, User, Mail, BookOpen, Hash, Calendar, CheckCircle2, ArrowLeft,
  Sparkles, RefreshCw, Plus, ArrowRight, MapPin, Users, FileText, ShieldCheck,
  Copy, Check, Key, Lock, Eye, EyeOff, Printer
} from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AddStudentPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Steps: 1 - Personal, 2 - Address, 3 - Guardian, 4 - Photo/Signature
  const [currentStep, setCurrentStep] = useState(1);

  // Form State - Personal & Full Profile Matching Fields
  const [formData, setFormData] = useState<any>({
    firstName: '',
    middleName: '',
    lastName: '',
    classNumber: '',
    section: '',
    stream: '',
    rollNumber: '',
    admissionYear: 2026,
    admissionType: 'Regular',
    dateOfBirth: '',
    birthPlace: '',
    gender: 'Male',
    bloodGroup: '',
    religion: '',
    category: '',
    nationality: 'Indian',
    physicallyDisabled: 'No',
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

  // Section Capacity & Next Roll Number Info State
  const [sectionCapacities, setSectionCapacities] = useState<any>(null);
  const [sectionCapacityMsg, setSectionCapacityMsg] = useState<string>('');

  // Submit & Result State
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [createdResult, setCreatedResult] = useState<any>(null);

  // Copy & Password Toggle State
  const [showPassword, setShowPassword] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const handleCopy = (text: string, fieldName: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedField(fieldName);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const fetchSectionCapacities = async (classNum: number) => {
    if (!classNum) return;
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/students/section-capacity-and-roll?classNumber=${classNum}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSectionCapacities(data);

        // Find first available section
        const sections = ['A', 'B', 'C'];
        const firstAvail = sections.find(s => data[s] && !data[s].isFull) || 'A';
        const nextRoll = data[firstAvail]?.nextRollNumber || 1;

        if (data[firstAvail]?.isFull) {
          setSectionCapacityMsg(`⚠️ All sections in Grade ${classNum} are currently full!`);
        } else {
          setSectionCapacityMsg('');
        }

        setFormData((prev: any) => ({
          ...prev,
          section: firstAvail,
          rollNumber: nextRoll,
        }));
      }
    } catch (e) {
      console.error('Failed to fetch section capacities', e);
    }
  };

  const handleClassChange = (classNum: number) => {
    setFormData((prev: any) => ({
      ...prev,
      classNumber: classNum,
      stream: classNum < 11 ? '' : (prev.stream || 'SCIENCE'),
    }));
    fetchSectionCapacities(classNum);
  };

  const handleSectionChange = (sec: string) => {
    if (sectionCapacities && sectionCapacities[sec]) {
      const info = sectionCapacities[sec];
      if (info.isFull) {
        setSectionCapacityMsg(`⚠️ Section ${sec} is full (${info.enrolled}/${info.max} enrolled). Please select next section.`);
      } else {
        setSectionCapacityMsg('');
        setFormData((prev: any) => ({
          ...prev,
          section: sec,
          rollNumber: info.nextRollNumber,
        }));
      }
    } else {
      setFormData((prev: any) => ({ ...prev, section: sec }));
    }
  };

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
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const handleNext = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setError('');
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  const handlePrev = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleChange = (section: string, field: string, value: any) => {
    if (section === 'root') {
      setFormData((prev: any) => ({ ...prev, [field]: value }));
    } else {
      setFormData((prev: any) => ({
        ...prev,
        [section]: {
          ...(prev as any)[section],
          [field]: value
        }
      }));
    }
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 400 * 1024) {
      const sizeKB = Math.round(file.size / 1024);
      setError(`⚠️ Photo size exceeds 400 KB (Actual size: ${sizeKB} KB). Please select an image under 400 KB.`);
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      handleChange('root', 'photoUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 400 * 1024) {
      const sizeKB = Math.round(file.size / 1024);
      setError(`⚠️ Signature size exceeds 400 KB (Actual size: ${sizeKB} KB). Please select an image under 400 KB.`);
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onload = () => {
      handleChange('root', 'signatureUrl', reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 4) {
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
        admissionType: formData.admissionType,
        dateOfBirth: formData.dateOfBirth || undefined,
        birthPlace: formData.birthPlace,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup,
        religion: formData.religion,
        category: formData.category,
        nationality: formData.nationality,
        physicallyDisabled: formData.physicallyDisabled,
        aadharNo: formData.aadharNo,
        mobileNo: formData.mobileNo,
        alternateMobileNo: formData.alternateMobileNo,

        permanentAddress: formData.permanentAddress,
        localAddress: formData.sameAsPermanent ? formData.permanentAddress : formData.localAddress,

        fatherDetails: formData.fatherDetails,
        motherDetails: formData.motherDetails,
        localGuardianDetails: formData.localGuardianDetails,

        photoUrl: formData.photoUrl,
        signatureUrl: formData.signatureUrl
      };

      const res = await fetch(`${apiUrl}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create student profile');
      setCreatedResult({ ...data, rawFormData: formData });
    } catch (err: any) {
      setError(err.message || 'An error occurred while creating the student.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex h-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">Loading...</div>;

  return (
    <div className="flex min-h-screen bg-slate-50 print:bg-white print:block">
      <div className="print:hidden">
        <Sidebar role={user?.role} tenantName={user?.tenant_name} />
      </div>
      <div className="flex-1 pl-0 md:pl-64 print:pl-0 transition-all duration-300 min-w-0">
        <div className="print:hidden">
          <Topbar title="Add New Student" userName="Welcome, Admin" userRole="System Administrator" />
        </div>
        <main className="px-4 sm:px-6 lg:px-8 py-6 print:p-0 space-y-6 max-w-6xl mx-auto print:max-w-none print:w-full">

          <div className="flex items-center gap-2 text-xs text-slate-500 print:hidden">
            <Link href="/admin/students" className="flex items-center gap-1 hover:text-slate-900 transition-colors">
              <ArrowLeft className="h-3.5 w-3.5" /> <span>Students Directory</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">New Student Enrollment</span>
          </div>

          {createdResult ? (
            <div className="rounded-2xl border border-emerald-200 bg-white p-4 sm:p-8 shadow-xl space-y-5 print:border-none print:shadow-none print:p-0 print:m-0 print:space-y-3">
              
              {/* CSS Rule for 1-Page Printing */}
              <style jsx global>{`
                @media print {
                  @page {
                    size: A4 portrait;
                    margin: 8mm;
                  }
                  body {
                    background-color: white !important;
                    color: black !important;
                    -webkit-print-color-adjust: exact !important;
                    print-color-adjust: exact !important;
                  }
                  .print\\:hidden {
                    display: none !important;
                  }
                }
              `}</style>

              {/* Print-Only Official Institution Header */}
              <div className="hidden print:flex items-center justify-between border-b-2 border-slate-900 pb-3 mb-2">
                <div>
                  <h1 className="text-xl font-serif font-bold text-slate-900 uppercase tracking-wide">
                    {user?.tenant_name || 'Marudhar Defence Academy'}
                  </h1>
                  <p className="text-xs text-slate-700 font-semibold uppercase tracking-wider mt-0.5">
                    Official Student Enrollment & Portal Credentials Receipt
                  </p>
                </div>
                <div className="text-right text-[11px] text-slate-600 font-mono">
                  <div>Date: {new Date().toLocaleDateString()}</div>
                  <div>Academic Session: 2026-2027</div>
                </div>
              </div>

              {/* Vibrant Banner (Screen) / Clean Header (Print) */}
              <div className="rounded-xl bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 p-4 sm:p-6 text-white shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:bg-slate-100 print:text-slate-900 print:p-3 print:border print:border-slate-300">
                <div className="flex items-center gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white print:bg-emerald-600 print:text-white print:h-8 print:w-8 shrink-0">
                    <CheckCircle2 className="h-7 w-7 text-emerald-200 print:text-white print:h-5 print:w-5" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-emerald-500/30 px-3 py-0.5 text-[10px] font-semibold tracking-wider text-emerald-100 uppercase mb-0.5 print:bg-emerald-200 print:text-emerald-900">
                      🎉 Enrollment Completed
                    </span>
                    <h2 className="font-serif text-xl font-bold text-white print:text-slate-900 print:text-base">
                      Student Profile Successfully Created!
                    </h2>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors border border-white/20 shadow-sm print:hidden"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Slip</span>
                </button>
              </div>

              {/* Student Comprehensive Profile Summary (Includes Photo, Class, Parents) */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-4 print:bg-white print:border-slate-300 print:p-3">
                <div className="flex flex-col sm:flex-row gap-4 items-start">
                  {/* Student Photo */}
                  <div className="w-24 h-28 bg-white border border-slate-300 rounded-lg overflow-hidden flex items-center justify-center text-slate-400 shrink-0 shadow-sm">
                    {createdResult.rawFormData?.photoUrl ? (
                      <img src={createdResult.rawFormData.photoUrl} alt="Student Photo" className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex flex-col items-center gap-1 text-[10px] text-slate-400">
                        <User className="w-8 h-8 opacity-40" />
                        <span>No Photo</span>
                      </div>
                    )}
                  </div>

                  {/* Student Details Grid */}
                  <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2.5">
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Student Full Name</span>
                      <strong className="text-slate-900 text-xs font-bold">
                        {createdResult.firstName} {createdResult.rawFormData?.middleName ? createdResult.rawFormData.middleName + ' ' : ''}{createdResult.lastName}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Admission No. / Code</span>
                      <strong className="text-slate-900 font-mono font-bold">
                        {createdResult.permanentAdmissionNo || createdResult.studentCode}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Class & Section</span>
                      <strong className="text-slate-900 font-semibold">
                        Grade {createdResult.class}-{createdResult.section} {createdResult.stream ? `(${createdResult.stream})` : ''}
                      </strong>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Roll Number</span>
                      <strong className="text-slate-900 font-mono font-bold">
                        #{createdResult.rollNo}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Date of Birth & Gender</span>
                      <strong className="text-slate-900 font-medium">
                        {createdResult.rawFormData?.dateOfBirth || 'N/A'} ({createdResult.rawFormData?.gender || 'N/A'})
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Aadhar Number</span>
                      <strong className="text-slate-900 font-mono">
                        {createdResult.rawFormData?.aadharNo || 'N/A'}
                      </strong>
                    </div>

                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Father's Name</span>
                      <strong className="text-slate-900 font-medium">
                        {createdResult.rawFormData?.fatherDetails?.firstName} {createdResult.rawFormData?.fatherDetails?.lastName}
                        {createdResult.rawFormData?.fatherDetails?.phone ? ` (+91 ${createdResult.rawFormData.fatherDetails.phone})` : ''}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">Mother's Name</span>
                      <strong className="text-slate-900 font-medium">
                        {createdResult.rawFormData?.motherDetails?.firstName} {createdResult.rawFormData?.motherDetails?.lastName}
                        {createdResult.rawFormData?.motherDetails?.phone ? ` (+91 ${createdResult.rawFormData.motherDetails.phone})` : ''}
                      </strong>
                    </div>
                    <div>
                      <span className="block text-[10px] text-slate-400 font-medium">City & State</span>
                      <strong className="text-slate-900 font-medium">
                        {createdResult.rawFormData?.permanentAddress?.city || 'N/A'}, {createdResult.rawFormData?.permanentAddress?.state || 'N/A'}
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* Generated Credentials Grid */}
              <div className="space-y-2">
                <h3 className="font-serif text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-emerald-600 print:text-slate-800" />
                  Student Portal Login Credentials
                </h3>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  {/* Username */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 print:bg-white print:border-slate-300 space-y-1">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Login Username</span>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      {createdResult.username}
                    </div>
                  </div>

                  {/* Password */}
                  <div className="p-3 rounded-lg border border-amber-200 bg-amber-50/40 print:bg-white print:border-slate-300 space-y-1">
                    <span className="text-[10px] font-semibold text-amber-900 print:text-slate-500 uppercase tracking-wider block">Initial Temporary Password</span>
                    <div className="font-mono text-sm font-bold text-slate-900">
                      <span className="print:hidden">
                        {showPassword ? (createdResult.defaultPassword || 'StudentPass123!') : '••••••••••••'}
                      </span>
                      <span className="hidden print:inline">
                        {createdResult.defaultPassword || 'StudentPass123!'}
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="ml-2 text-[10px] text-slate-500 hover:underline print:hidden"
                      >
                        {showPassword ? 'Hide' : 'Show'}
                      </button>
                    </div>
                  </div>

                  {/* Email */}
                  <div className="p-3 rounded-lg border border-slate-200 bg-slate-50 print:bg-white print:border-slate-300 space-y-1 col-span-2">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">Institutional Student Email</span>
                    <div className="font-mono text-xs font-bold text-slate-900">
                      {createdResult.email || `${createdResult.username}@school.com`}
                    </div>
                  </div>
                </div>
              </div>

              {/* Security & Password Self-Service Note */}
              <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-[11px] text-blue-900 flex items-start gap-2.5 print:bg-white print:border-slate-300 print:text-slate-600 print:p-2">
                <Lock className="h-3.5 w-3.5 text-blue-600 shrink-0 mt-0.5 print:text-slate-700" />
                <p className="leading-snug">
                  Parents/Students can log in to the <strong>Student Portal</strong> using either their <strong>System Username</strong> or <strong>Institutional Email</strong> with the initial temporary password. On first login, please reset password via <strong>Profile Settings</strong>.
                </p>
              </div>

              {/* Official Signatures for Printed Slip */}
              <div className="hidden print:flex justify-between items-end pt-8 text-xs text-slate-800">
                <div className="text-center">
                  <div className="border-t border-slate-400 w-44 pt-1 font-bold">Parent / Guardian Signature</div>
                </div>
                <div className="text-center">
                  <div className="border-t border-slate-400 w-44 pt-1 font-bold">Authorized Admin Stamp</div>
                </div>
              </div>

              {/* Footer Action Buttons */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100 print:hidden">
                <button
                  type="button"
                  onClick={() => window.location.reload()}
                  className="bg-slate-900 text-white rounded-xl px-5 py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors inline-flex items-center gap-2 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Register Another Student</span>
                </button>
                <Link
                  href="/admin/students"
                  className="border border-slate-300 bg-white text-slate-700 rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>View Students Directory</span>
                </Link>
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

                      {sectionCapacityMsg && (
                        <div className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-xs text-amber-900 font-medium flex items-center gap-2">
                          <span>{sectionCapacityMsg}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">First Name *</label>
                          <input type="text" required placeholder="e.g. Rahul" value={formData.firstName} onChange={(e) => handleChange('root', 'firstName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Middle Name</label>
                          <input type="text" placeholder="e.g. Kumar" value={formData.middleName} onChange={(e) => handleChange('root', 'middleName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Last Name *</label>
                          <input type="text" required placeholder="e.g. Sharma" value={formData.lastName} onChange={(e) => handleChange('root', 'lastName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Class *</label>
                          <select required value={formData.classNumber} onChange={(e) => handleClassChange(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option value="">Select Class...</option>
                            {Array.from({ length: 12 }, (_, i) => i + 1).map(c => <option key={c} value={c}>Grade {c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Section *</label>
                          <select required value={formData.section} onChange={(e) => handleSectionChange(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option value="">Select Section...</option>
                            {['A','B','C'].map(s => {
                              const info = sectionCapacities ? sectionCapacities[s] : null;
                              const isFull = info?.isFull;
                              return (
                                <option key={s} value={s} disabled={isFull}>
                                  Section {s} {info ? `(${info.enrolled}/${info.max}${isFull ? ' - FULL' : ''})` : ''}
                                </option>
                              );
                            })}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                            <span>Stream</span>
                            {Number(formData.classNumber) < 11 && (
                              <span className="text-[10px] text-slate-400 font-normal">(Grade 11 & 12 only)</span>
                            )}
                          </label>
                          <select
                            disabled={Number(formData.classNumber) < 11}
                            value={formData.stream}
                            onChange={(e) => handleChange('root', 'stream', e.target.value)}
                            className={`w-full rounded-lg border px-3 py-2 text-xs focus:outline-none ${
                              Number(formData.classNumber) >= 11
                                ? 'border-slate-200 bg-slate-50 focus:border-amber-500 focus:bg-white'
                                : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                            }`}
                          >
                            {Number(formData.classNumber) < 11 ? (
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
                          <label className="block text-xs font-medium text-slate-700 mb-1 flex items-center justify-between">
                            <span>Roll Number *</span>
                            <span className="text-[10px] text-emerald-600 font-normal">Auto-Suggested</span>
                          </label>
                          <input type="number" required min="1" placeholder="Roll No..." value={formData.rollNumber} onChange={(e) => handleChange('root', 'rollNumber', Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Admission Type</label>
                          <select value={formData.admissionType} onChange={(e) => handleChange('root', 'admissionType', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option value="Regular">Regular</option>
                            <option value="RTE">RTE</option>
                            <option value="Transfer">Transfer</option>
                            <option value="Management">Management</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">
                            Student Mobile No. <span className="text-red-500 font-bold">*</span> <span className="text-[10px] text-slate-400 font-normal">(Compulsory for Account Recovery)</span>
                          </label>
                          <div className="flex rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-amber-500 focus-within:bg-white">
                            <span className="px-3 py-2 bg-slate-200/70 text-slate-600 text-xs font-semibold border-r border-slate-200 flex items-center">+91</span>
                            <input
                              type="text"
                              required
                              maxLength={10}
                              placeholder="10-digit mobile number"
                              value={formData.mobileNo}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                handleChange('root', 'mobileNo', digits);
                              }}
                              className="w-full bg-transparent px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Alternate Mobile No.</label>
                          <div className="flex rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-amber-500 focus-within:bg-white">
                            <span className="px-3 py-2 bg-slate-200/70 text-slate-600 text-xs font-semibold border-r border-slate-200 flex items-center">+91</span>
                            <input
                              type="text"
                              maxLength={10}
                              placeholder="10-digit mobile number"
                              value={formData.alternateMobileNo}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                handleChange('root', 'alternateMobileNo', digits);
                              }}
                              className="w-full bg-transparent px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Date of Birth</label>
                          <input
                            type="date"
                            min="1990-01-01"
                            max="2026-12-31"
                            value={formData.dateOfBirth}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (val.length <= 10) {
                                handleChange('root', 'dateOfBirth', val);
                              }
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Birth Place</label>
                          <input type="text" placeholder="e.g. Jaipur" value={formData.birthPlace} onChange={(e) => handleChange('root', 'birthPlace', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
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
                          <label className="block text-xs font-medium text-slate-700 mb-1">Nationality</label>
                          <input type="text" value={formData.nationality} onChange={(e) => handleChange('root', 'nationality', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
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
                          <label className="block text-xs font-medium text-slate-700 mb-1">Physically Disabled</label>
                          <select value={formData.physicallyDisabled} onChange={(e) => handleChange('root', 'physicallyDisabled', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none">
                            <option value="No">No</option>
                            <option value="Yes">Yes</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Aadhar No.</label>
                          <input
                            type="text"
                            maxLength={14}
                            placeholder="1234-4567-8923"
                            value={formData.aadharNo}
                            onChange={(e) => {
                              const rawDigits = e.target.value.replace(/\D/g, '').slice(0, 12);
                              const formatted = rawDigits.replace(/(\d{4})(?=\d)/g, '$1-');
                              handleChange('root', 'aadharNo', formatted);
                            }}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-mono focus:border-amber-500 focus:bg-white focus:outline-none"
                          />
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
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="col-span-1 md:col-span-3">
                          <label className="block text-xs font-medium text-slate-700 mb-1">Address Details</label>
                          <textarea rows={2} placeholder="e.g. Flat 402, Sunshine Apartments, Civil Lines" value={formData.permanentAddress.addressDetails} onChange={(e) => handleChange('permanentAddress', 'addressDetails', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">City / Village</label>
                          <input type="text" placeholder="e.g. Jaipur" value={formData.permanentAddress.city} onChange={(e) => handleChange('permanentAddress', 'city', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                          <input type="text" placeholder="e.g. Rajasthan" value={formData.permanentAddress.state} onChange={(e) => handleChange('permanentAddress', 'state', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Pin Code</label>
                          <input type="text" placeholder="e.g. 302001" value={formData.permanentAddress.pinCode} onChange={(e) => handleChange('permanentAddress', 'pinCode', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
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
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="col-span-1 md:col-span-3">
                              <label className="block text-xs font-medium text-slate-700 mb-1">Address Details</label>
                              <textarea rows={2} placeholder="e.g. House No. 12, Subhash Nagar" value={formData.localAddress.addressDetails} onChange={(e) => handleChange('localAddress', 'addressDetails', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">City / Village</label>
                              <input type="text" placeholder="e.g. Jaipur" value={formData.localAddress.city} onChange={(e) => handleChange('localAddress', 'city', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">State</label>
                              <input type="text" placeholder="e.g. Rajasthan" value={formData.localAddress.state} onChange={(e) => handleChange('localAddress', 'state', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-slate-700 mb-1">Pin Code</label>
                              <input type="text" placeholder="e.g. 302001" value={formData.localAddress.pinCode} onChange={(e) => handleChange('localAddress', 'pinCode', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
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
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                          <input type="text" placeholder="e.g. Rajesh" value={formData.fatherDetails.firstName} onChange={(e) => handleChange('fatherDetails', 'firstName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                          <input type="text" placeholder="e.g. Sharma" value={formData.fatherDetails.lastName} onChange={(e) => handleChange('fatherDetails', 'lastName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Mobile No.</label>
                          <div className="flex rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-amber-500 focus-within:bg-white">
                            <span className="px-3 py-2 bg-slate-200/70 text-slate-600 text-xs font-semibold border-r border-slate-200 flex items-center">+91</span>
                            <input
                              type="text"
                              maxLength={10}
                              placeholder="10-digit mobile number"
                              value={formData.fatherDetails.phone}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                handleChange('fatherDetails', 'phone', digits);
                              }}
                              className="w-full bg-transparent px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Email ID</label>
                          <input type="email" placeholder="e.g. rajesh.sharma@example.com" value={formData.fatherDetails.email} onChange={(e) => handleChange('fatherDetails', 'email', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Occupation</label>
                          <input type="text" placeholder="e.g. Engineer / Business" value={formData.fatherDetails.occupation} onChange={(e) => handleChange('fatherDetails', 'occupation', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                      </div>

                      <h3 className="text-sm font-medium text-slate-800 pt-4 border-t border-slate-100">Mother's Details</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                          <input type="text" placeholder="e.g. Sunita" value={formData.motherDetails.firstName} onChange={(e) => handleChange('motherDetails', 'firstName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                          <input type="text" placeholder="e.g. Sharma" value={formData.motherDetails.lastName} onChange={(e) => handleChange('motherDetails', 'lastName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Mobile No.</label>
                          <div className="flex rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-amber-500 focus-within:bg-white">
                            <span className="px-3 py-2 bg-slate-200/70 text-slate-600 text-xs font-semibold border-r border-slate-200 flex items-center">+91</span>
                            <input
                              type="text"
                              maxLength={10}
                              placeholder="10-digit mobile number"
                              value={formData.motherDetails.phone}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                handleChange('motherDetails', 'phone', digits);
                              }}
                              className="w-full bg-transparent px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Email ID</label>
                          <input type="email" placeholder="e.g. sunita.sharma@example.com" value={formData.motherDetails.email} onChange={(e) => handleChange('motherDetails', 'email', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Occupation</label>
                          <input type="text" placeholder="e.g. Doctor / Homemaker" value={formData.motherDetails.occupation} onChange={(e) => handleChange('motherDetails', 'occupation', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                      </div>

                      <h3 className="text-sm font-medium text-slate-800 pt-4 border-t border-slate-100">Local Guardian Details (Optional)</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">First Name</label>
                          <input type="text" placeholder="e.g. Amit" value={formData.localGuardianDetails.firstName} onChange={(e) => handleChange('localGuardianDetails', 'firstName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Last Name</label>
                          <input type="text" placeholder="e.g. Sharma" value={formData.localGuardianDetails.lastName} onChange={(e) => handleChange('localGuardianDetails', 'lastName', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Mobile No.</label>
                          <div className="flex rounded-lg border border-slate-200 bg-slate-50 overflow-hidden focus-within:border-amber-500 focus-within:bg-white">
                            <span className="px-3 py-2 bg-slate-200/70 text-slate-600 text-xs font-semibold border-r border-slate-200 flex items-center">+91</span>
                            <input
                              type="text"
                              maxLength={10}
                              placeholder="10-digit mobile number"
                              value={formData.localGuardianDetails.phone}
                              onChange={(e) => {
                                const digits = e.target.value.replace(/\D/g, '').slice(0, 10);
                                handleChange('localGuardianDetails', 'phone', digits);
                              }}
                              className="w-full bg-transparent px-3 py-2 text-xs focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Email ID</label>
                          <input type="email" placeholder="e.g. amit.sharma@example.com" value={formData.localGuardianDetails.email} onChange={(e) => handleChange('localGuardianDetails', 'email', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-700 mb-1">Relation</label>
                          <input type="text" placeholder="e.g. Uncle / Local Guardian" value={formData.localGuardianDetails.relation} onChange={(e) => handleChange('localGuardianDetails', 'relation', e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs focus:border-amber-500 focus:bg-white focus:outline-none" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* STEP 4: Photo & Signature */}
                  {currentStep === 4 && (
                    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2">
                      <div className="border-b border-slate-100 pb-4 mb-6">
                        <h2 className="text-lg font-serif font-semibold text-slate-900">Photo & Signature Upload</h2>
                      </div>

                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs p-4 rounded-xl flex items-start gap-3 mb-6">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>Upload student photo and signature image files directly from your computer. Files must be JPG, JPEG, or PNG formats up to <strong>400 KB</strong>.</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Student Photo Upload */}
                        <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-4 text-center">
                          <div className="w-36 h-36 bg-white rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shadow-sm relative group">
                            {formData.photoUrl ? (
                              <img src={formData.photoUrl} alt="Student" className="w-full h-full object-cover" />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 p-2">
                                <User className="w-10 h-10 opacity-40 text-slate-500" />
                                <span className="text-[11px] font-medium text-slate-400">No Photo Selected</span>
                              </div>
                            )}
                          </div>
                          <div className="w-full space-y-2">
                            <label className="block text-xs font-semibold text-slate-800">Upload Student Passport Photo</label>
                            <span className="block text-[11px] text-slate-500 mb-2">Max file size: 400 KB (JPG / PNG)</span>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-sm">
                              <span>Choose Image File</span>
                              <input type="file" accept="image/*" onChange={handlePhotoUpload} className="hidden" />
                            </label>
                            {formData.photoUrl && (
                              <button
                                type="button"
                                onClick={() => handleChange('root', 'photoUrl', '')}
                                className="block mx-auto text-[11px] text-rose-600 font-medium hover:underline pt-1"
                              >
                                Remove Photo
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Student Signature Upload */}
                        <div className="p-6 border border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center gap-4 text-center">
                          <div className="w-56 h-28 bg-white rounded-2xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center text-slate-400 shadow-sm relative group">
                            {formData.signatureUrl ? (
                              <img src={formData.signatureUrl} alt="Signature" className="w-full h-full object-contain p-2" />
                            ) : (
                              <div className="flex flex-col items-center gap-1.5 p-2">
                                <FileText className="w-8 h-8 opacity-40 text-slate-500" />
                                <span className="text-[11px] font-medium text-slate-400">No Signature Selected</span>
                              </div>
                            )}
                          </div>
                          <div className="w-full space-y-2">
                            <label className="block text-xs font-semibold text-slate-800">Upload Student Signature</label>
                            <span className="block text-[11px] text-slate-500 mb-2">Max file size: 400 KB (JPG / PNG)</span>
                            <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-lg text-xs font-medium hover:bg-slate-800 transition-colors shadow-sm">
                              <span>Choose Signature File</span>
                              <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                            </label>
                            {formData.signatureUrl && (
                              <button
                                type="button"
                                onClick={() => handleChange('root', 'signatureUrl', '')}
                                className="block mx-auto text-[11px] text-rose-600 font-medium hover:underline pt-1"
                              >
                                Remove Signature
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Actions Footer */}
                  <div className="flex items-center justify-between border-t border-slate-100 pt-6">
                    <button
                      key={`btn-prev-step-${currentStep}`}
                      type="button"
                      disabled={currentStep === 1 || submitting}
                      onClick={(e) => handlePrev(e)}
                      className="border border-slate-300 text-slate-600 rounded-lg px-5 py-2 text-xs font-medium hover:bg-slate-50 disabled:opacity-30 flex items-center gap-2"
                    >
                      <ArrowLeft className="h-3.5 w-3.5" /> Prev
                    </button>

                    {currentStep < 4 ? (
                      <button
                        key={`btn-next-step-${currentStep}`}
                        type="button"
                        onClick={(e) => handleNext(e)}
                        className="bg-slate-900 text-white rounded-lg px-5 py-2 text-xs font-medium hover:bg-slate-800 flex items-center gap-2"
                      >
                        Next <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    ) : (
                      <button
                        key="btn-submit-final-step"
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
