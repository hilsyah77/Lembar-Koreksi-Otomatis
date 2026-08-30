'use client';

import React, { useState, useEffect } from 'react';
import { 
  Layers, 
  CheckCircle2, 
  Save, 
  X, 
  Plus, 
  Trash2, 
  Key, 
  Sliders, 
  Copy, 
  Wand2,
  ChevronDown,
  ListFilter,
  FileCheck2,
  Eye,
  Sparkles,
  ClipboardCopy,
  BookOpen
} from 'lucide-react';
import { ExamConfig, ExamPacket, OptionLetter } from '@/types/omr';

interface ExamConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  exam: ExamConfig;
  exams?: ExamConfig[];
  onSelectExam?: (id: string) => void;
  onSaveExam: (updated: ExamConfig) => void;
  onAddNewExam?: (newExam: ExamConfig) => void;
  onDeleteExam?: (id: string) => void;
}

// Helper to construct fully sanitized ExamConfig state with all keys initialized
export const sanitizeExamForm = (exam: ExamConfig): ExamConfig => {
  const totalQ = Math.max(1, Math.min(100, exam?.totalQuestions || 25));
  const optCount: 4 | 5 = exam?.optionsCount === 4 ? 4 : 5;

  const rawPackets = exam?.packets && exam.packets.length > 0
    ? exam.packets
    : [{ packetCode: 'A', keys: {} }];

  const sanitizedPackets: ExamPacket[] = rawPackets.map(pkt => {
    const keys: Record<number, OptionLetter> = { ...(pkt.keys || {}) };
    for (let i = 1; i <= totalQ; i++) {
      if (!keys[i]) {
        keys[i] = 'A';
      }
      if (optCount === 4 && keys[i] === 'E') {
        keys[i] = 'D';
      }
    }
    return {
      packetCode: pkt.packetCode || 'A',
      keys
    };
  });

  const weights: Record<number, number> = { ...(exam?.questionWeights || {}) };
  for (let i = 1; i <= totalQ; i++) {
    if (weights[i] === undefined) {
      weights[i] = 1;
    }
  }

  return {
    ...exam,
    totalQuestions: totalQ,
    optionsCount: optCount,
    packets: sanitizedPackets,
    questionWeights: weights
  };
};

