'use client';

import React, { useState, useMemo, useRef } from 'react';
import { 
  Users, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  Save, 
  X, 
  Search, 
  Edit3, 
  Download, 
  Upload, 
  FileSpreadsheet, 
  Filter, 
  AlertCircle,
  FileUp,
  FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { Student } from '@/types/omr';

interface StudentListModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onUpdateStudents: (students: Student[]) => void;
}

export const StudentListModal: React.FC<StudentListModalProps> = ({
  isOpen,
  onClose,
  students,
  onUpdateStudents
}) => {
  const [list, setList] = useState<Student[]>([...students]);
  const [activeTab, setActiveTab] = useState<'LIST' | 'BULK_IMPORT'>('LIST');
  const [selectedClassFilter, setSelectedClassFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Hidden file input ref
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Add Form State
  const [newNo, setNewNo] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newClass, setNewClass] = useState<string>('IX E');

  // Inline Edit State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editNo, setEditNo] = useState<string>('');
  const [editName, setEditName] = useState<string>('');
  const [editClass, setEditClass] = useState<string>('');

  // Bulk Import State
  const [bulkText, setBulkText] = useState<string>('');
  const [bulkDefaultClass, setBulkDefaultClass] = useState<string>('IX E');
  const [bulkSuccessMsg, setBulkSuccessMsg] = useState<string | null>(null);

  // Unique existing classes
  const uniqueClasses = useMemo(() => {
    const classes = Array.from(new Set(list.map(s => s.classId).filter(Boolean)));
    return classes.length > 0 ? classes : ['IX E', 'IX F', 'IX G', 'IX H', 'IX I'];
  }, [list]);

  // Duplicate NISN check
  const duplicateNisns = useMemo(() => {
    const counts = new Map<string, number>();
    list.forEach(s => {
      counts.set(s.studentNo, (counts.get(s.studentNo) || 0) + 1);
    });
    const dupes = new Set<string>();
    counts.forEach((count, no) => {
      if (count > 1) dupes.add(no);
    });
    return dupes;
  }, [list]);

  // Filtered list based on class and search
  const filteredList = useMemo(() => {
    return list.filter(std => {
      const matchClass = selectedClassFilter === 'ALL' || std.classId === selectedClassFilter;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || std.name.toLowerCase().includes(q) || std.studentNo.toLowerCase().includes(q) || std.classId.toLowerCase().includes(q);
      return matchClass && matchSearch;
    });
  }, [list, selectedClassFilter, searchQuery]);

  if (!isOpen) return null;

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNo.trim() || !newName.trim()) return;

    const classToAssign = newClass.trim() || 'IX E';
    const cleanNo = newNo.replace(/\D/g, ''); // keep numbers only
    const formattedNo = cleanNo.length > 0 ? cleanNo.padStart(10, '0').slice(-10) : newNo.trim();

    const newStd: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentNo: formattedNo,
      name: newName.trim(),
      classId: classToAssign
    };

    setList(prev => [newStd, ...prev]);
    setNewNo('');
    setNewName('');
  };

  const startEdit = (std: Student) => {
    setEditingId(std.id);
    setEditNo(std.studentNo);
    setEditName(std.name);
    setEditClass(std.classId);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const cleanNo = editNo.replace(/\D/g, '');
    const formattedNo = cleanNo.length > 0 ? cleanNo.padStart(10, '0').slice(-10) : editNo.trim();

    setList(prev => prev.map(std => {
      if (std.id === editingId) {
        return {
          ...std,
          studentNo: formattedNo,
          name: editName.trim() || std.name,
          classId: editClass.trim() || std.classId
        };
      }
      return std;
    }));
    setEditingId(null);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    setList(prev => prev.filter(s => s.id !== id));
  };

  // Process File Object (Excel / CSV / TXT)
  const processStudentFile = async (file: File) => {
    setUploadError(null);
    setBulkSuccessMsg(null);

    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: 'array' });
      const firstSheetName = workbook.SheetNames[0];
      if (!firstSheetName) {
        throw new Error('File tidak memiliki sheet data yang valid.');
      }

      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows: Array<Array<string | number | undefined>> = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

      if (!rawRows || rawRows.length === 0) {
        throw new Error('Sheet data kosong.');
      }

      // Find header row or default to row 0
      let headerIdx = -1;
      let colNisn = -1;
      let colName = -1;
      let colClass = -1;

      for (let r = 0; r < Math.min(rawRows.length, 10); r++) {
        const row = rawRows[r].map(c => String(c || '').toLowerCase().trim());
        const nisnIdx = row.findIndex(c => c.includes('nisn') || c.includes('nomor') || c.includes('no.') || c.includes('peserta') || c.includes('id') || c.includes('nis'));
        const nameIdx = row.findIndex(c => c.includes('nama') || c.includes('siswa') || c.includes('student') || c.includes('name'));
        const classIdx = row.findIndex(c => c.includes('kelas') || c.includes('rombel') || c.includes('tingkat') || c.includes('class'));

        if (nisnIdx !== -1 && nameIdx !== -1) {
          headerIdx = r;
          colNisn = nisnIdx;
          colName = nameIdx;
          colClass = classIdx;
          break;
        }
      }

      // If no explicit header row found, assume Col 0 = NISN, Col 1 = Name, Col 2 = Class
      const startRow = headerIdx !== -1 ? headerIdx + 1 : 0;
      if (colNisn === -1) colNisn = 0;
      if (colName === -1) colName = 1;
      if (colClass === -1) colClass = 2;

      const parsedStudents: Student[] = [];

      for (let r = startRow; r < rawRows.length; r++) {
        const row = rawRows[r];
        if (!row || row.length === 0) continue;

        const rawNisn = String(row[colNisn] ?? '').trim();
        const rawName = String(row[colName] ?? '').trim();
        const rawClass = colClass !== -1 && row[colClass] !== undefined ? String(row[colClass]).trim() : '';

        if (!rawName && !rawNisn) continue;

        const cleanNo = rawNisn.replace(/\D/g, '');
        const studentNo = cleanNo.length > 0 ? cleanNo.padStart(10, '0').slice(-10) : `00${Math.floor(10000000 + Math.random() * 90000000)}`;
        const name = rawName || `Siswa ${studentNo}`;
        const classId = rawClass || bulkDefaultClass || 'IX E';

        parsedStudents.push({
          id: `std-${Date.now()}-${r}-${Math.random().toString(36).substr(2, 5)}`,
          studentNo,
          name,
          classId
        });
      }

      if (parsedStudents.length === 0) {
        throw new Error('Tidak ada baris data siswa yang berhasil diekstrak.');
      }

      setList(prev => {
        // Merge or prepend
        const existingNoSet = new Set(prev.map(p => p.studentNo));
        const newUnique = parsedStudents.filter(p => !existingNoSet.has(p.studentNo));
        const updated = parsedStudents.filter(p => existingNoSet.has(p.studentNo));
        
        // Update existing & append new
        const merged = prev.map(p => {
          const match = updated.find(u => u.studentNo === p.studentNo);
          return match ? { ...p, name: match.name, classId: match.classId } : p;
        });

        return [...newUnique, ...merged];
      });

      setBulkSuccessMsg(`Berhasil mengimpor ${parsedStudents.length} data siswa dari file "${file.name}"!`);
      setActiveTab('LIST');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setUploadError(`Gagal membaca file: ${msg}`);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processStudentFile(file);
    }
    // reset input
    e.target.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processStudentFile(file);
    }
  };

  const handleBulkImport = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split(/\r?\n/).filter(line => line.trim().length > 0);
    const parsed: Student[] = [];

    lines.forEach(line => {
      // Split by tab or semicolon or comma (if no tab/semicolon)
      let parts: string[] = [];
      if (line.includes('\t')) {
        parts = line.split('\t');
      } else if (line.includes(';')) {
        parts = line.split(';');
      } else if (line.includes(',')) {
        parts = line.split(',');
      } else {
        // Space separated
        const segs = line.trim().split(/\s+/);
        if (segs.length >= 2) {
          parts = [segs[0], segs.slice(1).join(' ')];
        }
      }

      if (parts.length >= 1) {
        const rawNo = parts[0]?.trim() || '';
        const cleanNo = rawNo.replace(/\D/g, '');
        const studentNo = cleanNo.length > 0 ? cleanNo.padStart(10, '0').slice(-10) : `00${Math.floor(10000000 + Math.random() * 90000000)}`;
        const name = parts[1]?.trim() || `Siswa ${studentNo}`;
        const classId = parts[2]?.trim() || bulkDefaultClass;

        parsed.push({
          id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
          studentNo,
          name,
          classId
        });
      }
    });

    if (parsed.length > 0) {
      setList(prev => [...parsed, ...prev]);
      setBulkSuccessMsg(`Berhasil menambahkan ${parsed.length} data siswa baru!`);
      setBulkText('');
      setTimeout(() => {
        setBulkSuccessMsg(null);
        setActiveTab('LIST');
      }, 1500);
    }
  };

  const handleExportCSV = () => {
    const headers = 'NISN,Nama Siswa,Kelas\n';
    const rows = list.map(s => `"${s.studentNo}","${s.name}","${s.classId}"`).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daftar_siswa_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadTemplate = () => {
    const templateRows = [
      { 'NISN': '0081234501', 'Nama Siswa': 'Ahmad Fajar Prasetya', 'Kelas': 'IX E' },
      { 'NISN': '0081234502', 'Nama Siswa': 'Aisyah Putri Rahmadani', 'Kelas': 'IX E' },
      { 'NISN': '0081234503', 'Nama Siswa': 'Bagas Dwi Wicaksono', 'Kelas': 'IX E' },
      { 'NISN': '0081234504', 'Nama Siswa': 'Cantika Dewi Lestari', 'Kelas': 'IX F' },
      { 'NISN': '0081234505', 'Nama Siswa': 'Dimas Arya Nugraha', 'Kelas': 'IX F' }
    ];
    const ws = XLSX.utils.json_to_sheet(templateRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Template Siswa');
    XLSX.writeFile(wb, 'Template_Data_Siswa_LJK.xlsx');
  };

  const handleSaveAll = () => {
    onUpdateStudents(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      {/* Hidden file input for Excel / CSV upload */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileInputChange}
        accept=".xlsx, .xls, .csv, .txt, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
        className="hidden"
      />

      <div className="bg-white border border-slate-200 rounded-2xl max-w-4xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center shadow-xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-lg text-slate-900">
                  Pengaturan Kelas, Siswa & NISN
                </h3>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                  {list.length} Siswa Terdaftar
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Kelola nama siswa, NISN (Nomor Peserta 10 Digit), dan pembagian kelas untuk pencocokan otomatis OMR LJK.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selector & Quick Actions Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setActiveTab('LIST')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'LIST'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-4 h-4 text-purple-600" />
              Daftar & Edit Siswa
            </button>
            <button
              onClick={() => setActiveTab('BULK_IMPORT')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'BULK_IMPORT'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Impor / Upload Excel (CSV)
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* Primary Upload Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:shadow-sm"
              title="Upload file Excel (.xlsx / .xls) atau CSV"
            >
              <Upload className="w-3.5 h-3.5" />
              Upload Excel / CSV
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-xs"
              title="Download Data Siswa ke CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* Global Success / Error Message Banner */}
        {bulkSuccessMsg && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{bulkSuccessMsg}</span>
            </div>
            <button onClick={() => setBulkSuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {uploadError && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-900 rounded-xl flex items-center justify-between gap-2 text-xs font-semibold animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{uploadError}</span>
            </div>
            <button onClick={() => setUploadError(null)} className="text-rose-700 hover:text-rose-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* TAB 1: LIST & ADD FORM */}
        {activeTab === 'LIST' && (
          <div className="space-y-4">
            {/* Add Student Form */}
            <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-600" /> Tambah Siswa Baru
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-purple-700 hover:text-purple-900 font-bold flex items-center gap-1 underline cursor-pointer"
                  >
                    <Upload className="w-3 h-3" />
                    Atau Upload Berkas Excel
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                {/* NISN Input */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NISN (10 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Contoh: 0081234501"
                    value={newNo}
                    onChange={(e) => setNewNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-500 shadow-xs"
                    required
                  />
                </div>

                {/* Name Input */}
                <div className="sm:col-span-4">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Nama Lengkap Siswa
                  </label>
                  <input
                    type="text"
                    placeholder="Nama Lengkap Siswa"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-purple-500 shadow-xs"
                    required
                  />
                </div>

                {/* Class Input (Form Isian Langsung) */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kelas / Rombel
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: IX E / 9A"
                    value={newClass}
                    onChange={(e) => setNewClass(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-semibold focus:outline-none focus:border-purple-500 shadow-xs"
                    required
                  />
                </div>

                {/* Submit Button */}
                <div className="sm:col-span-2 flex items-end">
                  <button
                    type="submit"
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 shadow-md shadow-purple-200 transition-all text-xs"
                  >
                    <Plus className="w-4 h-4" /> Simpan
                  </button>
                </div>
              </form>
            </div>

            {/* Filter & Search Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              {/* Class Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto max-w-full">
                <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
                  <Filter className="w-3.5 h-3.5 text-purple-600" /> Kelas:
                </span>
                <button
                  onClick={() => setSelectedClassFilter('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedClassFilter === 'ALL'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Semua ({list.length})
                </button>
                {uniqueClasses.map(cls => {
                  const count = list.filter(s => s.classId === cls).length;
                  return (
                    <button
                      key={cls}
                      onClick={() => setSelectedClassFilter(cls)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                        selectedClassFilter === cls
                          ? 'bg-purple-600 text-white shadow-xs'
                          : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {cls} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Search Box */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Nama / NISN / Kelas..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-800 focus:outline-none focus:border-purple-500 shadow-xs"
                />
              </div>
            </div>

            {/* Duplicate NISN Alert */}
            {duplicateNisns.size > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2.5 text-xs text-amber-900 font-medium">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Perhatian: Ditemukan {duplicateNisns.size} NISN ganda ({Array.from(duplicateNisns).join(', ')}). Pastikan setiap siswa memiliki NISN yang unik.
                </span>
              </div>
            )}

            {/* Students Table */}
            <div className="max-h-80 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden shadow-xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-700 border-b border-slate-200 sticky top-0 font-bold">
                  <tr>
                    <th className="p-3 text-center w-12">No</th>
                    <th className="p-3 w-36">NISN / No. Peserta</th>
                    <th className="p-3">Nama Lengkap Siswa</th>
                    <th className="p-3 w-32">Kelas</th>
                    <th className="p-3 text-center w-24">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-40 text-slate-400" />
                        <p className="font-semibold text-slate-600">Tidak ada siswa ditemukan.</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Silakan tambah siswa secara manual atau klik tombol <strong>Upload Excel / CSV</strong> di atas.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredList.map((std, idx) => {
                      const isEditing = editingId === std.id;
                      const isDupe = duplicateNisns.has(std.studentNo);

                      if (isEditing) {
                        return (
                          <tr key={std.id} className="bg-purple-50/60">
                            <td className="p-2.5 text-center text-slate-400 font-medium">{idx + 1}</td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editNo}
                                onChange={(e) => setEditNo(e.target.value)}
                                className="w-full bg-white border border-purple-400 rounded-lg px-2 py-1 font-mono font-bold text-slate-900 text-xs shadow-xs"
                                placeholder="NISN"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="w-full bg-white border border-purple-400 rounded-lg px-2 py-1 font-bold text-slate-900 text-xs shadow-xs"
                                placeholder="Nama Siswa"
                              />
                            </td>
                            <td className="p-2.5">
                              <input
                                type="text"
                                value={editClass}
                                onChange={(e) => setEditClass(e.target.value)}
                                className="w-full bg-white border border-purple-400 rounded-lg px-2 py-1 font-semibold text-slate-900 text-xs shadow-xs"
                                placeholder="Kelas"
                              />
                            </td>
                            <td className="p-2.5 text-center">
                              <div className="flex items-center justify-center gap-1">
                                <button
                                  type="button"
                                  onClick={saveEdit}
                                  className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                                  title="Simpan Koreksi"
                                >
                                  <Save className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEdit}
                                  className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors"
                                  title="Batal"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      }

                      return (
                        <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-1.5 font-mono font-bold text-slate-800">
                              <span>{std.studentNo}</span>
                              {isDupe && (
                                <span className="px-1.5 py-0.5 rounded text-[10px] bg-rose-100 text-rose-700 font-sans font-bold" title="NISN Duplikat">
                                  Ganda
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 font-bold text-slate-900">{std.name}</td>
                          <td className="p-3">
                            <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              {std.classId}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                type="button"
                                onClick={() => startEdit(std)}
                                className="p-1.5 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Edit Siswa / NISN / Kelas"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(std.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus Siswa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 2: BULK IMPORT / UPLOAD EXCEL */}
        {activeTab === 'BULK_IMPORT' && (
          <div className="space-y-4">
            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all cursor-pointer ${
                isDragging 
                  ? 'border-emerald-500 bg-emerald-50 scale-[1.01]' 
                  : 'border-emerald-300 hover:border-emerald-500 bg-emerald-50/50 hover:bg-emerald-50/80'
              }`}
            >
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2.5 shadow-2xs">
                <FileUp className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-emerald-950">
                Pilih atau Tarik File Excel (.xlsx, .xls) / CSV ke Sini
              </h4>
              <p className="text-xs text-emerald-700 font-medium mt-1 max-w-md mx-auto">
                Sistem otomatis mendeteksi kolom NISN, Nama Lengkap Siswa, dan Kelas secara presisi.
              </p>
              <div className="mt-3 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Pilih File dari Komputer
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownloadTemplate();
                  }}
                  className="px-3.5 py-2 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                  title="Unduh Template Format Excel"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  Unduh Template Excel
                </button>
              </div>
            </div>

            {/* Manual Copy-Paste Alternative Box */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                  <FileCheck className="w-4 h-4 text-purple-600" />
                  Atau Salin & Tempel (Copy-Paste) Teks dari Spreadsheet
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Kelas Default:</span>
                  <input
                    type="text"
                    value={bulkDefaultClass}
                    onChange={(e) => setBulkDefaultClass(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 w-24"
                  />
                </div>
              </div>

              <textarea
                rows={5}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Format per baris: NISN [Tab/Koma] Nama Lengkap [Tab/Koma] Kelas\nContoh:\n0081234501\tAhmad Fajar\tIX E\n0081234502\tBudi Santoso\tIX F`}
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-800 focus:outline-none focus:border-purple-500 shadow-inner"
              />

              <div className="flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setBulkText(
                      `0081234511\tAditia Pratama\tIX E\n` +
                      `0081234512\tAnisa Rahmawati\tIX F\n` +
                      `0081234513\tBagus Tri Nugroho\tIX G\n` +
                      `0081234514\tCantika Putri\tIX H\n` +
                      `0081234515\tDimas Wahyu\tIX I`
                    );
                  }}
                  className="text-xs text-purple-700 hover:text-purple-900 font-bold underline cursor-pointer"
                >
                  Isi Contoh Teks
                </button>

                <button
                  type="button"
                  onClick={handleBulkImport}
                  disabled={!bulkText.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Tambahkan Teks ke Daftar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer Actions */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-3 mt-auto">
          <div className="text-xs text-slate-500 font-medium">
            Total tersimpan: <strong className="text-slate-800">{list.length} Siswa</strong>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSaveAll}
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-purple-200 transition-all"
            >
              <Save className="w-4 h-4" />
              Simpan & Terapkan Perubahan
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


