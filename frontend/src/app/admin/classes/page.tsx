'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Users,
  UserCheck,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  GraduationCap,
  CalendarDays,
  AlertTriangle,
  X,
  ArrowRightLeft,
  Search,
  Filter,
  LayoutGrid,
  List,
  UserPlus,
  Building2,
  Calendar,
  Clock,
  RefreshCw
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';

export default function ClassesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [classesList, setClassesList] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [selectedClass, setSelectedClass] = useState<any>(null);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Layout View Mode & Filters
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [selectedGradeCategory, setSelectedGradeCategory] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Daily Roster States
  const [rosterClass, setRosterClass] = useState<any>(null);
  const [rosterDate, setRosterDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [rosterSchedule, setRosterSchedule] = useState<any[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // Replace Teacher States
  const [replaceModal, setReplaceModal] = useState<{ period: number; originalTeacherId: string | null; subjectId: string | null } | null>(null);
  const [replaceTeacherId, setReplaceTeacherId] = useState('');
  const [replaceReason, setReplaceReason] = useState('');
  const [replaceError, setReplaceError] = useState('');

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
      fetchClassesAndStaff(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchClassesAndStaff = async (token: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const [classRes, staffRes] = await Promise.all([
        fetch(`${apiUrl}/classes`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/staff`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      if (classRes.ok) {
        const classData = await classRes.json();
        setClassesList(classData);
      }
      if (staffRes.ok) {
        const staffData = await staffRes.json();
        setStaffList(staffData);
      }
    } catch (e) {
      console.error('Failed to fetch classes or staff', e);
    }
  };

  const handleAssignTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClass || !selectedTeacherId) return;

    const teacher = staffList.find((s) => s.id === selectedTeacherId);
    if (!teacher) return;

    setAssignLoading(true);

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/classes/assign-teacher`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          className: selectedClass.className,
          section: selectedClass.section,
          teacherId: teacher.id,
          teacherName: teacher.name,
        }),
      });

      if (res.ok) {
        toast.success(`Assigned ${teacher.name} as Class Teacher for ${selectedClass.className}-${selectedClass.section}`);
        fetchClassesAndStaff(token || '');
        setSelectedClass(null);
        setSelectedTeacherId('');
      } else {
        const errData = await res.json().catch(() => ({}));
        toast.error(errData.message || 'Failed to assign class teacher');
      }
    } catch (err: any) {
      console.error('Error assigning class teacher', err);
      toast.error(err.message || 'An error occurred while assigning teacher');
    } finally {
      setAssignLoading(false);
    }
  };

  const fetchDailySchedule = async (cls: any, date: string) => {
    setLoadingSchedule(true);
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const classNum = parseInt(cls.className.replace('Grade ', ''), 10);

      const res = await fetch(`${apiUrl}/classes/daily-schedule`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classNumber: classNum,
          section: cls.section,
          date: date,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRosterSchedule(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingSchedule(false);
    }
  };

  const handleOpenRoster = (cls: any) => {
    setRosterClass(cls);
    fetchDailySchedule(cls, rosterDate);
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newDate = e.target.value;
    setRosterDate(newDate);
    if (rosterClass) {
      fetchDailySchedule(rosterClass, newDate);
    }
  };

  const handleReplaceTeacher = async (e: React.FormEvent) => {
    e.preventDefault();
    setReplaceError('');
    if (!rosterClass || !replaceModal || !replaceTeacherId || !replaceReason) return;

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const classNum = parseInt(rosterClass.className.replace('Grade ', ''), 10);

      const res = await fetch(`${apiUrl}/classes/daily-assignment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          classNumber: classNum,
          section: rosterClass.section,
          date: rosterDate,
          periodNumber: replaceModal.period,
          subjectId: replaceModal.subjectId,
          originalTeacherId: replaceModal.originalTeacherId,
          assignedTeacherId: replaceTeacherId,
          reason: replaceReason,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success(`Substituted teacher for Period ${replaceModal.period}`);
        setReplaceModal(null);
        setReplaceTeacherId('');
        setReplaceReason('');
        fetchDailySchedule(rosterClass, rosterDate);
      } else {
        setReplaceError(data.message || 'Failed to replace teacher');
        toast.error(data.message || 'Failed to replace teacher');
      }
    } catch (err) {
      setReplaceError('An error occurred while replacing teacher');
      toast.error('An error occurred while replacing teacher');
    }
  };

  // Helper for grade categories
  const getGradeNum = (clsName: string) => {
    const num = parseInt(clsName.replace('Grade ', ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const filteredClasses = classesList.filter((cls) => {
    const gradeNum = getGradeNum(cls.className);

    // Search filter
    const matchesSearch =
      cls.className.toLowerCase().includes(search.toLowerCase()) ||
      cls.section.toLowerCase().includes(search.toLowerCase()) ||
      (cls.stream && cls.stream.toLowerCase().includes(search.toLowerCase())) ||
      (cls.classTeacher && cls.classTeacher.toLowerCase().includes(search.toLowerCase()));

    // Grade & Assignment category filter
    let matchesCategory = true;
    if (selectedGradeCategory === 'UNASSIGNED') matchesCategory = !cls.classTeacher;
    if (selectedGradeCategory === 'ASSIGNED') matchesCategory = !!cls.classTeacher;
    if (selectedGradeCategory === 'PRIMARY') matchesCategory = gradeNum >= 1 && gradeNum <= 5;
    if (selectedGradeCategory === 'MIDDLE') matchesCategory = gradeNum >= 6 && gradeNum <= 8;
    if (selectedGradeCategory === 'SECONDARY') matchesCategory = gradeNum >= 9 && gradeNum <= 10;
    if (selectedGradeCategory === 'HIGHER') matchesCategory = gradeNum >= 11 && gradeNum <= 12;

    return matchesSearch && matchesCategory;
  });

  // KPI Statistics
  const totalSectionsCount = classesList.length;
  const assignedTeachersCount = classesList.filter((c) => c.classTeacher).length;
  const unassignedCount = totalSectionsCount - assignedTeachersCount;
  const totalStudentsCount = classesList.reduce((sum, c) => sum + (c.studentCount || 0), 0);

  const getStreamColor = (stream?: string) => {
    if (!stream) return 'bg-slate-100 text-slate-700 border-slate-200';
    const s = stream.toLowerCase();
    if (s.includes('science')) return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    if (s.includes('commerce')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (s.includes('arts')) return 'bg-amber-50 text-amber-700 border-amber-200';
    return 'bg-blue-50 text-blue-700 border-blue-200';
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-900 text-white text-sm font-medium">
        <div className="flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-spin text-amber-400" />
          <span>Loading Classes & Section Registry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50 selection:bg-slate-900 selection:text-white">
      <Toaster position="top-center" />
      {/* Sidebar */}
      <Sidebar role={user?.role} tenantName={user?.tenant_name} />

      {/* Main Content Area */}
      <div className="flex-1 pl-0 md:pl-64 transition-all duration-300 min-w-0">
        {/* Topbar */}
        <Topbar
          title="Classes & Streams Management"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-slate-800">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="h-4 w-4" />
                <span>Academic Structure</span>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Classes & Section Allocations
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
                Manage grades 1-12, section capacities, stream specializations, Class Teachers, and daily substitution rosters.
              </p>
            </div>
          </div>

          {/* 📊 4 KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sections</span>
                <p className="text-2xl font-bold text-slate-900">{totalSectionsCount} Sections</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                <BookOpen className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Enrolled</span>
                <p className="text-2xl font-bold text-blue-600">{totalStudentsCount} Students</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                <Users className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Teachers Assigned</span>
                <p className="text-2xl font-bold text-emerald-600">{assignedTeachersCount} Assigned</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
                <UserCheck className="h-6 w-6" />
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
              <div className="space-y-1">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Unassigned</span>
                <p className="text-2xl font-bold text-amber-600">{unassignedCount} Pending</p>
              </div>
              <div className="h-12 w-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
                <AlertTriangle className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Controls Bar: Grade Tabs, Search, View Mode Toggle */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-4 space-y-4">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              
              {/* Category Filter Tabs */}
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl w-full md:w-auto overflow-x-auto">
                {[
                  { key: 'ALL', label: 'All Sections (1-12)' },
                  { key: 'UNASSIGNED', label: `⚠️ Unassigned (${unassignedCount})` },
                  { key: 'ASSIGNED', label: `✅ Assigned (${assignedTeachersCount})` },
                  { key: 'PRIMARY', label: 'Primary (1-5)' },
                  { key: 'MIDDLE', label: 'Middle (6-8)' },
                  { key: 'SECONDARY', label: 'Secondary (9-10)' },
                  { key: 'HIGHER', label: 'Higher Sec (11-12)' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setSelectedGradeCategory(tab.key)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                      selectedGradeCategory === tab.key
                        ? 'bg-white text-slate-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Search & Layout Toggle */}
              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search class, section, teacher..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-slate-800 focus:bg-white focus:outline-none transition-all"
                  />
                </div>

                {/* View Mode Toggle Buttons */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'grid' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Grid Card View"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    className={`p-2 rounded-lg transition-all ${
                      viewMode === 'table' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-400 hover:text-slate-700'
                    }`}
                    title="Table View"
                  >
                    <List className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Render Sections Grid OR Table */}
          {viewMode === 'grid' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredClasses.length === 0 ? (
                <div className="col-span-full bg-white rounded-2xl border border-slate-200/80 p-12 text-center text-slate-400">
                  <BookOpen className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700 text-sm">No sections found</p>
                  <p className="text-xs text-slate-400">Try adjusting your search or category filter.</p>
                </div>
              ) : (
                filteredClasses.map((cls) => (
                  <motion.div
                    key={cls.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-2xl border border-slate-200/80 shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4 group"
                  >
                    {/* Header: Class Name + Stream Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-slate-900 to-indigo-900 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                          {cls.section}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-base group-hover:text-indigo-600 transition-colors">
                            {cls.className}-{cls.section}
                          </h3>
                          <span className="text-[11.5px] font-medium text-slate-500 flex items-center gap-1 mt-0.5">
                            <Users className="h-3 w-3 text-slate-400" />
                            {cls.studentCount || 0} Students Enrolled
                          </span>
                        </div>
                      </div>

                      <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStreamColor(cls.stream)}`}>
                        {cls.stream || 'General'}
                      </span>
                    </div>

                    {/* Class Teacher Allocation */}
                    <div className="bg-slate-50/80 rounded-xl p-3.5 border border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          cls.classTeacher ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                        }`}>
                          {cls.classTeacher ? <UserCheck className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
                        </div>
                        <div>
                          <span className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider block">
                            Assigned Class Teacher
                          </span>
                          <span className={`text-xs font-bold ${cls.classTeacher ? 'text-slate-900' : 'text-amber-600'}`}>
                            {cls.classTeacher || 'Unassigned'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedClass(cls);
                        }}
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 hover:underline shrink-0"
                      >
                        {cls.classTeacher ? 'Change' : 'Assign'}
                      </button>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenRoster(cls)}
                        className="w-full bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl py-2 px-3 text-xs font-bold transition-all flex items-center justify-center gap-1.5"
                      >
                        <CalendarDays className="h-3.5 w-3.5 text-amber-600" />
                        <span>Daily Substitution Roster</span>
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          ) : (
            /* Table View */
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="bg-slate-50/90 text-slate-500 border-b border-slate-200/80 font-bold uppercase tracking-wider text-[11px]">
                      <th className="px-6 py-4">Class & Section</th>
                      <th className="px-6 py-4">Stream</th>
                      <th className="px-6 py-4">Student Enrolment</th>
                      <th className="px-6 py-4">Assigned Class Teacher</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredClasses.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                          No section records found.
                        </td>
                      </tr>
                    ) : (
                      filteredClasses.map((cls) => (
                        <tr key={cls.id} className="hover:bg-slate-50/80 transition-colors group">
                          <td className="px-6 py-4 font-bold text-slate-900 flex items-center gap-2.5">
                            <div className="h-8 w-8 rounded-lg bg-indigo-50 text-indigo-700 font-bold flex items-center justify-center text-xs">
                              {cls.section}
                            </div>
                            <span className="group-hover:text-indigo-600 transition-colors text-sm">
                              {cls.className}-{cls.section}
                            </span>
                          </td>

                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${getStreamColor(cls.stream)}`}>
                              {cls.stream || 'General'}
                            </span>
                          </td>

                          <td className="px-6 py-4 font-medium text-slate-700 text-xs">
                            {cls.studentCount || 0} students
                          </td>

                          <td className="px-6 py-4">
                            {cls.classTeacher ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                                <UserCheck className="h-3.5 w-3.5 text-emerald-600" />
                                {cls.classTeacher}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200/60">
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                                Unassigned
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => handleOpenRoster(cls)}
                              className="bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200/80 rounded-xl px-3 py-1.5 text-xs font-bold transition-all"
                            >
                              Daily Roster
                            </button>
                            <button
                              type="button"
                              onClick={() => setSelectedClass(cls)}
                              className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all shadow-xs"
                            >
                              {cls.classTeacher ? 'Change Teacher' : 'Assign Teacher'}
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Assign Teacher Modal */}
      <AnimatePresence>
        {selectedClass && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedClass(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10 space-y-5"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-2.5 text-indigo-600">
                  <UserCheck className="h-5 w-5" />
                  <h3 className="text-base font-bold text-slate-900">
                    Assign Class Teacher — {selectedClass.className}-{selectedClass.section}
                  </h3>
                </div>
                <button
                  onClick={() => setSelectedClass(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleAssignTeacher} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Faculty Member
                  </label>
                  <select
                    required
                    value={selectedTeacherId}
                    onChange={(e) => setSelectedTeacherId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="">-- Choose Active Teacher --</option>
                    {staffList.map((stf) => (
                      <option key={stf.id} value={stf.id}>
                        {stf.name} ({stf.designation} - {stf.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setSelectedClass(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={assignLoading || !selectedTeacherId}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    {assignLoading ? 'Saving...' : 'Save Assignment'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Daily Roster Modal */}
      <AnimatePresence>
        {rosterClass && (
          <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setRosterClass(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl border border-slate-100 z-10 flex flex-col max-h-[90vh] overflow-hidden"
            >
              <div className="flex justify-between items-center border-b border-slate-100 px-6 py-4 bg-slate-900 text-white">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-amber-400" />
                    Daily Substitution Roster — Grade {rosterClass.className.replace('Grade ', '')}-{rosterClass.section}
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    View and manage period-wise teacher assignments and daily replacements.
                  </p>
                </div>
                <button
                  onClick={() => setRosterClass(null)}
                  className="rounded-lg p-1 text-slate-400 hover:text-white"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto space-y-4">
                <div className="flex items-center gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200/80">
                  <Calendar className="h-4 w-4 text-slate-500" />
                  <label className="text-xs font-bold text-slate-700">Select Date:</label>
                  <input
                    type="date"
                    value={rosterDate}
                    onChange={handleDateChange}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-900 focus:border-slate-900 focus:outline-none"
                  />
                </div>

                {loadingSchedule ? (
                  <div className="text-center py-12 text-slate-500 text-xs font-medium flex items-center justify-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin text-indigo-600" />
                    Fetching daily timetable schedule...
                  </div>
                ) : (
                  <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10.5px] border-b border-slate-200">
                        <tr>
                          <th className="px-4 py-3.5 w-16 text-center">Period</th>
                          <th className="px-4 py-3.5">Subject</th>
                          <th className="px-4 py-3.5">Teacher</th>
                          <th className="px-4 py-3.5">Status / Reason</th>
                          <th className="px-4 py-3.5 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {rosterSchedule.map((slot) => (
                          <tr key={slot.period} className={`hover:bg-slate-50/60 ${slot.isOverride ? 'bg-amber-50/40' : ''}`}>
                            <td className="px-4 py-3.5 text-center font-bold text-slate-900">
                              P{slot.period}
                            </td>
                            <td className="px-4 py-3.5 text-slate-900 font-bold">
                              {slot.subject}
                            </td>
                            <td className="px-4 py-3.5">
                              {slot.isOverride ? (
                                <div className="flex flex-col gap-0.5">
                                  <span className="text-slate-900 font-bold">{slot.assignedTeacher}</span>
                                  <span className="text-[11px] text-slate-400 line-through">was {slot.originalTeacher || 'Unassigned'}</span>
                                </div>
                              ) : (
                                <span className="text-slate-700 font-semibold">{slot.assignedTeacher}</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5">
                              {slot.isOverride ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10.5px] font-bold bg-amber-100 text-amber-800">
                                  <ArrowRightLeft className="h-3 w-3" />
                                  {slot.reason || 'Replaced'}
                                </span>
                              ) : (
                                <span className="text-slate-400 text-[11px] font-medium">Regular</span>
                              )}
                            </td>
                            <td className="px-4 py-3.5 text-right">
                              <button
                                onClick={() => {
                                  setReplaceError('');
                                  setReplaceModal({
                                    period: slot.period,
                                    originalTeacherId: slot.assignedTeacherId,
                                    subjectId: slot.subjectId,
                                  });
                                }}
                                className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline"
                              >
                                Replace Teacher
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Replace Teacher Sub-Modal */}
      <AnimatePresence>
        {replaceModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setReplaceModal(null)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 z-10 space-y-4"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                  <ArrowRightLeft className="h-5 w-5 text-indigo-600" />
                  Replace Teacher — Period {replaceModal.period}
                </h3>
                <button
                  onClick={() => setReplaceModal(null)}
                  className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <form onSubmit={handleReplaceTeacher} className="space-y-4">
                {replaceError && (
                  <div className="flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                    <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
                    <span>{replaceError}</span>
                  </div>
                )}

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Select Replacement Teacher
                  </label>
                  <select
                    required
                    value={replaceTeacherId}
                    onChange={(e) => setReplaceTeacherId(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  >
                    <option value="">-- Choose Teacher --</option>
                    {staffList.map((stf) => (
                      <option key={stf.id} value={stf.id}>
                        {stf.name} ({stf.designation} - {stf.department})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Reason for Replacement
                  </label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Teacher on Leave / Special Duty"
                    value={replaceReason}
                    onChange={(e) => setReplaceReason(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2.5 text-xs font-medium text-slate-900 focus:border-indigo-600 focus:bg-white focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setReplaceModal(null)}
                    className="px-4 py-2.5 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={!replaceTeacherId || !replaceReason}
                    className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors disabled:opacity-50 shadow-sm"
                  >
                    Confirm Replacement
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
