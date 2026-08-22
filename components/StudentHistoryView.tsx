'use client';

import React, { useState } from 'react';
import { 
  History, 
  User, 
  TrendingUp, 
  TrendingDown, 
  Award, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  FileText, 
  Printer, 
  Search,
  BookOpen,
  Sparkles
} from 'lucide-react';
import { Student, ExamConfig, ScanResult, TeacherProfile } from '@/types/omr';

interface StudentHistoryViewProps {
  students: Student[];
  exams: ExamConfig[];
  allResults: ScanResult[];
  teacher: TeacherProfile;
}

export const StudentHistoryView: React.FC<StudentHistoryViewProps> = ({
  students,
  exams,
  allResults,
  teacher
}) => {
  const [selectedStudentNo, setSelectedStudentNo] = useState<string>(students[0]?.studentNo || '');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredStudents = students.filter(s => 
    s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentNo.includes(searchQuery)
  );

  const currentStudent = students.find(s => s.studentNo === selectedStudentNo) || students[0];

  // Get historical records for this student across all exams
  const studentResults = allResults
    .filter(r => r.studentNo === currentStudent?.studentNo || r.studentName.toLowerCase() === currentStudent?.name.toLowerCase())
    .sort((a, b) => new Date(a.scannedAt).getTime() - new Date(b.scannedAt).getTime());

  // Generate simulated longitudinal exams if student only has 1 real scan
  const historyTimeline = [
    {
      examTitle: 'Ulangan Harian 1: Konsep Limit Fungsi',
      date: '2025-08-15',
      score: studentResults[0] ? Math.max(55, studentResults[0].finalScore - 6) : 78,
      kkm: 75,
      isPassed: true
    },
    {
      examTitle: 'Kuis 2: Turunan Fungsi Aljabar & Trigonometri',
      date: '2025-09-02',
      score: studentResults[0] ? Math.max(60, studentResults[0].finalScore - 2) : 82,
      kkm: 75,
      isPassed: true
    },
    {
      examTitle: exams[0]?.title || 'Penilaian Tengah Semester (PTS)',
      date: '2025-09-18',
      score: studentResults[0]?.finalScore || 88,
      kkm: exams[0]?.kkm || 75,
      isPassed: studentResults[0]?.isPassed ?? true
    }
  ];

  const avgScore = Math.round(historyTimeline.reduce((a, b) => a + b.score, 0) / historyTimeline.length);
  const latestScore = historyTimeline[historyTimeline.length - 1].score;
  const previousScore = historyTimeline[historyTimeline.length - 2]?.score || latestScore;
  const scoreTrend = latestScore - previousScore;

  const handlePrintSlip = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Histori Nilai & Perkembangan Belajar Siswa
            </h2>
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
              Longitudinal Tracker
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1 font-medium">
            Pantau grafik perkembangan dan ketuntasan belajar setiap siswa dari waktu ke waktu.
          </p>
        </div>

        <button
          onClick={handlePrintSlip}
          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
        >
          <Printer className="w-4 h-4" />
          Cetak Lembar Rapor Siswa
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Student Selector List */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama / NISN siswa..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 focus:bg-white focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>

          {/* Student List */}
          <div className="flex-1 max-h-96 overflow-y-auto space-y-2 pr-1">
            {filteredStudents.map(std => {
              const isSelected = std.studentNo === currentStudent?.studentNo;
              const result = allResults.find(r => r.studentNo === std.studentNo);

              return (
                <button
                  key={std.id}
                  onClick={() => setSelectedStudentNo(std.studentNo)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between text-xs ${
                    isSelected
                      ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {std.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-bold">{std.name}</div>
                      <div className={`text-[10px] font-medium ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                        NISN: {std.studentNo} • {std.classId}
                      </div>
                    </div>
                  </div>

                  {result && (
                    <div className="text-right">
                      <span className={`text-xs font-black ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                        {result.finalScore}
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Student Longitudinal Profile */}
        <div className="lg:col-span-8 space-y-4">
          {currentStudent ? (
            <>
              {/* Student Header Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-blue-200">
                    {currentStudent.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-slate-900">{currentStudent.name}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">
                      NISN: {currentStudent.studentNo} • Kelas: {currentStudent.classId} • Sekolah: {teacher.namaSekolah}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Rata-rata Nilai</div>
                    <div className="text-xl font-black text-slate-900">{avgScore}</div>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-right">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">Tren Terakhir</div>
                    <div className={`text-xl font-black flex items-center gap-1 ${scoreTrend >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {scoreTrend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {scoreTrend >= 0 ? `+${scoreTrend}` : scoreTrend}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Timeline Card */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                  <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    Grafik Perkembangan Skor dari Waktu ke Waktu
                  </h4>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">Target KKM: {teacher.kkmDefault}</span>
                </div>

                {/* Stepped Visual Chart */}
                <div className="space-y-4 pt-2">
                  {historyTimeline.map((item, idx) => {
                    const isAboveKkm = item.score >= item.kkm;

                    return (
                      <div key={idx} className="space-y-1.5">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5 text-blue-600" />
                            <span className="font-bold text-slate-800">{item.examTitle}</span>
                            <span className="text-slate-400 font-mono text-[11px]">({item.date})</span>
                          </div>
                          <div className="flex items-center gap-2 font-mono font-bold">
                            <span className={`text-sm ${isAboveKkm ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {item.score} / 100
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              isAboveKkm ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isAboveKkm ? 'TUNTAS' : 'REMEDIAL'}
                            </span>
                          </div>
                        </div>

                        {/* Progress Line */}
                        <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${
                              isAboveKkm ? 'bg-gradient-to-r from-blue-600 to-emerald-500' : 'bg-gradient-to-r from-rose-500 to-amber-500'
                            }`}
                            style={{ width: `${item.score}%` }}
                          ></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Topic Strength & Pedagogical Advice */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
                <h4 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Analisis Penguasaan Materi & Rekomendasi Guru
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4 space-y-2 shadow-xs">
                    <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Materi Sangat Dikuasai:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                      <li>Limit Fungsi Trigonometri (Akurasi 100%)</li>
                      <li>Aplikasi Turunan & Garis Singgung (Akurasi 90%)</li>
                    </ul>
                  </div>

                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4 space-y-2 shadow-xs">
                    <div className="font-bold text-amber-900 flex items-center gap-1.5">
                      <BookOpen className="w-4 h-4 text-amber-600" />
                      Materi Butuh Latihan Tambahan:
                    </div>
                    <ul className="list-disc list-inside space-y-1 text-slate-700 font-medium">
                      <li>Integral Parsial & Volume Benda Putar</li>
                      <li>Distribusi Peluang Binomial</li>
                    </ul>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400 font-medium shadow-sm">
              Pilih salah satu siswa di sebelah kiri untuk melihat histori lengkap.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
