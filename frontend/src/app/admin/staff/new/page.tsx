'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Users,
  User,
  Mail,
  Briefcase,
  Building,
  Calendar,
  CheckCircle2,
  ArrowLeft,
  Sparkles,
  Plus,
  ArrowRight,
  BookOpen,
  ShieldCheck,
  Copy,
  Check,
  Key,
  Lock,
  Eye,
  EyeOff,
  Printer,
  Hash
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AddStaffPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Form State
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [designation, setDesignation] = useState('Senior Teacher');
  const [department, setDepartment] = useState('English');
  const [joiningDate, setJoiningDate] = useState('2026-07-30');
  const [subjectsTaught, setSubjectsTaught] = useState('');
  const [classTeacherOf, setClassTeacherOf] = useState('');

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const payload = {
        firstName,
        lastName,
        designation,
        department,
        joiningDate,
        subjectsTaught: subjectsTaught || undefined,
        classTeacherOf: classTeacherOf || undefined,
      };

      const res = await fetch(`${apiUrl}/staff`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to create staff profile');
      }

      setCreatedResult(data);
    } catch (err: any) {
      setError(err.message || 'An error occurred while onboarding staff.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setFirstName('');
    setLastName('');
    setSubjectsTaught('');
    setClassTeacherOf('');
    setCreatedResult(null);
    setError('');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar */}
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar */}
        <Topbar
          title="Add Staff Member"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-5xl mx-auto">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/admin/staff"
              className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Staff Directory</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">New Staff Onboarding</span>
          </div>

          {/* Form / Result Card */}
          {createdResult ? (
            /* Success Confirmation Card - Executive & Interactive */
            <div className="rounded-2xl border border-amber-200 bg-white p-8 shadow-xl space-y-6">
              {/* Vibrant Gradient Banner Header */}
              <div className="rounded-xl bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 p-6 text-white shadow-md flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/20 backdrop-blur-md text-white">
                    <CheckCircle2 className="h-8 w-8 text-amber-200" />
                  </div>
                  <div>
                    <span className="inline-block rounded-full bg-amber-500/30 px-3 py-0.5 text-[11px] font-semibold tracking-wider text-amber-100 uppercase mb-1">
                      🎉 Onboarding Complete
                    </span>
                    <h2 className="font-serif text-2xl font-bold text-white">
                      Staff Member Successfully Onboarded!
                    </h2>
                    <p className="text-xs text-amber-100 mt-0.5">
                      Permanent Staff ID generated and teacher account provisioned on portal.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="hidden sm:inline-flex items-center gap-2 rounded-xl bg-white/10 px-4 py-2 text-xs font-semibold text-white hover:bg-white/20 transition-colors border border-white/20 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>Print Slip</span>
                </button>
              </div>

              {/* Staff Summary Sub-header */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">Staff Name</span>
                  <strong className="text-slate-800 text-sm font-semibold">
                    {createdResult.firstName} {createdResult.lastName}
                  </strong>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">Permanent Staff ID</span>
                  <strong className="text-slate-800 font-mono text-sm">
                    #{createdResult.staffId}
                  </strong>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">Department</span>
                  <strong className="text-slate-800 font-semibold">
                    {createdResult.department}
                  </strong>
                </div>
                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">Designation</span>
                  <strong className="text-slate-800 font-semibold">
                    {createdResult.designation}
                  </strong>
                </div>
              </div>

              {/* Generated Credentials Grid */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm font-bold text-slate-900 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-amber-600" />
                    System Account Credentials & Mailbox Provisioning
                  </h3>
                  <span className="text-[11px] text-slate-400 font-medium">Unique Account Details</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Permanent Staff ID */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-amber-300 transition-colors space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                        <Hash className="h-3.5 w-3.5 text-amber-500" />
                        Permanent Staff ID
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(String(createdResult.staffId), 'staffId')}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        {copiedField === 'staffId' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedField === 'staffId' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="font-mono text-base font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2">
                      {createdResult.staffId}
                    </div>
                  </div>

                  {/* Username */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-amber-300 transition-colors space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-blue-500" />
                        System Login Username
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdResult.username, 'username')}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        {copiedField === 'username' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedField === 'username' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="font-mono text-base font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2">
                      {createdResult.username}
                    </div>
                  </div>

                  {/* Generated Mailbox Email */}
                  <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 hover:border-amber-300 transition-colors space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-slate-600 flex items-center gap-1.5">
                        <Mail className="h-3.5 w-3.5 text-purple-500" />
                        Institutional Staff Mailbox Email
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(createdResult.email, 'email')}
                        className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                      >
                        {copiedField === 'email' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                        {copiedField === 'email' ? 'Copied' : 'Copy'}
                      </button>
                    </div>
                    <div className="font-mono text-xs font-bold text-slate-900 bg-white border border-slate-200 rounded-lg px-3 py-2 truncate">
                      {createdResult.email}
                    </div>
                  </div>

                  {/* Initial Temporary Password */}
                  <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 hover:border-amber-400 transition-colors space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <span className="font-semibold text-amber-900 flex items-center gap-1.5">
                        <Key className="h-3.5 w-3.5 text-amber-600" />
                        Initial Temporary Password
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="text-xs text-slate-500 hover:text-slate-700 flex items-center gap-1"
                        >
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {showPassword ? 'Hide' : 'Show'}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleCopy(createdResult.defaultPassword || 'StaffPass123!', 'password')}
                          className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
                        >
                          {copiedField === 'password' ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                          {copiedField === 'password' ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                    </div>
                    <div className="font-mono text-base font-bold text-slate-900 bg-white border border-amber-200 rounded-lg px-3 py-2 flex items-center justify-between">
                      <span>
                        {showPassword ? (createdResult.defaultPassword || 'StaffPass123!') : '••••••••••••'}
                      </span>
                      <span className="text-[10px] text-amber-700 font-sans font-medium">Default</span>
                    </div>
                  </div>
                </div>

                {/* Mailbox Status Card */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-slate-700">
                      Mailbox Provisioning Queue:
                    </span>
                    <StatusPill status="pending" label="Provisioning In Progress (~500ms)" />
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Job ID: {createdResult.mailboxJob?.id?.slice(0, 8)}...
                  </span>
                </div>
              </div>

              {/* Security & Password Self-Service Note */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-4 text-xs text-blue-900 flex items-start gap-3">
                <Lock className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h4 className="font-bold text-blue-950">Security & Portal Access Info</h4>
                  <p className="text-blue-800 text-[11px] leading-relaxed">
                    The staff member can log in to the <strong>Teacher Portal</strong> using either their <strong>System Username</strong> or <strong>Institutional Email</strong> with the initial password. Staff members can update their password via their <strong>Profile Settings</strong> or the <strong>"Forgot Password"</strong> link on the login page.
                  </p>
                </div>
              </div>

              {/* Action Buttons Footer */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={handleResetForm}
                  className="bg-slate-900 text-white rounded-xl px-5 py-2.5 text-xs font-bold hover:bg-slate-800 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <Plus className="h-4 w-4" />
                  <span>Onboard Another Staff Member</span>
                </button>

                <Link
                  href="/admin/staff"
                  className="border border-slate-300 bg-white text-slate-700 rounded-xl px-5 py-2.5 text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5"
                >
                  <span>View Staff Directory</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          ) : (
            /* Creation Form */
            <div className="rounded-xl border border-slate-200 bg-white p-8 shadow-sm">
              <div className="border-b border-slate-100 pb-5 mb-6">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-amber-500" strokeWidth={1.75} />
                  <h2 className="font-serif text-lg font-semibold text-slate-900">
                    Staff Onboarding & ID Generation
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enter staff details to generate a permanent Staff ID, Username, and School Email.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="rounded-lg bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700">
                    {error}
                  </div>
                )}

                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    1. Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        First Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="e.g. Ravindra"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Last Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="e.g. Kumar"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Professional Assignment */}
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    2. Role & Department Assignment
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Designation *
                      </label>
                      <select
                        value={designation}
                        onChange={(e) => setDesignation(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="Senior Teacher">Senior Teacher</option>
                        <option value="Assistant Teacher">Assistant Teacher</option>
                        <option value="Head of Department">Head of Department</option>
                        <option value="Vice Principal">Vice Principal</option>
                        <option value="Principal">Principal</option>
                        <option value="Administrative Staff">Administrative Staff</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Department *
                      </label>
                      <select
                        value={department}
                        onChange={(e) => setDepartment(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      >
                        <option value="English">English</option>
                        <option value="Hindi">Hindi</option>
                        <option value="Mathematics">Mathematics</option>
                        <option value="Environmental Studies (EVS)">Environmental Studies (EVS)</option>
                        <option value="Science">Science</option>
                        <option value="Social Science (SST)">Social Science (SST)</option>
                        <option value="Physics">Physics</option>
                        <option value="Chemistry">Chemistry</option>
                        <option value="Biology">Biology</option>
                        <option value="Sanskrit">Sanskrit</option>
                        <option value="Computer">Computer</option>
                        <option value="Computer Science">Computer Science</option>
                        <option value="Information Technology (IT)">Information Technology (IT)</option>
                        <option value="General Knowledge (GK)">General Knowledge (GK)</option>
                        <option value="Art & Craft">Art & Craft</option>
                        <option value="Music">Music</option>
                        <option value="Physical Education">Physical Education</option>
                        <option value="Accountancy">Accountancy</option>
                        <option value="Business Studies">Business Studies</option>
                        <option value="Economics">Economics</option>
                        <option value="History">History</option>
                        <option value="Geography">Geography</option>
                        <option value="Political Science">Political Science</option>
                        <option value="Sociology">Sociology</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Joining Date *
                      </label>
                      <input
                        type="date"
                        required
                        value={joiningDate}
                        onChange={(e) => setJoiningDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Optional Extended Details */}
                <div className="space-y-4 border-t border-slate-100 pt-5">
                  <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                    3. Optional Extended Details
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Subjects Taught (Comma Separated)
                      </label>
                      <input
                        type="text"
                        value={subjectsTaught}
                        onChange={(e) => setSubjectsTaught(e.target.value)}
                        placeholder="e.g. Physics, Chemistry, Science Lab"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Class Teacher Allocation
                      </label>
                      <input
                        type="text"
                        value={classTeacherOf}
                        onChange={(e) => setClassTeacherOf(e.target.value)}
                        placeholder="e.g. Grade 10-A"
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Form Actions */}
                <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-100">
                  <Link
                    href="/admin/staff"
                    className="border border-slate-300 text-slate-600 rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </Link>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-amber-600 text-white rounded-lg px-6 py-2 text-xs font-medium hover:bg-amber-700 disabled:opacity-50 transition-colors flex items-center gap-2 shadow-sm"
                  >
                    {submitting ? 'Onboarding...' : 'Complete Staff Onboarding'}
                    <CheckCircle2 className="h-4 w-4" />
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
