'use client';

import { repo } from '@/lib/db/repo-v4';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'motion/react';
import {
  Briefcase,
  Shield,
  Layers,
  Database,
  ChevronDown,
  UserCheck,
  Building,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { UserRoleV4 } from '@/types/domain-v4';

interface ShellProps {
  children: React.ReactNode;
}

export function V4Shell({ children }: ShellProps) {
  const pathname = usePathname();
  const [role, setRole] = useState<UserRoleV4>('senior');
  const [isRoleMenuOpen, setIsRoleMenuOpen] = useState(false);

  // Clean bypass for landing, onboarding, and login pages
  if (pathname === '/' || pathname === '/onboarding' || pathname === '/login') {
    return <>{children}</>;
  }

  useEffect(() => {
    const saved = localStorage.getItem('finova_v4_role');
    if (saved && ['preparer', 'senior', 'manager', 'partner'].includes(saved)) {
      setRole(saved as UserRoleV4);
    }
  }, []);

  const handleRoleChange = (newRole: UserRoleV4) => {
    setRole(newRole);
    localStorage.setItem('finova_v4_role', newRole);
    setIsRoleMenuOpen(false);
    window.dispatchEvent(new Event('storage'));
  };

  const roleMeta: Record<UserRoleV4, { label: string; name: string; avatar: string; color: string }> = {
    partner: { label: 'Audit Partner', name: 'Bambang Hendrawan, S.E., Ak., CPA', avatar: 'BH', color: 'bg-[#102A32] text-white' },
    manager: { label: 'Engagement Manager', name: 'Siti Rahmawati, S.E., M.Ak., CA', avatar: 'SR', color: 'bg-[#0F8F7A] text-white' },
    senior: { label: 'Senior In-Charge', name: 'Ahmad Pratama, S.Ak', avatar: 'AP', color: 'bg-[#0F8F7A] text-white' },
    preparer: { label: 'Preparer (Junior)', name: 'Budi Santoso, S.Ak', avatar: 'BS', color: 'bg-[#52636A] text-white' },
  };

  const activeMeta = roleMeta[role];

  return (
    <div className="min-h-screen bg-[#F6F7F5] flex flex-col antialiased text-[#102A32]">
      {/* Top Global Bar with Ambient Backdrop Blur */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#DDE4E2] px-4 sm:px-6 py-2.5 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Platform Identity */}
          <div className="flex items-center gap-3">
            <Link href="/engagements" className="flex items-center gap-2.5 group">
              <div className="w-8 h-8 rounded-lg bg-[#0F8F7A] text-white flex items-center justify-center font-bold text-xs shadow-sm transition-transform group-hover:scale-105">
                FN
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm tracking-tight text-[#102A32]">FINOVA AI</span>
                  <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                    v4.0 &bull; Rel 0.1
                  </span>
                </div>
              </div>
            </Link>

            <span className="text-[#DDE4E2] hidden md:inline">|</span>

            {/* Tenant Identity per PRD Section 41.1 */}
            <div className="hidden md:flex items-center gap-1.5 text-xs text-[#52636A]">
              <Building className="w-3.5 h-3.5 text-[#7A8C93]" />
              <Link href="/settings" className="font-semibold text-[#102A32] hover:text-[#0F8F7A] transition-colors flex items-center gap-1" title="Klik untuk ubah profil KAP"><span>{repo.getFirmProfile()?.name || "KAP Haidar & Rekan"}</span></Link>
            </div>
          </div>

          {/* Navigation & Persona Switcher */}
          <div className="flex items-center gap-3">
            {/* Global Nav Link */}
            <Link
              href="/engagements"
              className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition-all ${
                pathname.startsWith('/engagements') || pathname.startsWith('/engagements/new')
                  ? 'bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]'
                  : 'text-[#52636A] hover:text-[#102A32] hover:bg-black/5'
              }`}
            >
              <Briefcase className="w-3.5 h-3.5" />
              <span>Daftar Perikatan</span>
            </Link>

            {/* Role Persona Switcher per PRD Section 38 & 46 */}
            <div className="relative">
              <button
                onClick={() => setIsRoleMenuOpen(!isRoleMenuOpen)}
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-full border border-[#DDE4E2] bg-white hover:bg-[#F6F7F5] transition-all shadow-xs"
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${activeMeta.color}`}>
                  {activeMeta.avatar}
                </div>
                <div className="hidden sm:flex flex-col text-left">
                  <span className="text-[11px] font-bold text-[#102A32] leading-tight truncate max-w-[130px]">
                    {activeMeta.name.split(',')[0]}
                  </span>
                  <span className="text-[9px] text-[#52636A] leading-tight">
                    {activeMeta.label}
                  </span>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-[#7A8C93]" />
              </button>

              {/* Role Dropdown */}
              {isRoleMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl border border-[#DDE4E2] shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <div className="px-2.5 py-1.5 text-[10px] font-bold text-[#7A8C93] uppercase tracking-wider border-b border-[#DDE4E2]/60">
                    Ubah Persona Pengguna (RBAC Test)
                  </div>
                  {(['partner', 'manager', 'senior', 'preparer'] as UserRoleV4[]).map((r) => {
                    const item = roleMeta[r];
                    const isSelected = role === r;
                    return (
                      <button
                        key={r}
                        onClick={() => handleRoleChange(r)}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-left transition-colors ${
                          isSelected ? 'bg-[#E8F5F1] text-[#0F8F7A]' : 'hover:bg-[#F6F7F5] text-[#102A32]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-[10px] ${item.color}`}>
                            {item.avatar}
                          </div>
                          <div>
                            <div className="font-bold text-[11px]">{item.label}</div>
                            <div className="text-[10px] text-[#52636A]">{item.name.split(',')[0]}</div>
                          </div>
                        </div>
                        {isSelected && <CheckCircle2 className="w-4 h-4 text-[#0F8F7A]" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main App Content */}
      <main className="flex-1 flex flex-col">
        {children}
      </main>

      {/* Footer Audit Guarantee Bar */}
      <footer className="border-t border-[#DDE4E2] bg-white px-4 sm:px-6 py-2.5 text-[11px] text-[#7A8C93]">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#0F8F7A]" />
            <span>FINOVA AI v4.0 Release 0.1 &bull; Kertas Kerja & Standar Akuntansi Indonesia &bull; Server-Derived Tenant Isolation</span>
          </div>
          <div className="text-[10px]">
            Deterministic Math (Zero Float) &bull; Immutable Source Hash (SHA-256)
          </div>
        </div>
      </footer>
    </div>
  );
}
