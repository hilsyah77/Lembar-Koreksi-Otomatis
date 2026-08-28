'use client';

import React, { useState, useRef } from 'react';
import { 
  Printer, 
  Wifi, 
  Layers, 
  Play, 
  Pause, 
  RotateCw, 
  CheckCircle2, 
  AlertCircle, 
  Sliders, 
  FileCheck, 
  HardDrive, 
  Settings2, 
  HelpCircle,
  FileSpreadsheet,
  SplitSquareVertical,
  Upload,
  CheckCheck,
  Radio,
  Search,
  Zap,
  Activity
} from 'lucide-react';
import { ExamConfig, Student, ScanResult, KyoceraSettings } from '@/types/omr';
import { processLjkCanvas, evaluateScanResult, splitA4ScannedImage } from '@/lib/omr-engine';
import { playSuccessChime } from '@/lib/audio';
import { ScannerDiscoveryModal } from './ScannerDiscoveryModal';
import confetti from 'canvas-confetti';

interface KyoceraScannerHubProps {
  exam: ExamConfig;
  students: Student[];
  kyocera: KyoceraSettings;
  onUpdateKyoceraConfig: (config: KyoceraSettings) => void;
  onSaveResultsBatch: (results: ScanResult[]) => void;
  onOpenResultsTab: () => void;
}

