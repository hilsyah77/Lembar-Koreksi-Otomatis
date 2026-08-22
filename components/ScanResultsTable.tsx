'use client';

import React, { useState } from 'react';
import { 
  Table, 
  Search, 
  Filter, 
  FileSpreadsheet, 
  FileText, 
  CheckCircle2, 
  XCircle, 
  Edit3, 
  Trash2, 
  Eye, 
  Sparkles, 
  SlidersHorizontal,
  RefreshCw
} from 'lucide-react';
import { ScanResult, ExamConfig, TeacherProfile, OptionLetter } from '@/types/omr';
import { exportExamResultsToExcel } from '@/lib/excel-export';
import { generateExamReportPdf } from '@/lib/pdf-generator';
import { calculateClassAnalytics } from '@/lib/analytics';

interface ScanResultsTableProps {
  results: ScanResult[];
  exam: ExamConfig;
  teacher: TeacherProfile;
  onUpdateResult: (updated: ScanResult) => void;
  onDeleteResult: (id: string) => void;
  onOpenScanTab: () => void;
}

export const ScanResultsTable: React.FC<ScanResultsTableProps> = ({
  results,
  exam,
  teacher,
  onUpdateResult,
  onDeleteResult,
  onOpenScanTab
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'NEEDS_REVIEW'>('ALL');
  const [selectedResultForEdit, setSelectedResultForEdit] = useState<ScanResult | null>(null);

  const analytics = calculateClassAnalytics(exam, results);

  const filteredResults = results.filter(res => {
    const matchesSearch = res.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      res.studentNo.includes(searchQuery);

    if (!matchesSearch) return false;
    if (statusFilter === 'PASSED') return res.isPassed;
    if (statusFilter === 'FAILED') return !res.isPassed;
    if (statusFilter === 'NEEDS_REVIEW') return res.status === 'NEEDS_REVIEW';
    return true;
  });

  const handleExportExcel = () => {
    exportExamResultsToExcel(exam, results, teacher, analytics);
  };

  const handleExportPdf = () => {
    generateExamReportPdf(exam, results, teacher, analytics);
  };

  const handleSaveManualEdit = (edited: ScanResult) => {
    // Re-evaluate score after manual adjustment
    const packet = exam.packets.find(p => p.packetCode === edited.packetCode) || exam.packets[0];
    const keys = packet.keys;

    let correct = 0;
    let wrong = 0;
    let blank = 0;
    let rawScore = 0;

    const newDetailed = edited.detailedAnswers.map(ans => {
      const marked = edited.answers[ans.questionNo] || null;
      const correctKey = keys[ans.questionNo] || 'A';
      const weight = exam.questionWeights[ans.questionNo] || 1;
      const isCorrect = marked === correctKey;

      if (!marked) blank++;
      else if (isCorrect) {
        correct++;
        rawScore += weight;
      } else wrong++;

      return {
        ...ans,
        markedOption: marked,
        isCorrect,
        correctAnswer: correctKey
      };
    });

    const maxRaw = Object.values(exam.questionWeights).reduce((a, b) => a + b, 0) || exam.totalQuestions;
    const finalScore = Math.round((rawScore / maxRaw) * 100);

    const finalized: ScanResult = {
      ...edited,
      detailedAnswers: newDetailed,
      totalCorrect: correct,
      totalWrong: wrong,
      totalBlank: blank,
      rawScore,
      finalScore,
      isPassed: finalScore >= exam.kkm,
      status: 'VERIFIED',
      scanSource: 'MANUAL_EDIT'
    };

    onUpdateResult(finalized);
    setSelectedResultForEdit(null);
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Daftar Hasil Penilaian LJK ({exam.gradeClass})
            </h2>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {results.length} Siswa Terdata
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {exam.title} • {teacher.namaSekolah} • KKM: {exam.kkm}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-200 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel (.xlsx)
          </button>

          <button
            onClick={handleExportPdf}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-200 transition-all"
          >
            <FileText className="w-4 h-4" />
            Ekspor PDF Resmi
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau NISN siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: `Semua (${results.length})` },
            { id: 'PASSED', label: `Tuntas (${results.filter(r => r.isPassed).length})` },
            { id: 'FAILED', label: `Remedial (${results.filter(r => !r.isPassed).length})` },
            { id: 'NEEDS_REVIEW', label: `Perlu Review (${results.filter(r => r.status === 'NEEDS_REVIEW').length})` }
          ].map(f => (
            <button
              key={f.id}
              onClick={() => setStatusFilter(f.id as any)}
              className={`px-3 py-1.5 rounded-lg font-semibold whitespace-nowrap transition-all ${
                statusFilter === f.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 text-center w-12">No</th>
                <th className="p-3.5 w-28">No. Peserta</th>
                <th className="p-3.5">Nama Siswa</th>
                <th className="p-3.5 text-center w-16">Paket</th>
                <th className="p-3.5 text-center w-16 text-emerald-700">Benar</th>
                <th className="p-3.5 text-center w-16 text-rose-700">Salah</th>
                <th className="p-3.5 text-center w-16 text-slate-500">Kosong</th>
                <th className="p-3.5 text-center w-20">Nilai Akhir</th>
                <th className="p-3.5 text-center w-28">Status KKM</th>
                <th className="p-3.5 text-center w-24">Metode Scan</th>
                <th className="p-3.5 text-center w-24">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredResults.length > 0 ? (
                filteredResults.map((res, idx) => (
                  <tr key={res.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-3.5 text-center font-bold text-slate-400">{idx + 1}</td>
                    <td className="p-3.5 font-mono text-slate-600 font-semibold">{res.studentNo}</td>
                    <td className="p-3.5 font-bold text-slate-900">{res.studentName}</td>
                    <td className="p-3.5 text-center">
                      <span className="px-2.5 py-0.5 rounded font-bold bg-slate-100 text-slate-700 border border-slate-200">
                        {res.packetCode}
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-emerald-700 font-bold">{res.totalCorrect}</td>
                    <td className="p-3.5 text-center text-rose-700 font-bold">{res.totalWrong}</td>
                    <td className="p-3.5 text-center text-slate-500 font-medium">{res.totalBlank}</td>
                    <td className="p-3.5 text-center">
                      <span className="text-base font-black text-slate-900">{res.finalScore}</span>
                    </td>
                    <td className="p-3.5 text-center">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        res.isPassed
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {res.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                      </span>
                    </td>
                    <td className="p-3.5 text-center text-[11px] text-slate-500 font-medium">
                      {res.scanSource === 'ADF_KYOCERA' ? 'ADF Kyocera' : res.scanSource === 'CAMERA_REALTIME' ? 'Kamera Live' : 'Upload'}
                    </td>
                    <td className="p-3.5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => setSelectedResultForEdit(res)}
                          title="Lihat & Koreksi Butir Jawaban"
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-lg transition-colors border border-slate-200"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteResult(res.id)}
                          title="Hapus Rekord"
                          className="p-1.5 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded-lg transition-colors border border-slate-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={11} className="p-8 text-center text-slate-400 font-medium">
                    Tidak ada data hasil scan yang cocok dengan pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Review & Answer Editor Modal */}
      {selectedResultForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Review & Koreksi Manual Jawaban: {selectedResultForEdit.studentName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  NISN: {selectedResultForEdit.studentNo} • Paket {selectedResultForEdit.packetCode} • Nilai Saat Ini: {selectedResultForEdit.finalScore}
                </p>
              </div>
              <button
                onClick={() => setSelectedResultForEdit(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Answer Grid Editor */}
            <div className="space-y-2.5">
              <div className="text-xs font-semibold text-slate-700 flex items-center justify-between">
                <span>Klik opsi (A, B, C, D, E) untuk mengubah jika terdapat arsiran tipis/salah baca:</span>
                <span className="text-[11px] text-slate-500 font-medium">Total {exam.totalQuestions} Soal</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 max-h-80 overflow-y-auto p-1">
                {selectedResultForEdit.detailedAnswers.map(ans => {
                  const options: OptionLetter[] = exam.optionsCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

                  return (
                    <div
                      key={ans.questionNo}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col gap-1.5 text-xs shadow-xs"
                    >
                      <div className="flex items-center justify-between text-slate-500">
                        <span className="font-bold text-slate-900">Soal #{ans.questionNo}</span>
                        <span className="text-[10px] text-blue-700 font-mono font-bold bg-blue-50 px-1 rounded">Kunci: {ans.correctAnswer}</span>
                      </div>

                      <div className="flex items-center justify-between gap-1 mt-1">
                        {options.map(opt => {
                          const isSelected = selectedResultForEdit.answers[ans.questionNo] === opt;
                          const isKey = ans.correctAnswer === opt;

                          return (
                            <button
                              key={opt}
                              type="button"
                              onClick={() => {
                                const newAnswers = { ...selectedResultForEdit.answers, [ans.questionNo]: isSelected ? null : opt };
                                setSelectedResultForEdit({
                                  ...selectedResultForEdit,
                                  answers: newAnswers
                                });
                              }}
                              className={`w-6 h-6 rounded-full text-[11px] font-bold transition-all ${
                                isSelected
                                  ? isKey
                                    ? 'bg-emerald-600 text-white shadow-sm'
                                    : 'bg-rose-600 text-white shadow-sm'
                                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                              }`}
                            >
                              {opt}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedResultForEdit(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Batal
              </button>

              <button
                type="button"
                onClick={() => handleSaveManualEdit(selectedResultForEdit)}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-200"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan & Hitung Ulang Nilai
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
