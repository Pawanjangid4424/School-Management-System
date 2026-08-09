'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Lock, Eye, EyeOff, MapPin
} from 'lucide-react';
import { toast, Toaster } from 'sonner';

import campusImage from '@/assets/campus.jpg';
import logoAsset from '@/assets/marudhar-logo.png';
import { ForgotPasswordModal } from '@/components/auth/ForgotPasswordModal';

export default function LoginPage() {
  const router = useRouter();

  const [username, setUsername] = useState('admin@school.com');
  const [password, setPassword] = useState('AdminPass123!');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isForgotOpen, setIsForgotOpen] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Invalid login credentials');
      }

      localStorage.clear();
      localStorage.setItem('access_token', data.tokens.access_token);
      localStorage.setItem('refresh_token', data.tokens.refresh_token);
      localStorage.setItem('user', JSON.stringify(data.user));

      toast.success(`Welcome back, ${data.user.name || data.user.username}!`);

      switch (data.user.role) {
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'TEACHER':
          router.push('/teacher/dashboard');
          break;
        case 'STUDENT':
          router.push('/student/dashboard');
          break;
        case 'PARENT':
          router.push('/parent/dashboard');
          break;
        default:
          setError('Unknown user role. Please contact administration.');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to backend server.');
      toast.error(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen bg-white flex p-3 sm:p-4 gap-4 sm:gap-6 overflow-hidden text-slate-800 font-sans selection:bg-red-500 selection:text-white">
      <Toaster position="top-center" />

      {/* Left Hero Card Frame - Pristine Original Full Height Design on Desktop/Tablet */}
      <div className="hidden md:flex md:flex-1 relative h-full rounded-[24px] overflow-hidden bg-slate-100 border border-slate-200/80 shadow-xs flex-col justify-between p-4 group">
        {/* Main Campus Image */}
        <img
          src={campusImage.src}
          alt="Marudhar Defence Sec. School Campus"
          className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-101"
        />

        {/* Soft Ambient Tint Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/50 via-transparent to-black/10 pointer-events-none" />

        {/* Top Spacer */}
        <div className="relative z-10" />

        {/* Red School Badge overlay at bottom left inside the rounded campus card */}
        <div className="relative z-10 bg-[#D32F2F]/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-red-500/40 flex items-center gap-4 max-w-sm sm:max-w-md">
          <div className="h-14 w-14 rounded-xl bg-white p-1 shrink-0 shadow-sm flex items-center justify-center">
            <img
              src={logoAsset.src}
              alt="Marudhar Emblem"
              className="h-full w-full object-contain"
            />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-sm sm:text-base leading-tight uppercase tracking-tight text-white">
              MARUDHAR DEFENCE SEC. SCHOOL
            </span>

            <span className="text-[11px] text-white/90 mt-0.5 flex items-center gap-1 font-mono">
              <MapPin className="h-3 w-3 shrink-0" /> Jaipur, Rajasthan
            </span>
          </div>
        </div>
      </div>

      {/* Right Login Panel - Matches exact original CSS (430px width on desktop, full width on mobile) */}
      <aside
        className="w-full md:w-[430px] shrink-0 h-full bg-white flex flex-col justify-between py-2 px-4 sm:px-10 overflow-y-auto mx-auto"
        style={{
          boxSizing: 'border-box',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          fontSize: '14px',
          lineHeight: 1.5,
          color: 'rgb(33, 37, 41)',
        }}
      >
        <div className="space-y-4 flex-1 flex flex-col justify-center my-auto py-2 max-w-[360px] mx-auto w-full">

          {/* Top Center Logo & Address */}
          <div className="flex flex-col items-center justify-center text-center space-y-2 pb-3 border-b border-slate-100 shrink-0">
            <div className="h-16 w-16 rounded-lg border border-slate-200 bg-white p-1.5 shadow-2xs flex items-center justify-center">
              <img
                src={logoAsset.src}
                alt="Marudhar Defence Sec. School Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div>
              <h1 className="font-bold text-slate-900 text-sm sm:text-base tracking-tight uppercase leading-tight">
                MARUDHAR DEFENCE SEC. SCHOOL
              </h1>
              <p className="text-[11.5px] text-slate-500 mt-1 leading-snug font-normal max-w-[280px] mx-auto">
                Plot No-27, Ganesh Nagar Vistar (Ganesh Ext.), near Kanakpura Railway Station, Jhotwara, Jaipur, Rajasthan 302012.
              </p>
            </div>
          </div>

          {/* Form Header */}
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Sign In</h2>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="rounded-md bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* User Name Input */}
            <div className="relative">
              <label className="absolute -top-2.5 left-2.5 bg-white px-1 text-[11px] font-semibold text-slate-700 z-10">
                User Name
              </label>
              <div className="relative flex items-center">
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  className="w-full rounded-[4px] border border-red-500 bg-[#EAF2FF] px-3 py-2 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-red-600 focus:bg-white focus:outline-none transition-all pr-9 h-10"
                />
                <User className="absolute right-3 h-4 w-4 text-red-500 pointer-events-none" />
              </div>
            </div>

            {/* Password Input */}
            <div className="relative">
              <label className="absolute -top-2.5 left-2.5 bg-white px-1 text-[11px] font-semibold text-slate-600 z-10">
                Password
              </label>
              <div className="relative flex items-center">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-[4px] border border-slate-300 bg-white px-3 py-2 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none transition-all pr-9 h-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 text-slate-400 hover:text-slate-600 focus:outline-none"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password / Username */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
                <span className="text-xs font-medium text-slate-600">Remember Me</span>
              </label>
              <button
                type="button"
                onClick={() => setIsForgotOpen(true)}
                className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-all"
              >
                Forgot Password / UserName?
              </button>
            </div>

            {/* Sign In Primary Red Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-[4px] bg-[#D32F2F] hover:bg-[#C62828] text-white py-2.5 px-4 font-bold text-sm tracking-wide shadow-xs transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer h-10"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* Quick Admin Demo Login */}
          <div className="border-t border-slate-100 pt-3 space-y-1.5 shrink-0">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-center">
              System Admin Login:
            </span>
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => {
                  setUsername('admin@school.com');
                  setPassword('AdminPass123!');
                }}
                className="w-full py-1.5 px-4 rounded-lg border border-red-200 bg-red-50/60 hover:bg-red-100 hover:border-red-300 text-red-700 text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                👑 Auto-Fill Super Admin Credentials
              </button>
            </div>
          </div>

        </div>

        {/* Browser Compatibility Footer */}
        <div className="pt-3 border-t border-slate-100 text-center text-[10.5px] text-slate-400 shrink-0">
          <span>Site Compatible - <span className="text-slate-600 font-medium">Google Chrome 70+</span> • <span className="text-slate-600 font-medium">Firefox 65+</span> • <span className="text-slate-600 font-medium">Edge 89+</span></span>
        </div>
      </aside>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
}
