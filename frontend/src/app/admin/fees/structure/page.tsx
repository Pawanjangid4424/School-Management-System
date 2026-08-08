'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Plus, CheckCircle2, DollarSign, ArrowLeft } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function AdminFeeStructurePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [feeHeads, setFeeHeads] = useState<any[]>([]);
  const [feeStructures, setFeeStructures] = useState<any[]>([]);

  // Fee Head Modal State
  const [showHeadModal, setShowHeadModal] = useState(false);
  const [headName, setHeadName] = useState('');
  const [headDescription, setHeadDescription] = useState('');

  // Fee Structure Modal State
  const [showStructModal, setShowStructModal] = useState(false);
  const [classNum, setClassNum] = useState<number>(10);
  const [academicYear, setAcademicYear] = useState<number>(2026);
  const [selectedHeadId, setSelectedHeadId] = useState<string>('');
  const [amount, setAmount] = useState<number>(500);
  const [frequency, setFrequency] = useState<string>('MONTHLY');

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [error, setError] = useState('');

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
      fetchMetadata(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchMetadata = async (token: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const [hRes, sRes] = await Promise.all([
        fetch(`${apiUrl}/fees/heads`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/fees/structure`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (hRes.ok) {
        const heads = await hRes.json();
        setFeeHeads(heads);
        if (heads.length > 0) setSelectedHeadId(heads[0].id);
      }
      if (sRes.ok) setFeeStructures(await sRes.json());
    } catch (e) {
      console.error('Failed to fetch fee metadata', e);
    }
  };

  const handleCreateHead = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/fees/heads`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: headName, description: headDescription }),
      });

      if (res.ok) {
        setSuccessMsg(`Fee Head "${headName}" created!`);
        setShowHeadModal(false);
        setHeadName('');
        setHeadDescription('');
        fetchMetadata(token || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create fee head');
    } fontFinally: {
      setSubmitting(false);
    }
  };

  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/fees/structure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classNumber: Number(classNum),
          academicYear: Number(academicYear),
          feeHeadId: selectedHeadId,
          amount: Number(amount),
          frequency,
        }),
      });

      if (res.ok) {
        setSuccessMsg(`Fee Structure set for Grade ${classNum}!`);
        setShowStructModal(false);
        fetchMetadata(token || '');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create fee structure');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Fee Structures...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Fee Heads & Class Fee Structures"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Breadcrumb Navigation with Back Arrow */}
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Link
              href="/admin/fees/dashboard"
              className="flex items-center gap-1 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Fee Management</span>
            </Link>
            <span>/</span>
            <span className="text-slate-900 font-medium">Configure Fee Structures</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                School Fee Policy Configuration
              </h2>
              <p className="text-xs text-slate-500">
                Define fee categories (Tuition, Transport, Lab) and set per-class annual fee schedules.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHeadModal(true)}
                className="border border-slate-300 bg-white text-slate-700 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50 transition-colors flex items-center gap-1"
              >
                <Plus className="h-4 w-4" />
                <span>+ Add Fee Head</span>
              </button>
              <button
                onClick={() => setShowStructModal(true)}
                className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>+ Set Class Fee Structure</span>
              </button>
            </div>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Fee Structures Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-serif text-base font-semibold text-slate-900">
                Class Fee Schedules ({feeStructures.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Class Grade</th>
                    <th className="px-6 py-3">Academic Year</th>
                    <th className="px-6 py-3">Fee Head Category</th>
                    <th className="px-6 py-3">Fee Amount</th>
                    <th className="px-6 py-3">Billing Frequency</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {feeStructures.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No fee structures defined yet. Click "+ Set Class Fee Structure" to configure.
                      </td>
                    </tr>
                  ) : (
                    feeStructures.map((s) => (
                      <tr key={s.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3.5 font-semibold text-slate-900">
                          Grade {s.class_number}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-700">
                          {s.academic_year}
                        </td>
                        <td className="px-6 py-3.5 font-medium text-amber-600">
                          {s.fee_head?.name || 'General Fee'}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">
                          ${s.amount.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">
                          {s.frequency}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Add Fee Head Modal */}
          {showHeadModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Create Fee Head Category
                  </h3>
                  <button onClick={() => setShowHeadModal(false)} className="text-slate-400 text-xs font-bold">✕</button>
                </div>
                <form onSubmit={handleCreateHead} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Fee Head Name *</label>
                    <input
                      type="text"
                      required
                      value={headName}
                      onChange={(e) => setHeadName(e.target.value)}
                      placeholder="e.g. Tuition Fee, Transport Fee, Lab Fee"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Description</label>
                    <input
                      type="text"
                      value={headDescription}
                      onChange={(e) => setHeadDescription(e.target.value)}
                      placeholder="Optional details..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setShowHeadModal(false)} className="border border-slate-300 text-slate-600 rounded-lg px-3 py-2">Cancel</button>
                    <button type="submit" disabled={submitting} className="bg-slate-900 text-white rounded-lg px-4 py-2">Create Fee Head</button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Add Fee Structure Modal */}
          {showStructModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Configure Class Fee Structure
                  </h3>
                  <button onClick={() => setShowStructModal(false)} className="text-slate-400 text-xs font-bold">✕</button>
                </div>
                <form onSubmit={handleCreateStructure} className="space-y-4 text-xs">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Class Grade *</label>
                      <select value={classNum} onChange={(e) => setClassNum(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                          <option key={c} value={c}>Grade {c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Academic Year *</label>
                      <input type="number" value={academicYear} onChange={(e) => setAcademicYear(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Fee Head Category *</label>
                    <select
                      value={selectedHeadId}
                      onChange={(e) => setSelectedHeadId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none"
                    >
                      {feeHeads.length === 0 ? (
                        <option value="">Select Fee Head...</option>
                      ) : (
                        feeHeads.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} {h.description ? `(${h.description})` : ''}
                          </option>
                        ))
                      )}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Amount ($) *</label>
                      <input type="number" step="10" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Billing Frequency *</label>
                      <select value={frequency} onChange={(e) => setFrequency(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        <option value="MONTHLY">MONTHLY</option>
                        <option value="QUARTERLY">QUARTERLY</option>
                        <option value="ANNUAL">ANNUAL</option>
                        <option value="ONE_TIME">ONE_TIME</option>
                      </select>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setShowStructModal(false)} className="border border-slate-300 text-slate-600 rounded-lg px-3 py-2">Cancel</button>
                    <button type="submit" disabled={submitting} className="bg-slate-900 text-white rounded-lg px-4 py-2">Save Structure</button>
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
