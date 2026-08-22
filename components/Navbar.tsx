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
  Cloud, 
  Settings, 
  Layers, 
  CheckCircle2, 
  Wifi
} from 'lucide-react';
import { ExamConfig, TeacherProfile, KyoceraSettings } from '@/types/omr';

export type TabType = 'CAMERA' | 'KYOCERA' | 'RESULTS' | 'ANALYTICS' | 'HISTORY' | 'LJK_TEMPLATE';

interface NavbarProps {
  activeTab: TabType;
  setActiveTab: (tab: TabType) => void;
  exams: ExamConfig[];
  activeExamId: string;
  onSelectExam: (id: string) => void;
  teacher: TeacherProfile;
  kyocera: KyoceraSettings;
  onOpenTeacherModal: () => void;
  onOpenExamModal: () => void;
  onOpenCloudModal: () => void;
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
  totalResultsCount
}) => {
  const activeExam = exams.find(e => e.id === activeExamId) || exams[0];

  return (
    <header className="bg-white text-slate-800 border-b border-slate-200 sticky top-0 z-40 shadow-sm">
      {/* Top Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
        {/* Brand & App Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-200">
            <ScanLine className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                LJK Scan <span className="text-blue-600 font-black">Pro</span>
                <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  OMR Vision
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-500 hidden sm:block">
              {teacher.namaSekolah} • {teacher.namaGuru}
            </p>
          </div>
        </div>

        {/* Middle: Active Exam Selector */}
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs shadow-xs">
          <Layers className="w-3.5 h-3.5 text-blue-600 shrink-0" />
          <span className="text-slate-500 hidden md:inline font-medium">Ujian Aktif:</span>
          <select
            value={activeExamId}
            onChange={(e) => onSelectExam(e.target.value)}
            aria-label="Pilih Ujian Aktif"
            className="bg-transparent text-slate-800 font-semibold focus:outline-none cursor-pointer pr-2 max-w-[220px] truncate"
          >
            {exams.map(ex => (
              <option key={ex.id} value={ex.id} className="bg-white text-slate-800">
                {ex.title} ({ex.gradeClass})
              </option>
            ))}
          </select>
          <button
            onClick={onOpenExamModal}
            title="Pengaturan Kunci Jawaban & Bobot"
            className="ml-1 p-1 hover:bg-slate-200/80 rounded-lg text-slate-600 hover:text-slate-900 transition-colors"
          >
            <Settings className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Right: Hardware & Profile Quick Actions */}
        <div className="flex items-center gap-2.5">
          {/* Kyocera Status Pill */}
          <button 
            onClick={() => setActiveTab('KYOCERA')}
            title={`Kyocera ECOSYS M2535dn IP: ${kyocera.ipAddress}`}
            className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-green-700 rounded-full border border-green-200 text-xs font-semibold hover:bg-green-100/70 transition-all shadow-xs"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="font-sans text-xs hidden lg:inline">ADF Kyocera M2535dn: Terhubung</span>
            <span className="font-sans text-xs lg:hidden">ADF Terhubung</span>
          </button>

          {/* Cloud Sync Button */}
          <button
            onClick={onOpenCloudModal}
            title="Sinkronisasi Cloud & Backup Data"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-100 hover:text-slate-900 transition-colors shadow-xs"
          >
            <Cloud className="w-3.5 h-3.5 text-sky-600" />
            <span className="hidden sm:inline">Cloud</span>
          </button>

          {/* Teacher Profile Button */}
          <button
            onClick={onOpenTeacherModal}
            title="Pengaturan Guru Pengampu"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 hover:bg-blue-100 text-xs font-bold transition-all shadow-xs"
          >
            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Guru Pengampu</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="bg-slate-50/90 border-t border-slate-200 px-4 sm:px-6">
        <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 overflow-x-auto py-2 scrollbar-none">
          <button
            onClick={() => setActiveTab('CAMERA')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'CAMERA'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:border hover:border-slate-200'
            }`}
          >
            <ScanLine className="w-4 h-4" />
            Pindai Kamera Live
          </button>

          <button
            onClick={() => setActiveTab('KYOCERA')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'KYOCERA'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:border hover:border-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            ADF Kyocera M2535dn
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'KYOCERA' 
                ? 'bg-white/20 text-white' 
                : 'bg-emerald-100 text-emerald-800'
            }`}>
              Auto 50 Lembar
            </span>
          </button>

          <button
            onClick={() => setActiveTab('RESULTS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'RESULTS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:border hover:border-slate-200'
            }`}
          >
            <Table className="w-4 h-4" />
            Hasil Koreksi
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              activeTab === 'RESULTS'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            }`}>
              {totalResultsCount}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('ANALYTICS')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'ANALYTICS'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:border hover:border-slate-200'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            Analitik Kelas
          </button>

          <button
            onClick={() => setActiveTab('HISTORY')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
              activeTab === 'HISTORY'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white hover:border hover:border-slate-200'
            }`}
          >
            <History className="w-4 h-4" />
            Histori Nilai Siswa
          </button>

          <button
            onClick={() => setActiveTab('LJK_TEMPLATE')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ml-auto ${
              activeTab === 'LJK_TEMPLATE'
                ? 'bg-amber-500 text-white shadow-md shadow-amber-200'
                : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <FileText className="w-4 h-4 text-amber-700" />
            Cetak LJK A4 Bagi 2
          </button>
        </div>
      </div>
    </header>
  );
};
