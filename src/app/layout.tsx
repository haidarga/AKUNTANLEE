import type { Metadata } from 'next';
import './globals.css';
import { V4Shell } from '@/components/v4/V4Shell';

export const metadata: Metadata = {
  title: 'FINOVA AI v4.0 — Release 0.1 Spreadsheet Workpaper Engine',
  description: 'Evidence-first accounting workpaper preparation, deterministic tie-outs, and verified XLSX exports.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className="antialiased min-h-screen bg-[#F6F7F5] text-[#102A32]">
        <V4Shell>{children}</V4Shell>
      </body>
    </html>
  );
}
