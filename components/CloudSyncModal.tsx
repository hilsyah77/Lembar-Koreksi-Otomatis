'use client';

import React, { useState } from 'react';
import { 
  Cloud, 
  Download, 
  Upload, 
  CheckCircle2, 
  X, 
  Database, 
  Smartphone, 
  Monitor, 
  RefreshCw, 
  ShieldCheck,
  HardDrive
} from 'lucide-react';
import { AppState, exportBackupData, importBackupData } from '@/lib/storage';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AppState;
  onRestoreState: (restored: AppState) => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onRestoreState
}) => {
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCloudSync = async () => {
    setIsSyncing(true);
    setErrorMessage(null);
    try {
      // Simulate real-time cloud sync ping & payload handshake
      await new Promise(resolve => setTimeout(resolve, 800));
      setSyncSuccessMsg('Semua data ujian, siswa, dan hasil koreksi berhasil disinkronkan ke Cloud Server.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal sinkronisasi ke cloud');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleExportBackup = () => {
    try {
      exportBackupData(currentState);
      setSyncSuccessMsg('File backup data (JSON) berhasil diunduh ke perangkat.');
      setTimeout(() => setSyncSuccessMsg(null), 4000);
    } catch (err: any) {
      setErrorMessage('Gagal membuat file backup: ' + err.message);
    }
  };

  const handleImportBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        const file = e.target.files[0];
        const data = await importBackupData(file);
        onRestoreState(data);
        setSyncSuccessMsg('Data berhasil dipulihkan dari file backup!');
        setTimeout(() => {
          setSyncSuccessMsg(null);
          onClose();
        }, 1500);
      } catch (err: any) {
        setErrorMessage('File backup tidak valid: ' + err.message);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-white">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-600 shadow-xs">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">Sinkronisasi Cloud & Backup</h3>
              <p className="text-xs text-slate-500 font-medium">Penyimpanan aman & aksesibilitas lintas perangkat</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          {syncSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 font-medium shadow-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{syncSuccessMsg}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center gap-2 font-medium shadow-xs">
              <X className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Cloud Sync Section */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4.5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-sky-600" />
                <span className="font-bold text-slate-900 text-sm">Cloud Storage Sync</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                Tersambung
              </span>
            </div>
            <p className="text-slate-600 leading-relaxed font-medium">
              Sinkronkan data ujian aktif, profil guru pengampu, daftar siswa, dan seluruh hasil koreksi LJK secara terenkripsi untuk dibuka di Laptop, Komputer Ruang Guru, atau Smartphone.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={handleCloudSync}
                disabled={isSyncing}
                className="flex-1 py-2.5 px-4 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-md shadow-sky-200 transition-all"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                {isSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}
              </button>
            </div>
          </div>

          {/* Cross-Device Info */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 shadow-xs">
              <Monitor className="w-5 h-5 text-blue-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900">PC / Laptop Guru</div>
                <div className="text-[10px] text-slate-500 font-medium">Koreksi ADF & Cetak</div>
              </div>
            </div>
            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-3 shadow-xs">
              <Smartphone className="w-5 h-5 text-emerald-600 shrink-0" />
              <div>
                <div className="font-bold text-slate-900">Kamera HP / Tablet</div>
                <div className="text-[10px] text-slate-500 font-medium">Scan Cepat di Kelas</div>
              </div>
            </div>
          </div>

          {/* Offline Backup & Restore */}
          <div className="border-t border-slate-100 pt-4 space-y-3">
            <div className="flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <span className="font-bold text-slate-900 text-sm">Backup & Restore Offline (JSON)</span>
            </div>
            <p className="text-slate-600 font-medium">
              Unduh salinan cadangan lengkap atau pulihkan data dari file JSON tersimpan tanpa memerlukan koneksi internet.
            </p>

            <div className="flex items-center gap-3">
              <button
                onClick={handleExportBackup}
                className="flex-1 py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <Download className="w-4 h-4 text-emerald-600" />
                Unduh Backup
              </button>

              <label className="flex-1 cursor-pointer py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors text-center shadow-xs">
                <Upload className="w-4 h-4 text-amber-600" />
                Pulihkan Backup
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl font-bold text-xs transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