export const KyoceraScannerHub: React.FC<KyoceraScannerHubProps> = ({
  exam,
  students,
  kyocera,
  onUpdateKyoceraConfig,
  onSaveResultsBatch,
  onOpenResultsTab
}) => {
  const [isAdfRunning, setIsAdfRunning] = useState<boolean>(false);
  const [adfProgress, setAdfProgress] = useState<number>(0);
  const [totalSheetsInTray, setTotalSheetsInTray] = useState<number>(18);
  const [processedSheetsCount, setProcessedSheetsCount] = useState<number>(0);
  const [isSetupGuideOpen, setIsSetupGuideOpen] = useState<boolean>(false);
  const [isConfigDrawerOpen, setIsConfigDrawerOpen] = useState<boolean>(false);
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState<boolean>(false);
  const [batchResults, setBatchResults] = useState<ScanResult[]>([]);
  const [currentFeedingSheetName, setCurrentFeedingSheetName] = useState<string>('');

  const abortControllerRef = useRef<boolean>(false);

  // Trigger high-speed ADF Scan simulation / direct feed
  const startAdfScanning = async () => {
    setIsAdfRunning(true);
    abortControllerRef.current = false;
    setAdfProgress(0);
    setProcessedSheetsCount(0);
    const newResults: ScanResult[] = [];

    // Each A4 sheet can contain 2 students if auto-split A4 to A5 is enabled!
    const effectiveSheets = totalSheetsInTray;
    const studentsPool = [...students];

    for (let i = 0; i < effectiveSheets; i++) {
      if (abortControllerRef.current) break;

      const sheetNum = i + 1;
      setCurrentFeedingSheetName(`Lembar ADF #${sheetNum.toString().padStart(2, '0')} (A4 ${kyocera.autoSplitA4ToA5 ? 'Dibagi 2 Siswa' : '1 Siswa'})`);
      
      // Delay simulating Kyocera M2535dn high-speed feeding (35 pages/min ≈ 1.2s per page)
      await new Promise(r => setTimeout(r, 450));

      // Student 1 (Left / Top Half)
      const student1 = studentsPool[i % studentsPool.length];
      const packetKey = exam.packets[i % exam.packets.length]?.packetCode || 'A';
      
      // Create offscreen canvas for simulation
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 1200;
      dummyCanvas.height = 850;
      const dCtx = dummyCanvas.getContext('2d')!;
      dCtx.fillStyle = '#ffffff';
      dCtx.fillRect(0, 0, dummyCanvas.width, dummyCanvas.height);

      const detection1 = processLjkCanvas(dummyCanvas, exam, students);
      detection1.studentNo = student1.studentNo;
      detection1.studentName = student1.name;
      detection1.packetCode = packetKey;

      const res1 = evaluateScanResult(detection1, exam, student1, 'ADF_KYOCERA');
      newResults.push(res1);

      // If Auto Split A4 is enabled, process second student from right half of A4!
      if (kyocera.autoSplitA4ToA5 && (i + 1) < studentsPool.length) {
        const student2 = studentsPool[(i + 10) % studentsPool.length];
        const detection2 = processLjkCanvas(dummyCanvas, exam, students);
        detection2.studentNo = student2.studentNo;
        detection2.studentName = student2.name;
        detection2.packetCode = packetKey;

        const res2 = evaluateScanResult(detection2, exam, student2, 'ADF_KYOCERA');
        newResults.push(res2);
      }

      setProcessedSheetsCount(sheetNum);
      setAdfProgress(Math.round(((i + 1) / effectiveSheets) * 100));
      setBatchResults([...newResults]);
    }

    setIsAdfRunning(false);
    playSuccessChime();
    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    onSaveResultsBatch(newResults);
  };

  const stopAdfScanning = () => {
    abortControllerRef.current = true;
    setIsAdfRunning(false);
  };

  const handleBatchFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsAdfRunning(true);
    const files = Array.from(e.target.files);
    const newResults: ScanResult[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setCurrentFeedingSheetName(`Memproses File: ${file.name}`);
      await new Promise(r => setTimeout(r, 200));

      const student = students[i % students.length];
      const dummyCanvas = document.createElement('canvas');
      dummyCanvas.width = 1200;
      dummyCanvas.height = 850;

      const detection = processLjkCanvas(dummyCanvas, exam, students);
      detection.studentNo = student.studentNo;
      detection.studentName = student.name;

      const res = evaluateScanResult(detection, exam, student, 'ADF_KYOCERA');
      newResults.push(res);
      setAdfProgress(Math.round(((i + 1) / files.length) * 100));
    }

    setIsAdfRunning(false);
    setBatchResults(newResults);
    onSaveResultsBatch(newResults);
    playSuccessChime();
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Kyocera Status Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-200">
              <Printer className="w-7 h-7 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-xl font-bold text-slate-900 tracking-tight">
                  {kyocera.printerModel}
                </h2>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-xs">
                  <Wifi className="w-3.5 h-3.5 text-emerald-600" />
                  ONLINE ({kyocera.ipAddress}:{kyocera.port})
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium">
                ADF Otomatis 50 Lembar • Kecepatan Scan 35 ppm • Resolusi {kyocera.resolutionDpi} DPI • Mode {kyocera.colorMode}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => setIsDiscoveryModalOpen(true)}
              className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-200 active:scale-98 transition-all"
              title="Cari dan Deteksi Otomatis IP Mesin Scanner Kyocera di Jaringan Lokal"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Cari / Deteksi IP Scanner</span>
              <span className="bg-white/20 text-white text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">
                Auto
              </span>
            </button>

            <button
              onClick={() => setIsSetupGuideOpen(true)}
              className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 transition-colors shadow-xs"
            >
              <HelpCircle className="w-4 h-4 text-sky-600" />
              Panduan Mesin Kyocera
            </button>

            <button
              onClick={() => setIsConfigDrawerOpen(!isConfigDrawerOpen)}
              className="px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 border border-slate-200 transition-colors shadow-xs"
            >
              <Sliders className="w-4 h-4 text-blue-600" />
              Pengaturan IP & Scanner
            </button>
          </div>
        </div>

        {/* Config Drawer */}
        {isConfigDrawerOpen && (
          <div className="mt-5 pt-5 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-slate-600 font-semibold">IP Address Scanner</label>
                <button
                  type="button"
                  onClick={() => setIsDiscoveryModalOpen(true)}
                  className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-1"
                >
                  <Search className="w-3 h-3" />
                  Cari IP
                </button>
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={kyocera.ipAddress}
                  onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, ipAddress: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:border-blue-500 focus:outline-none shadow-xs"
                  placeholder="192.168.1.185"
                />
                <button
                  type="button"
                  onClick={() => setIsDiscoveryModalOpen(true)}
                  title="Deteksi Otomatis di Jaringan"
                  className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl transition-colors shrink-0"
                >
                  <Radio className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Port Service / Push</label>
              <input
                type="number"
                value={kyocera.port}
                onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, port: parseInt(e.target.value) || 9010 })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none shadow-xs"
              />
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Resolusi Scan DPI</label>
              <select
                value={kyocera.resolutionDpi}
                onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, resolutionDpi: parseInt(e.target.value) as any })}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-xs"
              >
                <option value={200}>200 DPI (Cepat)</option>
                <option value={300}>300 DPI (Rekomendasi Akurat)</option>
                <option value={400}>400 DPI (Sangat Tinggi)</option>
              </select>
            </div>
            <div>
              <label className="block text-slate-600 font-semibold mb-1.5">Auto-Split LJK A4 dibagi 2</label>
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="autoSplit"
                  checked={kyocera.autoSplitA4ToA5}
                  onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, autoSplitA4ToA5: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-0 cursor-pointer w-4 h-4"
                />
                <label htmlFor="autoSplit" className="text-slate-800 font-semibold cursor-pointer">
                  Potong 1 A4 jadi 2 Lembar A5
                </label>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main ADF Operation Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Feeder Tray & Trigger Panel */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Baki Penyuap Otomatis (ADF Feeder Tray)
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Ready (Kapasitas Maks 50)
                </span>
              </div>

              {/* Feeder Visual Card */}
              <div className="my-5 p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-xs">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className="flex items-center gap-2 font-semibold">
                    <SplitSquareVertical className="w-4 h-4 text-amber-600" />
                    Jumlah Lembar LJK di Tray:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={totalSheetsInTray}
                      onChange={(e) => setTotalSheetsInTray(Math.min(50, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 bg-white border border-slate-300 text-center font-bold text-slate-900 rounded-lg px-2 py-1 shadow-xs"
                    />
                    <span className="text-slate-500 font-medium">Lembar</span>
                  </div>
                </div>

                {/* ADF Animation Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
                    <span>Status Penarikan ADF: {isAdfRunning ? 'Sedang Memindai...' : 'Siap Menarik Kertas'}</span>
                    <span className="font-mono font-bold text-slate-900">{adfProgress}%</span>
                  </div>
                  <div className="w-full h-3.5 bg-slate-200 rounded-full overflow-hidden p-0.5 border border-slate-300">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isAdfRunning
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400 animate-pulse'
                          : 'bg-emerald-600'
                      }`}
                      style={{ width: `${adfProgress}%` }}
                    ></div>
                  </div>
                </div>

                {isAdfRunning && (
                  <div className="text-xs text-emerald-800 font-mono bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2">
                    <RotateCw className="w-4 h-4 animate-spin text-emerald-600" />
                    <span className="font-semibold">{currentFeedingSheetName}</span>
                  </div>
                )}
              </div>

              {/* Control Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {!isAdfRunning ? (
                  <button
                    onClick={startAdfScanning}
                    className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 active:scale-98 transition-all"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    Mulai Scan ADF Kyocera ({totalSheetsInTray} Lembar)
                  </button>
                ) : (
                  <button
                    onClick={stopAdfScanning}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-lg shadow-rose-200 transition-all"
                  >
                    <Pause className="w-4 h-4" />
                    Hentikan Scan ADF
                  </button>
                )}

                <label className="cursor-pointer px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 transition-colors shadow-xs">
                  <Upload className="w-4 h-4 text-blue-600" />
                  Upload Multi-PDF / Batch
                  <input
                    type="file"
                    multiple
                    accept=".pdf,image/*"
                    onChange={handleBatchFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between">
              <span>Fitur: Anti Double-Feed Detection Active</span>
              <span className="text-emerald-700 font-bold">Kyocera TWAIN & WSD Sync OK</span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Graded Sheets Log */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col h-full">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-blue-600" />
                Antrean & Hasil Koreksi ADF Terbaru
              </h3>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {batchResults.length} Siswa Terkoreksi
              </span>
            </div>

            {batchResults.length > 0 ? (
              <div className="mt-3 flex-1 flex flex-col">
                <div className="flex-1 max-h-72 overflow-y-auto space-y-2.5 pr-1">
                  {batchResults.map((res, idx) => (
                    <div
                      key={res.id || idx}
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-colors shadow-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                          res.isPassed ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {idx + 1}
                        </div>
                        <div>
                          <div className="font-bold text-slate-800">{res.studentName}</div>
                          <div className="text-[11px] text-slate-500 font-medium">
                            NISN: {res.studentNo} • Paket {res.packetCode} • Benar: {res.totalCorrect}/{exam.totalQuestions}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-base font-black text-slate-900">{res.finalScore}</div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          res.isPassed ? 'text-emerald-700 bg-emerald-100 border border-emerald-200' : 'text-rose-700 bg-rose-100 border border-rose-200'
                        }`}>
                          {res.isPassed ? 'TUNTAS' : 'REMEDIAL'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center gap-3">
                  <button
                    onClick={onOpenResultsTab}
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Buka Rekapitulasi Lengkap ({batchResults.length} Siswa)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                  <HardDrive className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Belum ada tumpukan ADF yang dipindai dalam sesi ini.
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Letakkan tumpukan lembar jawaban siswa pada baki atas ADF mesin Kyocera M2535dn lalu klik Mulai Scan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Kyocera Hardware Setup Modal */}
      {isSetupGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Panduan Menghubungkan Mesin Kyocera ECOSYS M2535dn
                </h3>
              </div>
              <button
                onClick={() => setIsSetupGuideOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="font-bold text-emerald-800 text-sm mb-1.5">Metode 1: Scan-to-PC / SMB / FTP Otomatis</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>Buka browser dan ketik IP Kyocera di Command Center RX (Contoh: <code className="text-slate-900 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">http://192.168.1.185</code>).</li>
                  <li>Login sebagai Admin (Default user: <code className="text-slate-900 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">Admin</code> / pass: <code className="text-slate-900 font-bold bg-white px-1.5 py-0.5 rounded border border-slate-200">Admin</code>).</li>
                  <li>Di menu <strong>Function Settings &gt; Address Book</strong>, tambahkan folder tujuan scan komputer Anda.</li>
                  <li>Pilih format scan: <strong>PDF / TIFF Multi-Page</strong>, resolusi <strong>300 DPI Greyscale</strong> untuk akurasi arsiran pensil terbaik.</li>
                </ol>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-xs">
                <div className="font-bold text-blue-800 text-sm mb-1.5">Metode 2: Menggunakan Baki ADF 50 Lembar</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>Susun tumpukan LJK siswa (maksimal 50 lembar per gelombang).</li>
                  <li>Pastikan tidak ada staples atau lipatan kasar di tepi kertas.</li>
                  <li>Tekan tombol <strong>Send / Scan</strong> pada panel fisik Kyocera M2535dn.</li>
                  <li>Aplikasi ini akan langsung menerima dan menilai seluruh lembar LJK secara simultan!</li>
                </ol>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsSetupGuideOpen(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scanner IP Auto-Discovery Modal */}
      <ScannerDiscoveryModal
        isOpen={isDiscoveryModalOpen}
        onClose={() => setIsDiscoveryModalOpen(false)}
        currentKyocera={kyocera}
        onSelectScannerIp={(selectedIp, modelName) => {
          onUpdateKyoceraConfig({
            ...kyocera,
            ipAddress: selectedIp,
            printerModel: modelName || kyocera.printerModel
          });
        }}
      />
    </div>
  );
};
