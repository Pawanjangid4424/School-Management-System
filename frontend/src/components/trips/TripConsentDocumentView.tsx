'use client';

import React, { useState, useRef } from 'react';
import {
  MapPin,
  Calendar,
  Clock,
  Wallet,
  CheckCircle2,
  XCircle,
  Backpack,
  ShieldCheck,
  Bus,
  ArrowRight,
  FileText,
  Phone,
  Plus,
  Trash2,
  Pencil,
  Eye,
  Lock,
} from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import logoAsset from '@/assets/marudhar-logo.png';

export interface CostItem {
  label: string;
  amount: number;
}

export interface TripFormData {
  tripTitle: string;
  destination: string;
  date: string;
  departureTime: string;
  arrivalTime: string;
  returnTime: string;
  costBreakdown: CostItem[];
  whatToBring: string[];
  rules: string[];
  phone1: string;
  phone2: string;
  description?: string;
  emergencyInstructions?: string;
  isLocked?: boolean;
}

export interface TripConsentDocumentViewProps {
  isEdit?: boolean;
  formData: TripFormData;
  onChange?: (updated: TripFormData) => void;
  // Parent/Student specific info
  student?: {
    name: string;
    code: string;
    class: string;
  };
  permissionStatus?: 'PENDING' | 'GRANTED' | 'DENIED';
  respondedByName?: string;
  signatureId?: string;
  signatureData?: string;
  respondedAt?: string;
  onRespond?: (status: 'GRANTED' | 'DENIED', name: string, signatureData?: string) => Promise<void>;
  isStudentView?: boolean;
}

function CodeBadge({ code }: { code: string }) {
  return (
    <span className="inline-block rounded-md border border-blue-200 bg-blue-50 px-2 py-1 font-mono text-xs text-blue-800">
      {code}
    </span>
  );
}

