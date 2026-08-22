'use client';

import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  Download, 
  Scissors, 
  Sparkles, 
  CheckCircle, 
  Layers, 
  Sliders,
  CheckCircle2,
  FileCheck2,
  Copy
} from 'lucide-react';
import { ExamConfig, TeacherProfile } from '@/types/omr';
import { generatePrintableLjkA4DividedBy2 } from '@/lib/pdf-generator';

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
    generatePrintableLjkA4DividedBy2(
      { ...exam, totalQuestions: totalQ, optionsCount: optCount },
      teacher
    );
  };

  const handlePrintDirect = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 print:max-w-none print:w-full print:p-0 print:m-0 print:space-y-0">
      {/* Embedded Print Stylesheet */}
      <style>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 4mm 6mm;
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
          /* Hide EVERYTHING across the web app during print */
          body * {
            visibility: hidden !important;
          }
          /* Exclusively show the LJK worksheet container */
          #printable-ljk-sheet,
          #printable-ljk-sheet * {
            visibility: visible !important;
          }
          #printable-ljk-sheet {
            position: fixed !important;
            top: 0 !important;
            left: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            display: grid !important;
            grid-template-columns: 1fr 1fr !important;
            gap: 6mm !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            z-index: 9999999 !important;
          }
        }
      `}</style>

      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Generator Lembar Jawaban Komputer (LJK) A4 Dibagi 2
              </h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                Hemat 50% Kertas
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Desain minimalis beresolusi tinggi, 1 lembar A4 dicetak untuk 2 siswa (Format A5). Kompatibel dengan ADF Kyocera M2535dn & Kamera Ponsel.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF Siap Cetak (A4)
          </button>

          <button
            onClick={handlePrintDirect}
            className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 transition-colors"
          >
            <Printer className="w-4 h-4 text-emerald-600" />
            Cetak Langsung
          </button>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 print:block print:w-full print:p-0 print:m-0">
        {/* Left: Customizer Controls */}
        <div className="lg:col-span-4 space-y-4 print:hidden">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2 pb-3.5 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-blue-600" />
              Kustomisasi Model LJK Minimalis
            </h3>

            {/* Total Questions Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Jumlah Butir Soal
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
                <span className="text-slate-500 font-medium">Nama Sekolah di LJK:</span>
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
                  Berhasil Disimpan ke Ujian Aktif!
                </>
              ) : (
                <>
                  <FileCheck2 className="w-4 h-4 text-blue-600" />
                  Terapkan Format Ini ke Ujian Aktif
                </>
              )}
            </button>
          </div>

          {/* Paper Savings Card */}
          <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-5 text-xs text-emerald-900 space-y-1.5 shadow-xs">
            <div className="font-bold flex items-center gap-1.5 text-emerald-800">
              <Scissors className="w-4 h-4 text-emerald-600" />
              Efisiensi Penggandaan Kertas Fotokopi
            </div>
            <p className="text-emerald-800/90 leading-relaxed font-medium">
              Dengan model A4 dibagi 2, untuk 36 siswa Anda hanya perlu mencetak <strong>18 lembar kertas A4</strong>. Setelah dicetak, potong tepat di bagian tengah menjadi 2 lembar format A5.
            </p>
          </div>
        </div>

        {/* Right: High-Fidelity Interactive Visual Preview */}
        <div className="lg:col-span-8 print:w-full print:p-0 print:m-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-3 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100 print:hidden">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-600" />
                Pratinjau Lembar A4 Landscape (Isi 2 LJK Siswa Kiri & Kanan)
              </span>
              <span className="font-semibold text-slate-500">Skala 1:1 Presisi OMR</span>
            </div>

            {/* A4 Landscape Virtual Sheet (White Paper Container) */}
            <div className="bg-slate-100 rounded-xl p-4 sm:p-6 border border-slate-200 overflow-x-auto select-none print:m-0 print:p-0 print:border-none print:bg-white print:overflow-visible print:rounded-none">
              <div 
                id="printable-ljk-sheet" 
                className="min-w-[680px] print:min-w-0 print:w-full grid grid-cols-2 gap-4 print:gap-4 relative bg-white p-4 print:p-0 rounded-lg print:rounded-none shadow-md print:shadow-none border border-slate-300 print:border-none"
              >
                {/* Left & Right A5 Sheets */}
                {[1, 2].map(sheetIdx => (
                  <div 
                    key={sheetIdx} 
                    className="border border-slate-400 print:border-2 print:border-black rounded-lg print:rounded-none p-3 print:p-3 bg-white flex flex-col justify-between relative text-[10px] print:text-[8px]"
                  >
                    {/* 4 Corner Fiducial Markers */}
                    <div className="absolute top-2 left-2 w-2.5 h-2.5 bg-black" />
                    <div className="absolute top-2 right-2 w-2.5 h-2.5 bg-black" />
                    <div className="absolute bottom-2 left-2 w-2.5 h-2.5 bg-black" />
                    <div className="absolute bottom-2 right-2 w-2.5 h-2.5 bg-black" />

                    {/* Sheet Header */}
                    <div className="text-center px-4">
                      <div className="font-black text-[11px] print:text-[9.5px] uppercase tracking-tight text-slate-900 print:text-black">{teacher.namaSekolah}</div>
                      <div className="font-bold text-[9px] print:text-[8px] text-slate-800 print:text-black">LEMBAR JAWABAN KOMPUTER (LJK) MINIMALIS</div>
                      <div className="text-[8px] print:text-[7px] text-slate-600 print:text-slate-800 mt-0.5 font-medium">
                        {exam.subject} • {exam.gradeClass} • Th. {teacher.tahunAjaran}
                      </div>
                      <div className="border-b border-slate-900 print:border-black my-1.5"></div>
                    </div>

                    {/* Student Info Box */}
                    <div className="grid grid-cols-12 gap-2 my-1">
                      {/* Left: Name & Number */}
                      <div className="col-span-8 border border-slate-400 print:border-slate-800 rounded p-1.5 bg-slate-50 print:bg-white">
                        <div className="font-bold text-[8px] print:text-[7px] text-slate-900 print:text-black">NAMA PESERTA:</div>
                        <div className="h-4 border border-slate-300 print:border-slate-800 bg-white rounded my-0.5"></div>

                        <div className="font-bold text-[8px] print:text-[7px] text-slate-900 print:text-black mt-1">NOMOR PESERTA (9 DIGIT):</div>
                        <div className="flex justify-between mt-1">
                          {Array.from({ length: 9 }).map((_, cIdx) => (
                            <div key={cIdx} className="flex flex-col items-center">
                              <div className="w-2.5 h-3 border border-slate-300 print:border-slate-800 bg-white text-[7px] text-center mb-0.5 font-mono"></div>
                              {Array.from({ length: 10 }).map((_, rIdx) => (
                                <span key={rIdx} className="w-2 h-2 rounded-full border border-slate-600 print:border-black text-[6px] flex items-center justify-center my-[0.5px] font-bold text-slate-700 print:text-black">
                                  {rIdx}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Right: Packet & Signature */}
                      <div className="col-span-4 flex flex-col justify-between">
                        <div className="border border-slate-400 print:border-slate-800 rounded p-1.5 bg-slate-50 print:bg-white text-center">
                          <div className="font-bold text-[8px] print:text-[7px] text-slate-900 print:text-black">PAKET SOAL</div>
                          <div className="flex justify-around mt-1">
                            {['A', 'B', 'C', 'D'].map(pkt => (
                              <div key={pkt} className="w-3 h-3 rounded-full border border-slate-700 print:border-black text-[7px] flex items-center justify-center font-bold text-slate-900 print:text-black">
                                {pkt}
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="border border-slate-400 print:border-slate-800 rounded p-1.5 bg-slate-50 print:bg-white text-[7.5px] print:text-[6.5px] mt-1">
                          <div className="font-semibold text-slate-800 print:text-black">TGL: ___/___/202_</div>
                          <div className="mt-1 font-bold text-[7px] text-slate-900 print:text-black">TTD PESERTA:</div>
                          <div className="h-6 border border-slate-300 print:border-slate-800 bg-white rounded mt-0.5"></div>
                        </div>
                      </div>
                    </div>

                    {/* Answer Grid (2 Columns: 1-13 & 14-25, etc.) */}
                    <div className="mt-1 border border-slate-400 print:border-slate-800 rounded p-1.5 bg-slate-50 print:bg-white">
                      <div className="text-center font-bold text-[8px] print:text-[7px] text-slate-900 print:text-black pb-1 border-b border-slate-300 print:border-slate-800 mb-1">
                        PILIHAN JAWABAN GANDA (1 - {totalQ})
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2].map(colIdx => {
                          const half = Math.ceil(totalQ / 2);
                          const startQ = colIdx === 1 ? 1 : half + 1;
                          const endQ = colIdx === 1 ? half : totalQ;
                          const count = endQ - startQ + 1;

                          return (
                            <div key={colIdx} className="space-y-[2px]">
                              {Array.from({ length: count }).map((_, qOffset) => {
                                const qNo = startQ + qOffset;
                                const options = optCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

                                return (
                                  <div key={qNo} className="flex items-center justify-between text-[7.5px] print:text-[6.5px]">
                                    <span className="font-bold w-4 text-slate-900 print:text-black">{qNo.toString().padStart(2, '0')}.</span>
                                    <div className="flex gap-1">
                                      {options.map(opt => (
                                        <span key={opt} className="w-2.5 h-2.5 rounded-full border border-slate-700 print:border-black text-[6.5px] flex items-center justify-center font-bold text-slate-800 print:text-black">
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

                    {/* Footer */}
                    <div className="text-[6.5px] text-slate-500 print:text-slate-800 font-semibold text-center mt-1">
                      [LJK-A4-BAGI-2 • KYOCERA M2535DN & CAM READY]
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
