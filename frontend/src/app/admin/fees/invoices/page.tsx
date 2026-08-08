'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FileText, Plus, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AdminInvoicesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const [invoices, setInvoices] = useState<any[]>([]);
  const [classFilter, setClassFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');

  // Bulk Generate Modal State
  const [showGenModal, setShowGenModal] = useState(false);
  const [genClassNum, setGenClassNum] = useState<number>(10);
  const [genYear, setGenYear] = useState<number>(2026);
  const [genDueDate, setGenDueDate] = useState<string>('2026-10-31');

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
      fetchInvoices(token, classFilter, statusFilter);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, classFilter, statusFilter]);

  const fetchInvoices = async (token: string, cFilter: string, sFilter: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      let url = `${apiUrl}/fees/invoices?`;
      if (cFilter) url += `classNumber=${cFilter}&`;
      if (sFilter) url += `status=${sFilter}&`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoices(data);
      }
    } catch (e) {
      console.error('Failed to fetch invoices', e);
    }
  };

  const handleGenerateInvoices = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/fees/generate-invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classNumber: Number(genClassNum),
          academicYear: Number(genYear),
          dueDate: genDueDate,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Invoice generation failed');

      setSuccessMsg(`Generated ${data.invoicesGenerated} invoices for ${data.studentsCount} students in Grade ${genClassNum}!`);
      setShowGenModal(false);
      fetchInvoices(token || '', classFilter, statusFilter);
    } catch (err: any) {
      setError(err.message || 'Error generating invoices');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Student Invoices...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Student Invoicing & Billing Roster"
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
            <span className="text-slate-900 font-medium">Manage Student Invoices</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Student Fee Invoices Roster
              </h2>
              <p className="text-xs text-slate-500">
                Generate term invoices and track payment balances.
              </p>
            </div>

            <button
              onClick={() => setShowGenModal(true)}
              className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" />
              <span>+ Bulk Generate Invoices</span>
            </button>
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Filters Row */}
          <div className="flex items-center gap-3 bg-white p-3 rounded-xl border border-slate-200 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Filter Class:</span>
              <select
                value={classFilter}
                onChange={(e) => setClassFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-900"
              >
                <option value="">All Classes</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                  <option key={c} value={c}>Grade {c}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded px-2 py-1 font-semibold text-slate-900"
              >
                <option value="">All Statuses</option>
                <option value="UNPAID">UNPAID</option>
                <option value="PARTIALLY_PAID">PARTIALLY_PAID</option>
                <option value="PAID">PAID</option>
                <option value="OVERDUE">OVERDUE</option>
              </select>
            </div>
          </div>

          {/* Invoice Roster Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4">
              <h3 className="font-serif text-base font-semibold text-slate-900">
                Invoices ({invoices.length})
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Student Code</th>
                    <th className="px-6 py-3">Fee Head</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Amount Due</th>
                    <th className="px-6 py-3">Amount Paid</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoices.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No student fee invoices generated matching filters.
                      </td>
                    </tr>
                  ) : (
                    invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {inv.student_profile ? `${inv.student_profile.first_name} ${inv.student_profile.last_name}` : 'Student'}
                        </td>
                        <td className="px-6 py-3.5">
                          <CodeBadge code={inv.student_profile?.current_student_code || '—'} />
                        </td>
                        <td className="px-6 py-3.5 text-amber-600 font-medium">
                          {inv.fee_structure?.fee_head?.name || 'General Fee'}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">
                          {new Date(inv.due_date).toISOString().split('T')[0]}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-slate-900">
                          ${inv.amount_due.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 font-semibold text-emerald-700">
                          ${inv.amount_paid.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill
                            status={inv.status === 'PAID' ? 'active' : inv.status === 'OVERDUE' ? 'error' : 'pending'}
                            label={inv.status}
                          />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            href={`/admin/fees/invoices/${inv.id}`}
                            className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Detail & Pay</span>
                            <ArrowRight className="h-3 w-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bulk Generate Invoices Modal */}
          {showGenModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Bulk Generate Class Fee Invoices
                  </h3>
                  <button onClick={() => setShowGenModal(false)} className="text-slate-400 text-xs font-bold">✕</button>
                </div>
                <form onSubmit={handleGenerateInvoices} className="space-y-4 text-xs">
                  {error && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                      {error}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Target Class *</label>
                      <select value={genClassNum} onChange={(e) => setGenClassNum(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                          <option key={c} value={c}>Grade {c}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">Academic Year *</label>
                      <input type="number" value={genYear} onChange={(e) => setGenYear(Number(e.target.value))} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Due Date *</label>
                    <input type="date" required value={genDueDate} onChange={(e) => setGenDueDate(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2" />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setShowGenModal(false)} className="border border-slate-300 text-slate-600 rounded-lg px-3 py-2">Cancel</button>
                    <button type="submit" disabled={submitting} className="bg-slate-900 text-white rounded-lg px-4 py-2">Generate Invoices</button>
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
