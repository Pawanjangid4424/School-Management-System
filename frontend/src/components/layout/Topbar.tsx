'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, Bell, User, LogOut, ChevronDown, Users, Loader2, Settings, Home, Menu } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { CodeBadge } from '@/components/ui/CodeBadge';

interface TopbarProps {
  title: string;
  userName?: string;
  userRole?: string;
  childrenList?: any[];
  selectedChildId?: string;
  onSelectChild?: (childId: string) => void;
}

export const Topbar: React.FC<TopbarProps> = ({
  title,
  userName = 'Admin User',
  userRole = 'System Administrator',
  childrenList,
  selectedChildId,
  onSelectChild,
}) => {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{type: string, name: string, sub: string, link: string}[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [realNotifications, setRealNotifications] = useState<any[]>([]);
  const [loadingNotifs, setLoadingNotifs] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  const fetchRealNotifications = async () => {
    setLoadingNotifs(true);
    try {
      const token = localStorage.getItem('access_token');
      if (!token) return;
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/notifications/my-notifications`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRealNotifications(data);
      }
    } catch (e) {
      console.error('Failed to fetch real-time notifications', e);
    } finally {
      setLoadingNotifs(false);
    }
  };

  useEffect(() => {
    fetchRealNotifications();
  }, []);

  const handleConfigureClick = () => {
    setIsNotifOpen(false);
    const role = currentUser?.role || userRole;
    if (role === 'TEACHER' || pathname?.startsWith('/teacher')) {
      router.push('/teacher/notices');
    } else if (role === 'PARENT' || pathname?.startsWith('/parent')) {
      router.push('/parent/notices');
    } else if (role === 'STUDENT' || pathname?.startsWith('/student')) {
      router.push('/student/notices');
    } else {
      router.push('/admin/notifications');
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setIsNotifOpen(false);
      }
    }
    
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsProfileOpen(false);
        setIsNotifOpen(false);
        setShowResults(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        setCurrentUser(JSON.parse(userStr));
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  const pathname = usePathname();
  const isStudentPortal = pathname?.startsWith('/student') || currentUser?.role === 'STUDENT';

  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }
    
    setIsSearching(true);
    setShowResults(true);
    
    const timer = setTimeout(async () => {
      try {
        if (isStudentPortal) {
          const studentPortalPages = [
            { type: 'Feature', name: 'Dashboard Overview', sub: 'Student Summary, Attendance & Daily Schedule', link: '/student/dashboard' },
            { type: 'Feature', name: 'My Attendance Report', sub: 'Monthly Attendance Log & Leaves', link: '/student/attendance' },
            { type: 'Feature', name: 'Weekly Class Timetable', sub: 'Subject Periods & Class Timing', link: '/student/timetable' },
            { type: 'Feature', name: 'Coursework & Homework', sub: 'Pending Assignments & Submissions', link: '/student/assignments' },
            { type: 'Feature', name: 'Examination Scores', sub: 'Report Cards & Letter Grades', link: '/student/exams' },
            { type: 'Feature', name: 'School Notices & Alerts', sub: 'Announcements & Circulars', link: '/student/notices' },
            { type: 'Feature', name: 'My Student Profile', sub: 'Personal Details & Admission Code', link: '/student/profile' },
            { type: 'Feature', name: 'Bus & Transport', sub: 'Bus Routes & Vehicle Details', link: '/student/transport' },
            { type: 'Feature', name: 'Field Trips', sub: 'School Excursions & Consent Slips', link: '/student/trips' },
          ];

          const query = searchQuery.toLowerCase();
          const filtered = studentPortalPages.filter((item) =>
            item.name.toLowerCase().includes(query) || item.sub.toLowerCase().includes(query)
          );
          setSearchResults(filtered);
          return;
        }

        const token = localStorage.getItem('access_token');
        if (!token) return;
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const [stRes, spRes] = await Promise.all([
          fetch(`${apiUrl}/students`, { headers: { Authorization: `Bearer ${token}` } }),
          fetch(`${apiUrl}/staff`, { headers: { Authorization: `Bearer ${token}` } })
        ]);
        
        let results: any[] = [];
        
        if (stRes.ok) {
          const students = await stRes.json();
          const filtered = students.filter((s: any) => 
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.studentCode?.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((s: any) => ({
            type: 'Student',
            name: s.name,
            sub: `${s.studentCode} • ${s.class}`,
            link: `/admin/students/${s.id}`
          }));
          results = [...results, ...filtered];
        }
        
        if (spRes.ok) {
          const staff = await spRes.json();
          const filtered = staff.filter((s: any) => 
            s.name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
            s.staffId?.toLowerCase().includes(searchQuery.toLowerCase())
          ).map((s: any) => ({
            type: 'Staff',
            name: s.name,
            sub: `${s.staffId} • ${s.department || 'N/A'}`,
            link: `/admin/staff`
          }));
          results = [...results, ...filtered];
        }
        
        setSearchResults(results.slice(0, 6));
      } catch (e) {
        console.error('Search failed', e);
      } finally {
        setIsSearching(false);
      }
    }, 200);
    
    return () => clearTimeout(timer);
  }, [searchQuery, isStudentPortal]);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 flex h-[76px] py-[18px] w-full items-center justify-between border-b border-slate-200 bg-white px-4 md:px-8">
      {/* Left: Page Title & Optional Child Switcher */}
      <div className={`flex items-center gap-3 md:gap-4 min-w-0 flex-1 ${isMobileSearchOpen ? 'hidden sm:flex' : 'flex'}`}>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('toggle-mobile-sidebar'))}
          className="md:hidden p-1.5 -ml-2 rounded-md text-slate-500 hover:bg-slate-100 transition-colors"
        >
          <Menu size={22} />
        </button>
        <h1 className="font-serif text-lg md:text-xl font-semibold text-slate-900 tracking-tight truncate min-w-0">
          {title}
        </h1>

        {/* Multi-Child Switcher Dropdown for Parent Role */}
        {childrenList && childrenList.length > 0 && onSelectChild && (
          <div className="hidden lg:flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1 text-xs ml-4 shrink-0">
            <Users className="h-4 w-4 text-amber-600" />
            <span className="text-amber-900 font-medium">Select Child:</span>
            <select
              value={selectedChildId}
              onChange={(e) => onSelectChild(e.target.value)}
              className="bg-white border border-amber-300 rounded px-2 py-0.5 font-bold text-slate-900 text-xs focus:outline-none"
            >
              {childrenList.map((child) => (
                <option key={child.studentProfileId} value={child.studentProfileId}>
                  {child.name} ({child.studentCode})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Center/Right: Search, Actions & Profile */}
      <div className={`flex items-center justify-end gap-3 sm:gap-4 md:gap-6 shrink-0 ml-4 ${isMobileSearchOpen ? 'w-full flex-1' : ''}`}>
        
        {/* Mobile Search Toggle Button */}
        {!isMobileSearchOpen && (
          <button
            className="sm:hidden p-2 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors ml-auto"
            onClick={() => setIsMobileSearchOpen(true)}
          >
            <Search className="h-5 w-5" />
          </button>
        )}

        {/* Search Bar - Expandable on mobile, flex width on tablet+ */}
        <div ref={searchRef} className={`relative ${isMobileSearchOpen ? 'flex-1 flex items-center' : 'hidden'} sm:block sm:max-w-md w-full ml-auto`}>
          <Search
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
            strokeWidth={1.75}
          />
          <input
            type="text"
            placeholder={isStudentPortal ? "Search portal features, timetable, attendance..." : "Search students, staff..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => { if(searchQuery.trim()) setShowResults(true) }}
            className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-8 text-sm text-slate-700 placeholder-slate-400 focus:border-amber-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 transition-all"
            autoFocus={isMobileSearchOpen}
          />
          
          {isMobileSearchOpen && (
            <button 
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 sm:hidden"
              onClick={() => { setIsMobileSearchOpen(false); setSearchQuery(''); setShowResults(false); }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
          )}

          {showResults && searchQuery.trim().length > 0 && (
            <div className="absolute top-full right-0 sm:left-0 mt-2 w-screen sm:w-80 max-w-[calc(100vw-2rem)] bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Search Results</span>
                {isSearching && <Loader2 className="h-3 w-3 text-slate-400 animate-spin" />}
              </div>
              <ul className="max-h-[60vh] sm:max-h-[320px] overflow-y-auto">
                {!isSearching && searchResults.length === 0 ? (
                  <li className="px-4 py-6 text-center text-sm text-slate-500">
                    No results found for "{searchQuery}"
                  </li>
                ) : (
                  searchResults.map((res, idx) => (
                    <li key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                      <Link 
                        href={res.link} 
                        onClick={() => { setShowResults(false); setSearchQuery(''); setIsMobileSearchOpen(false); }}
                        className="flex items-start gap-3 px-4 py-3"
                      >
                        <div className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${res.type === 'Student' ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {res.type === 'Student' ? 'S' : 'T'}
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-slate-900">{res.name}</span>
                          <span className="block text-xs text-slate-500">{res.sub}</span>
                        </div>
                      </Link>
                    </li>
                  ))
                )}
              </ul>
            </div>
          )}
        </div>

        <div className={`flex items-center gap-3 sm:gap-4 flex-shrink-0 ${isMobileSearchOpen ? 'hidden' : 'flex'}`}>
          {/* Notification Bell & Dropdown Panel */}
          <div className="relative" ref={notifRef}>
            <button
              type="button"
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              className="relative rounded-full border border-slate-200 bg-white p-2 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors"
              title="Notifications"
            >
              <Bell className="h-4 w-4" strokeWidth={1.75} />
              <span className="absolute right-0.5 top-0.5 h-2 w-2 rounded-full bg-amber-500 ring-2 ring-white" />
            </button>

            <AnimatePresence>
              {isNotifOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl bg-white shadow-2xl border border-slate-100 overflow-hidden z-50 p-0"
                >
                  <div className="bg-slate-900 text-white p-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-amber-400" />
                      <span className="text-xs font-bold uppercase tracking-wider">Notifications & Alerts</span>
                    </div>
                    <span className="text-[10px] bg-amber-500/20 text-amber-300 font-bold px-2 py-0.5 rounded-full border border-amber-500/30">
                      LIVE
                    </span>
                  </div>

                  <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                    {loadingNotifs ? (
                      <div className="p-6 text-center text-xs text-slate-400 font-medium">
                        Fetching live notifications...
                      </div>
                    ) : realNotifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        No notifications found.
                      </div>
                    ) : (
                      realNotifications.map((notif) => (
                        <div key={notif.id} className="p-3.5 hover:bg-slate-50 transition-colors flex items-start gap-3">
                          <div className="h-8 w-8 rounded-xl bg-slate-100 font-bold flex items-center justify-center shrink-0 text-xs shadow-xs">
                            {notif.icon || '🔔'}
                          </div>
                          <div className="space-y-0.5 min-w-0 flex-1">
                            <p className="text-xs font-bold text-slate-900 truncate">{notif.title}</p>
                            <p className="text-[11px] text-slate-500 line-clamp-1">{notif.content}</p>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {new Date(notif.date || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={handleConfigureClick}
                      className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 cursor-pointer w-full text-left"
                    >
                      <span>Configure Settings & View All</span> →
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          {/* Profile Dropdown / User Badge */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-slate-800 to-slate-950 text-amber-400 font-bold text-sm shadow-md ring-2 ring-transparent hover:ring-amber-500/50 transition-all cursor-pointer"
          >
            {(currentUser?.profile?.name || currentUser?.profile?.first_name || currentUser?.name || userName.replace('Welcome, ', '')).charAt(0).toUpperCase()}
          </button>

          <AnimatePresence>
            {isProfileOpen && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                className="absolute right-0 top-full mt-2 w-[280px] rounded bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.1),0_10px_20px_-2px_rgba(0,0,0,0.04)] overflow-hidden z-50 border border-slate-100"
              >
                
                {/* Profile Header */}
                <div className="pt-4 pb-2 flex flex-col items-center justify-center text-center">
                  <div className="h-[90px] w-[90px] rounded-full overflow-hidden mb-2.5 shadow-sm border-2 border-white">
                    <img 
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser?.profile?.name || currentUser?.profile?.first_name || currentUser?.name || userName.replace('Welcome, ', ''))}&background=0D8ABC&color=fff&size=256`} 
                      alt="User Image" 
                      className="w-full h-full object-cover" 
                    />
                  </div>
                  <p className="text-[17px] text-slate-800 tracking-wide font-normal mb-0">
                    Welcome {currentUser?.profile?.name || currentUser?.profile?.first_name || currentUser?.name || userName.replace('Welcome, ', '')}
                  </p>
                  {currentUser?.username && (
                    <p className="text-xs text-slate-500 mt-1">{currentUser.username}</p>
                  )}
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <Link href="/student/profile" className="flex items-center gap-2.5 px-5 py-2.5 text-slate-800 hover:bg-slate-50 transition-colors">
                    <User size={18} strokeWidth={3} className="text-black" />
                    <span className="text-[15px] font-normal">User Profile</span>
                  </Link>
                  <Link href="/student/dashboard" className="flex items-center gap-2.5 px-5 py-2.5 text-slate-800 hover:bg-slate-50 transition-colors">
                    <Home size={18} strokeWidth={3} className="text-black" />
                    <span className="text-[15px] font-normal">Home</span>
                  </Link>
                </div>

                {/* Divider */}
                <div className="h-px w-full bg-slate-100 my-2" />

                {/* Footer Actions */}
                <div className="flex justify-around items-center pb-4 pt-2 px-2">
                  <button className="flex items-center justify-center w-[72px] h-[48px] rounded-md bg-[#667eea] text-white hover:bg-[#5a6cd6] transition-colors shadow-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-key"><path d="m15.5 7.5 2.3 2.3a1 1 0 0 0 1.4 0l2.1-2.1a1 1 0 0 0 0-1.4L19 4"/><path d="m21 2-9.6 9.6"/><circle cx="7.5" cy="15.5" r="5.5"/></svg>
                  </button>
                  <button 
                    onClick={() => {
                      if (window.confirm('Are You Sure To Logout?')) {
                        handleLogout();
                      }
                    }}
                    className="flex items-center justify-center w-[72px] h-[48px] rounded-md bg-[#e53e3e] text-white hover:bg-[#c53030] transition-colors shadow-sm"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-power"><path d="M12 2v10"/><path d="M18.4 6.6a9 9 0 1 1-12.77.04"/></svg>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        </div>
      </div>
    </header>
  );
};
