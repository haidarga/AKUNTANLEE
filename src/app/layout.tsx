import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/AppShell';

export const metadata: Metadata = {
  title: 'FINOVA AI v3.0 — AI Operating System for Accounting & Financial Advisory',
  description: 'Automate the work. Elevate the judgment. Platform kecerdasan akuntansi, rekonsiliasi pajak deterministik, dan konsultasi keuangan Indonesia.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-slate-50 text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
