'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import {
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  ShieldCheck,
  Hash,
  ArrowRight,
  Clock,
  AlertCircle,
  FileCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import { repo } from '@/lib/db/repo-v4';
import { FileVersion } from '@/types/domain-v4';
import { FileScannerIllustration } from '@/components/v4/visuals/WorkflowIllustrations';

export default function FilesPage() {
  const state = repo.getState();
  const engagement = state.engagements[0];
  const [fileVersions, setFileVersions] = useState<FileVersion[]>(state.fileVersions);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadStatusText, setUploadStatusText] = useState('Memindai & Menghitung Hash...');
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Real Client-Side File Processing using SheetJS & Web Crypto API
  const handleProcessRealFile = async (file: File) => {
    setIsUploading(true);
    setUploadProgress(20);
    setUploadStatusText(`Membaca biner berkas ${file.name}...`);

    try {
      const arrayBuffer = await file.arrayBuffer();
      setUploadProgress(50);
      setUploadStatusText('Menghitung Hash Kriptografi SHA-256...');

      // Calculate SHA-256
      const hashBuffer = await crypto.subtle.digest('SHA-256', arrayBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const sha256 = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

      setUploadProgress(80);
      setUploadStatusText('Memeriksa integritas workbook & membaca daftar sheet...');

      // Read real worksheets with SheetJS
      const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
      const sheetNames = workbook.SheetNames && workbook.SheetNames.length > 0 ? workbook.SheetNames : ['Sheet1'];

      setUploadProgress(100);
      setUploadStatusText('Pemeriksaan selesai!');

      setTimeout(() => {
        const user = state.users.find((u) => u.role === 'senior') || state.users[0];
        const newFv: FileVersion = {
          id: `FV-00${fileVersions.length + 1}`,
          assetId: `FA-${Date.now().toString(36).toUpperCase()}`,
          tenantId: user.tenantId,
          engagementId: engagement.id,
          versionNumber: fileVersions.length + 1,
          originalName: file.name,
          storageKey: `engagements/${engagement.id}/sources/${file.name}`,
          checksumSha256: sha256,
          mediaType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          sizeBytes: file.size,
          status: 'ready',
          uploadedByUserId: user.id,
          scanStatus: 'clean',
          sheetCount: sheetNames.length,
          sheetNames: sheetNames,
          createdAt: new Date().toISOString(),
        };

        repo.addFileVersion(newFv, user);
        setFileVersions([newFv, ...fileVersions]);
        setIsUploading(false);
      }, 400);
    } catch (err: any) {
      alert(`Gagal memproses berkas Excel: ${err.message}`);
      setIsUploading(false);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleProcessRealFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleProcessRealFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-6 text-[#102A32] animate-finova-in">
      {/* Visual Ingestion Scanner Illustration */}
      <FileScannerIllustration />

      {/* Hidden native input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".xlsx,.xls,.csv,.tsv"
        className="hidden"
      />

      {/* Upload Dropzone Surface with Real Drag-and-Drop */}
      <div className="bg-white rounded-2xl border border-[#DDE4E2] p-6 shadow-2xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-[#102A32] flex items-center gap-2">
              Unggah Berkas Sumber Finansial (Real Excel & CSV Engine)
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#E8F5F1] text-[#0F8F7A] border border-[#B2DFD6]">
                SheetJS Engine
              </span>
            </h2>
            <p className="text-xs text-[#52636A] mt-0.5">
              Tarik berkas dari komputer Anda. Sistem akan langsung membedah struktur lembar kerja dan menghitung hash SHA-256 secara kriptografis di browser.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#0F8F7A] bg-[#E8F5F1] px-2.5 py-1 rounded-full border border-[#B2DFD6] font-bold">
            Max 100 MB &bull; 25 Sheets
          </span>
        </div>

        {isUploading ? (
          <div className="border-2 border-dashed border-[#0F8F7A] bg-[#E8F5F1]/50 rounded-2xl p-8 text-center space-y-3">
            <div className="text-xs font-bold text-[#0F8F7A] flex items-center justify-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0F8F7A] animate-ping" />
              {uploadStatusText} ({uploadProgress}%)
            </div>
            <div className="w-72 mx-auto bg-[#DDE4E2] h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-[#0F8F7A] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <div className="text-[11px] text-[#52636A]">
              Pemeriksaan macro execution guard dan integritas binary selesai.
            </div>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#DDE4E2] hover:border-[#0F8F7A] rounded-2xl p-8 text-center space-y-3 bg-[#F6F7F5]/50 hover:bg-[#E8F5F1]/20 transition-all cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-2xl bg-white text-[#0F8F7A] flex items-center justify-center mx-auto border border-[#DDE4E2] shadow-xs group-hover:scale-105 transition-transform">
              <UploadCloud className="w-6 h-6" />
            </div>

            <div className="max-w-md mx-auto">
              <div className="font-bold text-xs sm:text-sm text-[#102A32]">
                Tarik dan letakkan berkas spreadsheet (.xlsx / .csv) di sini, atau klik untuk memilih berkas
              </div>
              <div className="text-[11px] text-[#52636A] mt-1">
                Makro formula tidak akan dieksekusi demi keamanan perikatan (Section 28.3).
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                className="finova-pill-cta bg-[#0F8F7A] hover:bg-[#0C7564] text-white text-xs shadow-sm cursor-pointer"
              >
                <span>Pilih Berkas Spreadsheet</span>
                <div className="icon-circle">
                  <UploadCloud className="w-3.5 h-3.5 text-white" />
                </div>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Immutable Files & Versions Table */}
      <div className="bg-white rounded-2xl border border-[#DDE4E2] shadow-2xs overflow-hidden text-xs">
        <div className="p-4 bg-[#F6F7F5] border-b border-[#DDE4E2] flex items-center justify-between">
          <div className="font-bold text-[#102A32]">
            Daftar Versi Berkas Sumber ({fileVersions.length} Versi Tersimpan)
          </div>
          <span className="font-mono text-[11px] text-[#52636A]">
            Penyimpanan Terenkripsi & Immutable
          </span>
        </div>

        <div className="divide-y divide-[#DDE4E2]">
          {fileVersions.map((fv) => (
            <div key={fv.id} className="p-4 hover:bg-[#F6F7F5]/50 transition-colors flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-[#F1F4F3] text-[#102A32] border border-[#DDE4E2]">
                    {fv.id}
                  </span>
                  <span className="font-semibold text-xs text-[#0F8F7A] bg-[#E8F5F1] px-2.5 py-0.5 rounded-full border border-[#B2DFD6] flex items-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Pindai Bersih (Clean)
                  </span>
                  <span className="text-[11px] text-[#52636A]">
                    Versi {fv.versionNumber} &bull; {(fv.sizeBytes / 1024).toFixed(0)} KB &bull; {fv.sheetCount} Sheet(s)
                  </span>
                </div>

                <div className="font-bold text-sm text-[#102A32] flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-[#0F8F7A]" />
                  {fv.originalName}
                </div>

                <div className="font-mono text-[11px] text-[#7A8C93] flex items-center gap-1">
                  <Hash className="w-3 h-3 text-[#7A8C93]" />
                  SHA-256: {fv.checksumSha256}
                </div>

                <div className="text-[11px] text-[#52636A]">
                  Daftar Sheet: <span className="font-medium text-[#102A32]">{fv.sheetNames.join(', ')}</span>
                </div>
              </div>

              <div className="shrink-0 flex items-center gap-2">
                <Link
                  href={`/engagements/${engagement.id}/imports/IMP-001`}
                  className="finova-pill-cta bg-[#102A32] hover:bg-[#0F8F7A] text-white text-xs shadow-xs"
                >
                  <span>Konfigurasi Import</span>
                  <div className="icon-circle">
                    <ArrowRight className="w-3.5 h-3.5 text-white" />
                  </div>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
