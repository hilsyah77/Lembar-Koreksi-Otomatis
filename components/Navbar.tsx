'use client';

import React from 'react';
import { 
  ScanLine, 
  Printer,
  Table, 
  BarChart3, 
  History, 
  FileText, 
  UserCheck, 
  Settings, 
  Layers, 
  Users,
  Database,
  Cloud,
  Key
} from 'lucide-react';
import { ExamConfig, TeacherProfile, KyoceraSettings } from '@/types/omr';

export type TabType = 'CAMERA' | 'ADF_SCAN' | 'RESULTS' | 'ANALYTICS' | 'HISTORY' | 'LJK_TEMPLATE';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  exams: ExamConfig[];
  activeExamId: string;
  onSelectExam: (id: string) => void;
  teacher: TeacherProfile;
  kyocera?: KyoceraSettings;
  onOpenTeacherModal: () => void;
  onOpenExamModal: () => void;
  onOpenCloudModal: () => void;
  onOpenStudentModal: () => void;
  onOpenDatabaseModal: () => void;
  totalResultsCount: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  exams,
  activeExamId,
  onSelectExam,
  teacher,
  kyocera,
  onOpenTeacherModal,
  onOpenExamModal,
  onOpenCloudModal,
  onOpenStudentModal,
  onOpenDatabaseModal,
  totalResultsCount
}) => {
  const activeExam = exams.find(e => e.id === activeExamId) || exams[0];

  const navItems = [
    {
      id: 'CAMERA' as TabType,
      label: 'Pindai Kamera',
      icon: ScanLine,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'ADF_SCAN' as TabType,
      label: 'Scan Mesin ADF',
      icon: Printer,
      badge: 'Auto Feeder',
      badgeColor: 'bg-emerald-100 text-emerald-800',
    },
    {
      id: 'RESULTS' as TabType,
      label: 'Hasil Koreksi',
      icon: Table,
      badge: totalResultsCount > 0 ? `${totalResultsCount}` : '0',
      badgeColor: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'ANALYTICS' as TabType,
      label: 'Analitik Kelas',
      icon: BarChart3,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'HISTORY' as TabType,
      label: 'Histori Siswa',
      icon: History,
      badge: null,
      badgeColor: '',
    },
    {
      id: 'LJK_TEMPLATE' as TabType,
      label: 'Cetak LJK A4 Bagi 2',
      icon: FileText,
      badge: 'Cetak Presisi',
      badgeColor: 'bg-amber-100 text-amber-800',
    },
  ];

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs print:hidden">
      {/* Top Bar: Brand and Master Data Action Buttons */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Left: Brand / Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-200 shrink-0">
              <ScanLine className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base tracking-tight text-slate-900 leading-tight">
                  LJK Scan <span className="text-blue-600 font-black">Pro</span>
                </h1>
                <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 hidden sm:inline-block">
                  OMR
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium truncate max-w-[150px] sm:max-w-[260px]">
                {teacher.namaSekolah || 'Sistem Koreksi LJK'}
              </p>
            </div>
          </div>

          {/* Right: Master Data & Quick Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Cloud Firestore Sync Button */}
            <button
              onClick={onOpenCloudModal}
              title="Sinkronisasi Cloud Firestore & Multi-Perangkat"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-200 text-sky-700 hover:bg-sky-100 hover:text-sky-900 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Cloud className="w-3.5 h-3.5 text-sky-600" />
              <span className="hidden md:inline">Cloud Firestore</span>
            </button>

            {/* Student & Class Settings Button */}
            <button
              onClick={onOpenStudentModal}
              title="Kelola Data Siswa & Nomor Peserta (NISN)"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 text-purple-700 hover:bg-purple-100 hover:text-purple-900 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Users className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden md:inline">Data Siswa</span>
            </button>

            {/* Teacher Profile Button */}
            <button
              onClick={onOpenTeacherModal}
              title="Profil Guru Pengampu & Pengesahan Sekolah"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 hover:text-blue-900 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden md:inline">Guru Pengampu</span>
            </button>

            {/* Database & Backup Manager Button */}
            <button
              onClick={onOpenDatabaseModal}
              title="Kelola & Cadangkan Database Lokal"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 hover:text-slate-900 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            >
              <Database className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden lg:inline">Database & Backup</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Menu Navigation Tabs & Action Bar */}
      <div className="border-t border-slate-200/80 bg-slate-50/70">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center space-x-1.5 sm:space-x-2 overflow-x-auto py-2 scrollbar-none" aria-label="Menu Utama">
            
            {/* 1. Pindai Kamera Tab */}
            {(() => {
              const cameraItem = navItems[0];
              const Icon = cameraItem.icon;
              const isActive = activeTab === 'CAMERA';

              return (
                <button
                  key="CAMERA"
                  onClick={() => setActiveTab('CAMERA')}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 hover:border-blue-300'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span>{cameraItem.label}</span>
                </button>
              );
            })()}

            {/* 2. Navigasi Penilaian Aktif - Berada Tepat di Samping Pindai Kamera */}
            <div className="flex items-center gap-1.5 bg-white border-2 border-blue-200 hover:border-blue-400 rounded-xl px-2.5 py-1 shadow-2xs transition-colors shrink-0">
              <div className="flex items-center gap-1 text-blue-700 font-bold text-xs shrink-0">
                <div className="w-6 h-6 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                </div>
                <span className="hidden sm:inline text-[11px] font-bold text-slate-600">Penilaian:</span>
              </div>

              <select
                value={activeExamId}
                onChange={(e) => onSelectExam(e.target.value)}
                aria-label="Pilih Penilaian / Asesmen Aktif"
                className="bg-transparent text-xs font-bold text-slate-900 focus:outline-none cursor-pointer max-w-[150px] sm:max-w-[220px] md:max-w-[260px] truncate py-1"
              >
                {exams.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.title} {ex.gradeClass ? `(${ex.gradeClass})` : ''} • {ex.totalQuestions} Soal
                  </option>
                ))}
              </select>

              <span className="hidden lg:inline-flex px-1.5 py-0.5 rounded-md text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200 shrink-0">
                KKM {activeExam.kkm}
              </span>
            </div>

            {/* Divider */}
            <div className="h-5 w-px bg-slate-300 mx-1 shrink-0" />

            {/* 3. Sisa Tab Navigasi: Kyocera, Hasil Koreksi, Analitik, Histori, Cetak LJK */}
            {navItems.slice(1).map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 group cursor-pointer ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500 group-hover:text-blue-600'}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-white/20 text-white' : item.badgeColor
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}

            {/* Separator Divider */}
            <div className="h-5 w-px bg-slate-300 mx-1 shrink-0 hidden sm:block" />

            {/* Tombol Kunci Jawaban */}
            <button
              type="button"
              onClick={onOpenExamModal}
              title={`Atur Kunci Jawaban & Bobot Penilaian untuk "${activeExam.title}"`}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 bg-amber-500 hover:bg-amber-600 text-white shadow-sm hover:shadow-md hover:scale-[1.01] active:scale-[0.98] cursor-pointer group"
            >
              <div className="w-5 h-5 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                <Key className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="font-bold">Kunci Jawaban</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-black/20 text-amber-100 border border-white/20">
                {activeExam.totalQuestions} Soal • {activeExam.packets?.length || 1} Pkt
              </span>
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
};
