'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Phone, Lock, CheckCircle2, Copy, KeyRound, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface ForgotPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ForgotPasswordModal: React.FC<ForgotPasswordModalProps> = ({ isOpen, onClose }) => {
  // Option Selectors - Unselected by default per user requirement
  const [recoveryMode, setRecoveryMode] = useState<'USERNAME' | 'PASSWORD' | null>(null);
  const [targetType, setTargetType] = useState<'EMAIL' | 'MOBILE' | null>(null);

  // Multi-Step Form State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [credential, setCredential] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  // Outcome Data
  const [recoveredInfo, setRecoveredInfo] = useState<{ username: string; email: string } | null>(null);
  const [resetToken, setResetToken] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  if (!isOpen) return null;

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recoveryMode) {
      toast.error('Please select what you want to recover (UserName or Password)');
      return;
    }
    if (!targetType) {
      toast.error('Please select a verification channel (Email Address or Mobile Number)');
      return;
    }
    if (!credential.trim()) {
      toast.error(targetType === 'EMAIL' ? 'Please enter your Email Address' : 'Please enter your Mobile Number');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/forgot-password/request-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetType, credential, recoveryMode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Account not found');
      }

      toast.success(data.message);
      if (data.devModeOtp) {
        toast.info(`Dev Mode OTP: ${data.devModeOtp} (or test code 123456)`);
      }
      setStep(2);
    } catch (err: any) {
      toast.error(err.message || 'Failed to send OTP code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      toast.error('Please enter the 6-digit OTP code');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/forgot-password/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, otp, recoveryMode }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Invalid OTP code');
      }

      toast.success(data.message);
      if (recoveryMode === 'USERNAME') {
        setRecoveredInfo({ username: data.username, email: data.email });
        setStep(3);
      } else {
        setResetToken(data.resetToken);
        setStep(3);
      }
    } catch (err: any) {
      toast.error(err.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/auth/forgot-password/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resetToken, newPassword }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to reset password');
      }

      toast.success('Password reset successfully! You can now log in.');
      resetFormState();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Password reset failed');
    } finally {
      setLoading(false);
    }
  };

  const resetFormState = () => {
    setStep(1);
    setRecoveryMode(null);
    setTargetType(null);
    setCredential('');
    setOtp('');
    setRecoveredInfo(null);
    setResetToken(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-3 sm:p-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-[92vw] sm:w-full sm:max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden font-sans max-h-[90vh] flex flex-col my-auto"
        >
          {/* Header Banner - Per User Reference UI */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/80 shrink-0">
            <div className="flex items-center gap-2">
              <KeyRound className="h-5 w-5 text-red-600 shrink-0" />
              <h3 className="text-sm sm:text-base font-bold text-slate-800 tracking-tight truncate">Forgot Password / UserName</h3>
            </div>
            <button
              onClick={() => {
                resetFormState();
                onClose();
              }}
              className="h-8 w-8 rounded-full bg-slate-200/70 hover:bg-red-500 hover:text-white flex items-center justify-center text-slate-500 transition-colors shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="p-4 sm:p-6 space-y-5 overflow-y-auto max-h-[calc(90vh-64px)]">
            {/* Step 1 & Option Radio Selection */}
            {step === 1 && (
              <form onSubmit={handleRequestOtp} className="space-y-5">
                {/* Radio Selection Controls - Unselected by Default */}
                <div className="bg-slate-50/90 border border-slate-200/80 p-3.5 sm:p-4 rounded-2xl space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      What do you want to recover? <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="recoveryMode"
                          checked={recoveryMode === 'USERNAME'}
                          onChange={() => setRecoveryMode('USERNAME')}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                        />
                        UserName
                      </label>
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="recoveryMode"
                          checked={recoveryMode === 'PASSWORD'}
                          onChange={() => setRecoveryMode('PASSWORD')}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                        />
                        Password
                      </label>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/60 pt-3">
                    <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                      Verification Channel <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="targetType"
                          checked={targetType === 'EMAIL'}
                          onChange={() => setTargetType('EMAIL')}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                        />
                        Email Address
                      </label>
                      <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-slate-700 cursor-pointer select-none">
                        <input
                          type="radio"
                          name="targetType"
                          checked={targetType === 'MOBILE'}
                          onChange={() => setTargetType('MOBILE')}
                          className="h-4 w-4 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                        />
                        Mobile Number
                      </label>
                    </div>
                  </div>
                </div>

                {/* Input Field Dynamic Placeholder */}
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    {targetType === 'MOBILE'
                      ? '10-Digit Registered Mobile Number'
                      : 'Registered School / Personal Email'}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      {targetType === 'MOBILE' ? <Phone className="h-4 w-4" /> : <Mail className="h-4 w-4" />}
                    </div>
                    <input
                      type={targetType === 'MOBILE' ? 'tel' : 'email'}
                      value={credential}
                      onChange={(e) => setCredential(e.target.value)}
                      placeholder={
                        targetType === 'MOBILE'
                          ? 'e.g. 9876543210'
                          : 'e.g. student@mda.edu or personal email'
                      }
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 px-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  {loading ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      Send Verification Code (OTP)
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-5">
                <div className="text-center space-y-1">
                  <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-red-100 text-red-600 mb-1">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800">Enter Verification Code</h4>
                  <p className="text-xs text-slate-500">
                    We sent a 6-digit OTP code to <span className="font-semibold text-slate-700">{credential}</span>
                  </p>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 6-digit OTP"
                    className="w-full text-center tracking-[0.4em] sm:tracking-[0.5em] text-lg sm:text-xl font-bold py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                    required
                  />
                  <p className="text-[11px] text-center text-slate-400 mt-2">Dev test OTP: <code className="bg-slate-100 px-1 py-0.5 rounded font-bold text-slate-600">123456</code></p>
                </div>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="flex-1 py-2.5 border border-slate-300 hover:bg-slate-50 text-slate-700 font-medium text-xs rounded-xl"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5"
                  >
                    {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Verify Code'}
                  </button>
                </div>
              </form>
            )}

            {/* Step 3A: Recovered Username View */}
            {step === 3 && recoveryMode === 'USERNAME' && recoveredInfo && (
              <div className="space-y-5 text-center">
                <div className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-emerald-100 text-emerald-600">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <h4 className="text-base font-bold text-slate-800">Your Account Username</h4>
                  <p className="text-xs text-slate-500">Below are your registered system credentials:</p>
                </div>

                <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 space-y-3 text-left">
                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Assigned Username</span>
                    <div className="flex items-center justify-between bg-white border border-slate-200 px-3 py-2 rounded-xl mt-1">
                      <span className="font-mono text-sm font-bold text-slate-800">{recoveredInfo.username}</span>
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(recoveredInfo.username);
                          toast.success('Username copied to clipboard!');
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 flex items-center gap-1"
                      >
                        <Copy className="h-3.5 w-3.5" />
                        Copy
                      </button>
                    </div>
                  </div>

                  <div>
                    <span className="block text-[11px] font-semibold text-slate-400 uppercase">Registered System Email</span>
                    <span className="block font-mono text-xs text-slate-700 mt-0.5">{recoveredInfo.email}</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    resetFormState();
                    onClose();
                  }}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl shadow-md"
                >
                  Proceed to Login
                </button>
              </div>
            )}

            {/* Step 3B: Password Reset Form */}
            {step === 3 && recoveryMode === 'PASSWORD' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center space-y-1 mb-3">
                  <h4 className="text-sm font-bold text-slate-800">Set New Password</h4>
                  <p className="text-xs text-slate-500">Create a new password for your account</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Minimum 6 characters"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Confirm New Password</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                      <Lock className="h-4 w-4" />
                    </div>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Re-enter new password"
                      required
                      className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-[11px] text-red-500 mt-1 font-medium">Passwords do not match</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-red-500/25 flex items-center justify-center gap-2 transition-all disabled:opacity-50 mt-2"
                >
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Reset & Save Password'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
