'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, MessageSquare, X, Send, Bot, User, ArrowRight, CheckCircle2, ShieldCheck, Loader2 } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  model?: string;
  latencyMs?: number;
}

export function AuditCopilotDrawer({ engagementId }: { engagementId: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-0',
      role: 'assistant',
      content: 'Halo! Saya **FINOVA AI Copilot** (bertenaga model *Qwen 3.8 Reasoning*). Saya memegang seluruh konteks kertas kerja PT Nusantara Sukses Makmur untuk perikatan aktif Anda. Anda bisa menanyakan analisis SAK, selisih neraca, kepatuhan PSAK, atau justifikasi pemetaan akun.',
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      model: 'qwen3.8-nvfp4',
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = [...messages, userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/v1/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: history,
          engagementId,
        }),
      });

      const data = await res.json();

      if (data.success) {
        const assistantMsg: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          role: 'assistant',
          content: data.reply,
          timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
          model: data.model,
          latencyMs: data.latencyMs,
        };
        setMessages((prev) => [...prev, assistantMsg]);
      } else {
        throw new Error(data.error || 'Gagal berkomunikasi dengan AI');
      }
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-${Date.now()}-err`,
        role: 'assistant',
        content: `⚠️ Terjadi kendala saat menghubungi live model Qwen: ${err.message}. Pastikan endpoint vLLM aktif.`,
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickPrompts = [
    'Apakah persamaan neraca Aset = L + E sudah seimbang?',
    'Jelaskan alasan akun 2199-00 harus masuk ke WP-F.4 menurut PSAK 10',
    'Berapa laba bersih dan EBITDA PT Nusantara Sukses Makmur?',
  ];

  return (
    <>
      {/* Floating Trigger Button */}
      <button
        id="finova-copilot-trigger"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-2.5 rounded-full bg-[#102A32] hover:bg-[#0C7564] text-white shadow-xl hover:shadow-2xl transition-all border border-[#0F8F7A]/40 group cursor-pointer"
      >
        <div className="w-6 h-6 rounded-full bg-[#0F8F7A] flex items-center justify-center text-white shrink-0 group-hover:rotate-12 transition-transform">
          <Sparkles className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-bold tracking-tight">Tanya FINOVA AI</span>
        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
      </button>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 w-96 sm:w-[440px] h-[580px] bg-white rounded-2xl border-2 border-[#0F8F7A] shadow-2xl flex flex-col overflow-hidden animate-finova-in text-xs text-[#102A32]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-[#102A32] to-[#0F8F7A] text-white flex items-center justify-between shrink-0 shadow-xs">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                <Sparkles className="w-4 h-4 text-emerald-300" />
              </div>
              <div>
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  FINOVA AI Audit Copilot
                  <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-200 border border-emerald-400/30">
                    Live Qwen 3.8
                  </span>
                </h3>
                <p className="text-[10px] text-white/75">
                  Audit Workspace &bull; PT Nusantara Sukses Makmur
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-[#F6F7F5]/50">
            {messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex gap-2.5 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-lg bg-[#0F8F7A] text-white flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}
                  <div
                    className={`max-w-[82%] p-3 rounded-2xl space-y-1 ${
                      isUser
                        ? 'bg-[#102A32] text-white rounded-br-xs'
                        : 'bg-white border border-[#DDE4E2] text-[#102A32] shadow-xs rounded-bl-xs'
                    }`}
                  >
                    <p className="whitespace-pre-line leading-relaxed text-[11px]">{m.content}</p>
                    <div className="flex items-center justify-between text-[9px] text-[#7A8C93] pt-1">
                      <span>{m.timestamp}</span>
                      {m.latencyMs && (
                        <span className="font-mono text-[9px] text-[#0F8F7A]">
                          {m.latencyMs}ms ({m.model})
                        </span>
                      )}
                    </div>
                  </div>
                  {isUser && (
                    <div className="w-6 h-6 rounded-lg bg-[#52636A] text-white flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isLoading && (
              <div className="flex gap-2.5 items-center text-[#52636A]">
                <div className="w-6 h-6 rounded-lg bg-[#0F8F7A] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </div>
                <div className="p-3 rounded-2xl bg-white border border-[#DDE4E2] shadow-xs flex items-center gap-2 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#0F8F7A] animate-ping" />
                  <span>Qwen-3.8 sedang menelaah data kertas kerja...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts */}
          <div className="p-2.5 bg-white border-t border-[#DDE4E2] space-y-1.5">
            <div className="text-[10px] font-bold text-[#52636A] px-1">Pilihan Pertanyaan Cepat:</div>
            <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(qp)}
                  disabled={isLoading}
                  className="px-2.5 py-1 rounded-full bg-[#F6F7F5] hover:bg-[#E8F5F1] text-[#102A32] hover:text-[#0F8F7A] border border-[#DDE4E2] hover:border-[#0F8F7A] text-[10px] whitespace-nowrap transition-colors cursor-pointer shrink-0 disabled:opacity-50"
                >
                  {qp}
                </button>
              ))}
            </div>
          </div>

          {/* Input Bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 bg-white border-t border-[#DDE4E2] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Tanyakan analisis SAK, laba rugi, atau tie-out..."
              disabled={isLoading}
              className="flex-1 px-3 py-2 rounded-xl bg-[#F6F7F5] border border-[#DDE4E2] focus:border-[#0F8F7A] focus:outline-none text-xs text-[#102A32] disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="p-2 rounded-xl bg-[#0F8F7A] hover:bg-[#0C7564] text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-xs transition-colors cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
