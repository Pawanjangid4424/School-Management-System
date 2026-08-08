import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'School ERP System',
  description: 'Enterprise School Management & Information System',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-slate-50 text-slate-900 antialiased selection:bg-amber-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
