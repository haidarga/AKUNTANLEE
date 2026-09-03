import type { Metadata } from 'next';
import './globals.css';
import { V4Shell } from '@/components/v4/V4Shell';
import { repo } from '@/lib/db/repo-v4';

export const metadata: Metadata = {
  title: 'FINOVA AI v4.0 — Release 0.1 Spreadsheet Workpaper Engine',
  description: 'Evidence-first accounting workpaper preparation, deterministic tie-outs, and verified XLSX exports.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const initialState = repo.getState();

  return (
    <html lang="id">
      <head>
        <script
          id="__FINOVA_INITIAL_STATE__"
          type="application/json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(initialState),
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#F6F7F5] text-[#102A32]">
        <V4Shell>{children}</V4Shell>
      </body>
    </html>
  );
}
