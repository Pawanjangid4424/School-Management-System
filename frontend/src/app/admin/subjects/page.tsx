'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  Plus,
  Search,
  UserCheck,
  Building,
  CheckCircle2,
  MoreHorizontal,
  Layers,
  Pencil,
  Trash2,
  X,
  AlertTriangle,
} from 'lucide-react';

import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { CodeBadge } from '@/components/ui/CodeBadge';
import { StatusPill } from '@/components/ui/StatusPill';

const STANDARD_SUBJECT_PRESETS = [
  // Science & Tech
  { name: 'Mathematics', code: 'MAT', department: 'Mathematics' },
  { name: 'Physics', code: 'PHY', department: 'Science' },
  { name: 'Chemistry', code: 'CHE', department: 'Science' },
  { name: 'Biology', code: 'BIO', department: 'Science' },
  { name: 'Science & Technology', code: 'SCI', department: 'Science' },
  { name: 'Environmental Studies (EVS)', code: 'EVS', department: 'Science' },
  { name: 'Computer Science & IT', code: 'CS', department: 'Science' },
  { name: 'Information Technology (IT)', code: 'IT', department: 'Science' },
  { name: 'Artificial Intelligence & Coding', code: 'AI', department: 'Science' },

  // Languages
  { name: 'English Core / Literature', code: 'ENG', department: 'English & Languages' },
  { name: 'Hindi Core / Vyakaran', code: 'HIN', department: 'English & Languages' },
  { name: 'Sanskrit Language', code: 'SAN', department: 'English & Languages' },
  { name: 'French Language', code: 'FRE', department: 'English & Languages' },
  { name: 'German Language', code: 'GER', department: 'English & Languages' },

  // Social Sciences & Humanities
  { name: 'Social Studies (SST)', code: 'SST', department: 'Humanities & Social Sciences' },
  { name: 'History & Civics', code: 'HIS', department: 'Humanities & Social Sciences' },
  { name: 'Geography & Earth Science', code: 'GEO', department: 'Humanities & Social Sciences' },
  { name: 'Political Science', code: 'POL', department: 'Humanities & Social Sciences' },
  { name: 'Economics', code: 'ECO', department: 'Humanities & Social Sciences' },
  { name: 'Psychology', code: 'PSY', department: 'Humanities & Social Sciences' },
  { name: 'Sociology', code: 'SOC', department: 'Humanities & Social Sciences' },

  // Commerce
  { name: 'Accountancy', code: 'ACC', department: 'Commerce & Accounting' },
  { name: 'Business Studies', code: 'BST', department: 'Commerce & Accounting' },
  { name: 'Entrepreneurship', code: 'ENT', department: 'Commerce & Accounting' },

  // Sports & Other
  { name: 'Physical Education & Sports', code: 'PED', department: 'Physical Education & Sports' },
  { name: 'Defence Studies & NCC Training', code: 'DEF', department: 'Physical Education & Sports' },
  { name: 'General Knowledge & Current Affairs', code: 'GK', department: 'Humanities & Social Sciences' },
  { name: 'Art & Craft', code: 'ART', department: 'Humanities & Social Sciences' },
  { name: 'Music & Performing Arts', code: 'MUS', department: 'Humanities & Social Sciences' },
];

