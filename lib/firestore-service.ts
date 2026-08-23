import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import configJson from '../firebase-applet-config.json';
import { ExamConfig, Student, ScanResult, TeacherProfile, KyoceraSettings } from '@/types/omr';
import { AppState } from './storage';

/**
 * Cloud Firestore Data Service for LJK Pro Scanner
 */

export const FIREBASE_PROJECT_INFO = {
  projectId: configJson.projectId,
  authDomain: configJson.authDomain,
  firestoreDatabaseId: configJson.firestoreDatabaseId || '(default)'
};

// Collection references
const EXAMS_COLLECTION = 'exams';
const STUDENTS_COLLECTION = 'students';
const RESULTS_COLLECTION = 'scanResults';
const SETTINGS_COLLECTION = 'settings';

export interface CloudSyncStatus {
  isConnected: boolean;
  latencyMs?: number;
  lastSyncedAt?: string;
  examsCount: number;
  studentsCount: number;
  resultsCount: number;
  projectId: string;
  databaseId: string;
}

/**
 * Test & Ping Firestore database connection status
 */
export async function checkFirestoreConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const start = Date.now();
  try {
    const snap = await getDoc(doc(db, SETTINGS_COLLECTION, 'teacherProfile'));
    const latencyMs = Date.now() - start;
    return { connected: true, latencyMs };
  } catch (err: any) {
    const latencyMs = Date.now() - start;
    return { connected: false, latencyMs, error: err.message || 'Connection timeout' };
  }
}

/**
 * Sync entire AppState to Firebase Cloud Firestore
 */
export async function syncStateToFirestore(state: AppState): Promise<void> {
  const batch = writeBatch(db);

  // 1. Settings
  if (state.teacher) {
    const teacherDocRef = doc(db, SETTINGS_COLLECTION, 'teacherProfile');
    batch.set(teacherDocRef, { ...state.teacher, updatedAt: new Date().toISOString() });
  }

  if (state.kyocera) {
    const kyoceraDocRef = doc(db, SETTINGS_COLLECTION, 'kyoceraConfig');
    batch.set(kyoceraDocRef, { ...state.kyocera, updatedAt: new Date().toISOString() });
  }

  // 2. Exams
  if (state.exams && state.exams.length > 0) {
    state.exams.forEach(exam => {
      const examRef = doc(db, EXAMS_COLLECTION, exam.id);
      batch.set(examRef, {
        ...exam,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    });
  }

  // 3. Students
  if (state.students && state.students.length > 0) {
    state.students.forEach(student => {
      const studentRef = doc(db, STUDENTS_COLLECTION, student.id);
      batch.set(studentRef, student, { merge: true });
    });
  }

  // 4. Scan Results (Use composite key or result.id)
  if (state.results && state.results.length > 0) {
    state.results.forEach(result => {
      const resultDocId = result.id || `res_${result.studentNo}_${result.examId}`;
      const resultRef = doc(db, RESULTS_COLLECTION, resultDocId);
      batch.set(resultRef, {
        ...result,
        id: resultDocId,
        syncedAt: new Date().toISOString()
      }, { merge: true });
    });
  }

  await batch.commit();
}

/**
 * Fetch all documents from Cloud Firestore
 */
export async function fetchStateFromFirestore(): Promise<Partial<AppState>> {
  const partialState: Partial<AppState> = {};

  try {
    // 1. Get Settings
    const teacherSnap = await getDoc(doc(db, SETTINGS_COLLECTION, 'teacherProfile'));
    if (teacherSnap.exists()) {
      partialState.teacher = teacherSnap.data() as TeacherProfile;
    }

    const kyoceraSnap = await getDoc(doc(db, SETTINGS_COLLECTION, 'kyoceraConfig'));
    if (kyoceraSnap.exists()) {
      partialState.kyocera = kyoceraSnap.data() as KyoceraSettings;
    }

    // 2. Get Exams
    const examsSnap = await getDocs(collection(db, EXAMS_COLLECTION));
    const exams: ExamConfig[] = [];
    examsSnap.forEach(d => {
      exams.push(d.data() as ExamConfig);
    });
    if (exams.length > 0) {
      partialState.exams = exams;
    }

    // 3. Get Students
    const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
    const students: Student[] = [];
    studentsSnap.forEach(d => {
      students.push(d.data() as Student);
    });
    if (students.length > 0) {
      partialState.students = students;
    }

    // 4. Get Results
    const resultsSnap = await getDocs(collection(db, RESULTS_COLLECTION));
    const results: ScanResult[] = [];
    resultsSnap.forEach(d => {
      results.push(d.data() as ScanResult);
    });
    if (results.length > 0) {
      partialState.results = results;
    }

    partialState.lastSyncedAt = new Date().toISOString();
  } catch (error) {
    console.error('Failed to fetch from Firestore:', error);
    throw error;
  }

  return partialState;
}

/**
 * Save Single Exam to Firestore
 */
export async function saveExamToFirestore(exam: ExamConfig): Promise<void> {
  const examRef = doc(db, EXAMS_COLLECTION, exam.id);
  await setDoc(examRef, { ...exam, updatedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Delete Exam from Firestore
 */
export async function deleteExamFromFirestore(examId: string): Promise<void> {
  await deleteDoc(doc(db, EXAMS_COLLECTION, examId));
}

/**
 * Save Single Scan Result to Firestore
 */
export async function saveScanResultToFirestore(result: ScanResult): Promise<void> {
  const docId = result.id || `res_${result.studentNo}_${result.examId}`;
  const resRef = doc(db, RESULTS_COLLECTION, docId);
  await setDoc(resRef, { ...result, id: docId, syncedAt: new Date().toISOString() }, { merge: true });
}

/**
 * Save Batch Scan Results to Firestore
 */
export async function saveBatchScanResultsToFirestore(results: ScanResult[]): Promise<void> {
  if (!results || results.length === 0) return;
  const batch = writeBatch(db);
  results.forEach(result => {
    const docId = result.id || `res_${result.studentNo}_${result.examId}`;
    const resRef = doc(db, RESULTS_COLLECTION, docId);
    batch.set(resRef, { ...result, id: docId, syncedAt: new Date().toISOString() }, { merge: true });
  });
  await batch.commit();
}

/**
 * Purge All Cloud Database collections
 */
export async function purgeFirestoreDatabase(): Promise<void> {
  const collections = [EXAMS_COLLECTION, STUDENTS_COLLECTION, RESULTS_COLLECTION];
  for (const collName of collections) {
    const snap = await getDocs(collection(db, collName));
    const batch = writeBatch(db);
    snap.forEach(d => {
      batch.delete(d.ref);
    });
    await batch.commit();
  }
}
