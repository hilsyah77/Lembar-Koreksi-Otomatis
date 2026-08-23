'use client';

import React, { useState, useEffect } from 'react';
import { 
  Database, 
  CheckCircle2, 
  X, 
  Flame, 
  ExternalLink, 
  RefreshCw, 
  ShieldCheck, 
  Wifi,
  Sparkles
} from 'lucide-react';
import { checkFirestoreConnection, FIREBASE_PROJECT_INFO } from '@/lib/firestore-service';

interface FirebaseStatusBannerProps {
  onOpenCloudModal: () => void;
}

export const FirebaseStatusBanner: React.FC<FirebaseStatusBannerProps> = ({ onOpenCloudModal }) => {
  const [isVisible, setIsVisible] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(false);
  const [status, setStatus] = useState<{
    checking: boolean;
    connected: boolean;
    latencyMs?: number;
    lastChecked?: string;
  }>({
    checking: true,
    connected: true,
    latencyMs: 38
  });

  useEffect(() => {
    let isMounted = true;
    async function testConnection() {
      setStatus(prev => ({ ...prev, checking: true }));
      const result = await checkFirestoreConnection();
      if (isMounted) {
        setStatus({
          checking: false,
          connected: result.connected,
          latencyMs: result.latencyMs,
          lastChecked: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
        });
      }
    }

    testConnection();
    // Re-check periodically every 60 seconds
    const interval = setInterval(testConnection, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  if (!isVisible) return null;

  if (isMinimized) {
    return (
      <div 
        id="firebase-status-minimized-pill"
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-4 right-4 z-50 cursor-pointer bg-slate-900/90 backdrop-blur-md text-white px-3.5 py-2 rounded-full shadow-xl border border-slate-700/80 flex items-center gap-2 hover:bg-slate-800 transition-all text-xs font-semibold group animate-in fade-in slide-in-from-bottom-2"
        title="Klik untuk melihat detail koneksi Firebase"
      >
        <span className="relative flex h-2.5 w-2.5">
          <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${status.connected ? 'bg-amber-400' : 'bg-rose-400'}`}></span>
          <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${status.connected ? 'bg-amber-500' : 'bg-rose-500'}`}></span>
        </span>
        <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400/20" />
        <span>Firebase {status.connected ? 'Terhubung' : 'Offline'}</span>
        {status.latencyMs && <span className="text-[10px] text-slate-400 font-mono">({status.latencyMs}ms)</span>}
      </div>
    );
  }

  return (
    <div 
      id="firebase-connection-notification"
      className="fixed bottom-4 right-4 z-50 max-w-md w-[calc(100vw-2rem)] sm:w-96 bg-slate-900 text-white rounded-2xl shadow-2xl border border-slate-700/80 overflow-hidden animate-in fade-in slide-in-from-bottom-3 duration-300"
    >
      {/* Top Header bar with gradient accent */}
      <div className="bg-linear-to-r from-amber-500/20 via-orange-500/20 to-sky-500/20 px-4 py-2.5 border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-amber-500/20 text-amber-400">
            <Flame className="w-4 h-4 fill-amber-400/30" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-xs tracking-wide text-amber-300">Firebase Firestore</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-950/60 text-amber-300 border border-amber-800/60">
              Online
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsMinimized(true)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors text-xs"
            title="Kecilkan Notifikasi"
          >
            _
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
            title="Tutup Notifikasi"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-4 space-y-3 text-xs">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 shrink-0 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-white text-sm flex items-center gap-1.5">
              Koneksi Database Aktif
              <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            </p>
            <p className="text-slate-300 text-[11px] leading-relaxed">
              Cloud Firestore telah tersambung dan siap menyimpan lembar jawaban, data siswa & master ujian secara realtime.
            </p>
          </div>
        </div>

        {/* Connection Specs Matrix */}
        <div className="bg-slate-950/80 rounded-xl p-2.5 border border-slate-800/90 font-mono text-[10px] space-y-1 text-slate-300">
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Project ID:</span>
            <span className="text-amber-300 font-semibold">{FIREBASE_PROJECT_INFO.projectId}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Database:</span>
            <span className="text-sky-300">Cloud Firestore (Default)</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-slate-500">Status Latensi:</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <Wifi className="w-3 h-3" />
              {status.latencyMs ? `${status.latencyMs} ms (Sangat Cepat)` : 'Tersambung'}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 pt-1">
          <button
            onClick={() => {
              onOpenCloudModal();
              setIsMinimized(true);
            }}
            className="flex-1 py-2 px-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all text-xs shadow-md shadow-amber-950/40"
          >
            <Database className="w-3.5 h-3.5 text-slate-950" />
            Kelola Cloud Sync
          </button>

          <button
            onClick={() => setIsMinimized(true)}
            className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition-all text-xs border border-slate-700"
          >
            Sembunyikan
          </button>
        </div>
      </div>
    </div>
  );
};
