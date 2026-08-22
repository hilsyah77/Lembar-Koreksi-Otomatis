'use client';

import React from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Award, 
  AlertCircle, 
  CheckCircle2, 
  XCircle, 
  FileSpreadsheet, 
  FileText, 
  Sparkles,
  HelpCircle,
  Percent,
  Layers
} from 'lucide-react';
import { ExamConfig, ScanResult, TeacherProfile, ClassAnalytics } from '@/types/omr';
import { calculateClassAnalytics } from '@/lib/analytics';
import { exportExamResultsToExcel } from '@/lib/excel-export';
import { generateExamReportPdf } from '@/lib/pdf-generator';

interface ClassAnalyticsViewProps {
  exam: ExamConfig;
  results: ScanResult[];
  teacher: TeacherProfile;
}

export const ClassAnalyticsView: React.FC<ClassAnalyticsViewProps> = ({
  exam,
  results,
  teacher
}) => {
  const analytics = calculateClassAnalytics(exam, results);

  const handleExportExcel = () => {
    exportExamResultsToExcel(exam, results, teacher, analytics);
  };

  const handleExportPdf = () => {
    generateExamReportPdf(exam, results, teacher, analytics);
  };

  // Find most difficult questions (< 40% correct)
  const difficultQuestions = analytics.itemAnalyses.filter(item => item.correctRate < 40);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Info & Export Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Analitik Performa & Daya Beda Soal ({exam.gradeClass})
            </h2>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              {results.length} Siswa
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            {exam.title} • Mata Pelajaran: {exam.subject} • KKM: {exam.kkm}
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-200 transition-all"
          >
            <FileSpreadsheet className="w-4 h-4" />
            Ekspor Excel Lengkap (.xlsx)
          </button>

          <button
            onClick={handleExportPdf}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-rose-200 transition-all"
          >
            <FileText className="w-4 h-4" />
            Ekspor Laporan PDF Resmi
          </button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Rata-rata Kelas</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-slate-900">
              {analytics.averageScore.toFixed(1)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              KKM: {exam.kkm} ({analytics.averageScore >= exam.kkm ? 'Di atas KKM' : 'Di bawah KKM'})
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Ketuntasan Belajar</span>
            <Percent className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">
              {analytics.passingRate.toFixed(1)}%
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">
              {analytics.passedCount} Tuntas • {analytics.failedCount} Remedial
            </div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Nilai Tertinggi</span>
            <Award className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-amber-600">
              {analytics.highestScore}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Skor Maksimal 100</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Nilai Terendah</span>
            <AlertCircle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-rose-600">
              {analytics.lowestScore}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Perlu bimbingan khusus</div>
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Standar Deviasi</span>
            <Layers className="w-4 h-4 text-purple-600" />
          </div>
          <div className="mt-2">
            <div className="text-2xl sm:text-3xl font-black text-purple-600">
              {analytics.standardDeviation.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-500 font-medium mt-0.5">Homogenitas Skor</div>
          </div>
        </div>
      </div>

      {/* Grade Distribution & AI Classroom Insight */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Grade Distribution */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            Distribusi Rentang Nilai (Grade Kelas)
          </h3>

          <div className="space-y-3 pt-2">
            {[
              { label: 'Grade A (90 - 100)', count: analytics.gradeDistribution.gradeA, color: 'bg-emerald-500', text: 'text-emerald-700' },
              { label: 'Grade B (80 - 89)', count: analytics.gradeDistribution.gradeB, color: 'bg-blue-500', text: 'text-blue-700' },
              { label: 'Grade C (70 - 79)', count: analytics.gradeDistribution.gradeC, color: 'bg-amber-500', text: 'text-amber-700' },
              { label: 'Grade D (60 - 69)', count: analytics.gradeDistribution.gradeD, color: 'bg-orange-500', text: 'text-orange-700' },
              { label: 'Grade E (< 60)', count: analytics.gradeDistribution.gradeE, color: 'bg-rose-500', text: 'text-rose-700' }
            ].map(grade => {
              const pct = results.length > 0 ? (grade.count / results.length) * 100 : 0;
              return (
                <div key={grade.label} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-700 font-semibold">{grade.label}</span>
                    <span className={`font-bold ${grade.text}`}>
                      {grade.count} Siswa ({pct.toFixed(0)}%)
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                    <div
                      className={`h-full rounded-full ${grade.color} transition-all duration-500`}
                      style={{ width: `${pct}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* AI Classroom Insights & Difficult Questions Summary */}
        <div className="lg:col-span-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-600" />
              Rekomendasi Pembelajaran & Soal Paling Sulit
            </h3>

            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 text-xs text-slate-800 shadow-xs">
              <div className="font-bold text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                Materi yang Perlu Penguatan (Remedial Teaching):
              </div>
              {difficultQuestions.length > 0 ? (
                <ul className="list-disc list-inside space-y-1.5 text-slate-700 leading-relaxed font-medium">
                  {difficultQuestions.slice(0, 4).map(item => (
                    <li key={item.questionNo}>
                      <strong className="text-slate-900">Soal #{item.questionNo}</strong>: {item.topic || 'Kompetensi Dasar'} (Hanya {item.correctRate.toFixed(0)}% siswa yang menjawab benar).
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-emerald-700 font-semibold">
                  Semua butir soal memiliki tingkat ketuntasan di atas 40%. Pemahaman konsep kelas sangat merata.
                </p>
              )}
            </div>

            <div className="text-xs text-slate-500 leading-relaxed font-medium">
              <strong className="text-slate-800">Catatan Guru:</strong> Daya beda positif (&gt; 0.20) menunjukkan soal mampu membedakan dengan valid antara kelompok siswa berkemampuan tinggi dan siswa yang membutuhkan remedial.
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-medium">
            <span>Status Kurikulum: Kurikulum Merdeka</span>
            <span className="text-blue-700 font-bold">Auto Item Analysis Engine OK</span>
          </div>
        </div>
      </div>

      {/* Comprehensive Item Analysis Table */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <h3 className="font-bold text-sm text-slate-900">
            Tabel Analisis Butir Soal (Tingkat Kesukaran & Daya Beda)
          </h3>
          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">Total {exam.totalQuestions} Soal</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 font-bold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="p-3 text-center w-12">No</th>
                <th className="p-3 text-center w-14">Kunci</th>
                <th className="p-3">Materi / Topik</th>
                <th className="p-3 text-center">Jml Benar</th>
                <th className="p-3 text-center">% Benar</th>
                <th className="p-3 text-center">Tingkat Kesukaran</th>
                <th className="p-3 text-center">Daya Beda (D)</th>
                <th className="p-3 text-center">Distribusi Jawaban (A-B-C-D-E)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {analytics.itemAnalyses.map(item => (
                <tr key={item.questionNo} className="hover:bg-slate-50/80 transition-colors">
                  <td className="p-3 text-center font-bold text-slate-500">{item.questionNo}</td>
                  <td className="p-3 text-center">
                    <span className="font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      {item.correctAnswer}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-slate-900">{item.topic || `Kompetensi Soal #${item.questionNo}`}</td>
                  <td className="p-3 text-center font-medium text-slate-600">{item.correctCount} / {results.length}</td>
                  <td className="p-3 text-center font-bold text-slate-900">{item.correctRate.toFixed(1)}%</td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                      item.difficultyLevel === 'MUDAH'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : item.difficultyLevel === 'SEDANG'
                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                        : 'bg-rose-50 text-rose-700 border border-rose-200'
                    }`}>
                      {item.difficultyLevel}
                    </span>
                  </td>
                  <td className="p-3 text-center font-mono font-bold text-slate-800">
                    {item.discriminatingPower > 0 ? `+${item.discriminatingPower.toFixed(2)}` : item.discriminatingPower.toFixed(2)}
                  </td>
                  <td className="p-3 text-center text-slate-600 font-mono text-[11px]">
                    A:{item.optionPicks['A'] || 0} | B:{item.optionPicks['B'] || 0} | C:{item.optionPicks['C'] || 0} | D:{item.optionPicks['D'] || 0} {exam.optionsCount === 5 && `| E:${item.optionPicks['E'] || 0}`}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
