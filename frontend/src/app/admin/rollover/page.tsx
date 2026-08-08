'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RefreshCw,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Mail,
  ShieldCheck,
  GraduationCap,
  History,
  CheckSquare,
  Square,
  Repeat,
  Undo2,
  Filter,
  Check,
  X,
  UserCheck,
  Loader2,
  Users
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

export default function RolloverPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Rollover Form & Step State
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [targetYear, setTargetYear] = useState<number>(2027);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  const [promotionsState, setPromotionsState] = useState<any[]>([]);

  // Class & Section Filter
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');

  // Confirmation Alert Modal State
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<any>(null);

  // Undo Rollover State
  const [showUndoModal, setShowUndoModal] = useState(false);
  const [undoing, setUndoing] = useState(false);
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

  const handleGeneratePreview = async () => {
    setPreviewLoading(true);
    setError('');
    setExecutionResult(null);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/rollover/preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentYear, targetYear }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate rollover preview');

      setPreviewData(data);
      setPromotionsState(data.promotions || []);
      toast.success(`Generated preview for ${data.promotions?.length || 0} eligible students!`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while generating preview.');
      toast.error(err.message || 'Failed to generate preview');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleActionChange = (index: number, newAction: string) => {
    const updated = [...promotionsState];
    updated[index].action = newAction;
    setPromotionsState(updated);
  };

  const handleStreamChange = (index: number, newStream: string) => {
    const updated = [...promotionsState];
    updated[index].targetStream = newStream;
    setPromotionsState(updated);
  };

  // Get distinct classes from preview list
  const availableClasses = Array.from(
    new Set(promotionsState.map((p) => p.currentClass))
  ).sort();

  // Filtered promotions list based on selected class tab
  const filteredPromotions = promotionsState.filter((p) => {
    if (selectedClassFilter === 'ALL') return true;
    return p.currentClass === selectedClassFilter;
  });

  // Check if all filtered students are selected (action !== 'EXCLUDE')
  const isAllSelected =
    filteredPromotions.length > 0 &&
    filteredPromotions.every((p) => p.action !== 'EXCLUDE');

  const handleToggleSelectAll = () => {
    const targetAction = isAllSelected ? 'EXCLUDE' : 'PROMOTE';
    const updated = promotionsState.map((p) => {
      if (selectedClassFilter === 'ALL' || p.currentClass === selectedClassFilter) {
        return { ...p, action: targetAction };
      }
      return p;
    });
    setPromotionsState(updated);
    toast.info(isAllSelected ? 'Deselected all students in filter view' : 'Selected all students for promotion');
  };

  const handleToggleStudentSelection = (idxInFiltered: number) => {
    const targetItem = filteredPromotions[idxInFiltered];
    const realIndex = promotionsState.findIndex(
      (p) => p.studentProfileId === targetItem.studentProfileId
    );
    if (realIndex !== -1) {
      const currentAction = promotionsState[realIndex].action;
      const newAction = currentAction === 'EXCLUDE' ? 'PROMOTE' : 'EXCLUDE';
      handleActionChange(realIndex, newAction);
    }
  };

  const handleConfirmExecuteModalOpen = () => {
    const activePromotionsCount = promotionsState.filter((p) => p.action !== 'EXCLUDE').length;
    if (activePromotionsCount === 0) {
      toast.error('Please select at least one student for rollover promotion');
      return;
    }
    setShowConfirmModal(true);
  };

  const handleExecuteRollover = async () => {
    if (!promotionsState || promotionsState.length === 0) return;
    setExecuting(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/rollover/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentYear,
          targetYear,
          promotions: promotionsState.map((p: any) => ({
            studentProfileId: p.studentProfileId,
            action: p.action,
            targetClass: p.targetClassNum,
            targetSection: p.targetSection,
            targetStream: p.targetStream,
            targetRollNo: p.targetRollNo,
            targetYear,
          })),
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to execute rollover');

      setExecutionResult(data);
      setShowConfirmModal(false);
      toast.success(`Academic Year Rollover Executed! Promoted ${data.processedCount} students.`);
    } catch (err: any) {
      setError(err.message || 'An error occurred while executing bulk rollover.');
      toast.error(err.message || 'Rollover execution failed');
    } finally {
      setExecuting(false);
    }
  };

  const handleUndoRollover = async () => {
    setUndoing(true);
    setError('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/rollover/undo`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to undo rollover');

      setShowUndoModal(false);
      setExecutionResult(null);
      setPromotionsState([]);
      setPreviewData(null);
      toast.success(data.message || 'Rollover successfully undone! Students reverted to previous grades & emails.');
    } catch (err: any) {
      setError(err.message || 'An error occurred while undoing rollover.');
      toast.error(err.message || 'Failed to undo rollover');
    } finally {
      setUndoing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white text-sm font-medium">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-amber-400" />
          <span>Loading Academic Year Rollover Engine...</span>
        </div>
      </div>
    );
  }

  const activeCount = promotionsState.filter((p) => p.action !== 'EXCLUDE').length;

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-slate-900 selection:text-white">
      <Toaster position="top-center" />
      {/* Sidebar */}
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar */}
        <Topbar
          title="Academic Year Rollover Engine"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <StatusPill status="warning" label="Annual Promotion Engine" />
                <span className="text-xs text-amber-400 font-mono font-semibold">
                  Atomic Batch Rollback Safety Enabled
                </span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Bulk Student Promotion & Code Regeneration
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Promote students across classes, handle Grade 10 &rarr; 11 stream allocations, Class 12 graduation, and manage selective promotions.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Undo / Revert Rollover Button */}
              <button
                onClick={() => setShowUndoModal(true)}
                className="bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center gap-2 shadow-sm"
              >
                <Undo2 className="h-4 w-4 text-rose-400" />
                <span>Undo Last Rollover</span>
              </button>

              <div className="flex items-center gap-2 bg-slate-800/80 border border-slate-700 rounded-xl px-3.5 py-2 text-xs">
                <RefreshCw className="h-4 w-4 text-amber-400 shrink-0" />
                <div>
                  <span className="block font-bold text-white text-[11px]">Academic Rollover</span>
                  <span className="text-slate-300 font-mono text-[10px]">{currentYear} &rarr; {targetYear}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Controls Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>1. Configure Rollover Parameters</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Current Academic Year
                </label>
                <input
                  type="number"
                  value={currentYear}
                  onChange={(e) => setCurrentYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 font-semibold focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Promotion Year
                </label>
                <input
                  type="number"
                  value={targetYear}
                  onChange={(e) => setTargetYear(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-slate-900 font-semibold focus:border-slate-900 focus:outline-hidden"
                />
              </div>

              <div className="flex items-end">
                <button
                  type="button"
                  onClick={handleGeneratePreview}
                  disabled={previewLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl px-4 py-2.5 text-xs transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                >
                  {previewLoading ? (
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-amber-400" />
                      Calculating Promotions...
                    </span>
                  ) : (
                    <>
                      <span>Generate Promotion Preview</span>
                      <Sparkles className="h-4 w-4 text-amber-400" />
                    </>
                  )}
                </button>
              </div>
            </div>

            {error && (
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3 text-xs text-rose-700 font-medium">
                {error}
              </div>
            )}
          </div>

          {/* Execution Result Banner */}
          {executionResult && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/90 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                <div>
                  <h3 className="text-base font-bold text-emerald-900">
                    Atomic Rollover Execution Successful!
                  </h3>
                  <p className="text-xs text-emerald-700">
                    Processed {executionResult.processedCount} student promotions atomically for Academic Year {targetYear}. Codes regenerated and 6-month mailbox forwarding jobs queued.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  href="/admin/students"
                  className="bg-emerald-700 text-white font-bold rounded-xl px-4 py-2 text-xs hover:bg-emerald-800 transition-all inline-flex items-center gap-1.5"
                >
                  <span>View Updated Students Directory</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          )}

          {/* Preview Results Table with Class Filter & Select All */}
          {promotionsState.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden space-y-4">
              
              {/* Table Header & Action Row */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 px-6 py-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                    <span>2. Promotion Checklist & Selective Promotion Diffs</span>
                    <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200/60">
                      {activeCount} Selected for Promotion
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Filter by class section, check/uncheck students, select streams for Grade 11/12, or mark repeaters.
                  </p>
                </div>

                {!executionResult && (
                  <button
                    type="button"
                    onClick={handleConfirmExecuteModalOpen}
                    disabled={executing || activeCount === 0}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl px-5 py-2.5 text-xs transition-all flex items-center gap-2 shadow-lg hover:shadow-amber-500/25 shrink-0 disabled:opacity-50"
                  >
                    <span>Execute Atomic Rollover ({activeCount})</span>
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>

              {/* Class & Section Filter Tabs + Select All Control Row */}
              <div className="px-6 pb-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50 py-3 border-b border-slate-100">
                {/* Filter Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1">
                  <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
                    <Filter className="h-3.5 w-3.5 text-slate-400" />
                    <span>Filter:</span>
                  </span>
                  <button
                    onClick={() => setSelectedClassFilter('ALL')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      selectedClassFilter === 'ALL'
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    All Classes ({promotionsState.length})
                  </button>
                  {availableClasses.map((cls) => (
                    <button
                      key={cls}
                      onClick={() => setSelectedClassFilter(cls)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        selectedClassFilter === cls
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
                      }`}
                    >
                      {cls} ({promotionsState.filter((p) => p.currentClass === cls).length})
                    </button>
                  ))}
                </div>

                {/* Select All / Deselect All Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleSelectAll}
                  className="bg-white hover:bg-slate-100 text-slate-800 font-bold border border-slate-200 rounded-xl px-3.5 py-1.5 text-xs transition-all flex items-center gap-1.5 shrink-0"
                >
                  {isAllSelected ? (
                    <>
                      <CheckSquare className="h-4 w-4 text-emerald-600" />
                      <span>Deselect All ({filteredPromotions.length})</span>
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 text-slate-400" />
                      <span>Select All ({filteredPromotions.length})</span>
                    </>
                  )}
                </button>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="px-6 py-3.5 w-10">
                        <button
                          type="button"
                          onClick={handleToggleSelectAll}
                          className="hover:opacity-80"
                        >
                          {isAllSelected ? (
                            <CheckSquare className="h-4 w-4 text-emerald-600" />
                          ) : (
                            <Square className="h-4 w-4 text-slate-400" />
                          )}
                        </button>
                      </th>
                      <th className="px-6 py-3.5">Action Choice</th>
                      <th className="px-6 py-3.5">Student Name</th>
                      <th className="px-6 py-3.5">Current Class</th>
                      <th className="px-6 py-3.5">Current Code</th>
                      <th className="px-6 py-3.5">Target Class</th>
                      <th className="px-6 py-3.5">Stream (Grade 11/12)</th>
                      <th className="px-6 py-3.5">Regenerated Code ({targetYear})</th>
                      <th className="px-6 py-3.5">New System Email</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPromotions.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="px-6 py-8 text-center text-slate-400">
                          No students found for class filter "{selectedClassFilter}".
                        </td>
                      </tr>
                    ) : (
                      filteredPromotions.map((item: any, idx: number) => (
                        <tr
                          key={item.studentProfileId}
                          className={`transition-colors ${
                            item.action === 'EXCLUDE' ? 'bg-slate-100/50 opacity-60' : 'hover:bg-slate-50/80'
                          }`}
                        >
                          {/* Checkbox Column */}
                          <td className="px-6 py-3.5">
                            <button
                              type="button"
                              onClick={() => handleToggleStudentSelection(idx)}
                              className="p-1 rounded-md hover:bg-slate-200/60 transition-all"
                            >
                              {item.action !== 'EXCLUDE' ? (
                                <CheckSquare className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Square className="h-4 w-4 text-slate-300" />
                              )}
                            </button>
                          </td>

                          {/* Action Selector */}
                          <td className="px-6 py-3.5">
                            <select
                              value={item.action}
                              onChange={(e) => {
                                const realIdx = promotionsState.findIndex(
                                  (p) => p.studentProfileId === item.studentProfileId
                                );
                                handleActionChange(realIdx, e.target.value);
                              }}
                              className="rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-900 font-bold focus:border-amber-500 focus:outline-hidden"
                            >
                              <option value="PROMOTE">Promote</option>
                              <option value="REPEAT">Repeat Grade</option>
                              <option value="GRADUATE">Graduate</option>
                              <option value="EXCLUDE">Exclude</option>
                            </select>
                          </td>

                          {/* Student Name */}
                          <td className="px-6 py-3.5 font-bold text-slate-900">
                            {item.name}
                          </td>

                          {/* Current Class */}
                          <td className="px-6 py-3.5 text-slate-700 font-medium">
                            {item.currentClass}
                          </td>

                          {/* Current Code */}
                          <td className="px-6 py-3.5">
                            <CodeBadge code={item.currentCode} />
                          </td>

                          {/* Target Class */}
                          <td className="px-6 py-3.5 font-bold text-slate-900">
                            {item.action === 'REPEAT' ? item.currentClass : item.targetClass}
                          </td>

                          {/* Stream Selection */}
                          <td className="px-6 py-3.5">
                            {item.targetClassNum >= 11 ? (
                              <select
                                value={item.targetStream || 'SCIENCE'}
                                onChange={(e) => {
                                  const realIdx = promotionsState.findIndex(
                                    (p) => p.studentProfileId === item.studentProfileId
                                  );
                                  handleStreamChange(realIdx, e.target.value);
                                }}
                                className="rounded-lg border border-amber-300 bg-amber-50/60 px-2.5 py-1 text-xs text-amber-900 font-bold focus:border-amber-500 focus:outline-hidden"
                              >
                                <option value="SCIENCE">Science (S)</option>
                                <option value="COMMERCE">Commerce (C)</option>
                                <option value="ARTS">Arts (A)</option>
                              </select>
                            ) : (
                              <span className="text-slate-400 italic">General</span>
                            )}
                          </td>

                          {/* New Code */}
                          <td className="px-6 py-3.5">
                            <CodeBadge
                              code={item.action === 'EXCLUDE' ? 'EXCLUDED' : item.newCode}
                              className="bg-amber-50 border-amber-200 text-amber-800 font-bold"
                            />
                          </td>

                          {/* New Email */}
                          <td className="px-6 py-3.5 font-mono text-[11px] text-slate-700">
                            {item.newEmail}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ⚠️ CONFIRM EXECUTE ROLLOVER WARNING MODAL */}
          <AnimatePresence>
            {showConfirmModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-amber-600">
                    <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0">
                      <AlertTriangle className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Execute Academic Rollover?</h3>
                      <p className="text-xs text-slate-500">Atomic Promotion Batch Warning</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/50 p-3 rounded-xl border border-amber-100">
                    You are about to execute Academic Year Rollover for <strong className="text-slate-900">{activeCount} selected students</strong> from Academic Year <strong className="text-slate-900">{currentYear} &rarr; {targetYear}</strong>. Official student codes will be updated and email forwarding jobs will be queued.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      disabled={executing}
                      onClick={() => setShowConfirmModal(false)}
                      className="border border-slate-300 bg-white text-slate-700 font-bold rounded-xl px-4 py-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={executing}
                      onClick={handleExecuteRollover}
                      className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                    >
                      {executing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Executing Rollover...</span>
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          <span>Proceed & Execute ({activeCount})</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

          {/* 🔄 CONFIRM UNDO ROLLOVER MODAL */}
          <AnimatePresence>
            {showUndoModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4"
                >
                  <div className="flex items-center gap-3 text-rose-600">
                    <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                      <Undo2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base">Undo / Revert Rollover?</h3>
                      <p className="text-xs text-slate-500">Restore Previous Student Grades & Emails</p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-rose-50/50 p-3 rounded-xl border border-rose-100">
                    This will revert student profiles and email accounts back to their previous academic grade and student code before the last rollover was executed.
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      disabled={undoing}
                      onClick={() => setShowUndoModal(false)}
                      className="border border-slate-300 bg-white text-slate-700 font-bold rounded-xl px-4 py-2 text-xs hover:bg-slate-50 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={undoing}
                      onClick={handleUndoRollover}
                      className="bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl px-4 py-2 text-xs transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-md"
                    >
                      {undoing ? (
                        <>
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          <span>Reverting...</span>
                        </>
                      ) : (
                        <>
                          <Undo2 className="h-3.5 w-3.5" />
                          <span>Confirm Undo Rollover</span>
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>

        </main>
      </div>
    </div>
  );
}
