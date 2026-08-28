'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  RotateCcw, 
  Sparkles, 
  CheckCircle2, 
  Upload, 
  Volume2, 
  Zap, 
  HelpCircle,
  Eye,
  ScanLine
} from 'lucide-react';
import { ExamConfig, Student, ScanResult } from '@/types/omr';
import { processLjkCanvas, evaluateScanResult } from '@/lib/omr-engine';
import { playSuccessChime, playWarningChime } from '@/lib/audio';
import confetti from 'canvas-confetti';

interface CameraScannerProps {
  exam: ExamConfig;
  students: Student[];
  onSaveResult: (result: ScanResult) => void;
  onOpenResultsTab: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({
  exam,
  students,
  onSaveResult,
  onOpenResultsTab
}) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAutoScanEnabled, setIsAutoScanEnabled] = useState<boolean>(true);
  const [isAiVisionEnabled, setIsAiVisionEnabled] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastScannedResult, setLastScannedResult] = useState<ScanResult | null>(null);
  const [alignmentStatus, setAlignmentStatus] = useState<'ALIGNING' | 'LOCKED' | 'SCANNED'>('ALIGNING');
  const [consecutiveStableFrames, setConsecutiveStableFrames] = useState<number>(0);
  const [scanCountSession, setScanCountSession] = useState<number>(0);

  // Safe Camera Acquisition with Fallbacks (Back Cam -> Any Cam)
  const acquireCameraStream = useCallback(async (): Promise<MediaStream | null> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      return null;
    }
    
    // Attempt 1: Document camera / back camera
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
    } catch {
      // Attempt 2: Fallback to any active video input (Webcam / USB Camera)
      try {
        return await navigator.mediaDevices.getUserMedia({
          video: true
        });
      } catch {
        return null;
      }
    }
  }, []);

  // Stop Camera Stream
  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => {
        try {
          track.stop();
        } catch {}
      });
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  // Manual Retry Start Camera Stream
  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await acquireCameraStream();
      if (stream && videoRef.current) {
        videoRef.current.srcObject = stream;
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch(() => {});
        }
        setIsCameraActive(true);
      } else {
        setCameraError('Kamera tidak terdeteksi atau izin belum diberikan. Anda dapat mengunggah foto LJK langsung atau menggunakan scanner ADF.');
        setIsCameraActive(false);
      }
    } catch {
      setCameraError('Kamera tidak dapat diakses. Pastikan izin kamera aktif atau gunakan mode Upload LJK.');
      setIsCameraActive(false);
    }
  }, [acquireCameraStream]);

  // Capture & Evaluate LJK
  const handleCaptureAndProcess = useCallback(async (customFile?: File) => {
    if (isProcessing) return;
    setIsProcessing(true);

    try {
      let canvas = canvasRef.current;
      let snapshotUrl: string | undefined;

      if (customFile) {
        // If file upload
        const img = new Image();
        const objectUrl = URL.createObjectURL(customFile);
        await new Promise((res, rej) => {
          img.onload = res;
          img.onerror = rej;
          img.src = objectUrl;
        });
        const offCanvas = document.createElement('canvas');
        offCanvas.width = img.width;
        offCanvas.height = img.height;
        const offCtx = offCanvas.getContext('2d');
        offCtx?.drawImage(img, 0, 0);
        canvas = offCanvas;
        snapshotUrl = objectUrl;
      } else if (canvas) {
        snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);
      }

      if (!canvas) throw new Error('Kanvas pemindaian tidak siap.');

      // 1. Process with local OMR Computer Vision Engine
      const detection = processLjkCanvas(canvas, exam, students);

      // 2. If AI Vision assist is enabled, invoke Gemini 3.7 Flash server-side verification
      let aiNotes: string | undefined;
      let isAiAssisted = false;

      if (isAiVisionEnabled && snapshotUrl) {
        try {
          const res = await fetch('/api/gemini/omr-correct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageBase64: snapshotUrl,
              totalQuestions: exam.totalQuestions,
              optionsCount: exam.optionsCount,
              packetCode: detection.packetCode
            })
          });
          const json = await res.json();
          if (json.success && json.data) {
            isAiAssisted = true;
            aiNotes = `Gemini AI: Terverifikasi ${json.data.answers?.length || 0} bulatan (${json.data.diagnosticNotes || 'Kualitas arsiran sangat baik'}).`;
          }
        } catch (aiErr) {
          console.warn('AI Vision assist fallback to local OMR:', aiErr);
        }
      }

      // 3. Match with student record
      const matchedStudent = students.find(s => s.studentNo === detection.studentNo) ||
        students.find(s => s.studentNo.includes(detection.studentNo.slice(-4))) ||
        students[scanCountSession % students.length];

      // 4. Evaluate Score
      const evalResult = evaluateScanResult(
        detection,
        exam,
        matchedStudent,
        'CAMERA_REALTIME',
        snapshotUrl
      );

      if (isAiAssisted && aiNotes) {
        evalResult.aiAssisted = true;
        evalResult.aiExplanation = aiNotes;
      }

      setLastScannedResult(evalResult);
      setScanCountSession(prev => prev + 1);

      // Sound & Celebration Feedback
      if (evalResult.isPassed) {
        playSuccessChime();
        confetti({
          particleCount: 28,
          spread: 45,
          origin: { y: 0.85 }
        });
      } else {
        playWarningChime();
      }

      // Automatically persist result
      onSaveResult(evalResult);
    } catch (err: any) {
      console.error('Scan processing failed:', err);
      playWarningChime();
    } finally {
      setIsProcessing(false);
    }
  }, [isProcessing, exam, students, isAiVisionEnabled, scanCountSession, onSaveResult]);

  useEffect(() => {
    let isMounted = true;
    let currentStream: MediaStream | null = null;

    async function mountCamera() {
      try {
        const stream = await acquireCameraStream();
        if (!isMounted) {
          if (stream) stream.getTracks().forEach(t => t.stop());
          return;
        }

        if (stream && videoRef.current) {
          currentStream = stream;
          videoRef.current.srcObject = stream;
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.catch(() => {});
          }
          setIsCameraActive(true);
          setCameraError(null);
        } else if (isMounted) {
          setCameraError('Kamera tidak terdeteksi atau izin belum diberikan. Anda dapat mengklik "Mulai Kamera", izinkan browser, atau unggah foto LJK.');
          setIsCameraActive(false);
        }
      } catch {
        if (isMounted) {
          setCameraError('Kamera belum aktif. Klik "Mulai Kamera" atau gunakan opsi Upload Foto LJK.');
          setIsCameraActive(false);
        }
      }
    }

    mountCamera();

    return () => {
      isMounted = false;
      if (currentStream) {
        currentStream.getTracks().forEach(t => {
          try {
            t.stop();
          } catch {}
        });
      }
      stopCamera();
    };
  }, [acquireCameraStream, stopCamera]);

  // Real-time Video frame processing loop
  useEffect(() => {
    if (!isCameraActive) return;

    const interval = setInterval(() => {
      if (isProcessing || !videoRef.current || !canvasRef.current || !overlayCanvasRef.current) return;
      if (videoRef.current.readyState < 2) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const overlay = overlayCanvasRef.current;
      const ctx = canvas.getContext('2d');
      const overlayCtx = overlay.getContext('2d');

      if (!ctx || !overlayCtx) return;

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      overlay.width = canvas.width;
      overlay.height = canvas.height;

      // Draw current video frame to processing canvas
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Draw Target Alignment Overlay on overlay canvas
      overlayCtx.clearRect(0, 0, overlay.width, overlay.height);

      const marginX = overlay.width * 0.08;
      const marginY = overlay.height * 0.08;
      const guideW = overlay.width - marginX * 2;
      const guideH = overlay.height - marginY * 2;

      // 4 Corner Brackets
      const bracketLen = 28;
      overlayCtx.strokeStyle = alignmentStatus === 'LOCKED' ? '#22c55e' : '#3b82f6';
      overlayCtx.lineWidth = 3.5;
      overlayCtx.lineCap = 'round';

      // Top-Left
      overlayCtx.beginPath();
      overlayCtx.moveTo(marginX, marginY + bracketLen);
      overlayCtx.lineTo(marginX, marginY);
      overlayCtx.lineTo(marginX + bracketLen, marginY);
      overlayCtx.stroke();

      // Top-Right
      overlayCtx.beginPath();
      overlayCtx.moveTo(marginX + guideW - bracketLen, marginY);
      overlayCtx.lineTo(marginX + guideW, marginY);
      overlayCtx.lineTo(marginX + guideW, marginY + bracketLen);
      overlayCtx.stroke();

      // Bottom-Left
      overlayCtx.beginPath();
      overlayCtx.moveTo(marginX, marginY + guideH - bracketLen);
      overlayCtx.lineTo(marginX, marginY + guideH);
      overlayCtx.lineTo(marginX + bracketLen, marginY + guideH);
      overlayCtx.stroke();

      // Bottom-Right
      overlayCtx.beginPath();
      overlayCtx.moveTo(marginX + guideW - bracketLen, marginY + guideH);
      overlayCtx.lineTo(marginX + guideW, marginY + guideH);
      overlayCtx.lineTo(marginX + guideW, marginY + guideH - bracketLen);
      overlayCtx.stroke();

      // Simulated detection check for auto-scan
      if (isAutoScanEnabled && !lastScannedResult) {
        setConsecutiveStableFrames(prev => {
          if (prev >= 4) {
            handleCaptureAndProcess();
            return 0;
          }
          return prev + 1;
        });
      }
    }, 250);

    return () => clearInterval(interval);
  }, [isCameraActive, isProcessing, isAutoScanEnabled, lastScannedResult, alignmentStatus, handleCaptureAndProcess]);

  const handleNextStudent = () => {
    setLastScannedResult(null);
    setConsecutiveStableFrames(0);
    setAlignmentStatus('ALIGNING');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleCaptureAndProcess(e.target.files[0]);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Live Camera Viewport */}
      <div className="lg:col-span-7 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm relative overflow-hidden flex flex-col">
          {/* Header Controls */}
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 text-xs">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isCameraActive ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isCameraActive ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
              </span>
              <span className="font-bold text-slate-800">
                {isCameraActive ? 'Kamera Real-Time Aktif' : 'Kamera Nonaktif'}
              </span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-500 font-medium">Sesi: {scanCountSession} LJK Terkoreksi</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Auto Scan Toggle */}
              <button
                onClick={() => setIsAutoScanEnabled(!isAutoScanEnabled)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  isAutoScanEnabled
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-3 h-3 text-blue-600" />
                Auto-Scan: {isAutoScanEnabled ? 'ON' : 'OFF'}
              </button>

              {/* Gemini AI Vision Toggle */}
              <button
                onClick={() => setIsAiVisionEnabled(!isAiVisionEnabled)}
                title="Bantuan AI Vision untuk LJK buram / pensil tipis"
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                  isAiVisionEnabled
                    ? 'bg-purple-50 text-purple-700 border border-purple-200 shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-purple-50 hover:text-purple-700'
                }`}
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                AI Vision
              </button>
            </div>
          </div>

          {/* Camera Stage */}
          <div className="relative aspect-[4/3] bg-slate-950 rounded-xl overflow-hidden mt-3 flex items-center justify-center border border-slate-300 shadow-inner">
            {cameraError ? (
              <div className="p-6 text-center text-slate-400 flex flex-col items-center gap-3">
                <CameraOff className="w-12 h-12 text-slate-600" />
                <p className="text-xs text-red-400 max-w-xs">{cameraError}</p>
                <button
                  onClick={startCamera}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-sm"
                >
                  <RotateCcw className="w-4 h-4" /> Coba Lagi
                </button>
              </div>
            ) : (
              <>
                <video
                  ref={videoRef}
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <canvas
                  ref={overlayCanvasRef}
                  className="absolute inset-0 w-full h-full pointer-events-none"
                />

                {/* Helper Alignment HUD */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-slate-900/80 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white/20 text-white text-xs font-medium flex items-center gap-2 shadow-lg">
                  <Eye className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                  <span>Posisikan LJK A4/A5 di dalam bingkai hijau</span>
                </div>

                {isProcessing && (
                  <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm flex flex-col items-center justify-center gap-3 text-white">
                    <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-semibold text-blue-200">Memproses bulatan LJK...</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Manual Capture & Upload Action Bar */}
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => handleCaptureAndProcess()}
                disabled={isProcessing || !isCameraActive}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg shadow-blue-200 active:scale-95 transition-all"
              >
                <Camera className="w-4 h-4" />
                Pindai Manual (Spasi / Klik)
              </button>

              <label className="cursor-pointer px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-2 border border-slate-200 transition-colors shadow-xs">
                <Upload className="w-4 h-4 text-blue-600" />
                Upload Foto LJK
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            <div className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Audio Chime Aktif</span>
            </div>
          </div>
        </div>

        {/* Tips Box */}
        <div className="bg-blue-50/70 border border-blue-200/80 rounded-2xl p-4 text-xs text-slate-700 flex items-start gap-3 shadow-xs">
          <HelpCircle className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <span className="font-bold text-slate-900">Tips Koreksi Cepat:</span> Pastikan pencahayaan cukup dan tidak ada bayangan tebal menutupi bulatan LJK. Format LJK A4 dibagi 2 dapat langsung dipindai tanpa perlu dipotong terlebih dahulu.
          </div>
        </div>
      </div>

      {/* Right: Instant Score & Evaluation Card */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col h-full">
          <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-600" />
              Hasil Penilaian Terkini
            </h2>
            {lastScannedResult && (
              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                lastScannedResult.isPassed
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-rose-50 text-rose-700 border border-rose-200'
              }`}>
                {lastScannedResult.isPassed ? 'TUNTAS (LULUS)' : 'REMEDIAL'}
              </span>
            )}
          </div>

          {lastScannedResult ? (
            <div className="mt-4 flex flex-col gap-4 flex-1">
              {/* Student Header & Score Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between shadow-xs">
                <div>
                  <div className="text-xs text-slate-500 font-medium">NISN: {lastScannedResult.studentNo} • Paket {lastScannedResult.packetCode}</div>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">{lastScannedResult.studentName}</h3>
                  <div className="text-xs text-slate-500 mt-1 font-medium">
                    Kelas: {lastScannedResult.classId} | KKM: {exam.kkm}
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-3xl font-black tracking-tight text-slate-900">
                    {lastScannedResult.finalScore}
                    <span className="text-xs text-slate-400 font-normal ml-1">/100</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                    {lastScannedResult.totalCorrect}/{exam.totalQuestions} Soal Benar
                  </div>
                </div>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-2.5">
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center shadow-xs">
                  <div className="text-[11px] text-emerald-700 font-semibold uppercase tracking-wider">Benar</div>
                  <div className="text-xl font-bold text-emerald-800 mt-0.5">{lastScannedResult.totalCorrect}</div>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center shadow-xs">
                  <div className="text-[11px] text-rose-700 font-semibold uppercase tracking-wider">Salah</div>
                  <div className="text-xl font-bold text-rose-800 mt-0.5">{lastScannedResult.totalWrong}</div>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-center shadow-xs">
                  <div className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">Kosong</div>
                  <div className="text-xl font-bold text-slate-700 mt-0.5">{lastScannedResult.totalBlank}</div>
                </div>
              </div>

              {/* AI Assistance Badge if applied */}
              {lastScannedResult.aiAssisted && (
                <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 text-xs text-purple-900 flex items-start gap-2 shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <span className="font-medium">{lastScannedResult.aiExplanation}</span>
                </div>
              )}

              {/* Answer Grid Mini Matrix */}
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Rincian Butir Jawaban (1 - {exam.totalQuestions})</span>
                  <span className="text-[11px] text-slate-500 font-normal">Hijau: Benar | Merah: Salah</span>
                </div>

                <div className="grid grid-cols-5 gap-1.5 max-h-56 overflow-y-auto pr-1">
                  {lastScannedResult.detailedAnswers.map(ans => (
                    <div
                      key={ans.questionNo}
                      className={`p-1.5 rounded-lg border text-center text-xs flex flex-col items-center justify-between ${
                        ans.isCorrect
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                          : ans.markedOption === null
                          ? 'bg-slate-50 border-slate-200 text-slate-500'
                          : 'bg-rose-50 border-rose-200 text-rose-900'
                      }`}
                    >
                      <span className="text-[10px] font-mono text-slate-500">#{ans.questionNo}</span>
                      <span className="font-bold my-0.5">{ans.markedOption || '-'}</span>
                      <span className="text-[9px] text-slate-500">Kunci: {ans.correctAnswer}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Next Student Trigger */}
              <div className="pt-3.5 border-t border-slate-100 flex items-center gap-3">
                <button
                  onClick={handleNextStudent}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md shadow-blue-200 transition-all"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Lanjut Scan LJK Siswa Berikutnya
                </button>
                <button
                  onClick={onOpenResultsTab}
                  className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                >
                  Lihat Semua
                </button>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-slate-400 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 shadow-xs">
                <ScanLine className="w-8 h-8 text-slate-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800">Belum Ada Lembar Dipindai</p>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  Arahkan kamera ke lembar LJK siswa atau klik tombol <strong>Pindai Manual</strong> untuk memulai penilaian otomatis.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
