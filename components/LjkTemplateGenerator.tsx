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
  Layers,
  Key
} from 'lucide-react';
import { ExamConfig, TeacherProfile, OptionLetter } from '@/types/omr';
import { generatePrintableLjkFullA4, generatePrintableLjkA4DividedBy2 } from '@/lib/pdf-generator';

interface LjkTemplateGeneratorProps {
  exam: ExamConfig;
  teacher: TeacherProfile;
  onUpdateExam: (updated: ExamConfig) => void;
  onOpenExamModal?: () => void;
}

export const LjkTemplateGenerator: React.FC<LjkTemplateGeneratorProps> = ({
  exam,
  teacher,
  onUpdateExam,
  onOpenExamModal
}) => {
  const [layoutMode, setLayoutMode] = useState<'landscape_divided' | 'full_a4'>('landscape_divided');
  const [totalQ, setTotalQ] = useState<number>(exam.totalQuestions || 25);
  const [optCount, setOptCount] = useState<4 | 5>(exam.optionsCount || 5);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  const handleApplyToCurrentExam = () => {
    const rawPackets = exam.packets && exam.packets.length > 0
      ? exam.packets
      : [{ packetCode: 'A', keys: {} }];

    const updatedPackets = rawPackets.map(pkt => {
      const newKeys: Record<number, OptionLetter> = { ...(pkt.keys || {}) };
      for (let i = 1; i <= totalQ; i++) {
        if (!newKeys[i]) {
          newKeys[i] = 'A';
        }
        if (optCount === 4 && newKeys[i] === 'E') {
          newKeys[i] = 'D';
        }
      }
      return {
        packetCode: pkt.packetCode || 'A',
        keys: newKeys
      };
    });

    const updatedWeights: Record<number, number> = { ...(exam.questionWeights || {}) };
    for (let i = 1; i <= totalQ; i++) {
      if (updatedWeights[i] === undefined) {
        updatedWeights[i] = 1;
      }
    }

    onUpdateExam({
      ...exam,
      totalQuestions: totalQ,
      optionsCount: optCount,
      packets: updatedPackets,
      questionWeights: updatedWeights,
      updatedAt: new Date().toISOString()
    });
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2500);
  };

  const handleDownloadPdf = () => {
    if (layoutMode === 'landscape_divided') {
      generatePrintableLjkA4DividedBy2(
        { ...exam, totalQuestions: totalQ, optionsCount: optCount },
        teacher,
        'landscape',
        5
      );
    } else {
      generatePrintableLjkFullA4(
        { ...exam, totalQuestions: totalQ, optionsCount: optCount },
        teacher,
        8
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

  // Derive display subject & class from teacher profile (data guru pengampu)
  const displaySubject = teacher.mataPelajaran || exam.subject;
  const displayClass = teacher.tingkatKelas || exam.gradeClass;

  // Helper component to render an individual A5 LJK half (140mm x 200mm)
  const renderSingleLjkHalf = (studentNo: number) => (
    <div className="print-ljk-half flex-1 bg-white p-3.5 sm:p-4 print:p-2 rounded-lg border-2 border-slate-900 print:border-black text-slate-900 print:text-black flex flex-col justify-between relative box-border overflow-hidden">
      {/* 4 Black Corner Fiducial Markers for Scanner Alignment */}
      <div className="absolute top-1.5 left-1.5 w-3.5 h-3.5 bg-black" />
      <div className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-black" />
      <div className="absolute bottom-1.5 left-1.5 w-3.5 h-3.5 bg-black" />
      <div className="absolute bottom-1.5 right-1.5 w-3.5 h-3.5 bg-black" />

      {/* 1. Official Header */}
      <div className="text-center px-2 pt-0.5">
        <div className="font-black text-xs uppercase tracking-tight text-slate-900 print:text-black leading-tight line-clamp-1">
          {teacher.namaSekolah}
        </div>
        <div className="font-extrabold text-[10.5px] tracking-wider text-slate-900 print:text-black mt-0.5">
          LEMBAR JAWABAN KOMPUTER (LJK)
        </div>
        <div className="text-[8.5px] text-slate-700 print:text-black font-semibold mt-0.5">
          Mapel: <span className="font-bold text-black">{displaySubject}</span> | Kelas: <span className="font-bold text-black">{displayClass}</span> | Th. Ajaran: <span className="font-bold text-black">{teacher.tahunAjaran}</span>
        </div>
        <div className="border-b-2 border-black mt-1 mb-0.5"></div>
        <div className="border-b border-black mb-1"></div>
      </div>

      {/* 2. Petunjuk Pengisian Singkat */}
      <div className="bg-slate-50 border border-slate-400 print:border-black rounded-xs p-1 text-[8px] flex items-center justify-between gap-1 w-full">
        <div className="space-y-0.5">
          <span className="font-bold text-slate-900 print:text-black">PETUNJUK:</span>
          <p className="text-slate-700 print:text-black leading-none text-[7.5px]">
            1. Hitamkan bulatan [●] dgn Pensil 2B / Pulpen. 2. Jgn lipat/robek. 3. Hapus bersih jika keliru.
          </p>
        </div>
        <div className="flex items-center gap-1 shrink-0 border-l border-slate-300 print:border-black pl-1">
          <div className="text-center">
            <span className="w-3 h-3 rounded-full bg-black text-white text-[7px] flex items-center justify-center font-bold mx-auto">●</span>
            <span className="text-[6px] font-bold text-emerald-700 print:text-black">BENAR</span>
          </div>
          <div className="text-center">
            <span className="w-3 h-3 rounded-full border border-black text-black text-[7px] flex items-center justify-center font-bold mx-auto">✕</span>
            <span className="text-[6px] font-bold text-rose-700 print:text-black">SALAH</span>
          </div>
        </div>
      </div>

      {/* 3. Identitas Siswa & NISN Matrix Box */}
      <div className="border border-slate-700 print:border-black rounded-xs p-1.5 bg-white w-full my-1 space-y-1">
        {/* Nama Peserta */}
        <div className="flex items-center gap-1">
          <span className="font-bold text-[8.5px] text-slate-900 print:text-black shrink-0">NAMA PESERTA :</span>
          <div className="flex-1 h-4.5 border border-slate-500 print:border-black bg-white rounded-xs px-1.5 flex items-center">
          </div>
        </div>

        {/* Split: 10 Digit NISN Grid (Left) & Paket / Ruang / TTD (Right) */}
        <div className="grid grid-cols-12 gap-1.5 items-start">
          {/* Left: 10 Digit NISN Grid */}
          <div className="col-span-7 border border-slate-400 print:border-black rounded-xs p-1 bg-slate-50/50 print:bg-white">
            <div className="font-bold text-[7.5px] text-slate-900 print:text-black mb-0.5 flex items-center justify-between">
              <span>NOMOR PESERTA / NISN (10 DIGIT)</span>
            </div>
            <div className="grid grid-cols-10 gap-0.5 text-center">
              {Array.from({ length: 10 }).map((_, cIdx) => (
                <div key={cIdx} className="flex flex-col items-center">
                  <div className="w-3.5 h-3.5 border border-slate-500 print:border-black bg-white rounded-xs mb-0.5"></div>
                  {Array.from({ length: 10 }).map((_, rIdx) => (
                    <span 
                      key={rIdx} 
                      className="w-3 h-3 rounded-full border border-slate-700 print:border-black text-[6.5px] flex items-center justify-center my-[0.5px] font-bold text-slate-900 print:text-black leading-none"
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
            <div className="border border-slate-400 print:border-black rounded-xs p-1 bg-white text-center">
              <span className="font-bold text-[7.5px] text-slate-900 print:text-black block mb-0.5">PAKET SOAL</span>
              <div className="flex justify-around">
                {['A', 'B', 'C', 'D'].map(pkt => (
                  <div key={pkt} className="w-3.5 h-3.5 rounded-full border border-slate-800 print:border-black text-[7.5px] flex items-center justify-center font-bold text-slate-900 print:text-black">
                    {pkt}
                  </div>
                ))}
              </div>
            </div>

            {/* Ruang & Tanggal */}
            <div className="border border-slate-400 print:border-black rounded-xs p-1 bg-white text-[7.5px] space-y-0.5">
              <div className="flex justify-between">
                <span className="font-bold text-slate-800 print:text-black">RUANG:</span>
                <span className="font-semibold text-slate-900 print:text-black">{displayClass}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold text-slate-800 print:text-black">TGL:</span>
                <span className="font-semibold text-slate-900 print:text-black">{exam.date || '___/___/202_'}</span>
              </div>
            </div>

            {/* Tanda Tangan */}
            <div className="border border-slate-400 print:border-black rounded-xs p-1 bg-white h-10 flex flex-col justify-between">
              <span className="font-bold text-[7.5px] text-slate-900 print:text-black">TTD PESERTA:</span>
              <div className="border-b border-dotted border-slate-400 print:border-black mb-0.5"></div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Multiple Choice Answer Grid (1 - N) */}
      <div className="border border-slate-700 print:border-black rounded-xs p-1.5 bg-white w-full my-0.5 flex-1 flex flex-col justify-between">
        <div className="text-center font-bold text-[8.5px] text-slate-900 print:text-black pb-0.5 border-b border-slate-300 print:border-black mb-1 bg-slate-100 print:bg-transparent py-0.5 rounded-xs">
          LEMBAR JAWABAN PILIHAN GANDA (NOMOR 1 s.d {totalQ})
        </div>

        <div className={`grid gap-1.5 flex-1 ${numCols === 2 ? 'grid-cols-2' : numCols === 3 ? 'grid-cols-3' : 'grid-cols-4'}`}>
          {Array.from({ length: numCols }).map((_, colIdx) => {
            const startQ = colIdx * qPerCol + 1;
            const endQ = Math.min((colIdx + 1) * qPerCol, totalQ);
            const count = endQ >= startQ ? endQ - startQ + 1 : 0;

            return (
              <div key={colIdx} className="space-y-0.5 border-r border-slate-200 print:border-slate-300 last:border-none pr-1">
                {Array.from({ length: count }).map((_, qOffset) => {
                  const qNo = startQ + qOffset;

                  return (
                    <div key={qNo} className="flex items-center justify-start gap-1 text-[8.5px]">
                      <span className="font-bold w-4 shrink-0 text-slate-900 print:text-black font-mono text-left">
                        {qNo.toString().padStart(2, '0')}.
                      </span>
                      <div className="flex items-center gap-0.5">
                        {options.map(opt => (
                          <span 
                            key={opt} 
                            className="w-3.5 h-3.5 rounded-full border border-slate-700 print:border-black text-[7px] flex items-center justify-center font-bold text-slate-900 print:text-black"
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
      <div className="flex items-center justify-between text-[7px] text-slate-600 print:text-black font-medium px-1 pt-0.5 border-t border-slate-300 print:border-black w-full">
        <span>[LJK-A4-LANDSCAPE • SISWA {studentNo} • ID: {exam.id}] Terkalibrasi OMR Scanner / Kamera</span>
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
            size: ${isLandscapeDivided ? '297mm 210mm' : '210mm 297mm'};
            margin: 0mm !important;
          }
          *, *::before, *::after {
            box-sizing: border-box !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
            width: ${isLandscapeDivided ? '297mm' : '210mm'} !important;
            height: ${isLandscapeDivided ? '210mm' : '297mm'} !important;
            max-width: ${isLandscapeDivided ? '297mm' : '210mm'} !important;
            max-height: ${isLandscapeDivided ? '210mm' : '297mm'} !important;
            overflow: hidden !important;
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
            top: 0 !important;
            left: 0 !important;
            width: ${isLandscapeDivided ? '297mm' : '210mm'} !important;
            height: ${isLandscapeDivided ? '210mm' : '297mm'} !important;
            max-width: ${isLandscapeDivided ? '297mm' : '210mm'} !important;
            max-height: ${isLandscapeDivided ? '210mm' : '297mm'} !important;
            margin: 0 !important;
            padding: ${isLandscapeDivided ? '5mm 4.25mm' : '8mm'} !important;
            background: #ffffff !important;
            box-sizing: border-box !important;
            z-index: 9999999 !important;
            display: flex !important;
            flex-direction: ${isLandscapeDivided ? 'row' : 'column'} !important;
            justify-content: space-between !important;
            align-items: stretch !important;
            page-break-inside: avoid !important;
            page-break-after: avoid !important;
            page-break-before: avoid !important;
            overflow: hidden !important;
          }
          .print-ljk-half {
            width: 140mm !important;
            max-width: 140mm !important;
            min-width: 140mm !important;
            height: 200mm !important;
            max-height: 200mm !important;
            padding: 2.5mm !important;
            box-sizing: border-box !important;
            flex: 0 0 140mm !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
          }
          .print-cut-divider {
            width: 8.5mm !important;
            min-width: 8.5mm !important;
            max-width: 8.5mm !important;
            height: 200mm !important;
            flex: 0 0 8.5mm !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            box-sizing: border-box !important;
            position: relative !important;
          }
          .print-cut-divider::after {
            content: '' !important;
            position: absolute !important;
            top: 4mm !important;
            bottom: 4mm !important;
            left: 50% !important;
            transform: translateX(-50%) !important;
            border-right: 1px dashed #000000 !important;
          }
          .print-ljk-full {
            width: 194mm !important;
            max-width: 194mm !important;
            height: 281mm !important;
            max-height: 281mm !important;
            padding: 3.5mm !important;
            box-sizing: border-box !important;
            margin: 0 auto !important;
            display: flex !important;
            flex-direction: column !important;
            justify-content: space-between !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>

      {/* Header Info Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-wrap items-center justify-between gap-4 print:hidden">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 shadow-xs">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                Generator LJK Hemat Kertas (A4 Dibagi 2 Landscape)
              </h2>
              <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Presisi 140 mm Kiri & Kanan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-1 font-medium">
              Kertas A4 Landscape (210 x 297 mm) presisi: LJK Kiri 140 mm, LJK Kanan 140 mm, dan garis potong tengah di posisi simetris sesuai standar printer.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenExamModal && (
            <button
              type="button"
              onClick={() => {
                handleApplyToCurrentExam();
                onOpenExamModal();
              }}
              title="Buka & Sesuaikan Kunci Jawaban Penilaian Ini"
              className="px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.98]"
            >
              <Key className="w-4 h-4 text-amber-600" />
              <span>Kunci Jawaban ({totalQ} Soal)</span>
            </button>
          )}

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
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-emerald-600" />
                  Jumlah Butir Soal:
                </label>
                <span className="text-emerald-700 font-extrabold text-xs bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  {totalQ} Soal
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 text-xs">
                {[10, 15, 20, 25, 30, 35, 40, 45, 50].map(num => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => setTotalQ(num)}
                    className={`px-2.5 py-1 rounded-lg font-bold border transition-all ${
                      totalQ === num
                        ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
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
                    value={totalQ}
                    onChange={(e) => setTotalQ(Math.max(1, Math.min(100, parseInt(e.target.value) || 1)))}
                    className="w-14 bg-white border border-slate-300 rounded-lg px-2 py-1 text-center font-bold text-slate-900 text-xs focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>

            {/* Options Count */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-emerald-600" />
                Format Opsi Pilihan Ganda:
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setOptCount(4)}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    optCount === 4
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  4 Pilihan (A, B, C, D)
                </button>
                <button
                  type="button"
                  onClick={() => setOptCount(5)}
                  className={`py-2 rounded-lg font-bold border transition-all ${
                    optCount === 5
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  5 Pilihan (A, B, C, D, E)
                </button>
              </div>
            </div>

            {/* Exam & School Metadata in LJK Header */}
            <div className="space-y-2 pt-3 border-t border-slate-100 text-xs">
              <div>
                <span className="text-slate-500 font-medium">Kop Madrasah/Sekolah:</span>
                <p className="font-bold text-slate-900">{teacher.namaSekolah}</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Mata Pelajaran & Kelas:</span>
                <p className="font-bold text-slate-900">{displaySubject} ({displayClass})</p>
              </div>
              <div>
                <span className="text-slate-500 font-medium">Tahun Ajaran:</span>
                <p className="font-bold text-slate-900">{teacher.tahunAjaran} ({teacher.semester})</p>
              </div>
            </div>

            {/* Sync and Key Config Buttons */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={handleApplyToCurrentExam}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-sm shadow-emerald-200"
              >
                {isCopied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-white" />
                    Format Disimpan ke Ujian Aktif!
                  </>
                ) : (
                  <>
                    <FileCheck2 className="w-4 h-4" />
                    Sinkronkan ke Ujian Aktif ({totalQ} Soal)
                  </>
                )}
              </button>

              {onOpenExamModal && (
                <button
                  type="button"
                  onClick={() => {
                    handleApplyToCurrentExam();
                    onOpenExamModal();
                  }}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                >
                  <Key className="w-3.5 h-3.5" />
                  Atur Kunci Jawaban & Bobot ({totalQ} Soal)
                </button>
              )}
            </div>
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
            <div className="flex flex-col gap-2 print:m-0 print:p-0 print:border-none print:bg-white">
              {isLandscapeDivided && (
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 px-2 print:hidden">
                  <span className="bg-slate-200/80 px-2.5 py-0.5 rounded-md font-semibold text-slate-700">
                    ◀ LJK 1: 140 mm ▶
                  </span>
                  <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md font-bold text-[10px]">
                    ✂ Titik Tengah Presisi (148.5 mm)
                  </span>
                  <span className="bg-slate-200/80 px-2.5 py-0.5 rounded-md font-semibold text-slate-700">
                    ◀ LJK 2: 140 mm ▶
                  </span>
                </div>
              )}

              <div className="overflow-x-auto select-none print:m-0 print:p-0 print:border-none print:bg-white print:overflow-visible flex justify-center bg-slate-100 p-3 sm:p-5 rounded-xl border border-slate-200">
                {isLandscapeDivided ? (
                  /* LANDSCAPE A4 DIVIDED BY 2 (Side-by-side: 140mm Left + 140mm Right centered on 297x210mm) */
                  <div 
                    id="printable-ljk-container" 
                    className="w-full max-w-[840px] bg-white p-3.5 sm:p-4 print:p-0 rounded-lg shadow-sm print:shadow-none border border-slate-300 print:border-none text-slate-900 print:text-black flex flex-row gap-3 print:gap-0 relative items-stretch"
                    style={{
                      aspectRatio: '297 / 210'
                    }}
                  >
                    {/* Left Half: LJK Siswa 1 (140 mm) */}
                    {renderSingleLjkHalf(1)}

                    {/* Vertical Center Cut-Line Guide (Dashed Divider at precise center 148.5mm) */}
                    <div className="print-cut-divider w-0 border-r border-dashed border-slate-300 print:border-none self-stretch my-2 shrink-0 flex items-center justify-center" />

                    {/* Right Half: LJK Siswa 2 (140 mm) */}
                    {renderSingleLjkHalf(2)}
                  </div>
                ) : (
                /* FULL A4 PORTRAIT SHEET */
                <div 
                  id="printable-ljk-container" 
                  className="print-ljk-full w-full max-w-[680px] bg-white p-5 sm:p-6 print:p-2 rounded-lg shadow-sm print:shadow-none border-2 border-slate-900 print:border-black text-slate-900 print:text-black flex flex-col justify-between relative overflow-hidden"
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
                      Mata Pelajaran: <span className="font-bold text-black">{displaySubject}</span> &nbsp;|&nbsp; Kelas: <span className="font-bold text-black">{displayClass}</span> &nbsp;|&nbsp; Th. Ajaran: <span className="font-bold text-black">{teacher.tahunAjaran} ({teacher.semester})</span>
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
                      <div className="flex-1 h-7 border border-slate-500 print:border-black bg-white rounded-xs px-2.5 flex items-center">
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
                            <span className="font-semibold text-slate-900">{displayClass}</span>
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
                    <span>[LJK-A4-FULL • ID: {exam.id}] Terkalibrasi OMR Scanner / Kamera</span>
                    <span className="font-bold">KEMENAG / DINAS PENDIDIKAN</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
);
};
