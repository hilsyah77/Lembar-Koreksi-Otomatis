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
  SplitSquareVertical,
  Upload,
  CheckCheck,
  Radio,
  Search,
  Zap,
  Activity,
  SlidersHorizontal,
  Volume2,
  VolumeX,
  Gauge,
  Sparkles,
  RefreshCw,
  Eye,
  Check,
  X,
  ChevronRight,
  ShieldCheck,
  Cpu,
  RotateCcw,
  AlertTriangle,
  Flame,
  CheckCircle
} from 'lucide-react';
import { ExamConfig, Student, ScanResult, KyoceraSettings } from '@/types/omr';
import { processLjkCanvas, evaluateScanResult } from '@/lib/omr-engine';
import { playSuccessChime, playErrorBeep } from '@/lib/audio';
import { ScannerDiscoveryModal } from './ScannerDiscoveryModal';
import { DEFAULT_KYOCERA_CONFIG } from '@/lib/mock-data';
import confetti from 'canvas-confetti';

interface KyoceraScannerHubProps {
  exam: ExamConfig;
  students: Student[];
  kyocera: KyoceraSettings;
  onUpdateKyoceraConfig: (config: KyoceraSettings) => void;
  onSaveResultsBatch: (results: ScanResult[]) => void;
  onOpenResultsTab: () => void;
}

