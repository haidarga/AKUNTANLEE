'use client';

import React, { useState } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  Clock,
  ExternalLink,
  ShieldCheck,
  AlertTriangle,
  Search,
  FileSpreadsheet,
} from 'lucide-react';
import { db } from '@/lib/db/mock-db';
import { Document, ExtractionJob, Evidence } from '@/types/domain';
import { EvidenceDrawer } from '@/components/EvidenceDrawer';

export default function SmartDocumentHubPage() {
  const state = db.getState();
  const engagement = state.engagements[0];
  const [documents, setDocuments] = useState<Document[]>(state.documents);
  const [selectedEvidence, setSelectedEvidence] = useState<Evidence | null>(null);
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSimulateUpload = () => {
    setIsSimulatingUpload(true);
    setUploadProgress(0);

    const timer = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            const newDoc: Document = {
              id: `DOC-00${documents.length + 1}`,
              engagementId: engagement.id,
              name: 'SPT_Tahunan_Badan_1771_FY2024.pdf',
              fileSize: 845000,
              fileType: 'application/pdf',
              type: 'spt_tahunan',
              version: 1,
              uploadedByUserId: 'USR-SENIOR-01',
              isClientPbcUpload: false,
              evidenceItemsCount: 14,
              createdAt: new Date().toISOString(),
            };
            setDocuments([newDoc, ...documents]);
            setIsSimulatingUpload(false);
          }, 300);
          return 100;
        }
        return p + 20;
      });
    }, 120);
  };

  const handleInspectDoc = (doc: Document) => {
    const ev = state.evidenceList.find((e) => e.documentId === doc.id) || {
      id: `EVD-${doc.id}-01`,
      engagementId: engagement.id,
      documentId: doc.id,
      documentName: doc.name,
      fileType: doc.fileType,
      sheetName: 'Sheet1',
      cellReference: 'Sheet1!A1:H50',
      sourceValue: 'Ekstraksi Berhasil',
      normalizedValue: 52_400_000_000,
      confidence: 0.97,
      extractionMethod: 'deterministic_parse',
      snippetText: `Dokumen terverifikasi: ${doc.name} | Total Field Terekstraksi: ${doc.evidenceItemsCount}`,
      timestamp: new Date().toISOString(),
    };
    setSelectedEvidence(ev);
  };

  return (
    <div className="space-y-6">
      <EvidenceDrawer evidence={selectedEvidence} onClose={() => setSelectedEvidence(null)} />

      {/* Header & Upload Box */}
      <div className="bg-white p-5 rounded border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
        <div>
          <h1 className="text-base font-bold text-slate-900">
            Pusat Dokumen Cerdas (Smart Document Hub)
          </h1>
          <p className="text-slate-500 text-xs mt-0.5 max-w-2xl">
            Unggah, ekstraksi tabel & angka deterministik, klasifikasi tipe dokumen, serta pelacakan lineage koordinat sel untuk kertas kerja.
          </p>
        </div>

        <div>
          {isSimulatingUpload ? (
            <div className="w-48 bg-slate-100 p-2 rounded border border-slate-200 text-center">
              <div className="text-[10px] text-slate-600 font-semibold mb-1">
                OCR & Ekstraksi Deterministik... {uploadProgress}%
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden">
                <div className="bg-teal-700 h-1.5 transition-all" style={{ width: `${uploadProgress}%` }} />
              </div>
            </div>
          ) : (
            <button
              onClick={handleSimulateUpload}
              className="px-3.5 py-2 bg-[#0D5C75] hover:bg-[#09475C] text-white rounded font-semibold flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <UploadCloud className="w-4 h-4" />
              Unggah Dokumen Tambahan
            </button>
          )}
        </div>
      </div>

      {/* Document List */}
      <div className="bg-white rounded border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-3.5 bg-slate-50 border-b border-slate-200 font-semibold text-xs text-slate-800 flex items-center justify-between">
          <span>Daftar Berkas & Status Ekstraksi ({documents.length} Dokumen)</span>
          <span className="text-[11px] font-normal text-slate-500 font-mono">
            Pipeline: finova-doc-extractor-v3.0
          </span>
        </div>

        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-slate-600 font-semibold text-[11px]">
              <th className="py-2.5 px-3 border-r border-slate-200">Nama Dokumen</th>
              <th className="py-2.5 px-3 border-r border-slate-200">Tipe Dokumen</th>
              <th className="py-2.5 px-3 text-center border-r border-slate-200">Ukuran</th>
              <th className="py-2.5 px-3 text-center border-r border-slate-200">Status Ekstraksi</th>
              <th className="py-2.5 px-3 text-center border-r border-slate-200">Keyakinan (Confidence)</th>
              <th className="py-2.5 px-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {documents.map((doc) => {
              const job = state.extractionJobs.find((j) => j.documentId === doc.id);
              return (
                <tr key={doc.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-2.5 px-3 border-r border-slate-200 font-medium text-slate-900">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="w-4 h-4 text-teal-700 shrink-0" />
                      <div>
                        <div className="font-semibold">{doc.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">
                          ID: {doc.id} &bull; Diunggah: {new Date(doc.createdAt).toLocaleDateString('id-ID')}
                        </div>
                      </div>
                    </div>
                  </td>

                  <td className="py-2.5 px-3 border-r border-slate-200">
                    <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                      {doc.type.replace('_', ' ')}
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center font-mono text-slate-600 border-r border-slate-200">
                    {(doc.fileSize / 1024).toFixed(0)} KB
                  </td>

                  <td className="py-2.5 px-3 text-center border-r border-slate-200">
                    <span className="inline-flex items-center gap-1 font-semibold text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      Terekstraksi ({doc.evidenceItemsCount} Field)
                    </span>
                  </td>

                  <td className="py-2.5 px-3 text-center border-r border-slate-200 font-semibold font-mono text-emerald-700">
                    {job ? `${(job.confidenceScore * 100).toFixed(0)}%` : '98%'}
                  </td>

                  <td className="py-2.5 px-3 text-center">
                    <button
                      onClick={() => handleInspectDoc(doc)}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-medium text-[11px] inline-flex items-center gap-1 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Inspeksi Bukti
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
