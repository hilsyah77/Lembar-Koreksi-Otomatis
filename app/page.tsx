'use client';

import React, { useState, useEffect } from 'react';
import { 
  Navbar, 
  TabType 
} from '@/components/Navbar';
import { CameraScanner } from '@/components/CameraScanner';
import { KyoceraScannerHub } from '@/components/KyoceraScannerHub';
import { LjkTemplateGenerator } from '@/components/LjkTemplateGenerator';
import { ClassAnalyticsView } from '@/components/ClassAnalyticsView';
import { StudentHistoryView } from '@/components/StudentHistoryView';
import { ScanResultsTable } from '@/components/ScanResultsTable';
import { TeacherProfileModal } from '@/components/TeacherProfileModal';
import { ExamConfigModal } from '@/components/ExamConfigModal';
import { StudentListModal } from '@/components/StudentListModal';
import { DatabaseManagerModal } from '@/components/DatabaseManagerModal';
import { CloudSyncModal } from '@/components/CloudSyncModal';

import { 
  ExamConfig, 
  Student, 
  ScanResult, 
  TeacherProfile, 
  KyoceraSettings 
} from '@/types/omr';
import { 
  INITIAL_EXAM, 
  INITIAL_EXAMS,
  INITIAL_STUDENTS, 
  INITIAL_TEACHER_PROFILE,
  INITIAL_KYOCERA_SETTINGS,
  generateSampleScanResults 
} from '@/lib/mock-data';
import { 
  AppState,
  getStoredExams, 
  saveExams, 
  getStoredStudents, 
  saveStudents, 
  getStoredTeacherProfile, 
  saveTeacherProfile, 
  getStoredKyoceraSettings, 
  saveKyoceraSettings, 
  getStoredResults, 
  saveResults 
} from '@/lib/storage';
import { 
  saveScanResultToFirestore, 
  saveBatchScanResultsToFirestore,
  saveExamToFirestore,
  deleteExamFromFirestore,
  fetchStateFromFirestore 
} from '@/lib/firestore-service';
import { CheckCircle2, X } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('CAMERA');
  
  // App States initialized with deterministic server-safe defaults to prevent hydration mismatch
  const [exams, setExams] = useState<ExamConfig[]>(INITIAL_EXAMS);
  const [activeExamId, setActiveExamId] = useState<string>(INITIAL_EXAM.id);
  const [students, setStudents] = useState<Student[]>(INITIAL_STUDENTS);
  const [teacher, setTeacher] = useState<TeacherProfile>(INITIAL_TEACHER_PROFILE);
  const [kyocera, setKyocera] = useState<KyoceraSettings>(INITIAL_KYOCERA_SETTINGS);
  const [results, setResults] = useState<ScanResult[]>([]);

  // Modal States
  const [isTeacherModalOpen, setIsTeacherModalOpen] = useState<boolean>(false);
  const [isExamModalOpen, setIsExamModalOpen] = useState<boolean>(false);
  const [isStudentModalOpen, setIsStudentModalOpen] = useState<boolean>(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState<boolean>(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState<boolean>(false);

  // Global Toast Notification State
  const [globalToast, setGlobalToast] = useState<{
    show: boolean;
    title: string;
    message: string;
    type?: 'success' | 'info' | 'error';
  } | null>(null);

  const triggerToast = (title: string, message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setGlobalToast({ show: true, title, message, type });
    setTimeout(() => {
      setGlobalToast(null);
    }, 4500);
  };

  // Client-side hydration from localStorage & Firestore
  useEffect(() => {
    let isCancelled = false;

    async function loadHydratedData() {
      await Promise.resolve();
      if (isCancelled) return;

      try {
        const storedExams = getStoredExams();
        const hasLegacyDemoExams = storedExams.some(e => e.id === 'exam-pts-mat-2025' || e.id === 'exam-uh1-mat-2025');
        if (hasLegacyDemoExams) {
          setExams(INITIAL_EXAMS);
          saveExams(INITIAL_EXAMS);
          setActiveExamId(INITIAL_EXAM.id);
        } else if (storedExams && storedExams.length > 0) {
          const cleanedStoredExams = storedExams.map(e => ({
            ...e,
            gradeClass: (e.gradeClass?.includes('IX E') || e.gradeClass?.includes('Kelas IX')) ? '' : e.gradeClass,
            subject: e.subject === 'Mata Pelajaran' ? '' : e.subject
          }));
          setExams(cleanedStoredExams);
          saveExams(cleanedStoredExams);
          setActiveExamId(prev => cleanedStoredExams.some(e => e.id === prev) ? prev : cleanedStoredExams[0].id);
        }

        const storedStudents = getStoredStudents();
        const cleanedStudents = (storedStudents || []).filter(s => 
          !s.classId?.includes('IX E') && 
          !s.classId?.includes('IX F') && 
          !s.classId?.includes('IX G') && 
          !s.classId?.includes('IX H') && 
          !s.classId?.includes('IX I') && 
          !s.studentNo?.startsWith('00812345') &&
          !(s.id?.startsWith('std-') && s.studentNo === '120101001')
        );
        if (cleanedStudents.length !== (storedStudents || []).length) {
          setStudents(cleanedStudents);
          saveStudents(cleanedStudents);
        } else if (storedStudents) {
          setStudents(storedStudents);
        }

        const storedTeacher = getStoredTeacherProfile();
        if (storedTeacher && (storedTeacher.namaGuru === 'Drs. H. Ahmad Sudrajat, M.Pd.' || storedTeacher.namaSekolah === 'SMP / SMA / MTs / MA')) {
          setTeacher(INITIAL_TEACHER_PROFILE);
          saveTeacherProfile(INITIAL_TEACHER_PROFILE);
        } else if (storedTeacher) {
          const cleanedTeacher = {
            ...storedTeacher,
            tingkatKelas: (storedTeacher.tingkatKelas?.includes('IX E') || storedTeacher.tingkatKelas?.includes('Kelas IX')) ? '' : storedTeacher.tingkatKelas
          };
          setTeacher(cleanedTeacher);
          saveTeacherProfile(cleanedTeacher);
        }

        const storedKyocera = getStoredKyoceraSettings();
        if (storedKyocera) {
          setKyocera(storedKyocera);
        }

        const storedResults = getStoredResults();
        const hasLegacyDemoResults = storedResults.some(r => r.id?.startsWith('res-std-') || r.examId === 'exam-pts-mat-2025');
        if (hasLegacyDemoResults) {
          setResults([]);
          saveResults([]);
        } else if (storedResults && storedResults.length > 0) {
          setResults(storedResults);
        }
      } catch (err) {
        console.warn('Local storage hydration fallback:', err);
      }

      // Check cloud Firestore for latest state
      try {
        const cloudData = await fetchStateFromFirestore();
        if (isCancelled) return;
        if (cloudData.exams && cloudData.exams.length > 0) {
          const cloudHasDemo = cloudData.exams.some(e => e.id === 'exam-pts-mat-2025' || e.id === 'exam-uh1-mat-2025');
          if (!cloudHasDemo) {
            const cleanedCloudExams = cloudData.exams.map(e => ({
              ...e,
              gradeClass: (e.gradeClass?.includes('IX E') || e.gradeClass?.includes('Kelas IX')) ? '' : e.gradeClass,
              subject: e.subject === 'Mata Pelajaran' ? '' : e.subject
            }));
            setExams(cleanedCloudExams);
            saveExams(cleanedCloudExams);
            setActiveExamId(prev => cleanedCloudExams.some(e => e.id === prev) ? prev : cleanedCloudExams[0].id);
          }
        }
        if (cloudData.students) {
          const cleanedCloudStudents = cloudData.students.filter(s => 
            !s.classId?.includes('IX E') && 
            !s.classId?.includes('IX F') && 
            !s.classId?.includes('IX G') && 
            !s.classId?.includes('IX H') && 
            !s.classId?.includes('IX I') &&
            !s.studentNo?.startsWith('00812345') &&
            !(s.id?.startsWith('std-') && s.studentNo === '120101001')
          );
          setStudents(cleanedCloudStudents);
          saveStudents(cleanedCloudStudents);
        }
        if (cloudData.results) {
          const cloudResultsDemo = cloudData.results.some(r => r.id?.startsWith('res-std-') || r.examId === 'exam-pts-mat-2025');
          if (!cloudResultsDemo) {
            setResults(cloudData.results);
            saveResults(cloudData.results);
          }
        }
        if (cloudData.teacher && cloudData.teacher.namaGuru !== 'Drs. H. Ahmad Sudrajat, M.Pd.') {
          setTeacher(cloudData.teacher);
          saveTeacherProfile(cloudData.teacher);
        }
        if (cloudData.kyocera) {
          setKyocera(cloudData.kyocera);
          saveKyoceraSettings(cloudData.kyocera);
        }
      } catch {
        // Silently use offline cache if cloud is not reachable
      }
    }

    loadHydratedData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const activeExam = exams.find(e => e.id === activeExamId) || exams[0] || INITIAL_EXAM;

  // Save single result
  const handleSaveResult = (newResult: ScanResult) => {
    setResults(prev => {
      const existingIdx = prev.findIndex(r => r.studentNo === newResult.studentNo && r.examId === newResult.examId);
      let updated: ScanResult[];
      if (existingIdx >= 0) {
        updated = [...prev];
        updated[existingIdx] = newResult;
      } else {
        updated = [newResult, ...prev];
      }
      saveResults(updated);
      saveScanResultToFirestore(newResult).catch(() => {});
      return updated;
    });
  };

  // Save batch results from ADF Kyocera
  const handleSaveResultsBatch = (batch: ScanResult[]) => {
    setResults(prev => {
      const mergedMap = new Map<string, ScanResult>();
      prev.forEach(r => mergedMap.set(`${r.studentNo}-${r.examId}`, r));
      batch.forEach(r => mergedMap.set(`${r.studentNo}-${r.examId}`, r));
      const updated = Array.from(mergedMap.values());
      saveResults(updated);
      saveBatchScanResultsToFirestore(batch).catch(() => {});
      return updated;
    });
  };

  // Update single result from table
  const handleUpdateResult = (updated: ScanResult) => {
    setResults(prev => {
      const next = prev.map(r => r.id === updated.id ? updated : r);
      saveResults(next);
      return next;
    });
  };

  // Delete single result
  const handleDeleteResult = (id: string) => {
    setResults(prev => {
      const next = prev.filter(r => r.id !== id);
      saveResults(next);
      return next;
    });
  };

  // Full state restore from Cloud Backup
  const handleRestoreState = (restored: AppState) => {
    if (restored.exams) {
      setExams(restored.exams);
      saveExams(restored.exams);
    }
    if (restored.teacher) {
      setTeacher(restored.teacher);
      saveTeacherProfile(restored.teacher);
    }
    if (restored.kyocera) {
      setKyocera(restored.kyocera);
      saveKyoceraSettings(restored.kyocera);
    }
    if (restored.students) {
      setStudents(restored.students);
      saveStudents(restored.students);
    }
    if (restored.results) {
      setResults(restored.results);
      saveResults(restored.results);
    }
    if (restored.activeExamId) {
      setActiveExamId(restored.activeExamId);
    }
  };

  // State Purged / Database reset handler
  const handleStatePurged = (newState: AppState) => {
    setExams(newState.exams);
    setActiveExamId(newState.activeExamId);
    setStudents(newState.students);
    setResults(newState.results);
    setTeacher(newState.teacher);
    setKyocera(newState.kyocera);
  };

  // Results only purged handler
  const handleResultsPurged = () => {
    setResults([]);
  };

  // Exam management handlers with persistence & toasts
  const handleSaveExam = (updated: ExamConfig) => {
    setExams(prev => {
      const exists = prev.some(e => e.id === updated.id);
      const next = exists ? prev.map(e => e.id === updated.id ? updated : e) : [...prev, updated];
      saveExams(next);
      return next;
    });
    setActiveExamId(updated.id);
    saveExamToFirestore(updated).catch(err => console.warn('Firestore exam write:', err));
    triggerToast(
      'Kunci Jawaban Berhasil Disimpan!',
      `Kunci asesmen "${updated.title}" (${updated.totalQuestions} soal, ${updated.packets?.length || 1} paket) telah tersimpan dan siap digunakan.`,
      'success'
    );
  };

  const handleAddNewExam = (newExam: ExamConfig) => {
    setExams(prev => {
      const next = [...prev, newExam];
      saveExams(next);
      return next;
    });
    setActiveExamId(newExam.id);
    saveExamToFirestore(newExam).catch(err => console.warn('Firestore new exam write:', err));
    triggerToast(
      'Asesmen Baru Dibuat!',
      `Judul "${newExam.title}" berhasil ditambahkan ke database penilaian.`,
      'success'
    );
  };

  const handleDeleteExam = (examId: string) => {
    const target = exams.find(e => e.id === examId);
    const remaining = exams.filter(e => e.id !== examId);
    if (remaining.length > 0) {
      setExams(remaining);
      saveExams(remaining);
      setActiveExamId(remaining[0].id);
      deleteExamFromFirestore(examId).catch(err => console.warn('Firestore delete exam:', err));
      triggerToast(
        'Asesmen Dihapus',
        `Judul "${target?.title || 'Asesmen'}" telah dihapus.`,
        'info'
      );
    }
  };

  const currentAppState: AppState = {
    teacher,
    kyocera,
    exams,
    students,
    results,
    activeExamId,
    lastSyncedAt: new Date().toISOString()
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white font-sans antialiased print:bg-white print:min-h-0 print:p-0">
      {/* Floating Global Toast Notification */}
      {globalToast && (
        <div className="fixed bottom-6 right-6 z-50 max-w-md bg-slate-900 text-white p-4 rounded-2xl shadow-2xl border border-slate-700 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
            globalToast.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-blue-500 text-white'
          }`}>
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
              {globalToast.title}
            </h4>
            <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
              {globalToast.message}
            </p>
          </div>
          <button
            onClick={() => setGlobalToast(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Navigation Bar with Main Menu & Master Data */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        exams={exams}
        activeExamId={activeExamId}
        onSelectExam={setActiveExamId}
        teacher={teacher}
        kyocera={kyocera}
        onOpenTeacherModal={() => setIsTeacherModalOpen(true)}
        onOpenExamModal={() => setIsExamModalOpen(true)}
        onOpenCloudModal={() => setIsCloudModalOpen(true)}
        onOpenStudentModal={() => setIsStudentModalOpen(true)}
        onOpenDatabaseModal={() => setIsDatabaseModalOpen(true)}
        totalResultsCount={results.length}
      />

      {/* Main Content Router */}
      <main className="flex-1 pb-16 print:p-0 print:m-0 print:pb-0">
        {activeTab === 'CAMERA' && (
          <CameraScanner
            exam={activeExam}
            students={students}
            onSaveResult={handleSaveResult}
            onOpenResultsTab={() => setActiveTab('RESULTS')}
          />
        )}

        {activeTab === 'ADF_SCAN' && (
          <KyoceraScannerHub
            exam={activeExam}
            students={students}
            kyocera={kyocera}
            onUpdateKyoceraConfig={(updated) => {
              setKyocera(updated);
              saveKyoceraSettings(updated);
            }}
            onSaveResultsBatch={handleSaveResultsBatch}
            onOpenResultsTab={() => setActiveTab('RESULTS')}
          />
        )}

        {activeTab === 'RESULTS' && (
          <ScanResultsTable
            results={results}
            exam={activeExam}
            teacher={teacher}
            students={students}
            onUpdateResult={handleUpdateResult}
            onDeleteResult={handleDeleteResult}
            onOpenScanTab={() => setActiveTab('CAMERA')}
          />
        )}

        {activeTab === 'ANALYTICS' && (
          <ClassAnalyticsView
            exam={activeExam}
            results={results.filter(r => r.examId === activeExam.id || results.length > 0)}
            teacher={teacher}
          />
        )}

        {activeTab === 'HISTORY' && (
          <StudentHistoryView
            students={students}
            exams={exams}
            allResults={results}
            teacher={teacher}
          />
        )}

        {activeTab === 'LJK_TEMPLATE' && (
          <LjkTemplateGenerator
            key={`ljk-gen-${activeExam.id}-${activeExam.totalQuestions}-${activeExam.optionsCount}-${activeExam.updatedAt || ''}`}
            exam={activeExam}
            teacher={teacher}
            onUpdateExam={handleSaveExam}
            onOpenExamModal={() => setIsExamModalOpen(true)}
          />
        )}
      </main>

      {/* Settings & Configuration Modals */}
      <TeacherProfileModal
        isOpen={isTeacherModalOpen}
        onClose={() => setIsTeacherModalOpen(false)}
        teacher={teacher}
        onSaveTeacher={(updated) => {
          setTeacher(updated);
          saveTeacherProfile(updated);
          triggerToast('Profil Guru Disimpan', 'Data nama pengampu dan sekolah berhasil diperbarui.', 'success');
        }}
      />

      <ExamConfigModal
        key={`exam-modal-${isExamModalOpen ? 'open' : 'closed'}-${activeExam.id}-${activeExam.totalQuestions}-${activeExam.optionsCount}-${activeExam.updatedAt || ''}`}
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        exam={activeExam}
        exams={exams}
        onSelectExam={(id) => setActiveExamId(id)}
        onSaveExam={handleSaveExam}
        onAddNewExam={handleAddNewExam}
        onDeleteExam={handleDeleteExam}
      />

      <StudentListModal
        key={`student-modal-${isStudentModalOpen ? 'open' : 'closed'}-${students.length}`}
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        students={students}
        onUpdateStudents={(updated) => {
          setStudents(updated);
          saveStudents(updated);
          triggerToast('Data Siswa Diperbarui', `${updated.length} data siswa berhasil disimpan ke database.`, 'success');
        }}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        currentState={currentAppState}
        onRestoreState={handleRestoreState}
        onOpenDatabaseManager={() => setIsDatabaseModalOpen(true)}
      />

      <DatabaseManagerModal
        isOpen={isDatabaseModalOpen}
        onClose={() => setIsDatabaseModalOpen(false)}
        currentState={currentAppState}
        onStatePurged={handleStatePurged}
        onResultsPurged={handleResultsPurged}
      />
    </div>
  );
}
