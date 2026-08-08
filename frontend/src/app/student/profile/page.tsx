'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { Topbar } from '@/components/layout/Topbar';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants: any = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

const hover3DEffect = {
  y: -4,
  boxShadow: "0 12px 20px -8px rgba(0,0,0,0.08)",
  transition: { duration: 0.2 }
};

export default function StudentProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('Personal Details');

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
      if (parsedUser.role !== 'STUDENT') {
        router.push('/login');
        return;
      }
      fetchProfile(token);
    } catch (e) {
      router.push('/login');
    }
  }, [router]);

  const fetchProfile = async (token: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/students/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setStudent(data);
      }
    } catch (e) {
      console.error('Failed to fetch student profile', e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 text-slate-500 text-xs">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ repeat: Infinity, duration: 1 }}>
          Loading Student Profile...
        </motion.div>
      </div>
    );
  }

  const father = student?.guardian_links?.find((l: any) => l.guardian_profile?.relation_to_student === 'FATHER')?.guardian_profile;
  const mother = student?.guardian_links?.find((l: any) => l.guardian_profile?.relation_to_student === 'MOTHER')?.guardian_profile;

  const getPersonName = (person: any) => {
    if (!person) return '-';
    if (person.full_name && person.full_name.trim() !== '') return person.full_name;
    const name = `${person.first_name || ''} ${person.last_name || ''}`.trim();
    return name || '-';
  };

  const tabs = [
    'Student Information',
    'Personal Details',
    'Address Details',
    'Fees Details',
    'Attendance Details',
    'Result Details',
  ];

  const ReadOnlyField = ({ label, value, colSpan = 1 }: { label: string, value: any, colSpan?: number }) => (
    <div className={`col-span-1 md:col-span-${colSpan} border-b border-slate-100 py-3 flex flex-col md:flex-row md:items-center gap-1 md:gap-4`}>
      <span className="text-xs font-medium text-slate-500 md:w-1/3 shrink-0">{label}</span>
      <span className="text-[13px] text-slate-800 font-medium">{value || '-'}</span>
    </div>
  );

  // Compute Subject-wise Attendance
  const attendanceMap = new Map();
  if (student?.attendance_records) {
    student.attendance_records.forEach((record: any) => {
      const subject = record.subject;
      if (!subject) return;
      const key = subject.id;
      if (!attendanceMap.has(key)) {
        attendanceMap.set(key, {
          courseCode: subject.subject_code,
          courseName: subject.subject_name,
          total: 0,
          present: 0,
          absent: 0
        });
      }
      const data = attendanceMap.get(key);
      data.total++;
      if (record.status === 'PRESENT' || record.status === 'LATE') data.present++;
      else data.absent++;
    });
  }
  const attendanceStats = Array.from(attendanceMap.values());

  return (
    <div className="flex min-h-screen bg-slate-50 overflow-hidden">
      <Sidebar role="STUDENT" tenantName={user?.tenant_name} />
      <div className="flex-1 flex flex-col h-screen overflow-y-auto transition-all duration-300 md:pl-[var(--sidebar-width,256px)]">
        <Topbar title="Student Complete Detail" userName={`Welcome, ${user?.username}`} userRole="Enrolled Student" />
        
        <main className="px-4 md:px-8 py-6 space-y-6 max-w-[1400px] mx-auto w-full">
          {student && (
            <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-6">
              
              {/* Header Banner - ERP Style */}
              <motion.div variants={itemVariants} whileHover={hover3DEffect} className="rounded-xl border border-slate-200 bg-white shadow-sm flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-slate-100 overflow-hidden">
                
                {/* Left Identity Pane */}
                <div className="p-5 md:w-1/3 space-y-3 bg-white">
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Admission No.</span>
                    <span className="text-sm font-semibold text-slate-800">{student.admission_number || student.student_code}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Student Name</span>
                    <span className="text-sm font-bold text-slate-800">{student.first_name} {student.last_name}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Login Status</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full border border-emerald-500 text-emerald-600 text-[10px] font-bold tracking-wide w-fit">
                      Enabled
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-center">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Status</span>
                    <span className="inline-flex px-2 py-0.5 rounded-full border border-emerald-500 text-emerald-600 text-[10px] font-bold tracking-wide w-fit">
                      {student.status || 'Admitted'}
                    </span>
                  </div>
                </div>

                {/* Middle Academic Pane */}
                <div className="p-5 md:w-1/3 space-y-3 bg-white">
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Academic Year</span>
                    <span className="text-sm text-slate-800 font-medium">2025-26</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">School</span>
                    <span className="text-[13px] text-slate-800 font-medium leading-snug">
                      {user?.tenant_name || 'MDA Public School'}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Class/Section</span>
                    <span className="text-[13px] text-slate-800 font-medium">
                      Grade {student.current_class} - Section {student.current_section}
                    </span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] gap-2 items-start">
                    <span className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold mt-0.5">Roll No</span>
                    <span className="text-[13px] text-slate-800 font-medium">
                      {student.roll_no || 'TBD'}
                    </span>
                  </div>
                </div>

                {/* Right Photo Pane */}
                <div className="p-5 md:w-1/3 flex flex-col items-center justify-center bg-slate-50/30">
                  <motion.div whileHover={{ scale: 1.05 }} className="w-24 h-28 border border-slate-300 rounded overflow-hidden bg-slate-100 flex items-center justify-center p-1 shadow-sm">
                    {student.photo_url ? (
                       <img src={student.photo_url} alt="Profile" className="w-full h-full object-cover rounded-sm" />
                    ) : (
                      <img 
                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.first_name)}&background=0D8ABC&color=fff&size=256`} 
                        alt="User Image" 
                        className="w-full h-full object-cover rounded-sm" 
                      />
                    )}
                  </motion.div>
                  <div className="mt-2 text-[10px] text-slate-400 font-mono tracking-wider">
                    Sign: Not Uploaded
                  </div>
                </div>
              </motion.div>

              {/* Split Pane: Tabs and Content */}
              <div className="flex flex-col md:flex-row gap-6">
                
                {/* Left Sidebar Tabs */}
                <motion.div variants={itemVariants} className="md:w-64 shrink-0 rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden h-fit flex flex-col">
                  {tabs.map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`w-full text-left px-5 py-3.5 text-sm font-medium transition-all duration-200 border-l-[3px] ${
                        activeTab === tab 
                        ? 'border-indigo-600 bg-indigo-50/70 text-indigo-700' 
                        : 'border-transparent text-slate-600 hover:bg-slate-50 hover:text-slate-900 border-b border-slate-100 last:border-b-0'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </motion.div>

                {/* Right Content Area */}
                <motion.div variants={itemVariants} className="flex-1 rounded-xl border border-slate-200 bg-white shadow-sm min-h-[500px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeTab}
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="h-full"
                    >
                      {(activeTab === 'Personal Details' || activeTab === 'Student Information') && (
                        <div className="p-4 md:p-6">
                          <div className="mb-6 flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                            <h3 className="font-semibold text-slate-800 text-lg">Student Personal Details</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <ReadOnlyField label="Enrollment Number" value={student.admission_number || student.student_code} />
                            <ReadOnlyField label="Admission Type" value={student.admission_type || "Regular"} />
                            <ReadOnlyField label="Registration No" value={student.student_code} />
                            <ReadOnlyField label="Student Full Name" value={`${student.first_name} ${student.last_name}`} />
                            <ReadOnlyField label="Student First Name" value={student.first_name} />
                            <ReadOnlyField label="Student Middle Name" value={student.middle_name} />
                            <ReadOnlyField label="Student Last Name" value={student.last_name} />
                            <ReadOnlyField label="Student Mobile No." value={student.mobile_no} />
                            <ReadOnlyField label="Alternate Mobile No" value={student.alternate_mobile_no} />
                            <ReadOnlyField label="Student Email ID" value={user?.current_email} />
                            <ReadOnlyField label="Date of Birth" value={student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : ''} />
                            <ReadOnlyField label="Birth Place" value={student.birth_place} />
                            <ReadOnlyField label="Gender" value={student.gender} />
                            <ReadOnlyField label="Blood Group" value={student.blood_group} />
                            <ReadOnlyField label="Nationality" value={student.nationality || "Indian"} />
                            <ReadOnlyField label="Category" value={student.category} />
                            <ReadOnlyField label="Religion" value={student.religion} />
                            <ReadOnlyField label="Physically Disabled" value={student.physically_disabled || "No"} />
                            <ReadOnlyField label="Aadhar No." value={student.aadhar_no} />
                          </div>

                          <div className="mt-8 mb-6 flex items-center gap-2 border-l-4 border-blue-500 pl-3">
                            <h3 className="font-semibold text-slate-800 text-lg">Father Details</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <ReadOnlyField label="Father Full Name" value={getPersonName(father)} />
                            <ReadOnlyField label="Father's Mobile No." value={father?.phone} />
                            <ReadOnlyField label="Father's Email" value={father?.email} />
                            <ReadOnlyField label="Father's Occupation" value={father?.occupation} />
                          </div>

                          <div className="mt-8 mb-6 flex items-center gap-2 border-l-4 border-rose-500 pl-3">
                            <h3 className="font-semibold text-slate-800 text-lg">Mother Details</h3>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                            <ReadOnlyField label="Mother Full Name" value={getPersonName(mother)} />
                            <ReadOnlyField label="Mother's Mobile No." value={mother?.phone} />
                            <ReadOnlyField label="Mother's Email" value={mother?.email} />
                            <ReadOnlyField label="Mother's Occupation" value={mother?.occupation} />
                          </div>
                        </div>
                      )}

                      {activeTab === 'Address Details' && (
                        <div className="p-4 md:p-6">
                          <div className="mb-6 flex items-center gap-2 border-l-4 border-indigo-500 pl-3">
                            <h3 className="font-semibold text-slate-800 text-lg">Address Details</h3>
                          </div>
                          <div className="grid grid-cols-1 gap-x-8 gap-y-1">
                            <ReadOnlyField label="Permanent Address" value={
                              student.permanent_address 
                              ? typeof student.permanent_address === 'string' 
                                ? student.permanent_address 
                                : (student.permanent_address as any).addressDetails || (student.permanent_address as any).address 
                              : '-'
                            } />
                            <ReadOnlyField label="City" value={student.permanent_address ? (student.permanent_address as any).city : '-'} />
                            <ReadOnlyField label="State" value={student.permanent_address ? (student.permanent_address as any).state : '-'} />
                            <ReadOnlyField label="Pincode" value={student.permanent_address ? (student.permanent_address as any).pinCode || (student.permanent_address as any).pin : '-'} />
                          </div>
                        </div>
                      )}

                      {activeTab === 'Fees Details' && (
                        <div className="p-4 md:p-6">
                          <div className="mb-6 flex items-center gap-2 border-l-4 border-amber-500 pl-3">
                            <h3 className="font-semibold text-slate-800 text-lg">Fees Details</h3>
                          </div>
                          
                          {/* Desktop Table */}
                          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs text-slate-600">
                              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider text-slate-500">
                                <tr>
                                  <th className="px-4 py-3">Academic Year</th>
                                  <th className="px-4 py-3">Fee Head</th>
                                  <th className="px-4 py-3">Due Date</th>
                                  <th className="px-4 py-3 text-right">Amount Due</th>
                                  <th className="px-4 py-3 text-right">Amount Paid</th>
                                  <th className="px-4 py-3 text-right">Outstanding</th>
                                  <th className="px-4 py-3 text-center">Status</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {student?.fee_invoices?.length > 0 ? (
                                  student.fee_invoices.map((inv: any) => (
                                    <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-3 font-medium text-slate-800">{inv.academic_year}</td>
                                      <td className="px-4 py-3">{inv.fee_structure?.fee_head?.name || 'Tuition Fee'}</td>
                                      <td className="px-4 py-3">{new Date(inv.due_date).toLocaleDateString()}</td>
                                      <td className="px-4 py-3 text-right font-medium text-slate-700">₹{inv.amount_due}</td>
                                      <td className="px-4 py-3 text-right text-emerald-600">₹{inv.amount_paid}</td>
                                      <td className="px-4 py-3 text-right text-rose-600">₹{inv.amount_due - inv.amount_paid}</td>
                                      <td className="px-4 py-3 text-center">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                          {inv.status}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={7} className="px-4 py-12 text-center text-slate-400 font-medium text-sm">
                                      No fee invoices found for this student.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="md:hidden space-y-4">
                            {student?.fee_invoices?.length > 0 ? (
                              student.fee_invoices.map((inv: any) => (
                                <div key={inv.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm relative overflow-hidden flex flex-col gap-3">
                                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${inv.status === 'PAID' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <h4 className="font-semibold text-slate-800 text-sm">{inv.fee_structure?.fee_head?.name || 'Tuition Fee'}</h4>
                                      <p className="text-[11px] text-slate-500">Due: {new Date(inv.due_date).toLocaleDateString()}</p>
                                    </div>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold tracking-wide ${inv.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                                      {inv.status}
                                    </span>
                                  </div>
                                  <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-3">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Due</span>
                                      <span className="text-sm font-medium text-slate-700">₹{inv.amount_due}</span>
                                    </div>
                                    <div className="flex flex-col">
                                      <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Paid</span>
                                      <span className="text-sm font-medium text-emerald-600">₹{inv.amount_paid}</span>
                                    </div>
                                    <div className="flex flex-col text-right">
                                      <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Outst.</span>
                                      <span className="text-sm font-medium text-rose-600">₹{inv.amount_due - inv.amount_paid}</span>
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-slate-400 font-medium text-sm py-8 border border-slate-200 border-dashed rounded-xl">
                                No fee invoices found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'Attendance Details' && (
                        <div className="p-4 md:p-6">
                          <div className="mb-6 flex items-center gap-2 border-l-4 border-emerald-500 pl-3">
                            <h3 className="font-semibold text-slate-800 text-lg">Attendance Details</h3>
                          </div>
                          
                          {/* Desktop Table */}
                          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs text-slate-600">
                              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider text-slate-500">
                                <tr>
                                  <th className="px-4 py-3">Course Code</th>
                                  <th className="px-4 py-3">Course Name</th>
                                  <th className="px-4 py-3 text-center">Total Classes</th>
                                  <th className="px-4 py-3 text-center text-emerald-600">Present</th>
                                  <th className="px-4 py-3 text-center text-rose-600">Absent</th>
                                  <th className="px-4 py-3 text-right">Attendance(%)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {attendanceStats.length > 0 ? (
                                  attendanceStats.map((stat: any, i: number) => {
                                    const percent = ((stat.present / stat.total) * 100).toFixed(1);
                                    return (
                                      <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3 font-medium text-slate-800">{stat.courseCode}</td>
                                        <td className="px-4 py-3">{stat.courseName}</td>
                                        <td className="px-4 py-3 text-center font-medium">{stat.total}</td>
                                        <td className="px-4 py-3 text-center font-medium text-emerald-600">{stat.present}</td>
                                        <td className="px-4 py-3 text-center font-medium text-rose-600">{stat.absent}</td>
                                        <td className="px-4 py-3 text-right font-bold text-indigo-600">{percent}%</td>
                                      </tr>
                                    );
                                  })
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="px-4 py-12 text-center text-slate-400 font-medium text-sm">
                                      No attendance records found for this student.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="md:hidden space-y-4">
                            {attendanceStats.length > 0 ? (
                              attendanceStats.map((stat: any, i: number) => {
                                const percent = ((stat.present / stat.total) * 100).toFixed(1);
                                return (
                                  <div key={i} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                                    <div className="flex justify-between items-start border-b border-slate-100 pb-2">
                                      <div>
                                        <h4 className="font-semibold text-slate-800 text-sm">{stat.courseName}</h4>
                                        <p className="text-[11px] text-slate-500 font-mono mt-0.5">{stat.courseCode}</p>
                                      </div>
                                      <div className="text-right">
                                        <span className="text-sm font-bold text-indigo-600">{percent}%</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                      <div className="flex flex-col text-center bg-slate-50 rounded py-1.5">
                                        <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Total</span>
                                        <span className="text-sm font-medium text-slate-700">{stat.total}</span>
                                      </div>
                                      <div className="flex flex-col text-center bg-emerald-50 rounded py-1.5">
                                        <span className="text-[10px] uppercase text-emerald-500 font-semibold tracking-wider">Present</span>
                                        <span className="text-sm font-medium text-emerald-700">{stat.present}</span>
                                      </div>
                                      <div className="flex flex-col text-center bg-rose-50 rounded py-1.5">
                                        <span className="text-[10px] uppercase text-rose-500 font-semibold tracking-wider">Absent</span>
                                        <span className="text-sm font-medium text-rose-700">{stat.absent}</span>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            ) : (
                              <div className="text-center text-slate-400 font-medium text-sm py-8 border border-slate-200 border-dashed rounded-xl">
                                No attendance records found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {activeTab === 'Result Details' && (
                        <div className="p-4 md:p-6">
                          <div className="mb-6 flex items-center gap-2 border-l-4 border-purple-500 pl-3">
                            <h3 className="font-semibold text-slate-800 text-lg">Result Details</h3>
                          </div>
                          
                          {/* Desktop Table */}
                          <div className="hidden md:block overflow-x-auto rounded-lg border border-slate-200">
                            <table className="w-full text-left text-xs text-slate-600">
                              <thead className="bg-slate-50 border-b border-slate-200 uppercase font-semibold text-[10px] tracking-wider text-slate-500">
                                <tr>
                                  <th className="px-4 py-3">Examination Name</th>
                                  <th className="px-4 py-3">Subject</th>
                                  <th className="px-4 py-3 text-right">Marks Obtained</th>
                                  <th className="px-4 py-3 text-right">Letter Grade</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100">
                                {student?.exam_scores?.length > 0 ? (
                                  student.exam_scores.map((score: any) => (
                                    <tr key={score.id} className="hover:bg-slate-50/50 transition-colors">
                                      <td className="px-4 py-3 font-medium text-slate-800">{score.exam?.name}</td>
                                      <td className="px-4 py-3">{score.exam?.subject?.subject_name || '-'}</td>
                                      <td className="px-4 py-3 text-right font-medium text-slate-700">{score.marks_obtained} / {score.exam?.max_marks}</td>
                                      <td className="px-4 py-3 text-right font-bold text-indigo-600">{score.grade_label || '-'}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={4} className="px-4 py-12 text-center text-slate-400 font-medium text-sm">
                                      No examination results published for this term.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Mobile Cards */}
                          <div className="md:hidden space-y-4">
                            {student?.exam_scores?.length > 0 ? (
                              student.exam_scores.map((score: any) => (
                                <div key={score.id} className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm flex flex-col gap-2 relative overflow-hidden">
                                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500"></div>
                                  <h4 className="font-semibold text-slate-800 text-sm pl-2">{score.exam?.name}</h4>
                                  <div className="pl-2 flex justify-between items-end mt-2">
                                    <div className="flex flex-col">
                                      <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Subject</span>
                                      <span className="text-xs font-medium text-slate-700">{score.exam?.subject?.subject_name || '-'}</span>
                                    </div>
                                    <div className="flex gap-4">
                                      <div className="flex flex-col text-right">
                                        <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Score</span>
                                        <span className="text-sm font-bold text-slate-800">{score.marks_obtained} <span className="text-slate-400 text-xs font-normal">/ {score.exam?.max_marks}</span></span>
                                      </div>
                                      {score.grade_label && (
                                        <div className="flex flex-col text-right">
                                          <span className="text-[10px] uppercase text-slate-400 font-semibold tracking-wider">Grade</span>
                                          <span className="text-sm font-bold text-purple-600">{score.grade_label}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="text-center text-slate-400 font-medium text-sm py-8 border border-slate-200 border-dashed rounded-xl">
                                No exam results found.
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                    </motion.div>
                  </AnimatePresence>
                </motion.div>
              </div>
            </motion.div>
          )}
        </main>
      </div>
    </div>
  );
}
