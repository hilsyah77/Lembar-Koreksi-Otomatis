import { TeacherProfile, ExamConfig, Student, ScanResult, KyoceraSettings, OptionLetter } from '@/types/omr';
import { DEFAULT_TEACHER_PROFILE, DEFAULT_KYOCERA_CONFIG, SAMPLE_EXAMS, SAMPLE_STUDENTS, generateInitialResults } from './mock-data';

const STORAGE_KEYS = {
  TEACHER: 'LJK_TEACHER_PROFILE_V1',
  KYOCERA: 'LJK_KYOCERA_CONFIG_V1',
  EXAMS: 'LJK_EXAMS_LIST_V1',
  STUDENTS: 'LJK_STUDENTS_LIST_V1',
  RESULTS: 'LJK_SCAN_RESULTS_MAP_V1',
  ACTIVE_EXAM_ID: 'LJK_ACTIVE_EXAM_ID_V1',
  CLOUD_SYNC_TS: 'LJK_CLOUD_LAST_SYNC_TS_V1'
};

export interface AppState {
  teacher: TeacherProfile;
  kyocera: KyoceraSettings;
  exams: ExamConfig[];
  students: Student[];
  results: ScanResult[];
  activeExamId: string;
  lastSyncedAt: string;
}

export function getStoredTeacherProfile(): TeacherProfile {
  if (typeof window === 'undefined') return DEFAULT_TEACHER_PROFILE;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.TEACHER);
    return raw ? JSON.parse(raw) : DEFAULT_TEACHER_PROFILE;
  } catch {
    return DEFAULT_TEACHER_PROFILE;
  }
}

export function saveTeacherProfile(teacher: TeacherProfile): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.TEACHER, JSON.stringify(teacher));
  } catch (err) {
    console.error('Failed to save teacher profile:', err);
  }
}

export function getStoredKyoceraSettings(): KyoceraSettings {
  if (typeof window === 'undefined') return DEFAULT_KYOCERA_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.KYOCERA);
    return raw ? JSON.parse(raw) : DEFAULT_KYOCERA_CONFIG;
  } catch {
    return DEFAULT_KYOCERA_CONFIG;
  }
}

export function saveKyoceraSettings(kyocera: KyoceraSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.KYOCERA, JSON.stringify(kyocera));
  } catch (err) {
    console.error('Failed to save Kyocera settings:', err);
  }
}

export function getStoredExams(): ExamConfig[] {
  if (typeof window === 'undefined') return SAMPLE_EXAMS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.EXAMS);
    return raw ? JSON.parse(raw) : SAMPLE_EXAMS;
  } catch {
    return SAMPLE_EXAMS;
  }
}

export function saveExams(exams: ExamConfig[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.EXAMS, JSON.stringify(exams));
  } catch (err) {
    console.error('Failed to save exams:', err);
  }
}

export function getStoredStudents(): Student[] {
  if (typeof window === 'undefined') return SAMPLE_STUDENTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    return raw ? JSON.parse(raw) : SAMPLE_STUDENTS;
  } catch {
    return SAMPLE_STUDENTS;
  }
}

export function saveStudents(students: Student[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  } catch (err) {
    console.error('Failed to save students:', err);
  }
}

export function getStoredResults(): ScanResult[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.RESULTS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveResults(results: ScanResult[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEYS.RESULTS, JSON.stringify(results));
  } catch (err) {
    console.error('Failed to save scan results:', err);
  }
}

export function loadInitialState(): AppState {
  if (typeof window === 'undefined') {
    return {
      teacher: DEFAULT_TEACHER_PROFILE,
      kyocera: DEFAULT_KYOCERA_CONFIG,
      exams: SAMPLE_EXAMS,
      students: [],
      results: [],
      activeExamId: SAMPLE_EXAMS[0].id,
      lastSyncedAt: new Date().toISOString()
    };
  }

  const teacher = getStoredTeacherProfile();
  const kyocera = getStoredKyoceraSettings();
  const exams = getStoredExams();
  const students = getStoredStudents();
  const results = getStoredResults();
  const activeExamId = localStorage.getItem(STORAGE_KEYS.ACTIVE_EXAM_ID) || exams[0]?.id || SAMPLE_EXAMS[0].id;
  const lastSyncedAt = localStorage.getItem(STORAGE_KEYS.CLOUD_SYNC_TS) || new Date().toISOString();

  return {
    teacher,
    kyocera,
    exams,
    students,
    results,
    activeExamId,
    lastSyncedAt
  };
}

export function saveStateToStorage(state: Partial<AppState>): void {
  if (typeof window === 'undefined') return;

  try {
    if (state.teacher) saveTeacherProfile(state.teacher);
    if (state.kyocera) saveKyoceraSettings(state.kyocera);
    if (state.exams) saveExams(state.exams);
    if (state.students) saveStudents(state.students);
    if (state.results) saveResults(state.results);
    if (state.activeExamId) localStorage.setItem(STORAGE_KEYS.ACTIVE_EXAM_ID, state.activeExamId);
    if (state.lastSyncedAt) localStorage.setItem(STORAGE_KEYS.CLOUD_SYNC_TS, state.lastSyncedAt);
  } catch (err) {
    console.error('Failed to save state to localStorage:', err);
  }
}

export function exportBackupData(state: AppState): void {
  const jsonStr = JSON.stringify(state, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `LJK-Pro-Backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importBackupData(file: File): Promise<AppState> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = JSON.parse(text) as AppState;
        if (!parsed.exams || !parsed.results) {
          throw new Error('Format file backup tidak valid.');
        }
        resolve(parsed);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Hapus Semua Data Database & Kembalikan ke State Kosong Murni
 */
export function purgeEntireDatabase(): AppState {
  if (typeof window !== 'undefined') {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  const defaultKeys: Record<number, OptionLetter> = {};
  const defaultWeights: Record<number, number> = {};
  for (let i = 1; i <= 25; i++) {
    defaultKeys[i] = 'A';
    defaultWeights[i] = 1;
  }

  const cleanExam: ExamConfig = {
    id: `exam-${Date.now()}`,
    title: 'Penilaian Harian',
    subject: '',
    gradeClass: '',
    date: new Date().toISOString().slice(0, 10),
    totalQuestions: 25,
    optionsCount: 4,
    packets: [
      {
        packetCode: 'A',
        keys: defaultKeys
      }
    ],
    questionWeights: defaultWeights,
    penaltyNegativeScore: 0,
    kkm: 75,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const emptyState: AppState = {
    teacher: DEFAULT_TEACHER_PROFILE,
    kyocera: DEFAULT_KYOCERA_CONFIG,
    exams: [cleanExam],
    students: [],
    results: [],
    activeExamId: cleanExam.id,
    lastSyncedAt: new Date().toISOString()
  };

  saveStateToStorage(emptyState);
  return emptyState;
}

/**
 * Reset Database ke Contoh Data Standar (Default Demo Factory)
 */
export function resetDatabaseToFactoryDemo(): AppState {
  return purgeEntireDatabase();
}

/**
 * Hapus Hanya Hasil Koreksi Nilai Scan
 */
export function purgeResultsOnly(): ScanResult[] {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(STORAGE_KEYS.RESULTS);
  }
  return [];
}

