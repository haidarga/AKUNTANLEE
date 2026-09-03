'use client';

import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  CheckCircle2,
  Send,
  Clock,
  UserCheck,
  Sparkles,
} from 'lucide-react';
import { ReviewerNote } from '@/types/domain-v4';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  engagementId: string;
  targetLineId: string;
  targetLineLabel: string;
  notes: ReviewerNote[];
  onNoteAdded: (note: ReviewerNote) => void;
  onNoteResolved: (noteId: string) => void;
}

export function ReviewerNotesDrawer({
  isOpen,
  onClose,
  engagementId,
  targetLineId,
  targetLineLabel,
  notes,
  onNoteAdded,
  onNoteResolved,
}: DrawerProps) {
  const [newContent, setNewContent] = useState('');
  const [isSending, setIsSending] = useState(false);

  if (!isOpen) return null;

  const lineNotes = notes.filter((n) => n.targetLineId === targetLineId || targetLineId === 'ALL');

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContent.trim()) return;
    setIsSending(true);
    try {
      const res = await fetch(`/api/v1/engagements/${engagementId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLineId,
          content: newContent,
          userRole: 'senior',
        }),
      });
      const data = await res.json();
      if (data.success) {
        onNoteAdded(data.data);
        setNewContent('');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleResolve = async (noteId: string) => {
    try {
      const res = await fetch(`/api/v1/engagements/${engagementId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ noteId, userRole: 'partner' }),
      });
      const data = await res.json();
      if (data.success) {
        onNoteResolved(noteId);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-[#DDE4E2] shadow-2xl flex flex-col animate-finova-in text-xs">
      {/* Header */}
      <div className="p-5 bg-[#F6F7F5] border-b border-[#DDE4E2] flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#0F8F7A] text-white flex items-center justify-center font-bold">
            <MessageSquare className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-sm text-[#102A32]">
              Catatan Review Auditor
            </h3>
            <span className="font-mono text-[11px] text-[#52636A]">
              Pos: {targetLineId} &bull; {targetLineLabel}
            </span>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-[#7A8C93] hover:text-[#102A32] rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Notes List */}
      <div className="p-5 overflow-y-auto space-y-3 flex-1">
        {lineNotes.length === 0 ? (
          <div className="p-6 text-center bg-[#F6F7F5] rounded-2xl border border-[#DDE4E2] text-[#52636A]">
            Belum ada catatan review untuk pos akun ini.
          </div>
        ) : (
          lineNotes.map((note) => (
            <div key={note.id} className="p-4 rounded-2xl border border-[#DDE4E2] bg-white space-y-2 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 font-semibold text-[#102A32]">
                  <span className="px-2 py-0.5 rounded bg-[#F1F4F3] border border-[#DDE4E2] text-[10px] font-bold">
                    {note.authorRole.toUpperCase()}
                  </span>
                  <span>{note.authorName}</span>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  note.status === 'resolved' ? 'bg-[#ECFDF5] text-[#065F46]' : 'bg-[#FFF7E8] text-[#92400E]'
                }`}>
                  {note.status === 'resolved' ? '✓ Terselesaikan' : 'Perlu Tindak Lanjut'}
                </span>
              </div>

              <p className="text-xs text-[#102A32] leading-relaxed">
                {note.content}
              </p>

              <div className="flex items-center justify-between pt-2 border-t border-[#F1F4F3] text-[10px] text-[#7A8C93]">
                <span>{new Date(note.createdAt).toLocaleDateString('id-ID')}</span>
                {note.status !== 'resolved' && (
                  <button
                    onClick={() => handleResolve(note.id)}
                    className="text-[#0F8F7A] font-bold hover:underline cursor-pointer"
                  >
                    Tandai Selesai (Resolve)
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Input Box */}
      <form onSubmit={handleAddNote} className="p-4 bg-[#F6F7F5] border-t border-[#DDE4E2] flex items-center gap-2">
        <input
          type="text"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          placeholder="Tulis catatan review untuk tim..."
          className="flex-1 px-3.5 py-2.5 bg-white border border-[#DDE4E2] rounded-xl focus:ring-1 focus:ring-[#0F8F7A] focus:outline-none text-xs"
        />
        <button
          type="submit"
          disabled={isSending}
          className="px-4 py-2.5 bg-[#0F8F7A] text-white rounded-xl font-bold hover:bg-[#0C7564] shadow-xs cursor-pointer flex items-center gap-1.5"
        >
          <Send className="w-3.5 h-3.5" />
          <span>Kirim</span>
        </button>
      </form>
    </div>
  );
}