export const TripConsentDocumentView: React.FC<TripConsentDocumentViewProps> = ({
  isEdit = false,
  formData,
  onChange,
  student = {
    name: 'Student Name',
    code: '26MDA100021',
    class: 'Class 10 Section A',
  },
  permissionStatus = 'PENDING',
  respondedByName = '',
  signatureId = '',
  signatureData = '',
  respondedAt = '',
  onRespond,
  isStudentView = false,
}) => {
  const [signatureNameInput, setSignatureNameInput] = useState(respondedByName || '');
  const [submitting, setSubmitting] = useState(false);
  const sigCanvas = useRef<any>(null);

  const updateField = (field: keyof TripFormData, value: any) => {
    if (onChange) {
      onChange({ ...formData, [field]: value });
    }
  };

  const updateCost = (index: number, field: 'label' | 'amount', value: string) => {
    const next = formData.costBreakdown.map((item, i) => {
      if (i !== index) return item;
      return {
        ...item,
        [field]: field === 'amount' ? (isNaN(Number(value)) ? 0 : Number(value)) : value,
      };
    });
    updateField('costBreakdown', next);
  };

  const addCost = () => {
    updateField('costBreakdown', [...formData.costBreakdown, { label: 'New Expense', amount: 100 }]);
  };

  const removeCost = (index: number) => {
    updateField('costBreakdown', formData.costBreakdown.filter((_, i) => i !== index));
  };

  const updateChecklistItem = (index: number, value: string) => {
    const next = formData.whatToBring.map((item, i) => (i === index ? value : item));
    updateField('whatToBring', next);
  };

  const addChecklistItem = () => {
    updateField('whatToBring', [...formData.whatToBring, 'New Item']);
  };

  const removeChecklistItem = (index: number) => {
    updateField('whatToBring', formData.whatToBring.filter((_, i) => i !== index));
  };

  const updateRule = (index: number, value: string) => {
    const next = formData.rules.map((rule, i) => (i === index ? value : rule));
    updateField('rules', next);
  };

  const addRule = () => {
    updateField('rules', [...formData.rules, 'Students must follow teacher instructions.']);
  };

  const removeRule = (index: number) => {
    updateField('rules', formData.rules.filter((_, i) => i !== index));
  };

  const totalCost = formData.costBreakdown.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);

  const handleParentSubmit = async (status: 'GRANTED' | 'DENIED') => {
    if (onRespond) {
      setSubmitting(true);
      let sigData = undefined;
      if (sigCanvas.current && !sigCanvas.current.isEmpty()) {
        try {
          const originalCanvas = sigCanvas.current.getCanvas(); // Avoid getTrimmedCanvas due to high-DPI bugs on mobile
          const destCanvas = document.createElement('canvas');
          const maxW = 500;
          const scale = Math.min(1, maxW / originalCanvas.width);
          destCanvas.width = originalCanvas.width * scale;
          destCanvas.height = originalCanvas.height * scale;
          const ctx = destCanvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#ffffff'; // White background for JPEG
            ctx.fillRect(0, 0, destCanvas.width, destCanvas.height);
            ctx.drawImage(originalCanvas, 0, 0, destCanvas.width, destCanvas.height);
            sigData = destCanvas.toDataURL('image/jpeg', 0.7);
          } else {
            sigData = originalCanvas.toDataURL('image/png'); // Fallback
          }
        } catch (e) {
          console.error('Failed to process signature', e);
          sigData = sigCanvas.current.getCanvas().toDataURL('image/png'); // Safe fallback
        }
      }
      try {
        await onRespond(status, signatureNameInput, sigData);
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleClearSignature = () => {
    if (sigCanvas.current) {
      sigCanvas.current.clear();
    }
  };

  const logoSrc = (logoAsset as any).src || (logoAsset as any);

  return (
    <div className="relative min-h-screen bg-slate-100 p-4 font-sans sm:p-6 lg:p-8">
      {/* Container */}
      <div className="mx-auto max-w-3xl overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-900/5">
        {/* Decorative Top Accent Banner (Golden / Blue accent) */}
        <div className="h-3 bg-gradient-to-r from-blue-700 via-blue-600 to-amber-500" />

        {/* Paper Container with faint logo watermark */}
        <div className="relative p-6 sm:p-8">
          {/* Faint Logo Watermark Background */}
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-[0.035]">
            <img src={logoSrc} alt="School Logo Watermark" className="h-96 w-96 object-contain" />
          </div>

          {/* Document Header */}
          <div className="relative border-b border-slate-200 pb-6 text-center">
            <div className="flex flex-col items-center justify-center gap-3 sm:flex-row">
              <img src={logoSrc} alt="School Logo" className="h-16 w-16 object-contain" />
              <div className="text-center sm:text-left">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 sm:text-2xl">
                  MARUDHAR DEFENCE ACADEMY
                </h1>
                <p className="text-xs text-slate-500 font-medium mt-1">
                  Plot No-27, Ganesh Nagar Vistar (Ganesh Ext.), near Kanakpura Railway Station, Jhotwara, Jaipur, Rajasthan 302012.
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center justify-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-900">
                <FileText className="h-3.5 w-3.5 text-blue-600" /> Official Field Trip Consent Form
              </span>
              {formData.isLocked && (
                <span className="inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-800">
                  <Lock className="h-3 w-3 text-amber-600" /> Locked & Approved
                </span>
              )}
            </div>
          </div>

          {/* Student & Recipient Banner */}
          {!isEdit && (
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-100 bg-blue-50/50 p-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                  Student Name
                </p>
                <p className="text-base font-bold text-slate-900">{student.name}</p>
                <p className="text-xs text-slate-500">{student.class}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">
                  Student Code
                </p>
                <CodeBadge code={student.code} />
              </div>
            </div>
          )}

          {/* Trip Title & Destination */}
          <div className="mt-6">
            {isEdit ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Trip Title / Event Name
                  </label>
                  <input
                    type="text"
                    value={formData.tripTitle}
                    onChange={(e) => updateField('tripTitle', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-300 bg-amber-50/30 px-3 py-2 text-base font-bold text-slate-900 outline-none focus:border-amber-500 focus:bg-white"
                    placeholder="e.g. Science Park Educational Field Trip"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase text-slate-500">
                    Destination Location
                  </label>
                  <input
                    type="text"
                    value={formData.destination}
                    onChange={(e) => updateField('destination', e.target.value)}
                    className="mt-1 w-full rounded-lg border border-amber-300 bg-amber-50/30 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-amber-500 focus:bg-white"
                    placeholder="e.g. Jaipur Science Park, Shastri Nagar"
                  />
                </div>
              </div>
            ) : (
              <div className="text-center sm:text-left">
                <h2 className="text-xl font-extrabold text-slate-900 sm:text-2xl">
                  {formData.tripTitle || 'Field Trip'}
                </h2>
                <p className="mt-1 flex items-center justify-center gap-1.5 text-sm font-semibold text-blue-700 sm:justify-start">
                  <MapPin className="h-4 w-4" /> Destination: {formData.destination}
                </p>
              </div>
            )}
          </div>

          {/* Journey Schedule Layout */}
          <div className="mt-6 rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <p className="mb-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
              Trip Journey Schedule
            </p>
            <div className="flex flex-wrap items-center justify-between gap-3 text-center sm:flex-nowrap">
              {/* School Depart */}
              <div className="flex-1 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                <Bus className="mx-auto h-5 w-5 text-blue-600" />
                <p className="mt-1 text-xs font-bold text-slate-800">School Departure</p>
                {isEdit ? (
                  <input
                    type="text"
                    value={formData.departureTime}
                    onChange={(e) => updateField('departureTime', e.target.value)}
                    className="mt-1 w-full rounded border border-amber-300 bg-amber-50/30 px-1 py-0.5 text-center text-xs outline-none"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-600">{formData.departureTime}</p>
                )}
              </div>

              <ArrowRight className="hidden h-5 w-5 text-slate-300 sm:block" />

              {/* Destination Arrival */}
              <div className="flex-1 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                <MapPin className="mx-auto h-5 w-5 text-amber-600" />
                <p className="mt-1 text-xs font-bold text-slate-800">Destination Arrival</p>
                {isEdit ? (
                  <input
                    type="text"
                    value={formData.arrivalTime}
                    onChange={(e) => updateField('arrivalTime', e.target.value)}
                    className="mt-1 w-full rounded border border-amber-300 bg-amber-50/30 px-1 py-0.5 text-center text-xs outline-none"
                    placeholder="9:30 AM"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-600">{formData.arrivalTime || 'TBD'}</p>
                )}
              </div>

              <ArrowRight className="hidden h-5 w-5 text-slate-300 sm:block" />

              {/* School Return */}
              <div className="flex-1 rounded-lg bg-white p-3 shadow-sm border border-slate-100">
                <Bus className="mx-auto h-5 w-5 text-emerald-600" />
                <p className="mt-1 text-xs font-bold text-slate-800">School Return</p>
                {isEdit ? (
                  <input
                    type="text"
                    value={formData.returnTime}
                    onChange={(e) => updateField('returnTime', e.target.value)}
                    className="mt-1 w-full rounded border border-amber-300 bg-amber-50/30 px-1 py-0.5 text-center text-xs outline-none"
                  />
                ) : (
                  <p className="text-xs font-medium text-slate-600">{formData.returnTime}</p>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-center justify-center gap-2 border-t border-slate-200 pt-3 text-xs text-slate-600 font-medium">
              <Calendar className="h-4 w-4 text-blue-600" />
              {isEdit ? (
                <input
                  type="text"
                  value={formData.date}
                  onChange={(e) => updateField('date', e.target.value)}
                  className="rounded border border-amber-300 bg-amber-50/30 px-2 py-1 text-center text-xs outline-none"
                  placeholder="Wednesday, August 12, 2026"
                />
              ) : (
                <span>Trip Date: {formData.date}</span>
              )}
            </div>
          </div>

          {/* Cost Breakdown */}
          <div className="mt-6">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Wallet className="h-4 w-4 text-amber-600" /> Cost Breakdown per Student
            </p>
            <div className="rounded-xl border border-slate-200 p-4 bg-white">
              {formData.costBreakdown.map((item, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-1.5 text-sm border-b border-slate-100 last:border-none">
                  {isEdit ? (
                    <>
                      <input
                        type="text"
                        value={item.label}
                        onChange={(e) => updateCost(i, 'label', e.target.value)}
                        className="flex-1 rounded border border-dashed border-amber-300 bg-amber-50/40 px-2 py-1 text-xs outline-none"
                      />
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-slate-400">₹</span>
                        <input
                          type="text"
                          value={String(item.amount)}
                          onChange={(e) => updateCost(i, 'amount', e.target.value)}
                          className="w-16 rounded border border-dashed border-amber-300 bg-amber-50/40 px-2 py-1 text-right text-xs outline-none"
                        />
                      </div>
                      <button onClick={() => removeCost(i)} className="text-slate-300 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-slate-700">{item.label}</span>
                      <span className="font-mono font-semibold text-slate-900">₹{item.amount}</span>
                    </>
                  )}
                </div>
              ))}

              {isEdit && (
                <button
                  onClick={addCost}
                  className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
                >
                  <Plus className="h-3.5 w-3.5" /> Add cost item
                </button>
              )}

              <div className="mt-3 flex justify-between border-t border-slate-200 pt-2 text-sm font-bold">
                <span className="text-slate-900">Total Contribution</span>
                <span className="font-mono text-base text-blue-900">₹{totalCost}</span>
              </div>
            </div>
          </div>

          {/* What to Bring */}
          <div className="mt-6">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Backpack className="h-4 w-4 text-blue-600" /> What to Bring (Checklist)
            </p>
            <div className="flex flex-wrap gap-2">
              {formData.whatToBring.map((item, i) =>
                isEdit ? (
                  <span key={i} className="flex items-center gap-1 rounded-full border border-dashed border-amber-300 bg-amber-50/50 px-3 py-1">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => updateChecklistItem(i, e.target.value)}
                      className="w-28 bg-transparent text-xs outline-none font-medium text-slate-800"
                    />
                    <button onClick={() => removeChecklistItem(i)} className="text-slate-300 hover:text-rose-500">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                ) : (
                  <span key={i} className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-700 shadow-xs">
                    • {item}
                  </span>
                )
              )}
              {isEdit && (
                <button
                  onClick={addChecklistItem}
                  className="flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1 text-xs text-slate-500 hover:text-slate-700"
                >
                  <Plus className="h-3.5 w-3.5" /> Add item
                </button>
              )}
            </div>
          </div>

          {/* Trip Rules */}
          <div className="mt-6">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <ShieldCheck className="h-4 w-4 text-emerald-600" /> Rules & Safety Guidelines
            </p>
            <ul className="space-y-2">
              {formData.rules.map((rule, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-600" />
                  {isEdit ? (
                    <div className="flex flex-1 items-center gap-2">
                      <input
                        type="text"
                        value={rule}
                        onChange={(e) => updateRule(i, e.target.value)}
                        className="flex-1 rounded-md border border-dashed border-amber-300 bg-amber-50/40 px-2 py-1 text-sm outline-none"
                      />
                      <button onClick={() => removeRule(i)} className="text-slate-300 hover:text-rose-500">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <span>{rule}</span>
                  )}
                </li>
              ))}
            </ul>
            {isEdit && (
              <button
                onClick={addRule}
                className="mt-2 flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800"
              >
                <Plus className="h-3.5 w-3.5" /> Add rule item
              </button>
            )}
          </div>

          {/* Emergency Contact Numbers */}
          <div className="mt-6">
            <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <Phone className="h-4 w-4 text-blue-600" /> Emergency Contact Numbers
            </p>
            <div className="flex flex-wrap gap-4 rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-sm font-semibold text-slate-800">
              {isEdit ? (
                <div className="flex flex-wrap gap-3 w-full">
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 font-normal">Contact Phone 1 (Teacher)</label>
                    <input
                      type="text"
                      value={formData.phone1}
                      onChange={(e) => updateField('phone1', e.target.value)}
                      className="mt-1 w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs outline-none"
                      placeholder="+91 88753 33348"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-[11px] text-slate-500 font-normal">Contact Phone 2 (Optional)</label>
                    <input
                      type="text"
                      value={formData.phone2}
                      onChange={(e) => updateField('phone2', e.target.value)}
                      className="mt-1 w-full rounded border border-amber-300 bg-white px-2 py-1 text-xs outline-none"
                      placeholder="+91 89630 03348"
                    />
                  </div>
                </div>
              ) : (
                <span>
                  Primary Teacher Contact: <strong>{formData.phone1}</strong>
                  {formData.phone2 ? ` / ${formData.phone2}` : ''}
                </span>
              )}
            </div>
          </div>

          {/* Legal Consent & Signature Section */}
          {!isEdit && (
            <div className="mt-8">
              <div className="rounded-xl border border-amber-300 bg-amber-50/70 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-sm mb-2">
                  <ShieldCheck className="h-5 w-5 text-amber-700" />
                  Parent / Guardian Authorization & Digital Signature
                </div>
                <p className="text-xs leading-relaxed text-slate-800">
                  "I hereby give permission for my child to participate in the above official school field trip. I understand emergency procedures will be followed if required."
                </p>

                {permissionStatus === 'PENDING' && !isStudentView && (
                  <div className="mt-4 space-y-3">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-amber-900">
                      STEP 2: Capture Parent / Guardian Signature
                    </label>
                    <div className="border border-slate-300 rounded-lg bg-white overflow-hidden touch-none relative">
                       <span className="absolute top-2 left-2 text-xs text-slate-400 select-none">Interactive Signature Canvas</span>
                       <SignatureCanvas
                          ref={sigCanvas}
                          penColor="black"
                          canvasProps={{ className: "w-full h-40 cursor-crosshair" }}
                       />
                       <div className="absolute bottom-6 left-4 right-4 border-b-2 border-dashed border-slate-300 pointer-events-none opacity-50"></div>
                    </div>
                    <div className="mt-4 space-y-3">
                      <input
                        type="text"
                        placeholder="Type Full Name (For records)"
                        value={signatureNameInput}
                        onChange={(e) => setSignatureNameInput(e.target.value)}
                        className="w-full rounded-lg border border-amber-400 bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600"
                      />
                    </div>
                  </div>
                )}

                {signatureId && (
                  <div className="mt-3 flex items-center justify-between border-t border-amber-200/80 pt-2 text-xs text-amber-900">
                    <span>Parent Portal Digital Signature ID:</span>
                    <span className="font-mono font-bold text-blue-900">{signatureId}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons / Confirmed State */}
              {permissionStatus !== 'PENDING' ? (
                <div
                  className={`mt-4 flex items-center gap-3 rounded-xl border p-4 shadow-xs ${
                    permissionStatus === 'GRANTED'
                      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
                      : 'border-rose-200 bg-rose-50 text-rose-900'
                  }`}
                >
                  {permissionStatus === 'GRANTED' ? (
                    <CheckCircle2 className="h-6 w-6 text-emerald-600 shrink-0" />
                  ) : (
                    <XCircle className="h-6 w-6 text-rose-600 shrink-0" />
                  )}
                  <div className="flex-1 overflow-hidden">
                    <p className="text-sm font-bold">
                      {permissionStatus === 'GRANTED' ? 'Consent Permission Granted' : 'Consent Permission Declined'}
                    </p>
                    <div className="mt-3 flex flex-col sm:flex-row gap-4 sm:items-start">
                      {signatureData ? (
                        <div className="border border-slate-200 bg-white rounded-lg p-2 shrink-0 flex flex-col items-center min-w-[140px]">
                           <img src={signatureData} alt="Signature" className="h-12 object-contain" />
                           <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1 border-t border-slate-100 pt-1 w-full text-center">
                             {respondedByName || student.name}
                           </span>
                        </div>
                      ) : (
                        <div className="border border-slate-200 bg-white rounded-lg p-2 shrink-0 flex flex-col items-center justify-center h-16 px-4 min-w-[120px]">
                           <span className="font-cursive text-xl text-slate-700">{respondedByName || student.name}</span>
                           <span className="text-[9px] text-slate-400 mt-0.5 uppercase tracking-wider">Auto-Generated</span>
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-xs opacity-80 mt-1">
                          Signed by <strong>{respondedByName || student.name}</strong> • Recorded on{' '}
                          {respondedAt ? new Date(respondedAt).toLocaleString() : 'recently'}
                        </p>
                        {signatureId && (
                          <p className="text-[11px] font-mono mt-1 opacity-90 text-slate-600 break-all">
                            Signature verification hash: {signatureId}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ) : isStudentView ? (
                <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-4 text-center text-xs text-slate-500">
                  Consent status is currently <strong>PENDING PARENT SIGNATURE</strong>. Parents can log into the Parent Portal to sign.
                </div>
              ) : (
                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <button
                    onClick={handleClearSignature}
                    disabled={submitting}
                    className="flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 shrink-0"
                  >
                    <Trash2 className="h-4 w-4" /> Clear Pad
                  </button>
                  <button
                    disabled={!signatureNameInput.trim() || submitting}
                    onClick={() => handleParentSubmit('GRANTED')}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white shadow-md hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200"
                  >
                    {submitting ? (
                      <span className="flex items-center gap-2">
                        <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Submitting...
                      </span>
                    ) : (
                      <>
                        <CheckCircle2 className="h-4 w-4" /> SAVE & SUBMIT FINAL APPROVAL
                      </>
                    )}
                  </button>
                  <button
                    disabled={!signatureNameInput.trim() || submitting}
                    onClick={() => handleParentSubmit('DENIED')}
                    className="flex items-center justify-center gap-2 rounded-xl border border-rose-300 bg-white px-6 py-3 text-sm font-bold text-rose-600 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <XCircle className="h-4 w-4" /> Decline
                  </button>
                </div>
              )}
            </div>
          )}

          {isEdit && (
            <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-medium text-slate-500">
              Digital Signature & Parent Consent Authorization box appears automatically in Parent Preview mode — freezes for edits once Admin approves and dispatches.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
