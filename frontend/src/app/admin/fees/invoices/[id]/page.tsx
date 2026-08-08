'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { DollarSign, Receipt, CheckCircle2, Clock, Plus } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AdminSingleInvoicePage() {
  const router = useRouter();
  const params = useParams();
  const invoiceId = params?.id as string;

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [invoice, setInvoice] = useState<any>(null);

  // Record Payment Modal State
  const [showPayModal, setShowPayModal] = useState(false);
  const [payAmount, setPayAmount] = useState<number>(0);
  const [payMethod, setPayMethod] = useState<string>('UPI');
  const [payNotes, setPayNotes] = useState<string>('');

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
      if (invoiceId) fetchInvoice(token, invoiceId);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router, invoiceId]);

  const fetchInvoice = async (token: string, id: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/fees/invoices/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setInvoice(data);
        setPayAmount(data.amount_due - data.amount_paid);
      }
    } catch (e) {
      console.error('Failed to fetch invoice detail', e);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/fees/invoices/${invoiceId}/record-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          amountPaid: Number(payAmount),
          paymentMethod: payMethod,
          notes: payNotes,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Payment recording failed');

      setSuccessMsg(`Payment of $${payAmount} recorded! Receipt: ${data.payment.receipt_number}`);
      setShowPayModal(false);
      setPayNotes('');
      fetchInvoice(token || '', invoiceId);
    } catch (err: any) {
      setError(err.message || 'Failed to record payment');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Invoice Audit Trail...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Invoice not found.
      </div>
    );
  }

  const balanceOutstanding = invoice.amount_due - invoice.amount_paid;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Student Fee Invoice Audit Trail"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-5xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Invoice Details & Audit Log
              </h2>
              <p className="text-xs text-slate-500">
                Audit trail of partial payments and status transitions.
              </p>
            </div>

            {invoice.status !== 'PAID' && (
              <button
                onClick={() => setShowPayModal(true)}
                className="bg-emerald-600 text-white rounded-lg px-4 py-2 text-xs font-semibold hover:bg-emerald-500 transition-colors flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="h-4 w-4" />
                <span>+ Record Payment</span>
              </button>
            )}
          </div>

          {successMsg && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Invoice Summary Box */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <span className="text-[10px] text-slate-400 font-mono block">INVOICE ID</span>
                <span className="font-mono text-sm font-bold text-slate-900">{invoice.id}</span>
              </div>
              <StatusPill
                status={invoice.status === 'PAID' ? 'active' : invoice.status === 'OVERDUE' ? 'error' : 'pending'}
                label={invoice.status}
              />
            </div>

            <div className="grid grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block mb-0.5">Student</span>
                <span className="font-semibold text-slate-900 block">
                  {invoice.student_profile?.first_name} {invoice.student_profile?.last_name}
                </span>
                <CodeBadge code={invoice.student_profile?.current_student_code || ''} />
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Fee Category</span>
                <span className="font-semibold text-amber-600 block">
                  {invoice.fee_structure?.fee_head?.name}
                </span>
                <span className="text-slate-500 text-[11px] font-mono">
                  Grade {invoice.student_profile?.current_class}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block mb-0.5">Due Date</span>
                <span className="font-mono font-semibold text-slate-900 block">
                  {new Date(invoice.due_date).toISOString().split('T')[0]}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 p-4 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
              <div>
                <span className="text-slate-500 block">Total Amount Due</span>
                <span className="font-serif text-lg font-bold text-slate-900">
                  ${invoice.amount_due.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Total Amount Paid</span>
                <span className="font-serif text-lg font-bold text-emerald-600">
                  ${invoice.amount_paid.toFixed(2)}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block">Balance Outstanding</span>
                <span className="font-serif text-lg font-bold text-rose-600">
                  ${balanceOutstanding.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          {/* Payment Audit Trail Roster */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h3 className="font-serif text-base font-semibold text-slate-900">
                Payment History Audit Trail ({invoice.payments?.length || 0})
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Immutable Ledger
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Receipt #</th>
                    <th className="px-6 py-3">Payment Date</th>
                    <th className="px-6 py-3">Amount Paid</th>
                    <th className="px-6 py-3">Payment Method</th>
                    <th className="px-6 py-3">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {invoice.payments?.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No payments recorded yet for this invoice.
                      </td>
                    </tr>
                  ) : (
                    invoice.payments?.map((p: any) => (
                      <tr key={p.id} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3.5 font-mono font-semibold text-slate-900">
                          {p.receipt_number}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">
                          {new Date(p.payment_date).toLocaleString()}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-emerald-700">
                          ${p.amount_paid.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-700">
                          {p.payment_method}
                        </td>
                        <td className="px-6 py-3.5 text-slate-500">
                          {p.notes || '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Record Payment Modal */}
          {showPayModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Record Fee Payment
                  </h3>
                  <button onClick={() => setShowPayModal(false)} className="text-slate-400 text-xs font-bold">✕</button>
                </div>
                <form onSubmit={handleRecordPayment} className="space-y-4 text-xs">
                  {error && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                      {error}
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Amount Paid ($) *</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={payAmount}
                      onChange={(e) => setPayAmount(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 font-bold text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Payment Method *</label>
                    <select
                      value={payMethod}
                      onChange={(e) => setPayMethod(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    >
                      <option value="UPI">UPI</option>
                      <option value="CASH">CASH</option>
                      <option value="BANK_TRANSFER">BANK_TRANSFER</option>
                      <option value="CHEQUE">CHEQUE</option>
                      <option value="OTHER">OTHER</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">Notes / Remarks</label>
                    <input
                      type="text"
                      value={payNotes}
                      onChange={(e) => setPayNotes(e.target.value)}
                      placeholder="Optional transaction reference..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                    <button type="button" onClick={() => setShowPayModal(false)} className="border border-slate-300 text-slate-600 rounded-lg px-3 py-2">Cancel</button>
                    <button type="submit" disabled={submitting} className="bg-emerald-600 text-white rounded-lg px-4 py-2 font-semibold">Record Payment</button>
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
