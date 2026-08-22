'use client';

import React, { useState } from 'react';
import { Users, Plus, Trash2, CheckCircle2, Save, X, UploadCloud, RefreshCw } from 'lucide-react';
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
  const [newNo, setNewNo] = useState<string>('');
  const [newName, setNewName] = useState<string>('');
  const [newClass, setNewClass] = useState<string>('XII MIPA 1');

  if (!isOpen) return null;

  const handleAddStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNo || !newName) return;

    const newStd: Student = {
      id: `std-${Date.now()}`,
      studentNo: newNo.padStart(9, '0'),
      name: newName,
      classId: newClass
    };

    setList([...list, newStd]);
    setNewNo('');
    setNewName('');
  };

  const handleDelete = (id: string) => {
    setList(list.filter(s => s.id !== id));
  };

  const handleSaveAll = () => {
    onUpdateStudents(list);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-2xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Daftar Peserta Didik ({list.length} Siswa)
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Data NISN dan nama siswa digunakan untuk pencocokan otomatis saat memindai LJK.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 hover:bg-slate-100 p-1.5 rounded-lg transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Add Student Form */}
        <form onSubmit={handleAddStudent} className="grid grid-cols-1 sm:grid-cols-12 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs shadow-xs">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="NISN (e.g. 008712345)"
              value={newNo}
              onChange={(e) => setNewNo(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 font-mono focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Nama Lengkap Siswa"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
            />
          </div>
          <div className="sm:col-span-3">
            <button
              type="submit"
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1 shadow-md shadow-blue-200 transition-all"
            >
              <Plus className="w-4 h-4" /> Tambah
            </button>
          </div>
        </form>

        {/* Students Table */}
        <div className="max-h-72 overflow-y-auto border border-slate-200 rounded-xl overflow-hidden shadow-xs">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 sticky top-0 font-bold">
              <tr>
                <th className="p-3 text-center w-10">No</th>
                <th className="p-3 w-28">NISN</th>
                <th className="p-3">Nama Siswa</th>
                <th className="p-3 w-24">Kelas</th>
                <th className="p-3 text-center w-12">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {list.map((std, idx) => (
                <tr key={std.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 text-center text-slate-400 font-medium">{idx + 1}</td>
                  <td className="p-3 font-mono font-medium text-slate-700">{std.studentNo}</td>
                  <td className="p-3 font-bold text-slate-900">{std.name}</td>
                  <td className="p-3 text-slate-600 font-medium">{std.classId}</td>
                  <td className="p-3 text-center">
                    <button
                      type="button"
                      onClick={() => handleDelete(std.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Modal Actions */}
        <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-3">
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
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
          >
            <Save className="w-4 h-4" />
            Simpan Daftar Siswa
          </button>
        </div>
      </div>
    </div>
  );
};
