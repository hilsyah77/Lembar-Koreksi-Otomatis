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
  Scissors,
  CheckCircle,
  Layers
} from 'lucide-react';
import { ExamConfig, TeacherProfile } from '@/types/omr';
import { generatePrintableLjkFullA4, generatePrintableLjkA4DividedBy2 } from '@/lib/pdf-generator';

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
  const [layoutMode, setLayoutMode] = useState<'landscape_divided' | 'full_a4'>('landscape_divided');
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
    if (layoutMode === 'landscape_divided') {
      generatePrintableLjkA4DividedBy2(
        { ...exam, totalQuestions: totalQ, optionsCount: optCount },
        teacher,
        'landscape',
        8
      );
    } else {
      generatePrintableLjkFullA4(
        { ...exam, totalQuestions: totalQ, optionsCount: optCount },
        teacher,
        10
      );
    }
  };

  const handlePrintDirect = () => {
    window.print();
  };

  const options = optCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
  const isLandscapeDivided = layoutMode === 'landscape_divided';

  // Questions columns calculation
  const numCols = isLandscapeDivided
    ? (totalQ <= 25 ? 2 : totalQ <= 40 ? 3 : 4)
    : (totalQ <= 25 ? 2 : totalQ <= 40 ? 3 : 4);
  const qPerCol = Math.ceil(totalQ / numCols);

  // Helper component to render an individual A5 LJK half
  const renderSingleLjkHalf = (studentNo: number) => (
    <div className="flex-1 bg-white p-3.5 sm:p-4 print:p-2.5 rounded-lg border-2 border-slate-900 print:border-black text-slate-900 print:text-black flex flex-col justify-between relative">
      {/* 4 Black Corner Fiducial Markers */}
      <div className="absolute top-1.5 left-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-black" />
      <div className="absolute top-1.5 right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-black" />
      <div className="absolute bottom-1.5 left-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-black" />
      <div className="absolute bottom-1.5 right-1.5 w-3 h-3 sm:w-3.5 sm:h-3.5 bg-black" />

      {/* 1. Official Header */}
      <div className="text-center px-3 pt-0.5">
        <div className="font-black text-xs uppercase tracking-tight text-slate-900 print:text-black leading-tight line-clamp-1">
          {teacher.namaSekolah}
        </div>
        <div className="font-extrabold text-[11px] tracking-wider text-slate-900 print:text-black mt-0.5">
          LEMBAR JAWABAN KOMPUTER (LJK)
        </div>
        <div className="text-[9px] text-slate-700 print:text-black font-semibold mt-0.5">
          Mapel: <span className="font-bold text-black">{exam.subject}</span> | Kelas: <span className="font-bold text-black">{exam.gradeClass}</span> | Th. Ajaran: <span className="font-bold text-black">{teacher.tahunAjaran}</span>
        </div>
        <div className="border-b-2 border-black mt-1.5 mb-0.5"></div>
        <div className="border-b border-black mb-1.5"></div>
      </div>

      {/* 2. Petunjuk Pengisian Singkat */}
      <div className="bg-slate-50 border border-slate-400 print:border-black rounded-sm p-1.5 text-[8.5px] flex items-center justify-between gap-1.5 mx-0.5">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 print:text-black">PETUNJUK:</span>
          <p className="text-slate-700 print:text-black leading-tight">
            1. Hitamkan bulatan [●] dgn Pensil 2B / Pulpen. 2. Jgn lipat/robek. 3. Hapus bersih jika keliru.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 border-l border-slate-300 print:border-black pl-1.5">
          <div className="text-center">
            <span className="w-3 h-3 rounded-full bg-black text-white text-[7px] flex items-center justify-center font-bold mx-auto">●</span>
            <span className="text-[6.5px] font-bold text-emerald-700">BENAR</span>
          </div>
          <div className="text-center">
            <span className="w-3 h-3 rounded-full border border-black text-black text-[7px] flex items-center justify-center font-bold mx-auto">✕</span>
            <span className="text-[6.5px] font-bold text-rose-700">SALAH</span>
          </div>
        </div>
      </div>

      {/* 3. Identitas Siswa & NISN Matrix Box */}
      <div className="border border-slate-700 print:border-black rounded-sm p-2 bg-white mx-0.5 my-1.5 space-y-1.5">
        {/* Nama Peserta */}
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-[9px] text-slate-900 print:text-black shrink-0">NAMA PESERTA :</span>
          <div className="flex-1 h-5 border border-slate-500 print:border-black bg-slate-50/30 print:bg-white rounded-xs px-2 flex items-center text-[9px] font-mono text-slate-400">
            (Tuliskan nama lengkap peserta)
          </div>
        </div>

        {/* Split: 10 Digit NISN Grid (Left) & Paket / Ruang / TTD (Right) */}
        <div className="grid grid-cols-12 gap-2 items-start">
          {/* Left: 10 Digit NISN Grid */}
          <div className="col-span-7 border border-slate-400 print:border-black rounded-sm p-1.5 bg-slate-50/50 print:bg-white">
            <div className="font-bold text-[8.5px] text-slate-900 print:text-black mb-1 flex items-center justify-between">
              <span>NOMOR PESERTA / NISN (10 DIGIT)</span>
            </div>
            <div className="grid grid-cols-10 gap-0.5 text-center">
              {Array.from({ length: 10 }).map((_, cIdx) => (
                <div key={cIdx} className="flex flex-col items-center">
                  <div className="w-3.5 h-4 border border-slate-500 print:border-black bg-white rounded-xs mb-0.5"></div>
                  {Array.from({ length: 10 }).map((_, rIdx) => (
                    <span 
                      key={rIdx} 
                      className="w-3 h-3 rounded-full border border-slate-700 print:border-black text-[7px] flex items-center justify-center my-[0.5px] font-bold text-slate-900 print:text-black"
                    >
                      {rIdx}
                    </span>
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Right: Paket Soal, Ruang, Tgl & Tanda Tangan */}
          <div className="col-span-5 space-y-1">
            {/* Paket Soal */}
            <div className="border border-slate-400 print:border-black rounded-sm p-1 bg-white text-center">
              <span className="font-bold text-[8.5px] text-slate-900 print:text-black block mb-0.5">PAKET SOAL</span>
              <div className="flex justify-around">
                {['A', 'B', 'C', 'D'].map(pkt => (
                  <div key={pkt} className="w-4 h-4 rounded-full border border-slate-800 print:border-black text-[8px] flex items-center justify-center font-bold text-slate-900 print:text-black">
                    {pkt}
                  </div>
                ))}
              </div>
            </div>

            {/* Ruang & Tanggal */}
            <div className="border border-slate-400 print:border-black rounded-sm p-1 bg-white text-[8px] space-y-0.5">
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
            <div className="border border-slate-400 print:border-black rounded-sm p-1 bg-white h-12 flex flex-col justify-between">
              <span className="font-bold text-[8px] text-slate-900 print:text-black">TTD PESERTA:</span>
              <div className="border-b border-dotted border-slate-400 print:border-black mb-0.5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Multiple Choice Answer Grid (1 - N) */}
      <div className="border border-slate-700 print:border-black rounded-sm p-2 bg-white mx-0.5 my-1 flex-1 flex flex-col justify-between">
        <div className="text-center font-bold text-[9px] text-slate-900 print:text-black pb-1 border-b border-slate-300 print:border-black mb-1.5 bg-slate-100 print:bg-transparent py-0.5 rounded-xs">
          LEMBAR JAWABAN PILIHAN GANDA (NOMOR 1 s.d {totalQ})
        </div>

        <div className={`grid gap-2 flex-1 ${numCols === 2 ? 'grid-cols-2' : numCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {Array.from({ length: numCols }).map((_, colIdx) => {
            const startQ = colIdx * qPerCol + 1;
            const endQ = Math.min((colIdx + 1) * qPerCol, totalQ);
            const count = endQ >= startQ ? endQ - startQ + 1 : 0;

            return (
              <div key={colIdx} className="space-y-1 border-r border-slate-200 last:border-none pr-1.5">
                {Array.from({ length: count }).map((_, qOffset) => {
                  const qNo = startQ + qOffset;

                  return (
                    <div key={qNo} className="flex items-center justify-start gap-1.5 text-[9px]">
                      <span className="font-bold w-4 shrink-0 text-slate-900 print:text-black font-mono text-left">
                        {qNo.toString().padStart(2, '0')}.
                      </span>
                      <div className="flex items-center gap-0.5">
                        {options.map(opt => (
                          <span 
                            key={opt} 
                            className="w-3.5 h-3.5 rounded-full border border-slate-700 print:border-black text-[7.5px] flex items-center justify-center font-bold text-slate-900 print:text-black"
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

      {/* 5. Footer Calibration & Metadata */}
      <div className="flex items-center justify-between text-[7.5px] text-slate-600 print:text-black font-medium px-1 pt-1 border-t border-slate-300 print:border-black">
        <span>[LJK-A4-LANDSCAPE • SISWA {studentNo} • ID: {exam.id}] Kyocera M2535dn</span>
        <span className="font-bold">KEMENAG / DISDIK</span>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6 print:max-w-none print:w-full print:p-0 print:m-0 print:space-y-0">
      {/* Embedded Print Stylesheet strictly adapted for Landscape A4 Divided by 2 or Full A4 */}
      <style>{`
        @media print {
          @page {
            size: ${isLandscapeDivided ? 'A4 landscape' : 'A4 portrait'};
            margin: ${isLandscapeDivided ? '5mm 6mm 5mm 6mm' : '8mm 8mm 8mm 8mm'} !important;
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
            top: ${isLandscapeDivided ? '5mm' : '8mm'} !important;
            left: ${isLandscapeDivided ? '6mm' : '8mm'} !important;
            right: ${isLandscapeDivided ? '6mm' : '8mm'} !important;
            bottom: ${isLandscapeDivided ? '5mm' : '8mm'} !important;
            width: calc(${isLandscapeDivided ? '297mm - 12mm' : '210mm - 16mm'}) !important;
            height: calc(${isLandscapeDivided ? '210mm - 10mm' : '297mm - 16mm'}) !important;
            max-height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            z-index: 9999999 !important;
            display: flex !important;
            flex-direction: ${isLandscapeDivided ? 'row' : 'column'} !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
          }
        }
      `}</style>

      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <Scissors className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Generator LJK Hemat Kertas (A4 Dibagi 2 Landscape)
              </h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Hemat Kertas 50%
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              1 lembar kertas A4 posisi horizontal (landscape) dibagi 2 untuk 2 siswa. Dilengkapi garis potong tengah dan terkalibrasi scanner/kamera.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleDownloadPdf}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-200 transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF ({isLandscapeDivided ? 'A4 Landscape Bagi 2' : 'Full A4'})
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
              <Sliders className="w-4 h-4 text-emerald-600" />
              Pilihan Format Lembar LJK
            </h3>

            {/* Layout Mode Selector: A4 Landscape Bagi 2 vs Full A4 */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-2">
                Pilihan Format Kertas Cetak
              </label>
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => setLayoutMode('landscape_divided')}
                  className={`w-full p-3.5 rounded-xl font-bold border transition-all text-left flex items-start gap-3 ${
                    layoutMode === 'landscape_divided'
                      ? 'bg-emerald-50/80 border-emerald-600 text-emerald-900 ring-2 ring-emerald-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-10 h-7 border-2 border-current rounded bg-white flex items-center justify-between p-0.5 shrink-0 mt-0.5">
                    <div className="w-4 h-full border border-current opacity-40 rounded-xs text-[5px] flex items-center justify-center">LJK 1</div>
                    <div className="h-full border-r border-dashed border-red-500"></div>
                    <div className="w-4 h-full border border-current opacity-40 rounded-xs text-[5px] flex items-center justify-center">LJK 2</div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      A4 Landscape Dibagi 2 (2 Siswa / Lembar)
                      {layoutMode === 'landscape_divided' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 inline shrink-0" />}
                    </div>
                    <p className="text-[11px] font-medium text-emerald-700 mt-0.5">
                      ★ Hemat kertas & biaya fotokopi 50% (Posisi Mendatar / Landscape).
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setLayoutMode('full_a4')}
                  className={`w-full p-3.5 rounded-xl font-bold border transition-all text-left flex items-start gap-3 ${
                    layoutMode === 'full_a4'
                      ? 'bg-blue-50 border-blue-600 text-blue-900 ring-2 ring-blue-600/20'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="w-7 h-9 border-2 border-current rounded bg-white flex flex-col justify-between p-0.5 shrink-0 mt-0.5">
                    <div className="w-full h-1 bg-current opacity-40 rounded-xs"></div>
                    <div className="w-full h-4 border border-dashed border-current opacity-30 rounded-xs"></div>
                    <div className="w-full h-1 bg-current opacity-40 rounded-xs"></div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 flex items-center gap-1.5 text-xs">
                      1 Lembar A4 Portrait Penuh (1 Siswa / Lembar)
                      {layoutMode === 'full_a4' && <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 inline shrink-0" />}
                    </div>
                    <p className="text-[11px] font-normal text-slate-500 mt-0.5">
                      Satu lembar utuh A4 tegak (portrait) untuk 1 siswa.
                    </p>
                  </div>
                </button>
              </div>
            </div>

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
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
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
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  4 Pilihan (A, B, C, D)
                </button>
                <button
                  onClick={() => setOptCount(5)}
                  className={`py-2 rounded-lg font-semibold border transition-all ${
                    optCount === 5
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
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
                <span className="text-slate-500 font-medium">Tahun Ajaran:</span>
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
                  <FileCheck2 className="w-4 h-4 text-emerald-600" />
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
              Masing-masing bagian LJK dilengkapi 4 titik fiducial OMR di setiap sudut, menjamin akurasi deteksi pemindaian otomatis saat kertas dipotong menjadi dua lembar A5.
            </p>
          </div>
        </div>

        {/* Right: Visual Preview */}
        <div className="lg:col-span-8 print:w-full print:p-0 print:m-0">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col gap-3 print:border-none print:shadow-none print:p-0 print:m-0 print:bg-white">
            <div className="flex items-center justify-between text-xs text-slate-500 pb-3 border-b border-slate-100 print:hidden">
              <span className="font-bold text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Pratinjau Kertas {isLandscapeDivided ? 'A4 Landscape Dibagi 2 (2 Siswa)' : '1 Lembar A4 Portrait'}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  {isLandscapeDivided ? 'Format Hemat Kertas 50%' : 'Format 1 Siswa / Lembar'}
                </span>
                <span className="font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                  {totalQ} Soal ({optCount} Opsi)
                </span>
              </div>
            </div>

            {/* Simulated Paper Container */}
            <div className="overflow-x-auto select-none print:m-0 print:p-0 print:border-none print:bg-white print:overflow-visible flex justify-center bg-slate-100 p-3 sm:p-5 rounded-xl border border-slate-200">
              {isLandscapeDivided ? (
                /* LANDSCAPE A4 DIVIDED BY 2 (Side-by-side) */
                <div 
                  id="printable-ljk-container" 
                  className="w-full max-w-[840px] bg-white p-3 print:p-0 rounded-lg shadow-sm print:shadow-none border border-slate-300 print:border-none text-slate-900 print:text-black flex flex-row gap-3 print:gap-2 relative"
                  style={{
                    aspectRatio: '297 / 210'
                  }}
                >
                  {/* Left Half: LJK Siswa 1 */}
                  {renderSingleLjkHalf(1)}

                  {/* Vertical Center Cut-Line Guide */}
                  <div className="relative flex flex-col justify-center items-center px-1 shrink-0">
                    <div className="w-0 h-full border-r-2 border-dashed border-slate-400 print:border-black flex flex-col justify-center items-center relative">
                      <div className="bg-white px-1.5 py-1 border border-slate-300 print:border-black rounded-md text-[8px] font-bold text-slate-600 print:text-black flex flex-col items-center gap-1 shadow-xs z-10">
                        <Scissors className="w-3.5 h-3.5 text-rose-500 print:text-black" />
                        <span className="rotate-[-90deg] whitespace-nowrap my-4 text-[7px] tracking-wider">
                          POTONG TENGAH
                        </span>
                        <Scissors className="w-3.5 h-3.5 text-rose-500 print:text-black" />
                      </div>
                    </div>
                  </div>

                  {/* Right Half: LJK Siswa 2 */}
                  {renderSingleLjkHalf(2)}
                </div>
              ) : (
                /* FULL A4 PORTRAIT SHEET */
                <div 
                  id="printable-ljk-container" 
                  className="w-full max-w-[680px] bg-white p-5 sm:p-6 print:p-3 rounded-lg shadow-sm print:shadow-none border-2 border-slate-900 print:border-black text-slate-900 print:text-black flex flex-col justify-between relative"
                  style={{
                    aspectRatio: '210 / 297'
                  }}
                >
                  {/* 4 Black Corner Fiducial Markers */}
                  <div className="absolute top-2 left-2 w-4 h-4 bg-black" />
                  <div className="absolute top-2 right-2 w-4 h-4 bg-black" />
                  <div className="absolute bottom-2 left-2 w-4 h-4 bg-black" />
                  <div className="absolute bottom-2 right-2 w-4 h-4 bg-black" />

                  {/* 1. Official Header */}
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
                    <div className="flex items-center gap-2 mb-2.5">
                      <span className="font-bold text-[11px] sm:text-xs text-slate-900 print:text-black shrink-0">NAMA PESERTA :</span>
                      <div className="flex-1 h-7 border border-slate-500 print:border-black bg-slate-50/30 print:bg-white rounded-xs px-2.5 flex items-center text-[11px] sm:text-xs font-mono text-slate-400">
                        (Tuliskan nama lengkap peserta dengan huruf kapital)
                      </div>
                    </div>

                    <div className="grid grid-cols-12 gap-3 items-start">
                      {/* 10 Digit NISN Grid */}
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
                                  className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-slate-700 print:border-black text-[8px] sm:text-[9px] flex items-center justify-center my-[0.5px] font-bold text-slate-900 print:text-black"
                                >
                                  {rIdx}
                                </span>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Paket Soal, Ruang & TTD */}
                      <div className="col-span-5 sm:col-span-4 space-y-2">
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
                                        className="w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full border border-slate-700 print:border-black text-[9px] sm:text-[10px] flex items-center justify-center font-bold text-slate-900 print:text-black"
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

                  {/* 5. Footer Calibration */}
                  <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-slate-600 print:text-black font-medium px-2 pt-1 border-t border-slate-300 print:border-black">
                    <span>[LJK-A4-FULL • ID: {exam.id}] Terkalibrasi Kyocera M2535dn</span>
                    <span className="font-bold">KEMENAG / DINAS PENDIDIKAN</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
