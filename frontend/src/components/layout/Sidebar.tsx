'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  BookMarked,
  CalendarCheck,
  CreditCard,
  Settings,
  ShieldCheck,
  Building2,
  ChevronLeft,
  ChevronRight,
  GripVertical,
  ClipboardCheck,
  FileBadge,
  CalendarDays,
  MapPin,
  Bus,
  Layers,
  CalendarOff,
  Compass,
  Bell,
  RefreshCw,
  Award,
  FileText,
  Receipt
} from 'lucide-react';
import logoAsset from '@/assets/marudhar-logo.png';

interface SidebarProps {
  role?: string;
  tenantName?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  role = 'ADMIN',
  tenantName = 'Marudhar Defence Academy',
}) => {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(256); // Default 64 * 4 = 256px
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);

  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize(); // set initial
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const effectiveCollapsed = isMobile ? false : isCollapsed;

  useEffect(() => {
    const storedWidth = localStorage.getItem('sidebarWidth');
    const storedCollapsed = localStorage.getItem('sidebarCollapsed');
    if (storedWidth) setWidth(Number(storedWidth));
    if (storedCollapsed) setIsCollapsed(storedCollapsed === 'true');
  }, []);

  useEffect(() => {
    localStorage.setItem('sidebarWidth', width.toString());
    localStorage.setItem('sidebarCollapsed', isCollapsed.toString());
    
    // Update global CSS variable for layout coordination
    const updateSidebarVar = () => {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        document.documentElement.style.setProperty('--sidebar-width', '0px');
      } else {
        const effectiveWidth = isCollapsed ? 80 : width;
        document.documentElement.style.setProperty('--sidebar-width', `${effectiveWidth}px`);
      }
    };
    
    updateSidebarVar();
    window.addEventListener('resize', updateSidebarVar);
    return () => window.removeEventListener('resize', updateSidebarVar);
  }, [width, isCollapsed]);

  useEffect(() => {
    const handleToggle = () => setIsMobileOpen((prev) => !prev);
    window.addEventListener('toggle-mobile-sidebar', handleToggle);
    return () => window.removeEventListener('toggle-mobile-sidebar', handleToggle);
  }, []);

  const startResizing = React.useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = React.useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = React.useCallback(
    (mouseMoveEvent: MouseEvent) => {
      if (isResizing) {
        const newWidth = mouseMoveEvent.clientX;
        if (newWidth >= 200 && newWidth <= 450) {
          setWidth(newWidth);
          if (isCollapsed) setIsCollapsed(false);
        } else if (newWidth < 150) {
          setIsCollapsed(true);
        }
      }
    },
    [isResizing, isCollapsed]
  );

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);

  const adminNavItems = [
    { label: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Students', href: '/admin/students', icon: GraduationCap },
    { label: 'Staff & Teachers', href: '/admin/staff', icon: Users },
    { label: 'Classes & Streams', href: '/admin/classes', icon: Layers },
    { label: 'Subjects Management', href: '/admin/subjects', icon: BookMarked },
    { label: 'Timetable Grid', href: '/admin/timetable', icon: CalendarDays },
    { label: 'Attendance Oversight', href: '/admin/attendance', icon: ClipboardCheck },
    { label: 'Leave Requests', href: '/admin/leave-requests', icon: CalendarOff },
    { label: 'Field Trips Oversight', href: '/admin/trips', icon: Compass },
    { label: 'Notifications Queue', href: '/admin/notifications', icon: Bell },
    { label: 'Fee Management', href: '/admin/fees/dashboard', icon: Receipt },
    { label: 'Transport Fleet & Routes', href: '/admin/transport/routes', icon: Bus },
    { label: 'Year Rollover Engine', href: '/admin/rollover', icon: RefreshCw },
    { label: 'Settings', href: '/admin/settings', icon: Settings },
  ];

  const teacherNavItems = [
    { label: 'Dashboard', href: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'Attendance Marking', href: '/teacher/attendance', icon: ClipboardCheck },
    { label: 'Class Leave Requests', href: '/teacher/leaves', icon: CalendarOff },
    { label: 'My Assigned Classes', href: '/teacher/classes', icon: Layers },
    { label: 'Assignments', href: '/teacher/assignments', icon: FileText },
    { label: 'Test Scores', href: '/teacher/exams', icon: FileBadge },
    { label: 'Field Trips & Consents', href: '/teacher/trips', icon: Compass },
    { label: 'Daily Schedule', href: '/teacher/schedule', icon: CalendarDays },
    { label: 'Notices & Notifications', href: '/teacher/notices', icon: Bell },
  ];

  const parentNavItems = [
    { label: 'Dashboard', href: '/parent/dashboard', icon: LayoutDashboard },
    { label: 'Child Attendance', href: '/parent/attendance', icon: ClipboardCheck },
    { label: 'Coursework & Homework', href: '/parent/assignments', icon: BookOpen },
    { label: 'Test Scores & Grades', href: '/parent/exams', icon: Award },
    { label: 'Weekly Timetable', href: '/parent/timetable', icon: CalendarDays },
    { label: 'Field Trips & Consents', href: '/parent/trips', icon: Compass },
    { label: 'Bus Transport', href: '/parent/transport', icon: Bus },
    { label: 'School Notices & Alerts', href: '/parent/notices', icon: Bell },
  ];

  const studentNavItems = [
    { label: 'Dashboard', href: '/student/dashboard', icon: LayoutDashboard },
    { label: 'My Attendance', href: '/student/attendance', icon: ClipboardCheck },
    { label: 'Leave Applications', href: '/student/leaves', icon: CalendarOff },
    { label: 'My Coursework', href: '/student/assignments', icon: BookOpen },
    { label: 'My Test Scores', href: '/student/exams', icon: FileBadge },
    { label: 'My Timetable', href: '/student/timetable', icon: CalendarDays },
    { label: 'Field Trips', href: '/student/trips', icon: MapPin },
    { label: 'My Bus Transport', href: '/student/transport', icon: Bus },
    { label: 'Notices & Announcements', href: '/student/notices', icon: Bell },
  ];

  const navItems =
    role === 'TEACHER'
      ? teacherNavItems
      : role === 'PARENT'
      ? parentNavItems
      : role === 'STUDENT'
      ? studentNavItems
      : adminNavItems;

  return (
    <>
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsMobileOpen(false)}
            className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm md:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside
        ref={sidebarRef}
        initial={false}
        animate={{ 
          width: isMobile ? 280 : (isCollapsed ? 80 : width),
          x: isMobile ? (isMobileOpen ? 0 : -280) : 0 
        }}
        transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        className="fixed left-0 top-0 z-50 flex h-screen flex-col bg-slate-950 text-slate-300 select-none shadow-2xl"
      >
      {/* Brand Header */}
      <div className={`flex h-[76px] items-center border-b border-slate-800/80 ${effectiveCollapsed ? 'justify-center' : 'px-6 gap-3'}`}>
        <img
          src={logoAsset.src}
          alt="MDA Logo"
          className="h-9 w-9 rounded-xl object-contain bg-white p-0.5 shadow-sm shrink-0"
        />
        <AnimatePresence>
          {!effectiveCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col overflow-hidden min-w-0 flex-1"
            >
              <span className="text-xs sm:text-sm font-semibold text-white tracking-wide leading-snug line-clamp-2 break-words">
                {tenantName}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden p-3 space-y-1 custom-scrollbar">
        {navItems.map((item) => {
          const isActive = pathname.startsWith(item.href);
          return (
            <Link key={item.label} href={item.href} onClick={() => { if(isMobile) setIsMobileOpen(false); }}>
              <motion.div
                whileHover={{ scale: 1.02, x: 2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex items-center rounded-lg px-3 py-2.5 transition-colors ${
                  isActive
                    ? 'bg-indigo-600/10 text-indigo-400'
                    : 'text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                } ${effectiveCollapsed ? 'justify-center' : ''}`}
                title={effectiveCollapsed ? item.label : undefined}
              >
                <item.icon className="h-5 w-5 shrink-0" strokeWidth={isActive ? 2 : 1.75} />
                
                <AnimatePresence>
                  {!effectiveCollapsed && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="ml-3 text-[13px] font-medium whitespace-nowrap"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      {/* User / Settings Footer Area */}
      <div className={`flex items-center border-t border-slate-800/80 p-4 ${effectiveCollapsed ? 'justify-center' : 'justify-between'}`}>
        <AnimatePresence>
          {!effectiveCollapsed && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2 overflow-hidden whitespace-nowrap"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-indigo-500/20 text-indigo-400">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-slate-200">{role}</span>
                <span className="text-[10px] text-slate-500">Workspace</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-1.5 rounded-md hover:bg-slate-800 text-slate-400 transition-colors z-10"
        >
          {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </motion.button>
      </div>

      {/* Drag Resizer Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          className="absolute top-0 right-0 w-1.5 h-full cursor-col-resize hover:bg-indigo-500/50 transition-colors z-20 group flex items-center justify-center"
        >
          <div className="w-1 h-8 bg-slate-700/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center overflow-hidden">
            <GripVertical size={10} className="text-slate-400" />
          </div>
        </div>
      )}

      {/* Adding custom scrollbar styling globally for sidebar if needed, or inline */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
          border-radius: 4px;
        }
        .custom-scrollbar:hover::-webkit-scrollbar-thumb {
          background: #475569;
        }
      `}} />
    </motion.aside>
    </>
  );
};
