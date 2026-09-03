'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Building2,
  Users,
  CheckSquare,
  BarChart3,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { UserRole } from '@/types/domain';

export const USER_PERSONAS: { role: UserRole; name: string; title: string; firm: string }[] = [
  { role: 'partner', name: 'Bambang Hendrawan, CPA', title: 'Audit & Advisory Partner', firm: 'KAP Tanudiredja' },
  { role: 'manager', name: 'Siti Rahmawati, CPA', title: 'Senior Engagement Manager', firm: 'KAP Tanudiredja' },
  { role: 'senior', name: 'Ahmad Pratama, S.Ak', title: 'Senior Field Auditor', firm: 'KAP Tanudiredja' },
  { role: 'preparer', name: 'Dewi Lestari, S.Ak', title: 'Junior Audit Associate', firm: 'KAP Tanudiredja' },
  { role: 'tax_consultant', name: 'Rizky Ramadhan, BKP', title: 'Senior Tax Specialist', firm: 'KAP Tanudiredja' },
  { role: 'client_guest', name: 'Budi Hartono', title: 'Finance Director (PT NSM)', firm: 'Client Guest' },
];

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname();
  const [activeRole, setActiveRole] = useState<UserRole>('partner');
  const [showRoleMenu, setShowRoleMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('finova_active_role');
    if (saved) {
      setActiveRole(saved as UserRole);
    }
  }, []);

  const handleSelectRole = (role: UserRole) => {
    setActiveRole(role);
    localStorage.setItem('finova_active_role', role);
    setShowRoleMenu(false);
  };

  // If in isolated client guest portal, do not render internal audit firm shell
  if (pathname.startsWith('/portal')) {
    return <main className="min-h-screen bg-slate-50">{children}</main>;
  }

  const currentPersona = USER_PERSONAS.find((p) => p.role === activeRole) || USER_PERSONAS[0];

  const navItems = [
    { label: 'Home', href: '/', icon: Layers },
    { label: 'Clients & Engagements', href: '/clients', icon: Building2 },
    { label: 'Advisory Insights', href: '/engagements/ENG-2025-01/analysis', icon: BarChart3 },
    { label: 'Review Tasks', href: '/engagements/ENG-2025-01/findings', icon: CheckSquare },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-900">
      {/* Top Professional Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Brand and Firm Identity */}
            <div className="flex items-center gap-6">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-7 h-7 rounded bg-[#0D5C75] text-white flex items-center justify-center font-bold text-sm tracking-wider">
                  FN
                </div>
                <div className="flex flex-col">
                  <div className="text-sm font-bold tracking-tight text-slate-900 flex items-center gap-1.5">
                    FINOVA AI <span className="text-[10px] uppercase font-semibold bg-teal-50 text-teal-800 px-1.5 py-0.2 rounded border border-teal-200">v3.0</span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-medium">Operating System for Accounting & Tax</div>
                </div>
              </Link>

              {/* Firm Tag */}
              <div className="hidden md:flex items-center gap-1.5 text-xs text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
                <Building2 className="w-3.5 h-3.5 text-slate-500" />
                <span className="font-semibold text-slate-800">KAP Tanudiredja, Wibisana, Rintis & Rekan</span>
              </div>
            </div>

            {/* Global Navigation */}
            <nav className="hidden md:flex items-center gap-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                return (
                  <Link
                    key={item.label}
                    href={item.href}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-medium transition-colors ${
                      isActive
                        ? 'bg-teal-50 text-teal-900 border border-teal-200 font-semibold'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5 text-slate-500" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Persona Switcher for Live RBAC Testing */}
            <div className="relative">
              <button
                onClick={() => setShowRoleMenu(!showRoleMenu)}
                className="flex items-center gap-2 px-2.5 py-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 text-xs transition-colors"
                title="Ganti Persona untuk Menguji Hak Akses Server-Side"
              >
                <div className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center font-bold text-[10px]">
                  {activeRole === 'partner' ? 'PT' : activeRole === 'manager' ? 'MG' : activeRole === 'senior' ? 'SR' : activeRole === 'tax_consultant' ? 'TX' : activeRole === 'client_guest' ? 'CL' : 'AS'}
                </div>
                <div className="text-left hidden sm:block">
                  <div className="font-semibold text-slate-800 leading-tight">{currentPersona.name}</div>
                  <div className="text-[10px] text-teal-700 font-medium">{currentPersona.title}</div>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Dropdown Menu */}
              {showRoleMenu && (
                <div className="absolute right-0 mt-1 w-64 bg-white rounded border border-slate-200 shadow-lg py-1 z-50">
                  <div className="px-3 py-1.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Pilih Persona (Simulasi RBAC)
                  </div>
                  {USER_PERSONAS.map((p) => (
                    <button
                      key={p.role}
                      onClick={() => handleSelectRole(p.role)}
                      className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 transition-colors ${
                        activeRole === p.role ? 'bg-teal-50/70 text-teal-900 font-semibold' : 'text-slate-700'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-slate-900">{p.name}</div>
                        <div className="text-[10px] text-slate-500">{p.title}</div>
                      </div>
                      <span className="text-[10px] uppercase font-mono px-1 rounded bg-slate-100 text-slate-600 border border-slate-200">
                        {p.role}
                      </span>
                    </button>
                  ))}
                  <div className="px-3 py-1.5 border-t border-slate-100 text-[10px] text-slate-500">
                    Otorisasi diverifikasi ketat di layer server & data.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col">{children}</main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-3 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            FINOVA AI v3.0 Advisory Intelligence &copy; 2026. Standar SAK/PSAK &bull; SPAP &bull; UU Harmonisasi Peraturan Perpajakan (HPP).
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="text-emerald-700 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Deterministic Engine Active
            </span>
            <span>Zero Floating-Point Precision</span>
            <span>Tenant Isolation Verified</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
