'use client';

import React, { useState, useMemo } from 'react';
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
  Copy,
  Layers,
  GraduationCap
} from 'lucide-react';
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
  
  // Add Form State
  const [newNo, setNewNo] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newClass, setNewClass] = useState<string>('IX E');
  const [isCustomClass, setIsCustomClass] = useState<boolean>(false);
  const [customClassInput, setCustomClassInput] = useState<string>('');

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

    const classToAssign = isCustomClass ? (customClassInput.trim() || 'IX E') : newClass;
    const cleanNo = newNo.replace(/\D/g, ''); // keep numbers only
    const formattedNo = cleanNo.length > 0 ? cleanNo.padStart(9, '0').slice(-9) : newNo.trim();

    const newStd: Student = {
      id: `std-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      studentNo: formattedNo,
      name: newName.trim(),
      classId: classToAssign
    };

    setList(prev => [newStd, ...prev]);
    setNewNo('');
    setNewName('');
    if (isCustomClass && customClassInput.trim()) {
      setNewClass(customClassInput.trim());
      setIsCustomClass(false);
      setCustomClassInput('');
    }
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
    const formattedNo = cleanNo.length > 0 ? cleanNo.padStart(9, '0').slice(-9) : editNo.trim();

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
        const studentNo = cleanNo.length > 0 ? cleanNo.padStart(9, '0').slice(-9) : `00${Math.floor(1000000 + Math.random() * 9000000)}`;
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

  const handleSaveAll = () => {
    onUpdateStudents(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
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
                Kelola nama siswa, NISN (Nomor Peserta 9 Digit), dan pembagian kelas untuk pencocokan otomatis OMR LJK.
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

        {/* Tab Selector & Quick Actions */}
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
              Impor / Tempel Excel (CSV)
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 transition-colors shadow-xs"
              title="Download Data Siswa ke CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              Ekspor CSV
            </button>
          </div>
        </div>

        {/* TAB 1: LIST & ADD FORM */}
        {activeTab === 'LIST' && (
          <div className="space-y-4">
            {/* Add Student Form */}
            <div className="bg-purple-50/50 border border-purple-100 p-4 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-purple-600" /> Tambah Siswa Baru
                </span>
                <span className="text-[11px] text-purple-700 font-medium">
                  NISN 9 Digit otomatis dicocokkan dengan lembar LJK
                </span>
              </div>

              <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 text-xs">
                {/* NISN Input */}
                <div className="sm:col-span-3">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    NISN (9 Digit)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    placeholder="Contoh: 008123456"
                    value={newNo}
                    onChange={(e) => setNewNo(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-slate-800 font-mono font-bold focus:outline-none focus:border-purple-500 shadow-xs"
                    required
                  />
                </div>

                {/* Name Input */}
                <div className="sm:col-span-5">
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

                {/* Class Input / Select */}
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Kelas
                  </label>
                  {!isCustomClass ? (
                    <select
                      value={newClass}
                      onChange={(e) => {
                        if (e.target.value === '__NEW__') {
                          setIsCustomClass(true);
                        } else {
                          setNewClass(e.target.value);
                        }
                      }}
                      className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 font-semibold focus:outline-none focus:border-purple-500 shadow-xs"
                    >
                      {uniqueClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                      <option value="__NEW__">+ Buat Kelas Baru...</option>
                    </select>
                  ) : (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        placeholder="Nama Kelas"
                        value={customClassInput}
                        onChange={(e) => setCustomClassInput(e.target.value)}
                        className="w-full bg-white border border-purple-400 rounded-xl px-2 py-2 text-slate-800 font-semibold focus:outline-none text-xs"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsCustomClass(false)}
                        className="p-1 text-slate-400 hover:text-slate-700"
                        title="Batal custom kelas"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
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
                        <p className="text-[11px] text-slate-400 mt-0.5">Silakan tambah siswa secara manual atau gunakan fitur Impor Excel.</p>
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

        {/* TAB 2: BULK IMPORT / PASTE FROM EXCEL */}
        {activeTab === 'BULK_IMPORT' && (
          <div className="space-y-4">
            <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl space-y-3">
              <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                Salin & Tempel Data dari Microsoft Excel atau Google Sheets
              </div>
              <p className="text-xs text-emerald-800 font-medium leading-relaxed">
                Anda dapat langsung memblok kolom <strong>NISN, Nama Siswa, dan Kelas</strong> di file Excel lalu tempel (Paste / Ctrl+V) ke dalam kotak teks di bawah ini.
              </p>
            </div>

            {bulkSuccessMsg && (
              <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>{bulkSuccessMsg}</span>
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-700">
                  Kotak Tempel Teks (Format per baris: NISN [Tab/Koma] Nama [Tab/Koma] Kelas)
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-slate-500 font-medium">Kelas Default jika kosong:</span>
                  <input
                    type="text"
                    value={bulkDefaultClass}
                    onChange={(e) => setBulkDefaultClass(e.target.value)}
                    className="bg-white border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 w-28"
                  />
                </div>
              </div>

              <textarea
                rows={8}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                placeholder={`Contoh format:\n0081234501\tAhmad Fajar\tIX E\n0081234502\tBudi Santoso\tIX F\n0081234503\tCitra Lestari\tIX G\n0081234504\tDewi Anggraini\tIX H`}
                className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3.5 text-xs font-mono text-slate-800 focus:outline-none focus:border-emerald-500 shadow-inner"
              />
            </div>

            <div className="flex items-center justify-between pt-2">
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
                Isi Contoh Data Demo
              </button>

              <button
                type="button"
                onClick={handleBulkImport}
                disabled={!bulkText.trim()}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-emerald-200 transition-all"
              >
                <Upload className="w-4 h-4" />
                Proses & Tambahkan Siswa ke Daftar
              </button>
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

