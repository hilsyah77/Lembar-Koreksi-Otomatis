import { TeacherProfile, ExamConfig, Student, ScanResult, KyoceraSettings, OptionLetter } from '@/types/omr';

export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  namaGuru: '',
  nip: '',
  namaSekolah: 'SMP / SMA / MTs / MA',
  mataPelajaran: 'Mata Pelajaran',
  tingkatKelas: 'Kelas IX',
  semester: 'Ganjil',
  tahunAjaran: '2025/2026',
  kkmDefault: 75,
  kontakEmail: '',
  tandaTanganNama: ''
};

export const DEFAULT_KYOCERA_CONFIG: KyoceraSettings = {
  printerModel: 'Kyocera ECOSYS M2535dn (ADF 50 Sheets)',
  ipAddress: '192.168.1.185',
  port: 9010,
  protocol: 'NETWORK_PUSH',
  resolutionDpi: 300,
  colorMode: 'GREYSCALE',
  duplexMode: 'SIMPLEX',
  autoSplitA4ToA5: true,
  enableAutoCorrect: true,
  pollingIntervalSeconds: 3
};

export const SAMPLE_STUDENTS: Student[] = [];

const defaultKeys: Record<number, OptionLetter> = {
  1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'A',
  6: 'B', 7: 'C', 8: 'D', 9: 'A', 10: 'B',
  11: 'C', 12: 'D', 13: 'A', 14: 'B', 15: 'C',
  16: 'D', 17: 'A', 18: 'B', 19: 'C', 20: 'D',
  21: 'A', 22: 'B', 23: 'C', 24: 'D', 25: 'A'
};

const defaultWeights: Record<number, number> = Object.fromEntries(
  Array.from({ length: 25 }, (_, i) => [i + 1, 4])
);

export const SAMPLE_EXAMS: ExamConfig[] = [
  {
    id: 'exam-default-01',
    title: 'Penilaian Harian (Ujian Baru)',
    subject: 'Mata Pelajaran',
    gradeClass: 'Kelas IX',
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
  }
];

// Helper returns empty results since demo data is removed
export function generateInitialResults(_exam?: ExamConfig, _students?: Student[]): ScanResult[] {
  return [];
}

export const INITIAL_STUDENTS: Student[] = [];
export const INITIAL_EXAM: ExamConfig = SAMPLE_EXAMS[0];
export const INITIAL_EXAMS: ExamConfig[] = SAMPLE_EXAMS;
export const INITIAL_TEACHER_PROFILE: TeacherProfile = DEFAULT_TEACHER_PROFILE;
export const INITIAL_KYOCERA_SETTINGS: KyoceraSettings = DEFAULT_KYOCERA_CONFIG;
export const generateSampleScanResults = generateInitialResults;


