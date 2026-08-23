'use client';

import React, { useState } from 'react';
import { 
  Trash2, 
  AlertTriangle, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  X, 
  Database, 
  FileText, 
  Users, 
  Layers, 
  ShieldAlert,
  HelpCircle
} from 'lucide-react';
import { 
  AppState, 
  exportBackupData, 
  purgeEntireDatabase, 
  resetDatabaseToFactoryDemo, 
  purgeResultsOnly 
} from '@/lib/storage';
import { purgeFirestoreDatabase, syncStateToFirestore } from '@/lib/firestore-service';

interface DatabaseManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentState: AppState;
  onStatePurged: (newState: AppState) => void;
  onResultsPurged: () => void;
}

export const DatabaseManagerModal: React.FC<DatabaseManagerModalProps> = ({
  isOpen,
  onClose,
  currentState,
  onStatePurged,
  onResultsPurged
}) => {
  const [activeAction, setActiveAction] = useState<'NONE' | 'PURGE_ALL' | 'RESET_DEMO' | 'PURGE_RESULTS'>('NONE');
  const [confirmInput, setConfirmInput] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleDownloadBackupBeforeDelete = () => {
    try {
      exportBackupData(currentState);
      setSuccessMsg('File cadangan database berhasil diunduh. Sekarang aman untuk menghapus database.');
    } catch (err: any) {
      setErrorMessage('Gagal mengunduh cadangan: ' + err.message);
    }
  };

  const executeAction = async () => {
    setErrorMessage(null);

    if (activeAction === 'PURGE_ALL') {
      if (confirmInput.trim().toUpperCase() !== 'HAPUS') {
        setErrorMessage('Ketik kata "HAPUS" dengan tepat untuk mengonfirmasi penghapusan total.');
        return;
      }
      const emptyState = purgeEntireDatabase();
      onStatePurged(emptyState);
      try {
        await purgeFirestoreDatabase();
      } catch (e) {
        console.warn('Firestore purge warning:', e);
      }
      setSuccessMsg('Seluruh database aplikasi & Cloud Firestore berhasil dikosongkan!');
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveAction('NONE');
        setConfirmInput('');
        onClose();
      }, 1500);
    } else if (activeAction === 'RESET_DEMO') {
      const demoState = resetDatabaseToFactoryDemo();
      onStatePurged(demoState);
      try {
        await syncStateToFirestore(demoState);
      } catch (e) {
        console.warn('Firestore demo sync warning:', e);
      }
      setSuccessMsg('Database berhasil direset ke pengaturan dan data bawaan demo!');
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveAction('NONE');
        onClose();
      }, 1500);
    } else if (activeAction === 'PURGE_RESULTS') {
      purgeResultsOnly();
      onResultsPurged();
      setSuccessMsg('Semua data hasil koreksi & pemindaian LJK berhasil dihapus!');
      setTimeout(() => {
        setSuccessMsg(null);
        setActiveAction('NONE');
        onClose();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shadow-xs">
              <Trash2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 flex items-center gap-2">
                Hapus & Kelola Database
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Pengaturan penghapusan memori lokal, pembersihan hasil ujian, atau reset sistem
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              setActiveAction('NONE');
              setConfirmInput('');
              onClose();
            }}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Database Status Summary */}
        <div className="grid grid-cols-3 gap-2.5 text-center">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] font-bold text-slate-500">Ujian Tersimpan</div>
            <div className="text-base font-black text-slate-800 mt-0.5">{currentState.exams.length}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] font-bold text-slate-500">Data Siswa</div>
            <div className="text-base font-black text-slate-800 mt-0.5">{currentState.students.length}</div>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
            <div className="text-[11px] font-bold text-slate-500">Hasil Koreksi</div>
            <div className="text-base font-black text-rose-600 mt-0.5">{currentState.results.length} Lembar</div>
          </div>
        </div>

        {/* Success / Error Message Banner */}
        {successMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 font-bold text-xs">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-center gap-2 font-bold text-xs">
            <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Selection (Step 1) */}
        {activeAction === 'NONE' && (
          <div className="space-y-3">
            {/* Backup Recommendation Banner */}
            <div className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-start gap-3 text-xs">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1.5 flex-1">
                <div className="font-bold text-amber-900">Saran: Cadangkan Data Terlebih Dahulu</div>
                <div className="text-amber-800 leading-relaxed">
                  Data yang dihapus tidak dapat dipulihkan kembali kecuali Anda telah mengunduh salinan backup JSON.
                </div>
                <button
                  type="button"
                  onClick={handleDownloadBackupBeforeDelete}
                  className="mt-1 flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg transition-colors text-xs shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" /> Unduh File Backup JSON
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              <div className="text-xs font-bold text-slate-700">Pilih Jenis Penghapusan / Reset:</div>

              {/* Option 1: Purge All Database */}
              <div 
                onClick={() => setActiveAction('PURGE_ALL')}
                className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 hover:bg-rose-50 hover:border-rose-300 cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-100 text-rose-700 mt-0.5">
                    <Trash2 className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-rose-900 group-hover:text-rose-700">
                      Hapus & Kosongkan Seluruh Database (Reset Total)
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Menghapus seluruh hasil scan LJK, data siswa & NISN, serta konfigurasi ujian menjadi lembar kosong bersih.
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-rose-600 text-white shrink-0 shadow-xs">
                  Pilih
                </span>
              </div>

              {/* Option 2: Purge Results Only */}
              <div 
                onClick={() => setActiveAction('PURGE_RESULTS')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-amber-100 text-amber-700 mt-0.5">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-amber-700">
                      Hapus Riwayat Hasil Koreksi LJK Saja
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Membersihkan seluruh daftar nilai dan hasil pemindaian siswa ({currentState.results.length} lembar). Master soal dan daftar siswa tetap aman.
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 text-slate-700 group-hover:bg-slate-300 shrink-0">
                  Pilih
                </span>
              </div>

              {/* Option 3: Reset to Factory Demo */}
              <div 
                onClick={() => setActiveAction('RESET_DEMO')}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-white hover:border-slate-300 cursor-pointer transition-all flex items-start justify-between gap-3 group"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700 mt-0.5">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-900 group-hover:text-blue-700">
                      Reset ke Data Contoh Bawaan (Factory Demo)
                    </div>
                    <div className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
                      Mengembalikan database ke sampel bawaan (Ujian Matematika 25 Soal, 25 Siswa Kelas XII MIPA, dan hasil simulasi).
                    </div>
                  </div>
                </div>
                <span className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-200 text-slate-700 group-hover:bg-slate-300 shrink-0">
                  Pilih
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Confirmation Screen (Step 2) */}
        {activeAction !== 'NONE' && (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 space-y-2.5">
              <div className="flex items-center gap-2 font-bold text-xs text-rose-900">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Konfirmasi Tindakan:
              </div>
              <p className="text-xs text-rose-800 leading-relaxed font-medium">
                {activeAction === 'PURGE_ALL' && (
                  <>Anda akan menghapus <strong>SELURUH data aplikasi</strong> termasuk semua ujian, nama siswa, dan hasil penilaian. Tindakan ini tidak dapat dibatalkan.</>
                )}
                {activeAction === 'PURGE_RESULTS' && (
                  <>Anda akan menghapus seluruh <strong>{currentState.results.length} lembar hasil koreksi LJK</strong>. Data master siswa dan soal ujian tidak akan terhapus.</>
                )}
                {activeAction === 'RESET_DEMO' && (
                  <>Anda akan mengatur ulang seluruh database ke <strong>data sampel bawaan</strong>.</>
                )}
              </p>

              {activeAction === 'PURGE_ALL' && (
                <div className="pt-2">
                  <label className="block text-[11px] font-bold text-slate-800 mb-1">
                    Ketik kata <span className="text-rose-600 underline font-mono">HAPUS</span> di bawah ini untuk konfirmasi:
                  </label>
                  <input
                    type="text"
                    placeholder="Ketik HAPUS"
                    value={confirmInput}
                    onChange={(e) => setConfirmInput(e.target.value)}
                    className="w-full bg-white border border-rose-300 rounded-xl px-3 py-2 text-xs font-mono font-bold text-rose-700 focus:outline-none focus:border-rose-500 shadow-xs"
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => {
                  setActiveAction('NONE');
                  setConfirmInput('');
                  setErrorMessage(null);
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={executeAction}
                disabled={activeAction === 'PURGE_ALL' && confirmInput.trim().toUpperCase() !== 'HAPUS'}
                className="px-5 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md shadow-rose-200 transition-all"
              >
                <Trash2 className="w-4 h-4" />
                Ya, Lanjutkan Penghapusan
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {activeAction === 'NONE' && (
          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
            >
              Tutup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