export const ExamConfigModal: React.FC<ExamConfigModalProps> = ({
  isOpen,
  onClose,
  exam,
  exams = [],
  onSelectExam,
  onSaveExam,
  onAddNewExam,
  onDeleteExam
}) => {
  const [form, setForm] = useState<ExamConfig>(() => sanitizeExamForm(exam));
  const [activePacketIndex, setActivePacketIndex] = useState<number>(0);
  const [quickKeyString, setQuickKeyString] = useState<string>('');
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [toastMsg, setToastMsg] = useState<{ text: string; sub?: string } | null>(null);
  const [viewKeySummary, setViewKeySummary] = useState<boolean>(true);
  const [copiedPacket, setCopiedPacket] = useState<string | null>(null);

  const [prevExam, setPrevExam] = useState(exam);
  if (exam && exam !== prevExam) {
    setPrevExam(exam);
    setForm(sanitizeExamForm(exam));
    setActivePacketIndex(0);
  }

  if (!isOpen) return null;

  const currentPacket = form.packets[activePacketIndex] || form.packets[0] || { packetCode: 'A', keys: {} };
  const options: OptionLetter[] = form.optionsCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

  const showNotification = (text: string, sub?: string) => {
    setToastMsg({ text, sub });
    setTimeout(() => setToastMsg(null), 3500);
  };

  // Switch to another exam title from dropdown
  const handleDropdownExamChange = (selectedId: string) => {
    if (onSelectExam) {
      onSelectExam(selectedId);
    }
    const targetExam = exams.find(e => e.id === selectedId);
    if (targetExam) {
      setForm(sanitizeExamForm(targetExam));
      setActivePacketIndex(0);
      showNotification(`Memuat asesmen: "${targetExam.title}"`, `${targetExam.totalQuestions} butir soal • ${targetExam.packets?.length || 1} paket`);
    }
  };

  // Change single question answer key
  const handleKeyChange = (questionNo: number, option: OptionLetter) => {
    const updatedPackets = [...form.packets];
    const currentKeys = { ...updatedPackets[activePacketIndex].keys };
    currentKeys[questionNo] = option;
    updatedPackets[activePacketIndex] = {
      ...updatedPackets[activePacketIndex],
      keys: currentKeys
    };
    setForm({ ...form, packets: updatedPackets });
  };

  // Change total questions count (1 - 100)
  const handleTotalQuestionsChange = (newTotal: number) => {
    const clamped = Math.max(1, Math.min(100, newTotal || 1));
    const updatedPackets = form.packets.map(pkt => {
      const keys: Record<number, OptionLetter> = { ...pkt.keys };
      for (let i = 1; i <= clamped; i++) {
        if (!keys[i]) {
          keys[i] = 'A';
        }
        if (form.optionsCount === 4 && keys[i] === 'E') {
          keys[i] = 'D';
        }
      }
      return { ...pkt, keys };
    });

    const updatedWeights: Record<number, number> = { ...form.questionWeights };
    for (let i = 1; i <= clamped; i++) {
      if (updatedWeights[i] === undefined) updatedWeights[i] = 1;
    }

    setForm({
      ...form,
      totalQuestions: clamped,
      packets: updatedPackets,
      questionWeights: updatedWeights
    });
    showNotification(`Jumlah butir soal disetel ke ${clamped} butir`);
  };

  // Change options count (4 vs 5)
  const handleOptionsCountChange = (count: 4 | 5) => {
    const updatedPackets = form.packets.map(pkt => {
      const keys = { ...pkt.keys };
      if (count === 4) {
        Object.keys(keys).forEach(k => {
          const qNum = Number(k);
          if (keys[qNum] === 'E') {
            keys[qNum] = 'D';
          }
        });
      }
      return { ...pkt, keys };
    });

    setForm({
      ...form,
      optionsCount: count,
      packets: updatedPackets
    });
    showNotification(`Format pilihan disetel ke ${count} pilihan (A-${count === 4 ? 'D' : 'E'})`);
  };

  // Apply Quick Key String (e.g. CABDE...)
  const handleApplyQuickKeyString = () => {
    if (!quickKeyString.trim()) return;
    const clean = quickKeyString.toUpperCase().replace(/[^A-E]/g, '');
    if (clean.length === 0) return;

    const newKeys: Record<number, OptionLetter> = { ...currentPacket.keys };
    const limit = Math.min(form.totalQuestions, clean.length);

    for (let i = 0; i < limit; i++) {
      let opt = clean[i] as OptionLetter;
      if (form.optionsCount === 4 && opt === 'E') opt = 'D';
      newKeys[i + 1] = opt;
    }

    const updatedPackets = [...form.packets];
    updatedPackets[activePacketIndex] = {
      ...updatedPackets[activePacketIndex],
      keys: newKeys
    };

    setForm({ ...form, packets: updatedPackets });
    setQuickKeyString('');
    showNotification(`Berhasil menerapkan ${limit} kunci jawaban ke Paket ${currentPacket.packetCode}`);
  };

  // Quick fill all keys in active packet with single letter
  const handleFillAllWith = (letter: OptionLetter) => {
    const newKeys: Record<number, OptionLetter> = {};
    for (let i = 1; i <= form.totalQuestions; i++) {
      newKeys[i] = letter;
    }
    const updatedPackets = [...form.packets];
    updatedPackets[activePacketIndex] = {
      ...updatedPackets[activePacketIndex],
      keys: newKeys
    };
    setForm({ ...form, packets: updatedPackets });
    showNotification(`Semua kunci Paket ${currentPacket.packetCode} diset ke '${letter}'`);
  };

  // Generate alternating pattern (A, B, C, D, E...)
  const handleGeneratePattern = () => {
    const patternOptions: OptionLetter[] = form.optionsCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
    const newKeys: Record<number, OptionLetter> = {};
    for (let i = 1; i <= form.totalQuestions; i++) {
      newKeys[i] = patternOptions[(i - 1) % patternOptions.length];
    }
    const updatedPackets = [...form.packets];
    updatedPackets[activePacketIndex] = {
      ...updatedPackets[activePacketIndex],
      keys: newKeys
    };
    setForm({ ...form, packets: updatedPackets });
    showNotification(`Pola kunci berulang (A-${form.optionsCount === 4 ? 'D' : 'E'}) diterapkan ke Paket ${currentPacket.packetCode}`);
  };

  // Copy keys from Packet A
  const handleCopyFromPacketA = () => {
    if (activePacketIndex === 0) return;
    const packetA = form.packets[0];
    if (!packetA) return;

    const updatedPackets = [...form.packets];
    updatedPackets[activePacketIndex] = {
      ...updatedPackets[activePacketIndex],
      keys: { ...packetA.keys }
    };
    setForm({ ...form, packets: updatedPackets });
    showNotification(`Kunci dari Paket A berhasil disalin ke Paket ${currentPacket.packetCode}`);
  };

  // Copy key string to clipboard
  const handleCopyKeyString = (pkt: ExamPacket) => {
    const keyStr = Array.from({ length: form.totalQuestions })
      .map((_, i) => pkt.keys[i + 1] || 'A')
      .join('');
    
    navigator.clipboard.writeText(keyStr);
    setCopiedPacket(pkt.packetCode);
    showNotification(`String kunci Paket ${pkt.packetCode} disalin!`, keyStr);
    setTimeout(() => setCopiedPacket(null), 2000);
  };

  // Add new packet (B, C, D)
  const handleAddPacket = () => {
    if (form.packets.length >= 4) return;
    const nextCode = String.fromCharCode(65 + form.packets.length); // 'B', 'C', 'D'

    const newPacket: ExamPacket = {
      packetCode: nextCode,
      keys: { ...form.packets[0].keys }
    };

    setForm({
      ...form,
      packets: [...form.packets, newPacket]
    });
    setActivePacketIndex(form.packets.length);
    showNotification(`Paket ${nextCode} berhasil ditambahkan`);
  };

  // Delete packet
  const handleDeletePacket = (idx: number) => {
    if (form.packets.length <= 1) return;
    const targetCode = form.packets[idx].packetCode;
    const updated = form.packets.filter((_, i) => i !== idx);
    setForm({ ...form, packets: updated });
    setActivePacketIndex(Math.max(0, idx - 1));
    showNotification(`Paket ${targetCode} dihapus`);
  };

  // Create new assessment
  const handleCreateNewAssessment = () => {
    const newId = `exam-${Date.now()}`;
    const newExam: ExamConfig = {
      id: newId,
      title: `Penilaian Harian Baru (${exams.length + 1})`,
      subject: form.subject || 'Mata Pelajaran',
      gradeClass: form.gradeClass || 'Kelas 9',
      date: form.date || new Date().toISOString().split('T')[0],
      penaltyNegativeScore: 0,
      kkm: form.kkm || 75,
      totalQuestions: form.totalQuestions || 25,
      optionsCount: form.optionsCount || 5,
      packets: [{ packetCode: 'A', keys: {} }],
      questionWeights: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const sanitized = sanitizeExamForm(newExam);
    if (onAddNewExam) {
      onAddNewExam(sanitized);
    }
    setForm(sanitized);
    setActivePacketIndex(0);
    showNotification(`Asesmen baru "${sanitized.title}" berhasil dibuat!`);
  };

  // Duplicate current assessment
  const handleDuplicateAssessment = () => {
    const dupId = `exam-${Date.now()}`;
    const dupExam: ExamConfig = {
      ...form,
      id: dupId,
      title: `${form.title} (Salinan)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    const sanitized = sanitizeExamForm(dupExam);
    if (onAddNewExam) {
      onAddNewExam(sanitized);
    }
    setForm(sanitized);
    setActivePacketIndex(0);
    showNotification(`Duplikasi asesmen "${sanitized.title}" berhasil dibuat!`);
  };

  // Delete current assessment
  const handleDeleteAssessment = () => {
    if (exams.length <= 1) {
      showNotification('Tidak dapat menghapus satu-satunya asesmen yang ada.');
      return;
    }
    if (confirm(`Yakin ingin menghapus judul asesmen "${form.title}"?`)) {
      if (onDeleteExam) {
        onDeleteExam(form.id);
      }
      showNotification(`Asesmen "${form.title}" berhasil dihapus.`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const finalForm = sanitizeExamForm({
      ...form,
      updatedAt: new Date().toISOString()
    });
    onSaveExam(finalForm);
    setIsSaved(true);
    showNotification(
      `Kunci Jawaban "${finalForm.title}" Berhasil Disimpan!`,
      `Tersimpan: ${finalForm.totalQuestions} butir soal, ${finalForm.packets.length} paket (${finalForm.packets.map(p => p.packetCode).join(', ')}), KKM ${finalForm.kkm}`
    );
    setTimeout(() => {
      setIsSaved(false);
    }, 1500);
  };

  // Helper to format keys in groups of 5 for scannability
  const formatKeyGroups = (pkt: ExamPacket) => {
    const groups: { range: string; keys: string }[] = [];
    const step = 5;
    for (let start = 1; start <= form.totalQuestions; start += step) {
      const end = Math.min(start + step - 1, form.totalQuestions);
      const str = Array.from({ length: end - start + 1 })
        .map((_, i) => pkt.keys[start + i] || 'A')
        .join(' ');
      groups.push({ range: `${start}-${end}`, keys: str });
    }
    return groups;
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl space-y-4 max-h-[94vh] flex flex-col my-auto animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900 flex items-center gap-2">
                Kunci Jawaban & Bobot Penilaian Ujian
                <span className="text-[10px] font-extrabold bg-blue-100 text-blue-800 px-2.5 py-0.5 rounded-full">
                  {form.totalQuestions} Soal • {form.optionsCount} Pilihan (A-{form.optionsCount === 4 ? 'D' : 'E'})
                </span>
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Atur dan pantau hasil simpan kunci jawaban, mata pelajaran & kelas, batas KKM, serta format penilaian aktif.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-2 rounded-lg transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Floating Success Notification Toast */}
        {toastMsg && (
          <div className="bg-emerald-50 border-2 border-emerald-400 text-emerald-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between shadow-md shadow-emerald-100 animate-in fade-in slide-in-from-top-2 duration-200 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="font-bold text-emerald-950 text-xs">{toastMsg.text}</p>
                {toastMsg.sub && <p className="text-[11px] text-emerald-800 font-mono font-medium">{toastMsg.sub}</p>}
              </div>
            </div>
            <button 
              onClick={() => setToastMsg(null)}
              className="text-emerald-700 hover:text-emerald-950 p-1 hover:bg-emerald-100 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs flex-1 overflow-y-auto pr-1">
          
          {/* METADATA FORM ROW: PENILAIAN / ASESMEN, MAPEL & KELAS, BATAS KKM */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 p-3.5 bg-slate-50 border border-slate-200 rounded-xl shadow-xs">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">Judul Penilaian / Asesmen</label>
              <input
                type="text"
                required
                placeholder="Contoh: Penilaian Harian Matematika"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-semibold focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-slate-700 font-semibold mb-1">Mata Pelajaran & Kelas</label>
              <input
                type="text"
                required
                placeholder="Contoh: IPA / 9A"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 focus:outline-none focus:border-blue-500 shadow-xs"
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
                className="w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500 shadow-xs"
              />
            </div>
          </div>

          {/* HASIL SIMPAN KUNCI & DATA PENILAIAN / ASESMEN */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50/70 via-blue-50/50 to-indigo-50/60 border border-emerald-200/80 rounded-xl shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-emerald-200/60 pb-2.5">
              <div className="flex items-center gap-2 flex-1 min-w-[240px]">
                <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs shrink-0">
                  <BookOpen className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1">
                  <div className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                    <ListFilter className="w-3.5 h-3.5 text-blue-600" />
                    Pilih Judul Asesmen / Penilaian Tersimpan:
                  </div>
                  {exams && exams.length > 0 ? (
                    <div className="relative max-w-md">
                      <select
                        value={form.id}
                        onChange={(e) => handleDropdownExamChange(e.target.value)}
                        className="w-full bg-white border border-emerald-300 text-slate-900 font-bold text-xs rounded-lg px-2.5 py-1.5 pr-8 appearance-none focus:outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 cursor-pointer shadow-2xs"
                      >
                        {exams.map((ex) => (
                          <option key={ex.id} value={ex.id}>
                            {ex.title} {ex.subject ? `— ${ex.subject}` : ''} {ex.gradeClass ? `(${ex.gradeClass})` : ''} • [{ex.totalQuestions} Soal | KKM: {ex.kkm}]
                          </option>
                        ))}
                      </select>
                      <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-emerald-700">
                        <ChevronDown className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ) : (
                    <span className="text-blue-700 font-extrabold text-xs">
                      {form.title || '(Judul Belum Diisi)'}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleCreateNewAssessment}
                  className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-700 border border-emerald-300 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-emerald-600" /> + Tambah Asesmen
                </button>

                {exams.length > 1 && (
                  <button
                    type="button"
                    onClick={handleDeleteAssessment}
                    title="Hapus asesmen yang sedang dipilih"
                    className="px-2.5 py-1 bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Hapus
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setViewKeySummary(!viewKeySummary)}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 rounded-lg font-bold text-[11px] flex items-center gap-1 transition-colors shadow-2xs cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5 text-slate-600" />
                  {viewKeySummary ? 'Tutup Kunci' : 'Buka Kunci'}
                </button>
              </div>
            </div>

            {/* Assessment Meta Badges */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-semibold text-[11px] shadow-2xs">
                Asesmen: <strong className="text-slate-900">{form.title || '-'}</strong>
              </span>
              <span className="bg-white border border-slate-200 text-slate-700 px-2.5 py-1 rounded-lg font-semibold text-[11px] shadow-2xs">
                Mapel & Kelas: <strong className="text-slate-900">{form.subject || '-'}</strong>
              </span>
              <span className="bg-white border border-emerald-200 text-emerald-800 px-2.5 py-1 rounded-lg font-semibold text-[11px] shadow-2xs">
                Batas KKM: <strong className="text-emerald-700 font-extrabold">{form.kkm}</strong>
              </span>
              <span className="bg-white border border-blue-200 text-blue-800 px-2.5 py-1 rounded-lg font-semibold text-[11px] shadow-2xs">
                Soal & Opsi: <strong className="text-blue-700 font-extrabold">{form.totalQuestions} Soal (A-{form.optionsCount === 4 ? 'D' : 'E'})</strong>
              </span>
              <span className="bg-white border border-indigo-200 text-indigo-800 px-2.5 py-1 rounded-lg font-semibold text-[11px] shadow-2xs">
                Total Paket: <strong className="text-indigo-700 font-extrabold">{form.packets.length} Paket ({form.packets.map(p => p.packetCode).join(', ')})</strong>
              </span>
            </div>

            {/* Result of Saved Keys per Packet */}
            {viewKeySummary && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
                {form.packets.map((pkt) => {
                  const keyString = Array.from({ length: form.totalQuestions })
                    .map((_, i) => pkt.keys[i + 1] || 'A')
                    .join('');
                  const isCopied = copiedPacket === pkt.packetCode;
                  const groups = formatKeyGroups(pkt);

                  return (
                    <div 
                      key={pkt.packetCode}
                      className="bg-white border border-emerald-200/80 rounded-xl p-3 space-y-2 shadow-2xs hover:border-blue-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="w-5 h-5 rounded-md bg-blue-600 text-white font-extrabold text-[11px] flex items-center justify-center shadow-xs">
                            {pkt.packetCode}
                          </span>
                          <span className="font-bold text-slate-800 text-xs">Kunci Paket {pkt.packetCode}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleCopyKeyString(pkt)}
                          className="px-2 py-0.5 bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 rounded-md text-[10px] font-bold flex items-center gap-1 transition-colors cursor-pointer"
                        >
                          {isCopied ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tersalin!
                            </>
                          ) : (
                            <>
                              <ClipboardCopy className="w-3 h-3" /> Salin String Kunci
                            </>
                          )}
                        </button>
                      </div>

                      {/* Continuous Key String Viewer */}
                      <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200 font-mono text-[11px] text-blue-950 tracking-wider break-all select-all font-bold">
                        {keyString}
                      </div>

                      {/* Grouped Number Key Preview (5 numbers per group) */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pt-0.5 text-[10px]">
                        {groups.slice(0, 6).map((g, gi) => (
                          <div key={gi} className="bg-slate-50/90 px-1.5 py-0.5 rounded border border-slate-200 text-slate-600">
                            <span className="text-slate-400 font-medium mr-1">No {g.range}:</span>
                            <span className="font-bold text-slate-900 font-mono">{g.keys}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 4: QUESTION COUNT & OPTIONS SELECTOR CARD */}
          <div className="p-3.5 bg-blue-50/60 border border-blue-200 rounded-xl shadow-xs space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Jumlah Soal Presets & Custom Input */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-blue-600" />
                    Jumlah Butir Soal Ujian:
                  </span>
                  <span className="text-blue-700 font-extrabold text-sm">{form.totalQuestions} Butir</span>
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {[10, 15, 20, 25, 30, 35, 40, 45, 50].map(num => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleTotalQuestionsChange(num)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                        form.totalQuestions === num
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                  <div className="flex items-center gap-1 ml-auto">
                    <span className="text-[11px] text-slate-500 font-medium">Kustom:</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={form.totalQuestions}
                      onChange={(e) => handleTotalQuestionsChange(parseInt(e.target.value) || 1)}
                      className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold text-slate-900 text-xs focus:outline-none focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Opsi Pilihan Ganda (4 vs 5) */}
              <div>
                <label className="block text-slate-800 font-bold mb-1.5 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-blue-600" />
                    Format Opsi Pilihan:
                  </span>
                  <span className="text-blue-700 font-extrabold text-xs">
                    {form.optionsCount === 4 ? 'A - D (4 Opsi)' : 'A - E (5 Opsi)'}
                  </span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleOptionsCountChange(4)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                      form.optionsCount === 4
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    4 Pilihan (A, B, C, D)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOptionsCountChange(5)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-all ${
                      form.optionsCount === 5
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    5 Pilihan (A, B, C, D, E)
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 5: PACKET TABS & QUICK TOOLS */}
          <div className="space-y-2.5 pt-1">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
              {/* Packet Tabs */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-700 font-bold mr-1">Edit Kunci Paket:</span>
                {form.packets.map((pkt, idx) => (
                  <div key={pkt.packetCode} className="flex items-center">
                    <button
                      type="button"
                      onClick={() => setActivePacketIndex(idx)}
                      className={`px-3 py-1.5 rounded-lg font-bold text-xs transition-all ${
                        activePacketIndex === idx
                          ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      }`}
                    >
                      Paket {pkt.packetCode}
                    </button>
                    {form.packets.length > 1 && idx > 0 && activePacketIndex === idx && (
                      <button
                        type="button"
                        onClick={() => handleDeletePacket(idx)}
                        title={`Hapus Paket ${pkt.packetCode}`}
                        className="ml-1 p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}

                {form.packets.length < 4 && (
                  <button
                    type="button"
                    onClick={handleAddPacket}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 border border-slate-200 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-600" /> Tambah Paket ({String.fromCharCode(65 + form.packets.length)})
                  </button>
                )}
              </div>

              {/* Quick Paste String Input */}
              <div className="flex items-center gap-1.5 ml-auto">
                <input
                  type="text"
                  placeholder={`Tempel string kunci (${form.totalQuestions} huruf, e.g. CABDE...)`}
                  value={quickKeyString}
                  onChange={(e) => setQuickKeyString(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 font-mono w-56 text-[11px] focus:outline-none focus:border-blue-500 focus:bg-white"
                />
                <button
                  type="button"
                  onClick={handleApplyQuickKeyString}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition-colors shadow-xs"
                >
                  Terapkan
                </button>
              </div>
            </div>

            {/* Quick Fill Helpers for Active Packet */}
            <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-slate-50 border border-slate-200 rounded-lg text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-600 font-semibold">Isi Cepat Paket {currentPacket.packetCode}:</span>
                {options.map(opt => (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => handleFillAllWith(opt)}
                    className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-bold text-[10px]"
                    title={`Set semua nomor ke '${opt}'`}
                  >
                    Semua {opt}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={handleGeneratePattern}
                  className="px-2 py-0.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-md font-semibold text-[10px] flex items-center gap-1"
                >
                  <Wand2 className="w-3 h-3 text-blue-600" /> Pola A-{form.optionsCount === 4 ? 'D' : 'E'}
                </button>
              </div>

              {activePacketIndex > 0 && (
                <button
                  type="button"
                  onClick={handleCopyFromPacketA}
                  className="px-2.5 py-0.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-md font-bold text-[10px] flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> Salin dari Paket A
                </button>
              )}
            </div>
          </div>

          {/* SECTION 6: QUESTION KEYS GRID */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-slate-700 font-bold">
              <span>Klik huruf kunci jawaban untuk Paket {currentPacket.packetCode}:</span>
              <span className="text-slate-500 font-medium text-xs">
                Total {form.totalQuestions} Butir Soal (Nomor 1 s.d. {form.totalQuestions})
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 max-h-72 overflow-y-auto p-1.5 border border-slate-200 rounded-xl bg-slate-50/50">
              {Array.from({ length: form.totalQuestions }).map((_, idx) => {
                const qNo = idx + 1;
                const activeKey = currentPacket.keys[qNo] || 'A';

                return (
                  <div
                    key={qNo}
                    className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between shadow-2xs hover:border-blue-300 transition-colors"
                  >
                    <span className="font-bold text-slate-700 text-xs w-7 shrink-0">#{qNo}</span>
                    <div className="flex gap-1">
                      {options.map(opt => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleKeyChange(qNo, opt)}
                          className={`w-5 h-5 rounded-md text-[10px] font-bold transition-all flex items-center justify-center ${
                            activeKey === opt
                              ? 'bg-blue-600 text-white shadow-xs scale-105'
                              : 'bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-100'
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

          {/* FOOTER ACTIONS */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3 shrink-0">
            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span>Perubahan kunci tersimpan langsung aktif untuk penilaian scan kamera & ADF Kyocera.</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
              >
                Tutup
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
              >
                {isSaved ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    Kunci Berhasil Disimpan!
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    Simpan Kunci Jawaban
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
