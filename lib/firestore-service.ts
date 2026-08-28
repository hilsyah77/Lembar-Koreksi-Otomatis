import { 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  deleteDoc, 
  writeBatch,
  getDoc
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
  databaseName: 'Cloud Firestore',
  firestoreDatabaseId: configJson.firestoreDatabaseId || '(default)'
};

// Collection Names
const EXAMS_COLLECTION = 'exams';
const STUDENTS_COLLECTION = 'students';
const SCAN_RESULTS_COLLECTION = 'scan_results';
const APP_META_COLLECTION = 'app_meta';
const META_DOC_ID = 'global_config';

/**
 * Helper to remove undefined values before Firestore writes
 */
function cleanForFirestore<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

/**
 * Test & Ping Firestore database connection status
 */
export async function checkFirestoreConnection(): Promise<{ connected: boolean; latencyMs: number; error?: string }> {
  const start = performance.now();
  try {
    const metaRef = doc(db, APP_META_COLLECTION, 'health_ping');
    await getDoc(metaRef);
    const latency = Math.round(performance.now() - start);
    return { connected: true, latencyMs: latency };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { connected: false, latencyMs: 0, error: message };
  }
}

/**
 * Sync entire AppState to Firebase Cloud Firestore
 */
export async function syncStateToFirestore(state: AppState): Promise<void> {
  const batch = writeBatch(db);

  // 1. Sync Exams
  if (state.exams && state.exams.length > 0) {
    for (const exam of state.exams) {
      const examRef = doc(db, EXAMS_COLLECTION, exam.id);
      batch.set(examRef, cleanForFirestore(exam), { merge: true });
    }
  }

  // 2. Sync Students
  if (state.students && state.students.length > 0) {
    for (const student of state.students) {
      const studentRef = doc(db, STUDENTS_COLLECTION, student.id || student.studentNo);
      batch.set(studentRef, cleanForFirestore(student), { merge: true });
    }
  }

  // 3. Sync Scan Results (limited to avoid oversized batches)
  if (state.results && state.results.length > 0) {
    for (const result of state.results.slice(0, 100)) {
      const resultRef = doc(db, SCAN_RESULTS_COLLECTION, result.id);
      batch.set(resultRef, cleanForFirestore(result), { merge: true });
    }
  }

  // 4. Sync Metadata (Teacher profile, Kyocera settings, active exam ID)
  const metaRef = doc(db, APP_META_COLLECTION, META_DOC_ID);
  batch.set(metaRef, cleanForFirestore({
    teacher: state.teacher,
    kyocera: state.kyocera,
    activeExamId: state.activeExamId,
    lastSyncedAt: new Date().toISOString()
  }), { merge: true });

  await batch.commit();
}

/**
 * Fetch all documents from Cloud Firestore
 */
export async function fetchStateFromFirestore(): Promise<Partial<AppState>> {
  const fetchedState: Partial<AppState> = {};

  try {
    // 1. Fetch Exams
    const examsSnap = await getDocs(collection(db, EXAMS_COLLECTION));
    if (!examsSnap.empty) {
      fetchedState.exams = examsSnap.docs.map(d => d.data() as ExamConfig);
    }

    // 2. Fetch Students
    const studentsSnap = await getDocs(collection(db, STUDENTS_COLLECTION));
    if (!studentsSnap.empty) {
      fetchedState.students = studentsSnap.docs.map(d => d.data() as Student);
    }

    // 3. Fetch Scan Results
    const resultsSnap = await getDocs(collection(db, SCAN_RESULTS_COLLECTION));
    if (!resultsSnap.empty) {
      fetchedState.results = resultsSnap.docs.map(d => d.data() as ScanResult);
    }

    // 4. Fetch Meta
    const metaSnap = await getDoc(doc(db, APP_META_COLLECTION, META_DOC_ID));
    if (metaSnap.exists()) {
      const metaData = metaSnap.data();
      if (metaData.teacher) fetchedState.teacher = metaData.teacher as TeacherProfile;
      if (metaData.kyocera) fetchedState.kyocera = metaData.kyocera as KyoceraSettings;
      if (metaData.activeExamId) fetchedState.activeExamId = metaData.activeExamId as string;
    }
  } catch (error) {
    console.error('Failed to fetch from Firestore:', error);
    throw error;
  }

  return fetchedState;
}

/**
 * Save Single Exam to Firestore
 */
export async function saveExamToFirestore(exam: ExamConfig): Promise<void> {
  const examRef = doc(db, EXAMS_COLLECTION, exam.id);
  await setDoc(examRef, cleanForFirestore(exam), { merge: true });
}

/**
 * Delete Exam from Firestore
 */
export async function deleteExamFromFirestore(examId: string): Promise<void> {
  const examRef = doc(db, EXAMS_COLLECTION, examId);
  await deleteDoc(examRef);
}

/**
 * Save Single Scan Result to Firestore
 */
export async function saveScanResultToFirestore(result: ScanResult): Promise<void> {
  const resultRef = doc(db, SCAN_RESULTS_COLLECTION, result.id);
  await setDoc(resultRef, cleanForFirestore(result), { merge: true });
}

/**
 * Save Batch Scan Results to Firestore
 */
export async function saveBatchScanResultsToFirestore(results: ScanResult[]): Promise<void> {
  if (results.length === 0) return;
  const batch = writeBatch(db);
  for (const r of results) {
    const ref = doc(db, SCAN_RESULTS_COLLECTION, r.id);
    batch.set(ref, cleanForFirestore(r), { merge: true });
  }
  await batch.commit();
}

/**
 * Delete Single Scan Result from Firestore
 */
export async function deleteScanResultFromFirestore(resultId: string): Promise<void> {
  const resultRef = doc(db, SCAN_RESULTS_COLLECTION, resultId);
  await deleteDoc(resultRef);
}

/**
 * Purge entire Firestore database
 */
export async function purgeFirestoreDatabase(): Promise<void> {
  const collections = [EXAMS_COLLECTION, STUDENTS_COLLECTION, SCAN_RESULTS_COLLECTION, APP_META_COLLECTION];
  for (const col of collections) {
    const snap = await getDocs(collection(db, col));
    const batch = writeBatch(db);
    snap.docs.forEach(docSnap => {
      batch.delete(docSnap.ref);
    });
    await batch.commit();
  }
}
