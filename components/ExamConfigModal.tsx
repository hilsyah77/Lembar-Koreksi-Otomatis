'use client';

import React, { useState } from 'react';
import { Layers, CheckCircle2, Save, X, Plus, Key, Sparkles, Sliders } from 'lucide-react';
import { ExamConfig, ExamPacket, OptionLetter } from '@/types/omr';

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamConfig;
  onSaveExam: (updated: ExamConfig) => void;
}

export const ExamConfigModal: React.FC<ExamConfigModalProps> = ({
  isOpen,
  onClose,
  exam,
  onSaveExam
}) => {
  const [form, setForm] = useState<ExamConfig>({ ...exam });
  const [activePacketIndex, setActivePacketIndex] = useState<number>(0);
  const [quickKeyString, setQuickKeyString] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const currentPacket = form.packets[activePacketIndex] || form.packets[0];

  const handleKeyChange = (questionNo: number, option: OptionLetter) => {
    const updatedPackets = [...form.packets];
    const currentKeys = { ...updatedPackets[activePacketIndex].keys };
    currentKeys[questionNo] = option;
    updatedPackets[activePacketIndex].keys = currentKeys;
    setForm({ ...form, packets: updatedPackets });
  };

  const handleApplyQuickKeyString = () => {
    if (!quickKeyString) return;
    const clean = quickKeyString.toUpperCase().replace(/[^A-E]/g, '');
    const newKeys: Record<number, OptionLetter> = {};
    for (let i = 0; i < Math.min(form.totalQuestions, clean.length); i++) {
      newKeys[i + 1] = clean[i] as OptionLetter;
    }

    const updatedPackets = [...form.packets];
    updatedPackets[activePacketIndex].keys = { ...updatedPackets[activePacketIndex].keys, ...newKeys };
    setForm({ ...form, packets: updatedPackets });
    setQuickKeyString('');
  };

  const handleAddPacket = () => {
    const nextCode = String.fromCharCode(65 + form.packets.length); // 'B', 'C', 'D'
    if (form.packets.length >= 4) return;

    const newPacket: ExamPacket = {
      packetCode: nextCode,
      keys: { ...form.packets[0].keys }
    };

    setForm({
      ...form,
      packets: [...form.packets, newPacket]
    });
    setActivePacketIndex(form.packets.length);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveExam({
      ...form,
      updatedAt: new Date().toISOString()
    });
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Kunci Jawaban & Bobot Penilaian Ujian
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Atur kunci jawaban per paket soal (Paket A, B, C, D) dan bobot kelulusan KKM.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Exam Details */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Judul Penilaian / Asesmen</label>
              <input
                type="text"
                required
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-semibold focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mata Pelajaran & Kelas</label>
              <input
                type="text"
                required
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Batas KKM (Kelulusan)</label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.kkm}
                onChange={(e) => setForm({ ...form, kkm: parseInt(e.target.value) || 75 })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-900 font-bold focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
          </div>

          {/* Packet Selector Tabs */}
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <span className="text-slate-600 font-semibold">Paket Soal:</span>
              {form.packets.map((pkt, idx) => (
                <button
                  key={pkt.packetCode}
                  type="button"
                  onClick={() => setActivePacketIndex(idx)}
                  className={`px-3.5 py-1.5 rounded-lg font-bold transition-all text-xs ${
                    activePacketIndex === idx
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  Paket {pkt.packetCode}
                </button>
              ))}

              {form.packets.length < 4 && (
                <button
                  type="button"
                  onClick={handleAddPacket}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-600" /> Tambah Paket
                </button>
              )}
            </div>

            {/* Quick Paste String */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Tempel string kunci (e.g. CABDE...)"
                value={quickKeyString}
                onChange={(e) => setQuickKeyString(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono w-48 text-[11px] focus:outline-none focus:border-blue-500 focus:bg-white"
              />
              <button
                type="button"
                onClick={handleApplyQuickKeyString}
                className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg font-bold text-[11px] transition-colors shadow-xs"
              >
                Terapkan
              </button>
            </div>
          </div>

          {/* Question Keys Grid */}
          <div className="space-y-2">
            <div className="flex justify-between text-slate-600 font-semibold">
              <span>Klik huruf kunci jawaban untuk Paket {currentPacket.packetCode}:</span>
              <span className="text-slate-500 font-medium">Total {form.totalQuestions} Butir Soal</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1">
              {Array.from({ length: form.totalQuestions }).map((_, idx) => {
                const qNo = idx + 1;
                const activeKey = currentPacket.keys[qNo] || 'A';
                const options: OptionLetter[] = form.optionsCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

                return (
                  <div
                    key={qNo}
                    className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between shadow-xs"
                  >
                    <span className="font-bold text-slate-700 w-6">#{qNo}</span>
                    <div className="flex gap-1">
                      {options.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleKeyChange(qNo, opt)}
                          className={`w-5 h-5 rounded-full text-[10px] font-bold transition-all ${
                            activeKey === opt
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Kunci Disimpan!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Kunci Jawaban
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
