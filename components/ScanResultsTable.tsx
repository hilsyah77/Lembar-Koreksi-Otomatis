'use client';

import React, { useState, useMemo } from 'react';
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
  RefreshCw,
  GraduationCap,
  Users,
  Building2,
  Layers,
  Award,
  TrendingUp,
  AlertCircle,
  BarChart2
} from 'lucide-react';
import { ScanResult, ExamConfig, TeacherProfile, OptionLetter, Student } from '@/types/omr';
import { exportExamResultsToExcel } from '@/lib/excel-export';
import { generateExamReportPdf } from '@/lib/pdf-generator';
import { calculateClassAnalytics } from '@/lib/analytics';

interface ScanResultsTableProps {
  results: ScanResult[];
  exam: ExamConfig;
  teacher: TeacherProfile;
  students?: Student[];
  onUpdateResult: (updated: ScanResult) => void;
  onDeleteResult: (id: string) => void;
  onOpenScanTab: () => void;
}

export const ScanResultsTable: React.FC<ScanResultsTableProps> = ({
  results,
  exam,
  teacher,
  students = [],
  onUpdateResult,
  onDeleteResult,
  onOpenScanTab
}) => {
  const [selectedClass, setSelectedClass] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'PASSED' | 'FAILED' | 'NEEDS_REVIEW'>('ALL');
  const [selectedResultForEdit, setSelectedResultForEdit] = useState<ScanResult | null>(null);

  // Extract unique classes from results, students, and exam
  const availableClasses = useMemo(() => {
    const classSet = new Set<string>();
    
    // Add from current exam
    if (exam.gradeClass && exam.gradeClass.trim()) {
      classSet.add(exam.gradeClass.trim());
    }
    
    // Add from scanned results
    results.forEach(r => {
      if (r.classId && r.classId.trim()) {
        classSet.add(r.classId.trim());
      }
    });

    // Add from students roster
    students.forEach(s => {
      if (s.classId && s.classId.trim()) {
        classSet.add(s.classId.trim());
      }
    });

    return Array.from(classSet).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
  }, [results, students, exam.gradeClass]);

  // Filter results by selected class first
  const resultsByClass = useMemo(() => {
    if (selectedClass === 'ALL') return results;
    return results.filter(r => (r.classId || exam.gradeClass) === selectedClass);
  }, [results, selectedClass, exam.gradeClass]);

  // Analytics for the currently active class scope
  const activeClassAnalytics = useMemo(() => {
    const scopeExam: ExamConfig = {
      ...exam,
      gradeClass: selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass
    };
    return calculateClassAnalytics(scopeExam, resultsByClass);
  }, [exam, resultsByClass, selectedClass]);

  // Secondary filter: Search and Pass/Fail status
  const filteredResults = useMemo(() => {
    return resultsByClass.filter(res => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = 
        res.studentName.toLowerCase().includes(q) ||
        res.studentNo.includes(q) ||
        (res.classId && res.classId.toLowerCase().includes(q));

      if (!matchesSearch) return false;
      if (statusFilter === 'PASSED') return res.isPassed;
      if (statusFilter === 'FAILED') return !res.isPassed;
      if (statusFilter === 'NEEDS_REVIEW') return res.status === 'NEEDS_REVIEW';
      return true;
    });
  }, [resultsByClass, searchQuery, statusFilter]);

  // Export handlers scoped to the currently selected class
  const handleExportExcel = () => {
    const exportExam: ExamConfig = {
      ...exam,
      gradeClass: selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass
    };
    exportExamResultsToExcel(exportExam, resultsByClass, teacher, activeClassAnalytics);
  };

  const handleExportPdf = () => {
    const exportExam: ExamConfig = {
      ...exam,
      gradeClass: selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass
    };
    generateExamReportPdf(exportExam, resultsByClass, teacher, activeClassAnalytics);
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
      {/* 1. Header Bar with Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Daftar Hasil Penilaian LJK
            </h2>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass} • {resultsByClass.length} Siswa
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
            title={`Ekspor Rekap Excel untuk ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass}`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel {selectedClass !== 'ALL' && `(${selectedClass})`}
          </button>

          <button
            onClick={handleExportPdf}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-200 transition-all"
            title={`Ekspor Dokumen PDF Resmi untuk ${selectedClass === 'ALL' ? 'Semua Kelas' : selectedClass}`}
          >
            <FileText className="w-4 h-4" />
            Ekspor PDF {selectedClass !== 'ALL' && `(${selectedClass})`}
          </button>
        </div>
      </div>

      {/* 2. MENU PER KELAS (Class Tabs & Selector) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GraduationCap className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pilih Menu Kelas
            </h3>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            {availableClasses.length} Kelas Terdaftar
          </span>
        </div>

        {/* Scrollable Class Tabs Navigation */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-thin">
          {/* Tab: Semua Kelas */}
          <button
            onClick={() => setSelectedClass('ALL')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
              selectedClass === 'ALL'
                ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Semua Kelas</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
              selectedClass === 'ALL' ? 'bg-blue-800 text-blue-100' : 'bg-slate-200 text-slate-700'
            }`}>
              {results.length}
            </span>
          </button>

          {/* Individual Class Tabs */}
          {availableClasses.map(clsName => {
            const classCount = results.filter(r => (r.classId || exam.gradeClass) === clsName).length;
            const classResultsList = results.filter(r => (r.classId || exam.gradeClass) === clsName);
            const classAvg = classResultsList.length > 0
              ? Math.round(classResultsList.reduce((sum, r) => sum + r.finalScore, 0) / classResultsList.length)
              : null;
            const isCurrentClass = selectedClass === clsName;

            return (
              <button
                key={clsName}
                onClick={() => setSelectedClass(clsName)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                  isCurrentClass
                    ? 'bg-blue-600 border-blue-600 text-white shadow-sm shadow-blue-200'
                    : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                }`}
              >
                <Users className="w-3.5 h-3.5 text-slate-400" />
                <span>Kelas {clsName}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isCurrentClass ? 'bg-blue-800 text-blue-100' : 'bg-slate-100 text-slate-600'
                }`}>
                  {classCount} Siswa
                </span>
                {classAvg !== null && (
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                    isCurrentClass
                      ? 'bg-blue-700 text-blue-100'
                      : classAvg >= exam.kkm
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-rose-50 text-rose-700'
                  }`}>
                    Ø {classAvg}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Class Quick Performance Banner (Ringkasan Statistik Kelas Aktif) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Total Siswa */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Siswa Terkoreksi
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {resultsByClass.length} <span className="text-xs font-normal text-slate-500">Siswa</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              {selectedClass === 'ALL' ? 'Akumulasi Semua Kelas' : `Kelas ${selectedClass}`}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Nilai Rata-rata */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Rata-rata Nilai
            </span>
            <div className="text-xl font-black text-slate-900 mt-0.5">
              {activeClassAnalytics.averageScore.toFixed(1)}
            </div>
            <span className={`text-[10px] font-bold ${
              activeClassAnalytics.averageScore >= exam.kkm ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              {activeClassAnalytics.averageScore >= exam.kkm ? '▲ Di Atas KKM' : '▼ Di Bawah KKM'} ({exam.kkm})
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <BarChart2 className="w-5 h-5" />
          </div>
        </div>

        {/* Nilai Tertinggi & Terendah */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Rentang Nilai
            </span>
            <div className="text-base font-black text-slate-900 mt-0.5 flex items-center gap-1.5">
              <span className="text-emerald-600">{activeClassAnalytics.highestScore}</span>
              <span className="text-slate-300 font-normal">/</span>
              <span className="text-rose-600">{activeClassAnalytics.lowestScore}</span>
            </div>
            <span className="text-[10px] text-slate-400 font-medium">
              Max: {activeClassAnalytics.highestScore} • Min: {activeClassAnalytics.lowestScore}
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Award className="w-5 h-5" />
          </div>
        </div>

        {/* Kelulusan KKM */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Kelulusan KKM
            </span>
            <div className="text-xl font-black text-emerald-600 mt-0.5">
              {activeClassAnalytics.passingRate.toFixed(0)}%
            </div>
            <span className="text-[10px] text-slate-500 font-medium">
              {activeClassAnalytics.passedCount} Tuntas • {activeClassAnalytics.failedCount} Remedial
            </span>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. Filter & Search Toolbar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 flex-1 max-w-md">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder={`Cari nama, NISN, atau kelas di ${selectedClass === 'ALL' ? 'semua data' : selectedClass}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {[
            { id: 'ALL', label: `Semua (${resultsByClass.length})` },
            { id: 'PASSED', label: `Tuntas (${resultsByClass.filter(r => r.isPassed).length})` },
            { id: 'FAILED', label: `Remedial (${resultsByClass.filter(r => !r.isPassed).length})` },
            { id: 'NEEDS_REVIEW', label: `Perlu Review (${resultsByClass.filter(r => r.status === 'NEEDS_REVIEW').length})` }
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

      {/* 5. Main Results Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3.5 text-center w-12">No</th>
                <th className="p-3.5 w-28">No. Peserta</th>
                <th className="p-3.5">Nama Siswa</th>
                <th className="p-3.5 text-center w-24">Kelas</th>
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
                      <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {res.classId || exam.gradeClass}
                      </span>
                    </td>
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
                  <td colSpan={12} className="p-8 text-center text-slate-400 font-medium">
                    {resultsByClass.length === 0 ? (
                      <div className="space-y-2">
                        <p>Belum ada data scan untuk {selectedClass === 'ALL' ? 'semua kelas' : `Kelas ${selectedClass}`}.</p>
                        <button
                          onClick={onOpenScanTab}
                          className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 shadow-xs"
                        >
                          Mulai Scan LJK Sekarang
                        </button>
                      </div>
                    ) : (
                      'Tidak ada data hasil scan yang cocok dengan kata kunci pencarian / filter status.'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 6. Manual Review & Answer Editor Modal */}
      {selectedResultForEdit && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-3xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Review & Koreksi Manual Jawaban: {selectedResultForEdit.studentName}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5 font-medium">
                  NISN: {selectedResultForEdit.studentNo} • Kelas: {selectedResultForEdit.classId || exam.gradeClass} • Paket {selectedResultForEdit.packetCode} • Nilai: {selectedResultForEdit.finalScore}
                </p>
              </div>
              <button
                onClick={() => setSelectedResultForEdit(null)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg text-sm"
              >
                ✕
              </button>
            </div>

            {/* Quick Class Selection in Edit Modal */}
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between gap-3 text-xs">
              <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-blue-600" />
                Kelas Siswa:
              </label>
              <select
                value={selectedResultForEdit.classId || exam.gradeClass}
                onChange={(e) => {
                  setSelectedResultForEdit({
                    ...selectedResultForEdit,
                    classId: e.target.value
                  });
                }}
                className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-slate-800 font-bold focus:outline-none focus:border-blue-500"
              >
                {availableClasses.map(cls => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
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