export default function SubjectsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [staffList, setStaffList] = useState<any[]>([]);
  const [search, setSearch] = useState('');

  // New Subject Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState('');
  const [isCustomSubject, setIsCustomSubject] = useState(false);
  const [subjectName, setSubjectName] = useState('');
  const [subjectCode, setSubjectCode] = useState('');
  const [department, setDepartment] = useState('Science');
  const [createSuccess, setCreateSuccess] = useState('');
  const [error, setError] = useState('');

  // Generate unique subject code automatically
  const generateUniqueSubjectCode = (prefix: string, existingList: any[]) => {
    const cleanPrefix = (prefix || 'SUB').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 4) || 'SUB';
    let counter = 101;
    const existingCodes = new Set(existingList.map((s: any) => s.subject_code?.toUpperCase()));
    while (existingCodes.has(`${cleanPrefix}${counter}`)) {
      counter++;
    }
    return `${cleanPrefix}${counter}`;
  };

  const handleSelectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    if (presetName === 'CUSTOM') {
      setIsCustomSubject(true);
      setSubjectName('');
      const autoCode = generateUniqueSubjectCode('SUB', subjects);
      setSubjectCode(autoCode);
      return;
    }

    setIsCustomSubject(false);
    const preset = STANDARD_SUBJECT_PRESETS.find((p) => p.name === presetName);
    if (preset) {
      setSubjectName(preset.name);
      setDepartment(preset.department);
      const autoCode = generateUniqueSubjectCode(preset.code, subjects);
      setSubjectCode(autoCode);
    }
  };

  // Edit Subject Modal State
  const [editingSubject, setEditingSubject] = useState<any>(null);
  const [editName, setEditName] = useState('');
  const [editCode, setEditCode] = useState('');
  const [editDepartment, setEditDepartment] = useState('Science');

  // Delete Subject State
  const [deletingSubject, setDeletingSubject] = useState<any>(null);

  // Manage Class Mappings State
  const [managingMappingsSubject, setManagingMappingsSubject] = useState<any>(null);

  // Map Subject to Class Modal State
  const [selectedSubject, setSelectedSubject] = useState<any>(null);
  const [mapClassNum, setMapClassNum] = useState(6);
  const [mapSection, setMapSection] = useState('A');
  const [mapStream, setMapStream] = useState('');
  const [mapTeacherId, setMapTeacherId] = useState('');

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
      fetchData(token);
    } catch (e) {
      router.push('/login');
    } finally {
      setLoading(false);
    }
  }, [router]);

  const fetchData = async (token: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    try {
      const [subRes, stfRes] = await Promise.all([
        fetch(`${apiUrl}/subjects`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${apiUrl}/staff`, { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      if (subRes.ok) {
        const subData = await subRes.json();
        setSubjects(subData);
      }
      if (stfRes.ok) {
        const stfData = await stfRes.json();
        setStaffList(stfData);
      }
    } catch (e) {
      console.error('Failed to fetch subjects or staff', e);
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCreateSuccess('');

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/subjects`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: subjectName,
          code: subjectCode,
          department,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to create subject');

      setCreateSuccess(`Subject ${data.subject_name} (${data.subject_code}) created!`);
      setSubjectName('');
      setSubjectCode('');
      setShowCreateModal(false);
      fetchData(token || '');
    } catch (err: any) {
      setError(err.message || 'An error occurred.');
    }
  };

  const handleEditSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubject) return;

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/subjects/${editingSubject.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName,
          code: editCode,
          department: editDepartment,
        }),
      });

      if (res.ok) {
        setCreateSuccess(`Subject ${editName} updated successfully!`);
        setEditingSubject(null);
        fetchData(token || '');
      } else {
        const data = await res.json();
        setError(data.message || 'Failed to update subject');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating subject.');
    }
  };

  const handleDeleteSubject = async (subjectId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/subjects/${subjectId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setCreateSuccess('Subject and its class mappings deleted successfully!');
        setDeletingSubject(null);
        fetchData(token || '');
      }
    } catch (err) {
      console.error('Error deleting subject', err);
    }
  };

  const handleDeleteClassMapping = async (mappingId: string) => {
    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/subjects/mapping/${mappingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setCreateSuccess('Class mapping removed successfully!');
        fetchData(token || '');
        if (managingMappingsSubject) {
          setManagingMappingsSubject((prev: any) => ({
            ...prev,
            class_mappings: prev.class_mappings.filter((m: any) => m.id !== mappingId),
          }));
        }
      }
    } catch (err) {
      console.error('Error deleting class mapping', err);
    }
  };

  const handleMapSubjectToClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSubject) return;

    try {
      const token = localStorage.getItem('access_token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

      const res = await fetch(`${apiUrl}/subjects/map-class`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: selectedSubject.id,
          classNumber: Number(mapClassNum),
          section: mapSection,
          stream: mapClassNum >= 11 ? mapStream : undefined,
          teacherId: mapTeacherId || undefined,
        }),
      });

      if (res.ok) {
        setCreateSuccess(`Mapped ${selectedSubject.subject_name} to Grade ${mapClassNum}-${mapSection}`);
        setSelectedSubject(null);
        fetchData(token || '');
      }
    } catch (err) {
      console.error('Error mapping subject', err);
    }
  };

  const filteredSubjects = subjects.filter(
    (s) =>
      s.subject_name.toLowerCase().includes(search.toLowerCase()) ||
      s.subject_code.toLowerCase().includes(search.toLowerCase()) ||
      s.department.toLowerCase().includes(search.toLowerCase()),
  );

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        Loading Subjects...
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
          title="Subject Management & Curriculum Mapping"
          userName="Welcome, Admin"
          userRole="System Administrator"
        />

        <main className="px-4 sm:px-6 lg:px-8 py-6 space-y-6 max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-semibold text-slate-900">
                School Subjects & Class Assignments
              </h2>
              <p className="text-xs text-slate-500">
                Define academic subjects, map them to grade levels, and assign subject faculty.
              </p>
            </div>

            <button
              onClick={() => {
                setShowCreateModal(true);
                setCreateSuccess('');
              }}
              className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800 transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="h-4 w-4" strokeWidth={2} />
              <span>+ Create Subject</span>
            </button>
          </div>

          {createSuccess && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{createSuccess}</span>
            </div>
          )}

          {/* Directory Card */}
          <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden space-y-4">
            <div className="flex items-center justify-between px-6 pt-5 pb-2">
              <div className="relative w-80">
                <Search
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                  strokeWidth={1.75}
                />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by code, subject name, or department..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-1.5 pl-9 pr-3 text-xs text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <span className="text-xs text-slate-500">
                Total: <strong className="text-slate-900 font-semibold">{filteredSubjects.length}</strong> subjects
              </span>
            </div>

            {/* Subjects Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 border-y border-slate-100 font-medium">
                  <tr>
                    <th className="px-6 py-3">Subject Code</th>
                    <th className="px-6 py-3">Subject Name</th>
                    <th className="px-6 py-3">Department</th>
                    <th className="px-6 py-3">Mapped Classes</th>
                    <th className="px-6 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {filteredSubjects.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No subjects found. Click "+ Create Subject" to add to the curriculum.
                      </td>
                    </tr>
                  ) : (
                    filteredSubjects.map((sub) => (
                      <tr key={sub.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-6 py-3.5">
                          <CodeBadge code={sub.subject_code} />
                        </td>
                        <td className="px-6 py-3.5 font-medium text-slate-900">
                          {sub.subject_name}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {sub.department}
                        </td>
                        <td className="px-6 py-3.5 text-slate-600">
                          {sub.class_mappings?.length > 0 ? (
                            <button
                              type="button"
                              onClick={() => setManagingMappingsSubject(sub)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 hover:bg-amber-100 transition-colors font-medium text-xs cursor-pointer group"
                              title="Click to view & edit mapped classes"
                            >
                              <Layers className="h-3.5 w-3.5 text-amber-600 group-hover:scale-110 transition-transform" />
                              <span>{sub.class_mappings.length} class mappings</span>
                            </button>
                          ) : (
                            <span className="text-slate-400">Unmapped</span>
                          )}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => setSelectedSubject(sub)}
                              className="bg-slate-900 text-white rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1 shadow-sm"
                            >
                              <Plus className="h-3.5 w-3.5" />
                              <span>Map to Class</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setEditingSubject(sub);
                                setEditName(sub.subject_name);
                                setEditCode(sub.subject_code);
                                setEditDepartment(sub.department);
                              }}
                              title="Edit Subject"
                              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors shadow-sm"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeletingSubject(sub)}
                              title="Delete Subject"
                              className="p-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-600 hover:text-rose-700 hover:bg-rose-100 transition-colors shadow-sm"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Create Subject Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Create New Subject
                  </h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleCreateSubject} className="space-y-4">
                  {error && (
                    <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700">
                      {error}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Subject Name *
                    </label>
                    <select
                      value={selectedPreset}
                      onChange={(e) => handleSelectPreset(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500 font-medium"
                    >
                      <option value="">-- Select Standard Subject --</option>
                      <optgroup label="Mathematics & Science">
                        {STANDARD_SUBJECT_PRESETS.filter(
                          (p) => p.department === 'Mathematics' || p.department === 'Science',
                        ).map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Languages">
                        {STANDARD_SUBJECT_PRESETS.filter((p) => p.department === 'English & Languages').map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Social Sciences & Humanities">
                        {STANDARD_SUBJECT_PRESETS.filter(
                          (p) => p.department === 'Humanities & Social Sciences',
                        ).map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Commerce">
                        {STANDARD_SUBJECT_PRESETS.filter((p) => p.department === 'Commerce & Accounting').map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                      <optgroup label="Physical Education & Others">
                        {STANDARD_SUBJECT_PRESETS.filter(
                          (p) => p.department === 'Physical Education & Sports',
                        ).map((p) => (
                          <option key={p.name} value={p.name}>
                            {p.name}
                          </option>
                        ))}
                      </optgroup>
                      <option value="CUSTOM">➕ Custom / Other Subject...</option>
                    </select>

                    {isCustomSubject && (
                      <div className="mt-2">
                        <input
                          type="text"
                          required
                          value={subjectName}
                          onChange={(e) => {
                            setSubjectName(e.target.value);
                            if (e.target.value.length >= 2) {
                              const prefix = e.target.value.slice(0, 3).toUpperCase();
                              setSubjectCode(generateUniqueSubjectCode(prefix, subjects));
                            }
                          }}
                          placeholder="Enter Custom Subject Name (e.g. Robotics)"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      </div>
                    )}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-medium text-slate-700">
                        Subject Unique Code *
                      </label>
                      <span className="text-[10px] text-amber-600 font-medium">
                        ✨ Auto-generated & unique
                      </span>
                    </div>
                    <input
                      type="text"
                      required
                      value={subjectCode}
                      onChange={(e) => setSubjectCode(e.target.value.toUpperCase())}
                      placeholder="e.g. MAT101"
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-mono font-bold focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
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
                      <option value="Science">Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="English & Languages">English & Languages</option>
                      <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
                      <option value="Commerce & Accounting">Commerce & Accounting</option>
                      <option value="Physical Education & Sports">Physical Education & Sports</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="border border-dashed border-slate-300 text-slate-600 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800"
                    >
                      Save Subject
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Edit Subject Modal */}
          {editingSubject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Edit Subject ({editingSubject.subject_code})
                  </h3>
                  <button
                    onClick={() => setEditingSubject(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleEditSubject} className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Subject Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Subject Code *
                    </label>
                    <input
                      type="text"
                      required
                      value={editCode}
                      onChange={(e) => setEditCode(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-mono focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Department *
                    </label>
                    <select
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="Science">Science</option>
                      <option value="Mathematics">Mathematics</option>
                      <option value="English & Languages">English & Languages</option>
                      <option value="Humanities & Social Sciences">Humanities & Social Sciences</option>
                      <option value="Commerce & Accounting">Commerce & Accounting</option>
                      <option value="Physical Education & Sports">Physical Education & Sports</option>
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingSubject(null)}
                      className="border border-dashed border-slate-300 text-slate-600 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800"
                    >
                      Update Subject
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Subject Modal */}
          {deletingSubject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-rose-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-100 text-rose-600 shrink-0">
                    <AlertTriangle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-base font-semibold text-slate-900">
                      Delete Subject
                    </h3>
                    <p className="text-xs text-slate-500">
                      This action will remove the subject from curriculum.
                    </p>
                  </div>
                </div>

                <p className="text-xs text-slate-700 bg-rose-50/60 border border-rose-200/60 rounded-lg p-3 leading-relaxed">
                  Are you sure you want to delete <strong>{deletingSubject.subject_name} ({deletingSubject.subject_code})</strong>? All class mappings ({deletingSubject.class_mappings?.length || 0}) for this subject will also be unmapped.
                </p>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setDeletingSubject(null)}
                    className="border border-slate-300 text-slate-700 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteSubject(deletingSubject.id)}
                    className="bg-rose-600 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-rose-700 transition-colors shadow-sm"
                  >
                    Delete Subject
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Manage Mapped Classes Modal */}
          {managingMappingsSubject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <div>
                    <h3 className="font-serif text-base font-semibold text-slate-900">
                      Class Mappings for {managingMappingsSubject.subject_name}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono">Code: {managingMappingsSubject.subject_code}</p>
                  </div>
                  <button
                    onClick={() => setManagingMappingsSubject(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                  {managingMappingsSubject.class_mappings?.length === 0 ? (
                    <p className="text-xs text-slate-400 text-center py-6">No classes currently mapped to this subject.</p>
                  ) : (
                    managingMappingsSubject.class_mappings.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg border border-slate-200 bg-slate-50/70 hover:bg-slate-100/60 transition-colors">
                        <div>
                          <span className="font-bold text-slate-900 text-xs">
                            Grade {m.class_number} - Section {m.section} {m.stream ? `(${m.stream})` : ''}
                          </span>
                          <p className="text-[11px] text-slate-500">
                            Faculty: {m.teacher_id ? (staffList.find((s) => s.id === m.teacher_id)?.name || 'Assigned Faculty') : 'No Faculty Assigned'}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteClassMapping(m.id)}
                          title="Remove Class Mapping"
                          className="p-1.5 rounded-lg border border-rose-200 bg-white text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      const sub = managingMappingsSubject;
                      setManagingMappingsSubject(null);
                      setSelectedSubject(sub);
                    }}
                    className="bg-slate-900 text-white rounded-lg px-3.5 py-1.5 text-xs font-medium hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>Add New Class Mapping</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setManagingMappingsSubject(null)}
                    className="border border-slate-300 text-slate-700 rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Map Subject Modal */}
          {selectedSubject && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/40 p-4">
              <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-xl space-y-4">
                <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                  <h3 className="font-serif text-base font-semibold text-slate-900">
                    Map {selectedSubject.subject_name} to Class
                  </h3>
                  <button
                    onClick={() => setSelectedSubject(null)}
                    className="text-slate-400 hover:text-slate-700 text-xs font-bold"
                  >
                    ✕
                  </button>
                </div>

                <form onSubmit={handleMapSubjectToClass} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Class / Grade
                      </label>
                      <select
                        value={mapClassNum}
                        onChange={(e) => setMapClassNum(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                      >
                        {Array.from({ length: 12 }, (_, i) => i + 1).map((c) => (
                          <option key={c} value={c}>
                            Grade {c}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-slate-700 mb-1">
                        Section
                      </label>
                      <select
                        value={mapSection}
                        onChange={(e) => setMapSection(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                      >
                        <option value="A">Section A</option>
                        <option value="B">Section B</option>
                        <option value="C">Section C</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-700 mb-1">
                      Assign Subject Teacher
                    </label>
                    <select
                      value={mapTeacherId}
                      onChange={(e) => setMapTeacherId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900"
                    >
                      <option value="">-- Choose Subject Faculty --</option>
                      {staffList.map((stf) => (
                        <option key={stf.id} value={stf.id}>
                          {stf.name} ({stf.department})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setSelectedSubject(null)}
                      className="border border-dashed border-slate-300 text-slate-600 rounded-lg px-3 py-2 text-xs font-medium hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="bg-slate-900 text-white rounded-lg px-4 py-2 text-xs font-medium hover:bg-slate-800"
                    >
                      Save Mapping
                    </button>
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
