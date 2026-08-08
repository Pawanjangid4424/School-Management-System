import React from 'react';

interface CodeBadgeProps {
  code: string;
  className?: string;
}

export const CodeBadge: React.FC<CodeBadgeProps> = ({ code, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center rounded-md border border-slate-200 bg-slate-50 px-2 py-1 font-mono text-xs text-slate-700 ${className}`}
    >
      {code}
    </span>
  );
};
