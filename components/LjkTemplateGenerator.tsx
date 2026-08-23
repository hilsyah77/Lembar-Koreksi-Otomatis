'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Sparkles, 
  CheckCircle2, 
  FileCheck2,
  Sliders,
  CheckCircle,
  HelpCircle,
  QrCode
} from 'lucide-react';
import { ExamConfig, TeacherProfile } from '@/types/omr';
import { generatePrintableLjkFullA4 } from '@/lib/pdf-generator';

interface LjkTemplateGeneratorProps {
  exam: ExamConfig;
  teacher: TeacherProfile;
  onUpdateExam: (updated: ExamConfig) => void;
}

export const LjkTemplateGenerator: React.FC<LjkTemplateGeneratorProps> = ({
  exam,
  teacher,
  onUpdateExam
}) => {
  const [totalQ, setTotalQ] = useState<number>(exam.totalQuestions || 25);
  const [optCount, setOptCount] = useState<4 | 5>(exam.optionsCount || 5);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleApplyToCurrentExam = () => {
    onUpdateExam({
      ...exam,
      totalQuestions: totalQ,
      optionsCount: optCount
    });
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadPdf = () => {
    generatePrintableLjkFullA4(
      { ...exam, totalQuestions: totalQ, optionsCount: optCount },
      teacher,
      10 // Standard 10mm symmetric margin
    );
  };

  const handlePrintDirect = () => {
    window.print();
  };

  const options = optCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
  const numCols = totalQ <= 25 ? 2 : totalQ <= 40 ? 3 : 4;
  const qPerCol = Math.ceil(totalQ / numCols);

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 print:max-w-none print:w-full print:p-0 print:m-0 print:space-y-0">
      {/* Embedded Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 8mm 8mm 8mm 8mm !important;
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          body * {
            visibility: hidden !important;
          }
          #printable-ljk-container,
          #printable-ljk-container * {
            visibility: visible !important;
          }
          #printable-ljk-container {
            position: fixed !important;
            top: 8mm !important;
            left: 8mm !important;
            right: 8mm !important;
            bottom: 8mm !important;
            width: calc(210mm - 16mm) !important;
            height: calc(297mm - 16mm) !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 2mm !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            z-index: 9999999 !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>

      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Generator Lembar Jawaban Komputer (LJK)
              </h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                Standar OMR Presisi
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Format lembar LJK resmi siap cetak dan terkalibrasi otomatis untuk pemindaian kamera dan scanner ADF Kyocera.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF LJK
          </button>

          <button
            onClick={handlePrintDirect}
            className="px-4 py-2.5 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-400" />
            Cetak Langsung (Ctrl+P)
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:w-full print:p-0 print:m-0">
        {/* Left: Customizer Controls */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3.5 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-blue-600" />
              Pengaturan Lembar LJK
            </h3>

            {/* Total Questions Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Jumlah Butir Soal Pilihan Ganda
              </label>
              <div className="grid grid-cols-5 gap-2 text-xs">
                {[20, 25, 30, 40, 50].map(num => (
                  <button
                    key={num}
                    onClick={() => setTotalQ(num)}
                    className={`py-2 rounded-lg font-bold border transition-all ${
                      totalQ === num
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Options Count */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Opsi Pilihan Ganda
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setOptCount(4)}
                  className={`py-2 rounded-lg font-semibold border transition-all ${
                    optCount === 4
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  4 Pilihan (A, B, C, D)
                </button>
                <button
                  onClick={() => setOptCount(5)}
                  className={`py-2 rounded-lg font-semibold border transition-all ${
                    optCount === 5
                      ? 'bg-blue-600 border-blue-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  5 Pilihan (A, B, C, D, E)
                </button>
              </div>
            </div>

            {/* Exam & School Metadata in LJK Header */}
            <div className="space-y-2.5 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Kop Madrasah/Sekolah:</span>
                <p className="font-bold text-slate-900">{teacher.namaSekolah}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Mata Pelajaran & Kelas:</span>
                <p className="font-bold text-slate-900">{exam.subject} ({exam.gradeClass})</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Tahun Ajaran & Semester:</span>
                <p className="font-bold text-slate-900">{teacher.tahunAjaran} ({teacher.semester})</p>
              </div>
            </div>

            <button
              onClick={handleApplyToCurrentExam}
              className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-slate-200 transition-colors shadow-xs"
            >
              {isCopied ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Format Disimpan ke Ujian Aktif!
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  Sinkronkan ke Ujian Aktif
                </>
              )}
            </button>
          </div>

          {/* Scanner Compatibility Info Card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 text-xs space-y-2 shadow-xs">
            <div className="font-bold flex items-center gap-2 text-emerald-400">
              <Sparkles className="w-4 h-4" />
              Presisi OMR & Kalibrasi Scanner
            </div>
            <p className="text-slate-300 leading-relaxed">
              Titik fiducial OMR di 4 sudut lembar menjamin akurasi deteksi bulatan jawaban secara otomatis saat dipindai.
            </p>
          </div>
        </div>

        {/* Right: Clean Direct Visual Preview */}
        <div className="lg:col-span-8 print:w-full print:p-0 print:m-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-3 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100 print:hidden">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-600" />
                Pratinjau Lembar Jawaban
              </span>
              <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                {totalQ} Soal ({optCount} Opsi)
              </span>
            </div>

            {/* Clean Direct LJK Container */}
            <div className="overflow-x-auto select-none print:m-0 print:p-0 print:border-none print:bg-white print:overflow-visible flex justify-center">
              <div 
                id="printable-ljk-container" 
                className="w-full max-w-[720px] bg-white p-5 sm:p-6 print:p-3 rounded-lg shadow-sm print:shadow-none border-2 border-slate-900 print:border-black text-slate-900 print:text-black flex flex-col justify-between relative"
              >
                {/* 4 Black Corner Fiducial Markers for High-Precision OMR Auto-Alignment */}
                <div className="absolute top-2 left-2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-black" />
                <div className="absolute top-2 right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-black" />
                <div className="absolute bottom-2 left-2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-black" />
                <div className="absolute bottom-2 right-2 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-black" />

                {/* 1. Official Header (KOP LEMBAR JAWABAN KOMPUTER) */}
                <div className="text-center px-4 pt-1">
                  <div className="font-black text-sm sm:text-base uppercase tracking-tight text-slate-900 print:text-black leading-tight">
                    {teacher.namaSekolah}
                  </div>
                  <div className="font-extrabold text-xs sm:text-sm tracking-wider text-slate-900 print:text-black mt-0.5">
                    LEMBAR JAWABAN KOMPUTER (LJK)
                  </div>
                  <div className="text-[11px] sm:text-xs text-slate-700 print:text-black font-semibold mt-0.5">
                    Mata Pelajaran: <span className="font-bold text-black">{exam.subject}</span> &nbsp;|&nbsp; Kelas: <span className="font-bold text-black">{exam.gradeClass}</span> &nbsp;|&nbsp; Th. Ajaran: <span className="font-bold text-black">{teacher.tahunAjaran} ({teacher.semester})</span>
                  </div>
                  <div className="border-b-2 border-black mt-2 mb-0.5"></div>
                  <div className="border-b border-black mb-2"></div>
                </div>

                {/* 2. Petunjuk Pengisian Pensil 2B Box */}
                <div className="bg-slate-50 border border-slate-400 print:border-black rounded-sm p-2 text-[10px] sm:text-[11px] flex items-center justify-between gap-2 mx-1">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-900 print:text-black">PETUNJUK PENGISIAN:</span>
                    <p className="text-slate-700 print:text-black leading-tight">
                      1. Hitamkan bulatan penuh [●] dengan Pensil 2B / Pulpen Hitam. &nbsp;2. Jangan dilipat / robek. &nbsp;3. Hapus bersih jika keliru.
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 border-l border-slate-300 print:border-black pl-3">
                    <div className="text-center">
                      <span className="w-4 h-4 rounded-full bg-black text-white text-[8px] flex items-center justify-center font-bold mx-auto">●</span>
                      <span className="text-[8px] font-bold text-emerald-700">BENAR</span>
                    </div>
                    <div className="text-center">
                      <span className="w-4 h-4 rounded-full border border-black text-black text-[8px] flex items-center justify-center font-bold mx-auto">✕</span>
                      <span className="text-[8px] font-bold text-rose-700">SALAH</span>
                    </div>
                  </div>
                </div>

                {/* 3. Identitas Siswa & NISN Matrix Box */}
                <div className="border border-slate-700 print:border-black rounded-sm p-3 bg-white mx-1 my-2">
                  {/* Nama Peserta */}
                  <div className="flex items-center gap-2 mb-2.5">
                    <span className="font-bold text-[11px] sm:text-xs text-slate-900 print:text-black shrink-0">NAMA PESERTA :</span>
                    <div className="flex-1 h-7 border border-slate-500 print:border-black bg-slate-50/30 print:bg-white rounded-xs px-2.5 flex items-center text-[11px] sm:text-xs font-mono text-slate-400">
                      (Tuliskan nama lengkap peserta dengan huruf kapital)
                    </div>
                  </div>

                  {/* Split: NISN Columns (Left) & Paket / Tanggal / TTD (Right) */}
                  <div className="grid grid-cols-12 gap-3 items-start">
                    {/* Left: 10 Digit NISN Grid */}
                    <div className="col-span-7 sm:col-span-8 border border-slate-400 print:border-black rounded-sm p-2 bg-slate-50/50 print:bg-white">
                      <div className="font-bold text-[10px] sm:text-[11px] text-slate-900 print:text-black mb-1.5 flex items-center justify-between">
                        <span>NOMOR PESERTA / NISN (10 DIGIT)</span>
                      </div>
                      <div className="grid grid-cols-10 gap-1 text-center">
                        {Array.from({ length: 10 }).map((_, cIdx) => (
                          <div key={cIdx} className="flex flex-col items-center">
                            <div className="w-4.5 h-5.5 border border-slate-500 print:border-black bg-white rounded-xs mb-1"></div>
                            {Array.from({ length: 10 }).map((_, rIdx) => (
                              <span 
                                key={rIdx} 
                                className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-slate-700 print:border-black text-[8px] sm:text-[9px] flex items-center justify-center my-[0.5px] font-bold text-slate-900 print:text-black hover:bg-slate-200"
                              >
                                {rIdx}
                              </span>
                            ))}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Right: Paket Soal, Ruang & Tanda Tangan */}
                    <div className="col-span-5 sm:col-span-4 space-y-2">
                      {/* Paket Soal */}
                      <div className="border border-slate-400 print:border-black rounded-sm p-2 bg-white text-center">
                        <span className="font-bold text-[10px] sm:text-[11px] text-slate-900 print:text-black block mb-1">PAKET SOAL</span>
                        <div className="flex justify-around">
                          {['A', 'B', 'C', 'D'].map(pkt => (
                            <div key={pkt} className="w-5 h-5 rounded-full border border-slate-800 print:border-black text-[10px] flex items-center justify-center font-bold text-slate-900 print:text-black">
                              {pkt}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Ruang & Tanggal */}
                      <div className="border border-slate-400 print:border-black rounded-sm p-2 bg-white text-[10px] space-y-1">
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-800">RUANG:</span>
                          <span className="font-semibold text-slate-900">{exam.gradeClass}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="font-bold text-slate-800">TGL:</span>
                          <span className="font-semibold text-slate-900">{exam.date || '___/___/202_'}</span>
                        </div>
                      </div>

                      {/* Tanda Tangan */}
                      <div className="border border-slate-400 print:border-black rounded-sm p-2 bg-white h-20 flex flex-col justify-between">
                        <span className="font-bold text-[10px] text-slate-900 print:text-black">TTD PESERTA:</span>
                        <div className="border-b border-dotted border-slate-400 print:border-black mb-0.5"></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 4. Multiple Choice Answer Grid (1 - N) */}
                <div className="border border-slate-700 print:border-black rounded-sm p-3 bg-white mx-1 my-1.5 flex-1 flex flex-col justify-between">
                  <div className="text-center font-bold text-[11px] sm:text-xs text-slate-900 print:text-black pb-1.5 border-b border-slate-300 print:border-black mb-2 bg-slate-100 print:bg-transparent py-1 rounded-xs">
                    LEMBAR JAWABAN PILIHAN GANDA (NOMOR 1 s.d {totalQ})
                  </div>

                  <div className={`grid gap-3 flex-1 ${numCols === 2 ? 'grid-cols-2' : numCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
                    {Array.from({ length: numCols }).map((_, colIdx) => {
                      const startQ = colIdx * qPerCol + 1;
                      const endQ = Math.min((colIdx + 1) * qPerCol, totalQ);
                      const count = endQ >= startQ ? endQ - startQ + 1 : 0;

                      return (
                        <div key={colIdx} className="space-y-1.5 border-r border-slate-200 last:border-none pr-2">
                          {Array.from({ length: count }).map((_, qOffset) => {
                            const qNo = startQ + qOffset;

                            return (
                              <div key={qNo} className="flex items-center justify-start gap-2 text-[11px]">
                                <span className="font-bold w-5 shrink-0 text-slate-900 print:text-black font-mono text-left">
                                  {qNo.toString().padStart(2, '0')}.
                                </span>
                                <div className="flex items-center gap-1">
                                  {options.map(opt => (
                                    <span 
                                      key={opt} 
                                      className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border border-slate-700 print:border-black text-[9px] sm:text-[10px] flex items-center justify-center font-bold text-slate-900 print:text-black hover:bg-slate-200"
                                    >
                                      {opt}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 5. Footer Calibration & Metadata Bar */}
                <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-600 print:text-black font-medium px-2 pt-1 border-t border-slate-300 print:border-black">
                  <span>[LJK • ID: {exam.id}] Terkalibrasi Kyocera M2535dn</span>
                  <span className="font-bold">KEMENAG / DINAS PENDIDIKAN</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

