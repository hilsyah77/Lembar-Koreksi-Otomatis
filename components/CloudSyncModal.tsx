'use client';

import React, { useState, useEffect } from 'react';
import { 
  Cloud, 
  CloudUpload, 
  CloudDownload, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  Layers, 
  Users, 
  Table, 
  X,
  Radio,
  Clock,
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { 
  checkFirestoreConnection, 
  syncStateToFirestore, 
  fetchStateFromFirestore, 
  FIREBASE_PROJECT_INFO 
} from '@/lib/firestore-service';
import { AppState } from '@/lib/storage';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AppState;
  onRestoreState: (restoredState: AppState) => void;
  onOpenDatabaseManager?: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onRestoreState,
  onOpenDatabaseManager
}) => {
  const [isChecking, setIsChecking] = useState(false);
  const [connStatus, setConnStatus] = useState<{ connected: boolean; latencyMs: number; error?: string } | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const performHealthCheck = async () => {
    setIsChecking(true);
    try {
      const result = await checkFirestoreConnection();
      setConnStatus(result);
    } catch {
      setConnStatus({ connected: false, latencyMs: 0, error: 'Koneksi ke Firestore gagal.' });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    let isCancelled = false;

    if (isOpen) {
      const runCheck = async () => {
        setIsChecking(true);
        try {
          const result = await checkFirestoreConnection();
          if (!isCancelled) {
            setConnStatus(result);
            setStatusMessage(null);
          }
        } catch {
          if (!isCancelled) {
            setConnStatus({ connected: false, latencyMs: 0, error: 'Koneksi ke Firestore gagal.' });
            setStatusMessage(null);
          }
        } finally {
          if (!isCancelled) {
            setIsChecking(false);
          }
        }
      };

      runCheck();
    }

    return () => {
      isCancelled = true;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleUploadToCloud = async () => {
    setIsSyncing(true);
    setStatusMessage({ type: 'info', text: 'Sedang mengunggah data ujian, siswa, dan hasil scan ke Cloud Firestore...' });
    try {
      await syncStateToFirestore(currentState);
      setStatusMessage({ 
        type: 'success', 
        text: `Berhasil mencadangkan ${currentState.exams.length} Ujian, ${currentState.students.length} Siswa, dan ${currentState.results.length} Hasil Scan ke Cloud!` 
      });
      performHealthCheck();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: `Gagal mencadangkan data ke Cloud: ${msg}` });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDownloadFromCloud = async () => {
    setIsRestoring(true);
    setStatusMessage({ type: 'info', text: 'Mengambil salinan data terbaru dari Cloud Firestore...' });
    try {
      const cloudData = await fetchStateFromFirestore();
      if (!cloudData.exams || cloudData.exams.length === 0) {
        setStatusMessage({ type: 'error', text: 'Database Cloud masih kosong atau belum pernah dicadangkan.' });
        setIsRestoring(false);
        return;
      }

      const mergedState: AppState = {
        exams: cloudData.exams || currentState.exams,
        activeExamId: cloudData.activeExamId || (cloudData.exams[0]?.id ?? currentState.activeExamId),
        teacher: cloudData.teacher || currentState.teacher,
        kyocera: cloudData.kyocera || currentState.kyocera,
        students: cloudData.students || currentState.students,
        results: cloudData.results || currentState.results,
        lastSyncedAt: new Date().toISOString()
      };

      onRestoreState(mergedState);
      setStatusMessage({ 
        type: 'success', 
        text: `Sinkronisasi sukses! Berhasil memuat ${mergedState.exams.length} Ujian, ${mergedState.students.length} Siswa, dan ${mergedState.results.length} Hasil Scan dari Cloud.` 
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setStatusMessage({ type: 'error', text: `Gagal mengunduh dari Cloud: ${msg}` });
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/15 rounded-xl backdrop-blur-xs">
              <Cloud className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold flex items-center gap-2">
                Firebase Cloud Firestore
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-full bg-white/20 text-white">
                  Aktif
                </span>
              </h2>
              <p className="text-xs text-blue-100 font-medium">
                Sinkronisasi & Cadangan Cloud Multi-Perangkat
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5">
          {/* Cloud Connection Status Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2.5 rounded-xl ${
                connStatus?.connected 
                  ? 'bg-emerald-100 text-emerald-700' 
                  : connStatus === null 
                    ? 'bg-slate-100 text-slate-500' 
                    : 'bg-rose-100 text-rose-700'
              }`}>
                {connStatus?.connected ? (
                  <Radio className="w-5 h-5 animate-pulse" />
                ) : (
                  <Cloud className="w-5 h-5" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-800">
                    {connStatus?.connected ? 'Terhubung ke Cloud Firestore' : isChecking ? 'Memeriksa Koneksi Cloud...' : 'Menghubungkan ke Cloud...'}
                  </span>
                  {connStatus?.connected && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {connStatus.latencyMs} ms
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                  Project: <span className="text-slate-700 font-semibold">{FIREBASE_PROJECT_INFO.projectId}</span>
                </p>
              </div>
            </div>

            <button
              onClick={performHealthCheck}
              disabled={isChecking}
              className="p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-200/70 rounded-lg transition-colors"
              title="Perbarui Status Koneksi"
            >
              <RefreshCw className={`w-4 h-4 ${isChecking ? 'animate-spin text-blue-600' : ''}`} />
            </button>
          </div>

          {/* Current Local Data Summary */}
          <div>
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <HardDrive className="w-3.5 h-3.5 text-blue-600" />
              Data Lokal Saat Ini
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-lg font-black text-slate-800">{currentState.exams.length}</div>
                <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                  <Layers className="w-3 h-3 text-blue-500" /> Paket Ujian
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-lg font-black text-slate-800">{currentState.students.length}</div>
                <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                  <Users className="w-3 h-3 text-purple-500" /> Data Siswa
                </div>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                <div className="text-lg font-black text-slate-800">{currentState.results.length}</div>
                <div className="text-[10px] font-semibold text-slate-500 flex items-center justify-center gap-1 mt-0.5">
                  <Table className="w-3 h-3 text-emerald-500" /> Lembar Nilai
                </div>
              </div>
            </div>
          </div>

          {/* Sync Action Buttons */}
          <div className="space-y-3 pt-1">
            <h4 className="text-xs font-bold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Opsi Sinkronisasi
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={handleUploadToCloud}
                disabled={isSyncing || isRestoring}
                className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/70 hover:bg-blue-100/90 text-blue-800 flex items-center gap-3 text-left transition-all group shadow-2xs disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-blue-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                  <CloudUpload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Unggah ke Cloud</div>
                  <p className="text-[10px] text-blue-600/80 leading-tight mt-0.5">
                    Cadangkan data lokal ke Firestore
                  </p>
                </div>
              </button>

              <button
                onClick={handleDownloadFromCloud}
                disabled={isSyncing || isRestoring}
                className="p-3.5 rounded-xl border border-indigo-200 bg-indigo-50/70 hover:bg-indigo-100/90 text-indigo-800 flex items-center gap-3 text-left transition-all group shadow-2xs disabled:opacity-50"
              >
                <div className="p-2 rounded-lg bg-indigo-600 text-white shrink-0 group-hover:scale-105 transition-transform">
                  <CloudDownload className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold">Pulihkan dari Cloud</div>
                  <p className="text-[10px] text-indigo-600/80 leading-tight mt-0.5">
                    Unduh data ujian & nilai terbaru
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Feedback / Status Message Alert */}
          {statusMessage && (
            <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 animate-in fade-in duration-150 ${
              statusMessage.type === 'success' 
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : statusMessage.type === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-blue-50 border-blue-200 text-blue-800'
            }`}>
              {statusMessage.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {statusMessage.type === 'info' && <RefreshCw className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-spin" />}
              <span className="font-medium">{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          {onOpenDatabaseManager ? (
            <button
              onClick={() => {
                onClose();
                onOpenDatabaseManager();
              }}
              className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1.5"
            >
              <Database className="w-3.5 h-3.5" />
              Kelola File JSON Lokal
            </button>
          ) : (
            <div />
          )}

          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
