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
  fetchStateFromFirestore 
} from '@/lib/firestore-service';

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
          setExams(storedExams);
          setActiveExamId(prev => storedExams.some(e => e.id === prev) ? prev : storedExams[0].id);
        }

        const storedStudents = getStoredStudents();
        const hasLegacyDemoStudents = storedStudents.some(s => s.id?.startsWith('std-') && s.studentNo === '120101001');
        if (hasLegacyDemoStudents) {
          setStudents([]);
          saveStudents([]);
        } else if (storedStudents) {
          setStudents(storedStudents);
        }

        const storedTeacher = getStoredTeacherProfile();
        if (storedTeacher && storedTeacher.namaGuru === 'Drs. H. Ahmad Sudrajat, M.Pd.') {
          setTeacher(INITIAL_TEACHER_PROFILE);
          saveTeacherProfile(INITIAL_TEACHER_PROFILE);
        } else if (storedTeacher) {
          setTeacher(storedTeacher);
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
            setExams(cloudData.exams);
            saveExams(cloudData.exams);
            setActiveExamId(prev => cloudData.exams!.some(e => e.id === prev) ? prev : cloudData.exams![0].id);
          }
        }
        if (cloudData.students) {
          const cloudStudentsDemo = cloudData.students.some(s => s.id?.startsWith('std-') && s.studentNo === '120101001');
          if (!cloudStudentsDemo) {
            setStudents(cloudData.students);
            saveStudents(cloudData.students);
          }
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

        {activeTab === 'KYOCERA' && (
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
            exam={activeExam}
            teacher={teacher}
            onUpdateExam={(updated) => {
              setExams(prev => {
                const next = prev.map(e => e.id === updated.id ? updated : e);
                saveExams(next);
                return next;
              });
            }}
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
        }}
      />

      <ExamConfigModal
        isOpen={isExamModalOpen}
        onClose={() => setIsExamModalOpen(false)}
        exam={activeExam}
        onSaveExam={(updated) => {
          setExams(prev => {
            const next = prev.map(e => e.id === updated.id ? updated : e);
            saveExams(next);
            return next;
          });
        }}
      />

      <StudentListModal
        key={`student-modal-${isStudentModalOpen ? 'open' : 'closed'}-${students.length}`}
        isOpen={isStudentModalOpen}
        onClose={() => setIsStudentModalOpen(false)}
        students={students}
        onUpdateStudents={(updated) => {
          setStudents(updated);
          saveStudents(updated);
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