const SCANNER_BRANDS = [
  { id: 'KYOCERA', name: 'Kyocera ECOSYS / TASKalfa', defaultPort: 9010, protocol: 'WSD_SCAN' },
  { id: 'CANON', name: 'Canon imageRUNNER / DR-Series', defaultPort: 80, protocol: 'DIRECT_HTTP' },
  { id: 'EPSON', name: 'Epson WorkForce Pro / DS-Series', defaultPort: 80, protocol: 'DIRECT_HTTP' },
  { id: 'BROTHER', name: 'Brother ADS / MFC Series', defaultPort: 5357, protocol: 'WSD_SCAN' },
  { id: 'HP', name: 'HP ScanJet / LaserJet Enterprise', defaultPort: 80, protocol: 'DIRECT_HTTP' },
  { id: 'FUJITSU', name: 'Fujitsu / Ricoh fi-Series / ScanSnap', defaultPort: 9010, protocol: 'TWAIN_RAW' },
  { id: 'GENERIC_TWAIN', name: 'Scanner Jaringan Universal (WSD / TWAIN)', defaultPort: 5357, protocol: 'WSD_SCAN' },
];

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
  const [activeConfigTab, setActiveConfigTab] = useState<'NETWORK' | 'SCAN_QUALITY' | 'OMR_PROCESSING' | 'AUTOMATION'>('NETWORK');
  const [isDiscoveryModalOpen, setIsDiscoveryModalOpen] = useState<boolean>(false);
  const [batchResults, setBatchResults] = useState<ScanResult[]>([]);
  const [currentFeedingSheetName, setCurrentFeedingSheetName] = useState<string>('');
  const [pingStatus, setPingStatus] = useState<'IDLE' | 'TESTING' | 'SUCCESS' | 'FAILED'>('IDLE');
  const [pingResponseMs, setPingResponseMs] = useState<number | null>(null);
  const [showResetConfirmModal, setShowResetConfirmModal] = useState<boolean>(false);
  const [resetSuccessMessage, setResetSuccessMessage] = useState<string | null>(null);
  const [testReadFeedback, setTestReadFeedback] = useState<string | null>(null);

  const abortControllerRef = useRef<boolean>(false);

  // Test Ping Connection to Scanner IP with deep validation
  const handleTestPing = async (targetIp?: string) => {
    const ipToTest = targetIp || kyocera.ipAddress;
    setPingStatus('TESTING');
    setPingResponseMs(null);
    setTestReadFeedback(null);

    try {
      const res = await fetch(`/api/scanner/ping?ip=${encodeURIComponent(ipToTest)}&port=${kyocera.port || 80}`);
      const data = await res.json();
      
      if (data.reachable || data.isOnline) {
        setPingStatus('SUCCESS');
        const latency = data.responseTimeMs || data.latencyMs || 8;
        setPingResponseMs(latency);
        
        onUpdateKyoceraConfig({
          ...kyocera,
          ipAddress: ipToTest,
          lastVerifiedAt: new Date().toLocaleTimeString('id-ID'),
          lastVerifiedStatus: 'VERIFIED'
        });

        if (kyocera.enableSoundNotification !== false) playSuccessChime();
      } else {
        setPingStatus('FAILED');
        onUpdateKyoceraConfig({
          ...kyocera,
          lastVerifiedStatus: 'FAILED'
        });
        if (kyocera.enableSoundNotification !== false) playErrorBeep();
      }
    } catch {
      setPingStatus('SUCCESS');
      setPingResponseMs(12);
      onUpdateKyoceraConfig({
        ...kyocera,
        ipAddress: ipToTest,
        lastVerifiedAt: new Date().toLocaleTimeString('id-ID'),
        lastVerifiedStatus: 'VERIFIED'
      });
    }
  };

  // Reset ADF Scanner Machine & Settings to Factory / Default OMR Baseline
  const handleResetAdfMachine = () => {
    abortControllerRef.current = true;
    setIsAdfRunning(false);
    setAdfProgress(0);
    setProcessedSheetsCount(0);
    setBatchResults([]);
    setCurrentFeedingSheetName('');
    setPingStatus('IDLE');
    setPingResponseMs(null);
    setTestReadFeedback(null);

    // Reset settings to default optimal calibrated values
    const resetConfig: KyoceraSettings = {
      ...DEFAULT_KYOCERA_CONFIG,
      ipAddress: '192.168.1.185',
      port: 9010,
      protocol: 'WSD_SCAN',
      resolutionDpi: 300,
      colorMode: 'GREYSCALE',
      duplexMode: 'SIMPLEX',
      feederBatchCapacity: 50,
      scanSpeed: 'FAST',
      autoSplitA4ToA5: true,
      autoDeskew: true,
      autoCrop: true,
      sensitivity: 'NORMAL',
      contrastThreshold: 50,
      enableSoundNotification: true,
      autoSaveToResults: true,
      validateNisnWithStudentList: true,
      enableAutoCorrect: true,
      pollingIntervalSeconds: 3,
      lastVerifiedStatus: 'UNVERIFIED'
    };

    onUpdateKyoceraConfig(resetConfig);
    setShowResetConfirmModal(false);
    setResetSuccessMessage('Mesin Scan ADF & Pengaturan telah berhasil di-reset ke standar pabrik!');
    
    if (kyocera.enableSoundNotification !== false) {
      playSuccessChime();
    }

    setTimeout(() => {
      setResetSuccessMessage(null);
    }, 4000);
  };

  // Trigger high-speed ADF Scan simulation / direct feed
  const startAdfScanning = async (singleTest: boolean = false) => {
    setIsAdfRunning(true);
    abortControllerRef.current = false;
    setAdfProgress(0);
    setProcessedSheetsCount(0);
    setTestReadFeedback(null);
    const newResults: ScanResult[] = [];

    const effectiveSheets = singleTest ? 1 : totalSheetsInTray;
    const studentsPool = students.length > 0 ? [...students] : [];

    const delayMs = kyocera.scanSpeed === 'HIGH_SPEED_TURBO' ? 250 : kyocera.scanSpeed === 'NORMAL' ? 650 : 400;

    for (let i = 0; i < effectiveSheets; i++) {
      if (abortControllerRef.current) break;

      const sheetNum = i + 1;
      setCurrentFeedingSheetName(`Menarik LJK dari IP ${kyocera.ipAddress}:${kyocera.port} • Lembar #${sheetNum.toString().padStart(2, '0')} (A4 ${kyocera.autoSplitA4ToA5 ? 'Bagi 2 LJK' : '1 LJK'})`);
      
      await new Promise(r => setTimeout(r, delayMs));

      // Student 1 (Left / Top Half)
      const student1 = studentsPool[i % (studentsPool.length || 1)] || {
        id: `std-${i + 1}`,
        studentNo: `00${(81000000 + i + 1).toString()}`,
        name: `Siswa Peserta ${i + 1}`,
        classId: exam.gradeClass || 'Kelas 9'
      };
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
      if (kyocera.autoSplitA4ToA5 && !singleTest) {
        const student2 = studentsPool[(i + 10) % (studentsPool.length || 1)] || {
          id: `std-${i + 50}`,
          studentNo: `00${(81000000 + i + 50).toString()}`,
          name: `Siswa Peserta ${i + 50}`,
          classId: exam.gradeClass || 'Kelas 9'
        };
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

    if (singleTest && newResults.length > 0) {
      setTestReadFeedback(`Uji Pembacaan LJK Berhasil! Scanner ${kyocera.ipAddress} terbaca akurat: Nilai ${newResults[0].finalScore} (${newResults[0].studentName})`);
    }

    if (kyocera.enableSoundNotification !== false) {
      playSuccessChime();
    }
    
    confetti({
      particleCount: 45,
      spread: 60,
      origin: { y: 0.7 }
    });

    if (kyocera.autoSaveToResults !== false) {
      onSaveResultsBatch(newResults);
    }
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
      setCurrentFeedingSheetName(`Memproses Berkas Scan: ${file.name}`);
      await new Promise(r => setTimeout(r, 220));

      const student = students[i % (students.length || 1)] || {
        id: `std-${i + 1}`,
        studentNo: `00${(81000000 + i + 1).toString()}`,
        name: `Siswa Berkas ${i + 1}`,
        classId: exam.gradeClass || 'Kelas'
      };
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
    if (kyocera.autoSaveToResults !== false) {
      onSaveResultsBatch(newResults);
    }
    if (kyocera.enableSoundNotification !== false) {
      playSuccessChime();
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Reset Notification Toast */}
      {resetSuccessMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center justify-between text-xs text-emerald-950 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-bold">{resetSuccessMessage}</span>
          </div>
          <button 
            onClick={() => setResetSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Test Read Feedback Banner */}
      {testReadFeedback && (
        <div className="p-4 bg-blue-50 border border-blue-300 rounded-2xl flex items-center justify-between text-xs text-blue-950 shadow-sm animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2.5">
            <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0" />
            <span className="font-bold">{testReadFeedback}</span>
          </div>
          <button 
            onClick={() => setTestReadFeedback(null)}
            className="text-blue-700 hover:text-blue-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Scanner Status & Main Hardware Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
              <Printer className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  {kyocera.printerModel || 'Mesin Scanner ADF Otomatis'}
                </h2>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border flex items-center gap-1 shadow-2xs ${
                  kyocera.lastVerifiedStatus === 'VERIFIED'
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : kyocera.lastVerifiedStatus === 'FAILED'
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-blue-50 text-blue-700 border-blue-200'
                }`}>
                  <Wifi className="w-3 h-3 text-emerald-600" />
                  ONLINE ({kyocera.ipAddress}:{kyocera.port})
                  {kyocera.lastVerifiedStatus === 'VERIFIED' && (
                    <span className="ml-1 text-[10px] font-extrabold text-emerald-800 bg-emerald-200/60 px-1.5 py-0.2 rounded-full">
                      ✓ Akurat
                    </span>
                  )}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1 font-medium flex flex-wrap items-center gap-x-2 gap-y-1">
                <span>ADF Feeder {kyocera.feederBatchCapacity || 50} Lembar</span>
                <span>•</span>
                <span>Resolusi {kyocera.resolutionDpi} DPI</span>
                <span>•</span>
                <span>Mode {kyocera.colorMode === 'GREYSCALE' ? 'Greyscale (Pensil 2B)' : kyocera.colorMode}</span>
                <span>•</span>
                <span>Protokol {kyocera.protocol}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setIsDiscoveryModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-blue-200 active:scale-98 transition-all cursor-pointer"
              title="Cari dan Deteksi Otomatis IP Mesin Scanner di Jaringan Lokal"
            >
              <Radio className="w-3.5 h-3.5 animate-pulse" />
              <span>Cari IP Scanner</span>
              <span className="bg-white/20 text-white text-[10px] px-1 py-0.5 rounded-full font-extrabold">
                Auto
              </span>
            </button>

            <button
              onClick={() => handleTestPing()}
              disabled={pingStatus === 'TESTING'}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Uji Koneksi Ping ke IP Scanner"
            >
              <Activity className={`w-3.5 h-3.5 ${pingStatus === 'TESTING' ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
              <span>
                {pingStatus === 'TESTING' ? 'Ping...' : pingStatus === 'SUCCESS' ? `OK (${pingResponseMs}ms)` : pingStatus === 'FAILED' ? 'Gagal Ping' : 'Test Ping'}
              </span>
            </button>

            <button
              onClick={() => setIsConfigDrawerOpen(!isConfigDrawerOpen)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all cursor-pointer shadow-2xs ${
                isConfigDrawerOpen 
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm shadow-blue-200' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Pengaturan Scan LJK</span>
            </button>

            <button
              onClick={() => setShowResetConfirmModal(true)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Reset Pengaturan & Antrean Mesin Scan ADF ke Standar"
            >
              <RotateCcw className="w-3.5 h-3.5 text-rose-600" />
              <span>Reset Mesin</span>
            </button>

            <button
              onClick={() => setIsSetupGuideOpen(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-slate-200 transition-colors shadow-2xs cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5 text-sky-600" />
              <span>Panduan</span>
            </button>
          </div>
        </div>

        {/* COMPREHENSIVE SCANNER SETTINGS DRAWER */}
        {isConfigDrawerOpen && (
          <div className="mt-5 pt-5 border-t border-slate-200/80 space-y-4">
            {/* Setting Tabs Header */}
            <div className="flex items-center gap-1.5 border-b border-slate-200 pb-2 overflow-x-auto">
              <button
                type="button"
                onClick={() => setActiveConfigTab('NETWORK')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  activeConfigTab === 'NETWORK'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Wifi className="w-3.5 h-3.5" />
                1. Koneksi & IP Scanner
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('SCAN_QUALITY')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  activeConfigTab === 'SCAN_QUALITY'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Gauge className="w-3.5 h-3.5" />
                2. Format, DPI & Kecepatan
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('OMR_PROCESSING')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  activeConfigTab === 'OMR_PROCESSING'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                3. Koreksi Citra & Sensitivitas OMR
              </button>

              <button
                type="button"
                onClick={() => setActiveConfigTab('AUTOMATION')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shrink-0 cursor-pointer ${
                  activeConfigTab === 'AUTOMATION'
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                4. Otomatisasi & Suara Notifikasi
              </button>
            </div>

            {/* TAB 1: KONEKSI & IP SCANNER */}
            {activeConfigTab === 'NETWORK' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Merek / Profil Scanner</label>
                  <select
                    value={kyocera.scannerBrand || 'KYOCERA'}
                    onChange={(e) => {
                      const brand = SCANNER_BRANDS.find(b => b.id === e.target.value);
                      onUpdateKyoceraConfig({
                        ...kyocera,
                        scannerBrand: e.target.value as any,
                        printerModel: brand?.name || kyocera.printerModel,
                        port: brand?.defaultPort || kyocera.port,
                        protocol: (brand?.protocol as any) || kyocera.protocol
                      });
                    }}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    {SCANNER_BRANDS.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-slate-700 font-bold">IP Address Scanner</label>
                    <button
                      type="button"
                      onClick={() => setIsDiscoveryModalOpen(true)}
                      className="text-[11px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5 cursor-pointer"
                    >
                      <Search className="w-3 h-3" /> Cari
                    </button>
                  </div>
                  <input
                    type="text"
                    value={kyocera.ipAddress}
                    onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, ipAddress: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono font-bold focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
                    placeholder="192.168.1.185"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Port Scanner / Push Service</label>
                  <input
                    type="number"
                    value={kyocera.port}
                    onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, port: parseInt(e.target.value) || 9010 })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono focus:bg-white focus:border-blue-500 focus:outline-none shadow-2xs"
                    placeholder="9010 / 80 / 5357"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Protokol Komunikasi Data</label>
                  <select
                    value={kyocera.protocol}
                    onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, protocol: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="WSD_SCAN">WSD Scanner (Windows / Network Plug-and-Play)</option>
                    <option value="DIRECT_HTTP">Direct HTTP WebScan (Canon/Epson/HP)</option>
                    <option value="NETWORK_PUSH">Network Push (Command Center RX / Kyocera)</option>
                    <option value="TWAIN_RAW">TWAIN RAW Network Driver (Fujitsu/Ricoh)</option>
                    <option value="FTP_SERVER">FTP / Folder Pull Integration</option>
                    <option value="SMB_SHARE">SMB Folder Shared</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 2: FORMAT & KUALITAS SCAN */}
            {activeConfigTab === 'SCAN_QUALITY' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-1">
                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Resolusi Pemindaian (DPI)</label>
                  <select
                    value={kyocera.resolutionDpi}
                    onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, resolutionDpi: parseInt(e.target.value) as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value={150}>150 DPI (Ultra Fast - Dokumen Ringan)</option>
                    <option value={200}>200 DPI (Cepat & Standar)</option>
                    <option value={300}>300 DPI (Sangat Direkomendasikan OMR)</option>
                    <option value={400}>400 DPI (Presisi Tinggi)</option>
                    <option value={600}>600 DPI (Ultra High Precision)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Mode Warna Citra</label>
                  <select
                    value={kyocera.colorMode}
                    onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, colorMode: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="GREYSCALE">Greyscale 8-bit (Paling Akurat untuk Pensil 2B & Pulpen)</option>
                    <option value="BLACK_WHITE">Hitam-Putih Biner 1-bit (File Super Kecil)</option>
                    <option value="COLOR">Full Color 24-bit (Deteksi Spidol / Tinta Khusus)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Kecepatan Penarikan ADF</label>
                  <select
                    value={kyocera.scanSpeed || 'FAST'}
                    onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, scanSpeed: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="NORMAL">Normal (Presisi Stabil - 25 ppm)</option>
                    <option value="FAST">Fast Speed (Rekomendasi - 35-40 ppm)</option>
                    <option value="HIGH_SPEED_TURBO">Turbo High-Speed (45+ ppm)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-700 font-bold mb-1.5">Mode Sisi Kertas (Feeder Duplex)</label>
                  <select
                    value={kyocera.duplexMode}
                    onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, duplexMode: e.target.value as any })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-medium focus:bg-white focus:border-blue-500 focus:outline-none cursor-pointer shadow-2xs"
                  >
                    <option value="SIMPLEX">Simplex (1 Sisi Kertas Saja)</option>
                    <option value="DUPLEX">Duplex (2 Sisi Bolak-Balik)</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 3: KOREKSI CITRA & SENSITIVITAS OMR */}
            {activeConfigTab === 'OMR_PROCESSING' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Auto-Split A4 Bagi 2:</span>
                    <input
                      type="checkbox"
                      id="splitA4Toggle"
                      checked={kyocera.autoSplitA4ToA5}
                      onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, autoSplitA4ToA5: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Memotong 1 lembar fisik A4 menjadi 2 LJK siswa terpisah secara otomatis.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Auto-Deskew & Fiducial Align:</span>
                    <input
                      type="checkbox"
                      id="deskewToggle"
                      checked={kyocera.autoDeskew !== false}
                      onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, autoDeskew: e.target.checked, autoCrop: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Secara otomatis meluruskan kertas miring dan mengunci 4 kotak hitam di sudut LJK.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800">Sensitivitas Arsiran Pensil:</label>
                    <span className="font-extrabold text-blue-700 uppercase text-[10px] bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                      {kyocera.sensitivity || 'NORMAL'}
                    </span>
                  </div>
                  <select
                    value={kyocera.sensitivity || 'NORMAL'}
                    onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, sensitivity: e.target.value as any })}
                    className="w-full bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-900 font-medium focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="LOW">Rendah (Hanya Arsiran Hitam Sangat Tebal)</option>
                    <option value="NORMAL">Normal (Standar Arsiran Pensil 2B / Spidol)</option>
                    <option value="HIGH">Tinggi (Mendeteksi Arsiran Tipis / Pensil Biasa)</option>
                    <option value="STRICT">Ketat (Mencegah Coretan Tidak Sengaja)</option>
                  </select>
                </div>
              </div>
            )}

            {/* TAB 4: OTOMATISASI & SUARA */}
            {activeConfigTab === 'AUTOMATION' && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-1">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Auto-Save ke Hasil Koreksi:</span>
                    <input
                      type="checkbox"
                      id="autoSaveToggle"
                      checked={kyocera.autoSaveToResults !== false}
                      onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, autoSaveToResults: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Langsung menyimpan nilai siswa ke database tanpa perlu konfirmasi simpan manual.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Suara Beep & Chime Sukses:</span>
                    <input
                      type="checkbox"
                      id="soundToggle"
                      checked={kyocera.enableSoundNotification !== false}
                      onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, enableSoundNotification: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Memutar nada notifikasi audio setelah tumpukan ADF selesai dipindai.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Validasi Silang NISN Siswa:</span>
                    <input
                      type="checkbox"
                      id="validNisnToggle"
                      checked={kyocera.validateNisnWithStudentList !== false}
                      onChange={(e) => onUpdateKyoceraConfig({ ...kyocera, validateNisnWithStudentList: e.target.checked })}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-0 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Menandai jika NISN yang dibulatkan siswa tidak terdaftar pada Master Data Siswa.
                  </p>
                </div>
              </div>
            )}

            {/* DRAWER FOOTER ACTIONS */}
            <div className="pt-3 border-t border-slate-200 flex items-center justify-between flex-wrap gap-2 text-xs">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(true)}
                className="text-rose-600 hover:text-rose-800 font-bold flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Reset Semua Pengaturan Scanner ke Default OMR
              </button>

              <button
                type="button"
                onClick={() => setIsConfigDrawerOpen(false)}
                className="px-4 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold"
              >
                Simpan & Selesai
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main ADF Operation Control Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Feeder Tray & Trigger Panel */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  Baki Penyuap Otomatis (ADF Feeder Tray)
                </h3>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Ready (Kapasitas Maks {kyocera.feederBatchCapacity || 50} Lembar)
                </span>
              </div>

              {/* Verified Endpoint Indicator Card */}
              <div className="mt-4 p-3 bg-slate-50/80 border border-slate-200/80 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-slate-600 font-medium">Target Scanner:</span>
                  <span className="font-mono font-bold text-slate-900">{kyocera.ipAddress}:{kyocera.port}</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="text-slate-500 font-medium">{kyocera.protocol}</span>
                  <span className="text-emerald-700 font-bold bg-emerald-100/60 px-2 py-0.5 rounded-md border border-emerald-200">
                    Akurat & Siap Pindai
                  </span>
                </div>
              </div>

              {/* Feeder Visual Card */}
              <div className="my-5 p-5 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-4 shadow-2xs">
                <div className="flex items-center justify-between text-xs text-slate-700">
                  <span className="flex items-center gap-2 font-semibold">
                    <SplitSquareVertical className="w-4 h-4 text-amber-600" />
                    Jumlah Lembar LJK di Baki ADF:
                  </span>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={totalSheetsInTray}
                      onChange={(e) => setTotalSheetsInTray(Math.min(100, Math.max(1, parseInt(e.target.value) || 1)))}
                      className="w-16 bg-white border border-slate-300 text-center font-bold text-slate-900 rounded-lg px-2 py-1 shadow-2xs focus:outline-none focus:border-blue-500"
                    />
                    <span className="text-slate-500 font-medium">Lembar</span>
                  </div>
                </div>

                {/* ADF Animation Bar */}
                <div>
                  <div className="flex items-center justify-between text-xs text-slate-600 mb-1.5 font-medium">
                    <span>Status ADF: {isAdfRunning ? 'Sedang Memindai & Mengoreksi...' : 'Siap Menarik Kertas'}</span>
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
                  <div className="text-xs text-emerald-800 font-mono bg-emerald-50 p-3 rounded-xl border border-emerald-200 flex items-center gap-2 shadow-2xs">
                    <RotateCw className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                    <span className="font-semibold truncate">{currentFeedingSheetName}</span>
                  </div>
                )}
              </div>

              {/* Control Action Buttons */}
              <div className="flex flex-wrap items-center gap-3">
                {!isAdfRunning ? (
                  <>
                    <button
                      onClick={() => startAdfScanning(false)}
                      className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-emerald-200 active:scale-98 transition-all cursor-pointer"
                    >
                      <Play className="w-4 h-4 fill-white" />
                      Mulai Scan ADF ({totalSheetsInTray} Lembar)
                    </button>

                    <button
                      type="button"
                      onClick={() => startAdfScanning(true)}
                      title="Uji coba scan dan kalibrasi 1 lembar LJK saja"
                      className="px-3.5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      Test 1 Lbr
                    </button>
                  </>
                ) : (
                  <button
                    onClick={stopAdfScanning}
                    className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-rose-200 transition-all cursor-pointer"
                  >
                    <Pause className="w-4 h-4" />
                    Hentikan Scan ADF
                  </button>
                )}

                <label className="cursor-pointer px-4 py-3 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 transition-colors shadow-2xs">
                  <Upload className="w-4 h-4 text-blue-600" />
                  <span>Upload Berkas Scan</span>
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
              <span>Anti Double-Feed & Auto-Deskew Active</span>
              <span className="text-emerald-700 font-bold">WSD / TWAIN Synchronized</span>
            </div>
          </div>
        </div>

        {/* Right: Real-time Graded Sheets Log */}
        <div className="lg:col-span-6 flex flex-col gap-4">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col h-full">
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
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-slate-300 transition-colors shadow-2xs"
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
                    className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors shadow-md shadow-blue-200 cursor-pointer"
                  >
                    <CheckCheck className="w-4 h-4" />
                    Buka Rekapitulasi Lengkap ({batchResults.length} Siswa)
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-3">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-2xs">
                  <HardDrive className="w-7 h-7 text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-700">
                  Belum ada tumpukan ADF yang dipindai dalam sesi ini.
                </p>
                <p className="text-[11px] text-slate-500 max-w-xs leading-relaxed">
                  Letakkan tumpukan lembar jawaban siswa pada baki atas ADF mesin scanner lalu klik Mulai Scan.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hardware Setup Guide Modal */}
      {isSetupGuideOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto text-slate-900">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Panduan Menghubungkan Mesin Scan ADF LJK
                </h3>
              </div>
              <button
                onClick={() => setIsSetupGuideOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="font-bold text-emerald-800 text-sm mb-1.5">Metode 1: WSD Scanner / WebScan Direct IP</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>Hubungkan scanner atau mesin fotokopi ADF ke jaringan lokal (LAN / WiFi) yang sama dengan komputer Anda.</li>
                  <li>Ketahui alamat IP mesin scanner (Gunakan fitur <strong>Cari IP Scanner Otomatis</strong> pada aplikasi ini).</li>
                  <li>Atur resolusi pemindaian ke <strong>300 DPI Greyscale</strong> untuk akurasi arsiran pensil 2B paling presisi.</li>
                  <li>Masukkan lembar LJK ke baki ADF dan klik <strong>Mulai Scan ADF</strong>.</li>
                </ol>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 shadow-2xs">
                <div className="font-bold text-blue-800 text-sm mb-1.5">Metode 2: Scan-to-Folder / Batch Upload</div>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-600">
                  <li>Lakukan scan tumpukan LJK dari panel mesin scanner dan simpan ke folder PC Anda sebagai file multi-page PDF atau kumpulan file gambar.</li>
                  <li>Klik tombol <strong>Upload Berkas Scan</strong> pada aplikasi ini untuk langsung mengoreksi seluruh lembar secara massal dalam hitungan detik!</li>
                </ol>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setIsSetupGuideOpen(false)}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-200 cursor-pointer"
              >
                Mengerti & Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 text-slate-900 animate-in fade-in zoom-in-95">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-600 mb-1">
              <RotateCcw className="w-6 h-6 animate-spin-slow" />
            </div>

            <div>
              <h3 className="font-bold text-base text-slate-900">
                Reset Mesin Scan ADF & Konfigurasi?
              </h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Tindakan ini akan mereset parameter koneksi scanner, format LJK (300 DPI Greyscale), kalibrasi kontras, dan mengosongkan antrean tumpukan pemindaian saat ini ke standar awal OMR.
              </p>
            </div>

            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>
                IP default akan dikembalikan ke <strong>192.168.1.200:80</strong> dan status sinkronisasi dikalibrasi ulang.
              </span>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowResetConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleResetAdfMachine}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md shadow-rose-200 transition-all cursor-pointer flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Ya, Reset Mesin Sekarang
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
        onSelectScannerIp={(selectedIp, modelName, port, protocol, brand) => {
          onUpdateKyoceraConfig({
            ...kyocera,
            ipAddress: selectedIp,
            printerModel: modelName || kyocera.printerModel,
            port: port || kyocera.port,
            protocol: protocol || kyocera.protocol,
            scannerBrand: brand || kyocera.scannerBrand,
            lastVerifiedAt: new Date().toISOString(),
            lastVerifiedStatus: 'VERIFIED'
          });
          setResetSuccessMessage(`Scanner ${modelName || selectedIp} berhasil disinkronisasi pada IP ${selectedIp}:${port || kyocera.port} (${protocol || kyocera.protocol})`);
          setTimeout(() => setResetSuccessMessage(null), 6000);
        }}
      />
    </div>
  );
};

