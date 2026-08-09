'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Lock, Eye, EyeOff, MapPin, ShieldCheck } from 'lucide-react';
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
    <div className="min-h-screen w-full bg-slate-100/80 flex items-center justify-center p-3 sm:p-6 lg:p-8 font-sans selection:bg-red-500 selection:text-white">
      <Toaster position="top-center" />

      {/* Main Glassmorphic Outer Card Container */}
      <div className="w-full max-w-5xl bg-white rounded-3xl shadow-xl border border-slate-200/80 overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[580px] my-auto">
        
        {/* Left Hero Image Frame - Visible on Desktop/Tablet Large Screens */}
        <div className="hidden lg:flex lg:col-span-7 relative flex-col justify-between p-6 overflow-hidden bg-slate-900 group">
          {/* Main Campus Image */}
          <img
            src={campusImage.src}
            alt="Marudhar Defence Sec. School Campus"
            className="absolute inset-0 h-full w-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
          />

          {/* Dark Gradient Overlay for Vignette effect */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/30 to-black/20 pointer-events-none" />

          {/* Top Decorative Tag */}
          <div className="relative z-10 flex items-center gap-2 bg-white/10 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-medium w-fit">
            <ShieldCheck className="h-4 w-4 text-red-400" />
            <span>Official Institutional ERP Portal</span>
          </div>

          {/* Bottom School Badge */}
          <div className="relative z-10 bg-[#D32F2F]/95 backdrop-blur-md text-white p-4 sm:p-5 rounded-2xl shadow-xl border border-red-500/40 flex items-center gap-4 max-w-md">
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

        {/* Right Login Panel - 100% Mobile Responsive */}
        <aside className="col-span-1 lg:col-span-5 p-5 sm:p-8 flex flex-col justify-between bg-white w-full">
          <div className="space-y-5 my-auto max-w-md mx-auto w-full">

            {/* Top Center School Logo & Title */}
            <div className="flex flex-col items-center justify-center text-center space-y-2 pb-3 border-b border-slate-100">
              <div className="h-14 w-14 sm:h-16 sm:w-16 rounded-xl border border-slate-200 bg-white p-1.5 shadow-xs flex items-center justify-center">
                <img
                  src={logoAsset.src}
                  alt="Marudhar Defence Sec. School Logo"
                  className="h-full w-full object-contain"
                />
              </div>

              <div>
                <h1 className="font-bold text-slate-900 text-xs sm:text-sm tracking-tight uppercase leading-tight">
                  MARUDHAR DEFENCE SEC. SCHOOL
                </h1>
                <p className="text-[10.5px] sm:text-[11.5px] text-slate-500 mt-1 leading-snug font-normal max-w-[280px] mx-auto">
                  Plot No-27, Ganesh Nagar Vistar, near Kanakpura Railway Station, Jhotwara, Jaipur, Rajasthan 302012.
                </p>
              </div>
            </div>

            {/* Form Title */}
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">Sign In</h2>
              <p className="text-xs text-slate-500 mt-0.5">Enter your system credentials to access portal</p>
            </div>

            {/* Error Notification */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-xs text-red-700 font-medium">
                {error}
              </div>
            )}

            {/* Sign In Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              {/* Username Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  User Name
                </label>
                <div className="relative flex items-center">
                  <input
                    type="text"
                    required
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter username or email"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none transition-all pr-9"
                  />
                  <User className="absolute right-3 h-4 w-4 text-slate-400 pointer-events-none" />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Password
                </label>
                <div className="relative flex items-center">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-2.5 text-xs sm:text-sm text-slate-900 font-medium placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:outline-none transition-all pr-9"
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

              {/* Remember Me & Forgot Password Modal Trigger */}
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-slate-300 text-red-600 focus:ring-red-500 cursor-pointer accent-red-600"
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
                className="w-full rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white py-3 px-4 font-bold text-xs sm:text-sm tracking-wide shadow-md shadow-red-500/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </form>

            {/* Quick System Admin Login Button */}
            <div className="border-t border-slate-100 pt-4 space-y-1.5">
              <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider text-center">
                System Admin Login:
              </span>
              <button
                type="button"
                onClick={() => {
                  setUsername('admin@school.com');
                  setPassword('AdminPass123!');
                }}
                className="w-full py-2 px-4 rounded-xl border border-red-200 bg-red-50/70 hover:bg-red-100 hover:border-red-300 text-red-700 text-xs font-semibold transition-all text-center flex items-center justify-center gap-1.5 shadow-xs"
              >
                👑 Auto-Fill Super Admin Credentials
              </button>
            </div>
          </div>

          {/* Browser Compatibility Footer */}
          <div className="pt-4 border-t border-slate-100 text-center text-[10.5px] text-slate-400 mt-6">
            <span>Site Compatible - <span className="text-slate-600 font-medium">Chrome 70+</span> • <span className="text-slate-600 font-medium">Firefox 65+</span> • <span className="text-slate-600 font-medium">Edge 89+</span></span>
          </div>
        </aside>
      </div>

      <ForgotPasswordModal isOpen={isForgotOpen} onClose={() => setIsForgotOpen(false)} />
    </div>
  );
}
