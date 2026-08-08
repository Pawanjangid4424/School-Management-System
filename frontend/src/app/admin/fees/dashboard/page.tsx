'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  IndianRupee,
  TrendingUp,
  AlertTriangle,
  FileText,
  Plus,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  PieChart,
  Receipt,
  Download,
  Users,
  Search,
  Filter,
  RefreshCw
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';

export default function AdminFeesDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<any>(null);
  const [recentPayments, setRecentPayments] = useState<any[]>([]);

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
      fetchSummary(token);
      fetchRecentPayments(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchSummary = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/fees/dashboard-summary`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setSummary(data);
      }
    } catch (e) {
      console.error('Failed to fetch fees summary', e);
    }
  };

  const fetchRecentPayments = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/fees/payments/recent`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRecentPayments(data);
      }
    } catch (e) {
      // Fallback empty
      setRecentPayments([]);
    }
  };

  const formatCurrency = (amount: number | undefined) => {
    if (amount === undefined || amount === null) return '₹0';
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white text-sm font-medium">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
          <span>Loading Financial & Fee Revenue Dashboard...</span>
        </div>
      </div>
    );
  }

  const totalCollected = summary?.totalCollected || 0;
  const totalOutstanding = summary?.totalOutstanding || 0;
  const collectionRate = summary?.collectionRate || 100;
  const overdueCount = summary?.overdueCount || 0;

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-slate-900 selection:text-white">
      <Toaster position="top-center" />
      {/* Sidebar */}
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar */}
        <Topbar
          title="Financial & Fee Management Overview"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="h-4 w-4" />
                <span>Financial Command Center</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                School Revenue & Fee Collection Overview
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Track real-time fee collections, outstanding dues, fee head structures, and manage student invoices.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Link
                href="/admin/fees/structure"
                className="bg-slate-800/80 hover:bg-slate-800 text-white border border-slate-700 font-semibold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center gap-2 shadow-sm"
              >
                <span>Configure Fee Structures</span>
              </Link>
              <Link
                href="/admin/fees/invoices"
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl px-4.5 py-2.5 text-xs transition-all flex items-center gap-2 shadow-lg hover:shadow-amber-500/25 shrink-0"
              >
                <FileText className="h-4 w-4" />
                <span>Manage Invoices</span>
              </Link>
            </div>
          </div>

          {/* 📊 4 KPI Stat Header Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Total Realized Collections */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Realized Revenue</span>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalCollected)}</p>
                <span className="text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-emerald-600" />
                  Realized Collections
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                <IndianRupee className="h-6 w-6" />
              </div>
            </div>

            {/* Outstanding Balance */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Outstanding Dues</span>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalOutstanding)}</p>
                <span className="text-[11px] text-amber-700 font-semibold flex items-center gap-1">
                  <Clock className="h-3 w-3 text-amber-600" />
                  Receivables Pending
                </span>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
                <Clock className="h-6 w-6" />
              </div>
            </div>

            {/* Collection Efficiency Rate */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1 min-w-0">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Collection Efficiency</span>
                <p className="text-2xl font-bold text-indigo-600">{collectionRate}%</p>
                <div className="w-28 bg-slate-100 rounded-full h-2 overflow-hidden mt-1">
                  <div className="bg-indigo-600 h-full rounded-full" style={{ width: `${Math.min(collectionRate, 100)}%` }} />
                </div>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
                <ShieldCheck className="h-6 w-6" />
              </div>
            </div>

            {/* Overdue Defaulters */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Overdue Defaulters</span>
                <p className="text-2xl font-bold text-rose-600">{overdueCount} Invoices</p>
                <Link href="/admin/fees/defaulters" className="text-[11px] text-rose-600 font-bold hover:underline block">
                  View Defaulters Roster &rarr;
                </Link>
              </div>
              <div className="h-12 w-12 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>

          </div>

          {/* Payment Method Breakdown & Fee Head Distribution */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2 text-indigo-600">
                  <CreditCard className="h-5 w-5" />
                  <h3 className="text-sm font-bold text-slate-900">Payment Channel Breakdown</h3>
                </div>
                <span className="text-[11px] font-semibold text-slate-400">All Time</span>
              </div>

              <div className="space-y-3">
                {summary?.channelBreakdown?.totalPaymentsCount === 0 ? (
                  <div className="py-6 text-center text-slate-400 text-xs font-medium space-y-1">
                    <p className="font-bold text-slate-600">No Payment Records Yet</p>
                    <p className="text-[11px] text-slate-400">Recorded student payments will automatically populate method percentages.</p>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>UPI / Online Banking</span>
                        <span className="text-emerald-600">{summary?.channelBreakdown?.upiPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${summary?.channelBreakdown?.upiPercent || 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Bank Transfer (NEFT / RTGS)</span>
                        <span className="text-indigo-600">{summary?.channelBreakdown?.bankPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full rounded-full transition-all duration-500" style={{ width: `${summary?.channelBreakdown?.bankPercent || 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Cash Counter Collections</span>
                        <span className="text-blue-600">{summary?.channelBreakdown?.cashPercent || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full transition-all duration-500" style={{ width: `${summary?.channelBreakdown?.cashPercent || 0}%` }} />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700">
                        <span>Cheque / Demand Draft</span>
                        <span className="text-amber-600">{summary?.channelBreakdown?.chequePercent || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                        <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${summary?.channelBreakdown?.chequePercent || 0}%` }} />
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Quick Actions & Navigation Cards */}
            <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Card 1: Fee Structure Config */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 font-bold flex items-center justify-center">
                    <Receipt className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Fee Heads & Academic Structures</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Set up monthly tuition, transport, registration, and activity fee structures per grade.
                  </p>
                </div>

                <Link
                  href="/admin/fees/structure"
                  className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl py-2.5 px-4 text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Manage Structures</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              {/* Card 2: Fee Defaulters Oversight */}
              <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-5 flex flex-col justify-between space-y-4 hover:border-slate-300 transition-all">
                <div className="space-y-2">
                  <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 text-rose-600 font-bold flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <h4 className="font-bold text-slate-900 text-base">Fee Defaulters Oversight</h4>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Track students with overdue fee invoices, generate warning slips, and send SMS reminders.
                  </p>
                </div>

                <Link
                  href="/admin/fees/defaulters"
                  className="w-full bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl py-2.5 px-4 text-xs transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Fee Defaulters Page</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

            </div>

          </div>

          {/* Recent Student Fee Invoices & Payment Ledger */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Student Fee Invoices & Payment Receipts</h3>
                <p className="text-xs text-slate-500">Overview of recent student payments and active invoice statuses.</p>
              </div>

              <Link
                href="/admin/fees/invoices"
                className="bg-slate-900 text-white font-bold rounded-xl px-4 py-2 text-xs hover:bg-slate-800 transition-all inline-flex items-center gap-1.5 shrink-0"
              >
                <span>View Full Invoice Directory</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                    <th className="px-6 py-4">Receipt / Invoice ID</th>
                    <th className="px-6 py-4">Student Name</th>
                    <th className="px-6 py-4">Payment Method</th>
                    <th className="px-6 py-4">Amount Paid</th>
                    <th className="px-6 py-4">Payment Date</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentPayments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <Receipt className="h-8 w-8 text-slate-300" />
                          <p className="font-bold text-slate-700 text-sm">No recent fee payments recorded</p>
                          <p className="text-xs text-slate-400">Recorded payments and receipts will display here automatically.</p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    recentPayments.map((pmt) => (
                      <tr key={pmt.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">
                          <CodeBadge code={pmt.receipt_number || pmt.id.slice(0, 8)} />
                        </td>
                        <td className="px-6 py-4 font-bold text-slate-800">
                          {pmt.student_name || 'Student Record'}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-md border border-slate-200">
                            {pmt.payment_method || 'UPI / ONLINE'}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-bold text-emerald-600 text-sm">
                          {formatCurrency(pmt.amount_paid)}
                        </td>
                        <td className="px-6 py-4 text-slate-600 font-medium">
                          {new Date(pmt.payment_date || Date.now()).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                            PAID
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <Link
                            href={`/admin/fees/invoices`}
                            className="p-2 rounded-xl text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 font-bold transition-all text-xs inline-flex items-center gap-1"
                          >
                            <Download className="h-3.5 w-3.5" />
                            <span>Receipt</span>
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </main>
      </div>
    </div>
  );
}
