'use client';

import React, { useState } from 'react';
import { UserCheck, School, BookOpen, Award, CheckCircle2, Save, X } from 'lucide-react';
import { TeacherProfile } from '@/types/omr';

interface TeacherProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  teacher: TeacherProfile;
  onSaveTeacher: (updated: TeacherProfile) => void;
}

export const TeacherProfileModal: React.FC<TeacherProfileModalProps> = ({
  isOpen,
  onClose,
  teacher,
  onSaveTeacher
}) => {
  const [form, setForm] = useState<TeacherProfile>({ ...teacher });
  const [isSaved, setIsSaved] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveTeacher(form);
    setIsSaved(true);
    setTimeout(() => {
      setIsSaved(false);
      onClose();
    }, 1000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 text-blue-600 flex items-center justify-center shadow-xs">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-900">
                Pengaturan Guru Pengampu & Lembaga
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Profil ini dicantumkan pada kop LJK, laporan nilai Excel, dan berkas PDF resmi.
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1.5">
                Nama Lengkap & Gelar Guru Pengampu *
              </label>
              <input
                type="text"
                required
                value={form.namaGuru}
                onChange={(e) => setForm({ ...form, namaGuru: e.target.value, tandaTanganNama: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium shadow-xs"
                placeholder="Contoh: Drs. H. Ahmad Sudrajat, M.Pd."
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                NIP / NUPTK / NIK *
              </label>
              <input
                type="text"
                required
                value={form.nip}
                onChange={(e) => setForm({ ...form, nip: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono focus:outline-none focus:border-blue-500 focus:bg-white shadow-xs"
                placeholder="19780512 200501 1 004"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Nama Sekolah / Madrasah *
              </label>
              <input
                type="text"
                required
                value={form.namaSekolah}
                onChange={(e) => setForm({ ...form, namaSekolah: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white font-medium shadow-xs"
                placeholder="SMA Negeri 1 Prestasi Bangsa"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Mata Pelajaran yang Diampu *
              </label>
              <input
                type="text"
                required
                value={form.mataPelajaran}
                onChange={(e) => setForm({ ...form, mataPelajaran: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-xs"
                placeholder="Matematika Peminatan"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Tingkat / Kelas *
              </label>
              <input
                type="text"
                required
                value={form.tingkatKelas}
                onChange={(e) => setForm({ ...form, tingkatKelas: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-xs"
                placeholder="Kelas IX E"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Semester *
              </label>
              <select
                value={form.semester}
                onChange={(e) => setForm({ ...form, semester: e.target.value as any })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white cursor-pointer shadow-xs"
              >
                <option value="Ganjil">Semester Ganjil</option>
                <option value="Genap">Semester Genap</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Tahun Ajaran *
              </label>
              <input
                type="text"
                required
                value={form.tahunAjaran}
                onChange={(e) => setForm({ ...form, tahunAjaran: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-xs"
                placeholder="2025/2026"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Standar Kelulusan KKM Default
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={form.kkmDefault}
                onChange={(e) => setForm({ ...form, kkmDefault: parseInt(e.target.value) || 75 })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-bold focus:outline-none focus:border-blue-500 focus:bg-white shadow-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1.5">
                Email / Kontak Guru (Opsional)
              </label>
              <input
                type="email"
                value={form.kontakEmail || ''}
                onChange={(e) => setForm({ ...form, kontakEmail: e.target.value })}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white shadow-xs"
                placeholder="guru@sekolah.sch.id"
              />
            </div>
          </div>

          <div className="pt-3.5 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold border border-slate-200 transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md shadow-blue-200 transition-all"
            >
              {isSaved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  Tersimpan!
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Simpan Profil Guru
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
