'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function AdminFeeDefaultersPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [defaulters, setDefaulters] = useState<any[]>([]);

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
      fetchDefaulters(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchDefaulters = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/fees/defaulters`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setDefaulters(data);
      }
    } catch (e) {
      console.error('Failed to fetch fee defaulters', e);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Fee Defaulters Roster...
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar role="ADMIN" tenantName={user?.tenant_name} />

      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        <Topbar
          title="Fee Defaulters & Overdue Receivables"
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
            <span className="text-slate-900 font-medium">Fee Defaulters Roster</span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                Fee Defaulters Roster
              </h2>
              <p className="text-xs text-slate-500">
                Students with unpaid or overdue fee invoices past their scheduled due dates.
              </p>
            </div>
          </div>

          {/* Defaulters Roster Table */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="border-b border-slate-100 px-6 py-4 flex justify-between items-center">
              <h3 className="font-serif text-base font-semibold text-slate-900">
                Overdue Student Invoices ({defaulters.length})
              </h3>
              <span className="text-xs text-rose-600 font-medium flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                Action Required
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Student Name</th>
                    <th className="px-6 py-3">Student Code</th>
                    <th className="px-6 py-3">Class</th>
                    <th className="px-6 py-3">Fee Head</th>
                    <th className="px-6 py-3">Due Date</th>
                    <th className="px-6 py-3">Amount Due</th>
                    <th className="px-6 py-3">Outstanding Balance</th>
                    <th className="px-6 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {defaulters.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="px-6 py-8 text-center text-emerald-600 text-xs font-medium">
                        No fee defaulters! All active invoices are up to date.
                      </td>
                    </tr>
                  ) : (
                    defaulters.map((d) => (
                      <tr key={d.invoiceId} className="hover:bg-slate-50/60">
                        <td className="px-6 py-3.5 font-semibold text-slate-900">
                          {d.studentName}
                        </td>
                        <td className="px-6 py-3.5">
                          <CodeBadge code={d.studentCode} />
                        </td>
                        <td className="px-6 py-3.5 font-mono text-slate-600">
                          {d.class}
                        </td>
                        <td className="px-6 py-3.5 text-amber-600 font-medium">
                          {d.feeHeadName}
                        </td>
                        <td className="px-6 py-3.5 font-mono text-rose-600 font-semibold">
                          {d.dueDate}
                        </td>
                        <td className="px-6 py-3.5 text-slate-700">
                          ${d.amountDue.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5 font-bold text-rose-600">
                          ${d.balanceOutstanding.toFixed(2)}
                        </td>
                        <td className="px-6 py-3.5">
                          <StatusPill status="error" label={d.status} />
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <Link
                            href={`/admin/fees/invoices/${d.invoiceId}`}
                            className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                          >
                            <span>Collect Fee</span>
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
        </main>
      </div>
    </div>
  );
}
