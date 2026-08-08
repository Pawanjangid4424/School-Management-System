import React from 'react';

export type StatusVariant = 'active' | 'pending' | 'inactive' | 'error';

interface StatusPillProps {
  status: StatusVariant | string;
  label?: string;
}

export const StatusPill: React.FC<StatusPillProps> = ({ status, label }) => {
  const normalized = status.toLowerCase();

  let bgClass = 'bg-slate-50 border-slate-200 text-slate-700';
  let dotClass = 'bg-slate-400';

  if (normalized === 'active' || normalized === 'success' || normalized === 'approved') {
    bgClass = 'bg-emerald-50 border-emerald-200 text-emerald-700';
    dotClass = 'bg-emerald-500';
  } else if (normalized === 'pending' || normalized === 'warning') {
    bgClass = 'bg-amber-50 border-amber-200 text-amber-700';
    dotClass = 'bg-amber-500';
  } else if (normalized === 'inactive' || normalized === 'error' || normalized === 'danger' || normalized === 'rejected') {
    bgClass = 'bg-rose-50 border-rose-200 text-rose-700';
    dotClass = 'bg-rose-500';
  }

  const displayText = label || status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${bgClass}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      {displayText}
    </span>
  );
};
