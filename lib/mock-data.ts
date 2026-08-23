import { TeacherProfile, ExamConfig, Student, ScanResult, KyoceraSettings } from '@/types/omr';

export const DEFAULT_TEACHER_PROFILE: TeacherProfile = {
  namaGuru: 'Drs. H. Ahmad Sudrajat, M.Pd.',
  nip: '19780512 200501 1 004',
  namaSekolah: 'SMA Negeri 1 Prestasi Bangsa',
  mataPelajaran: 'Matematika Peminatan',
  tingkatKelas: 'Kelas XII MIPA 1',
  semester: 'Ganjil',
  tahunAjaran: '2025/2026',
  kkmDefault: 75,
  kontakEmail: 'ahmad.sudrajat@guru.smp.belajar.id',
  tandaTanganNama: 'Drs. H. Ahmad Sudrajat, M.Pd.'
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

export const SAMPLE_STUDENTS: Student[] = [
  { id: 'std-01', studentNo: '120101001', name: 'Aditya Pratama', classId: 'XII MIPA 1', gender: 'L' },
  { id: 'std-02', studentNo: '120101002', name: 'Aisyah Putri Rahmadani', classId: 'XII MIPA 1', gender: 'P' },
  { id: 'std-03', studentNo: '120101003', name: 'Bagas Dwi Wicaksono', classId: 'XII MIPA 1', gender: 'L' },
  { id: 'std-04', studentNo: '120101004', name: 'Cantika Dewi Lestari', classId: 'XII MIPA 1', gender: 'P' },
  { id: 'std-05', studentNo: '120101005', name: 'Dimas Arya Nugraha', classId: 'XII MIPA 1', gender: 'L' },
  { id: 'std-06', studentNo: '120101006', name: 'Eka Nur Fitriani', classId: 'XII MIPA 1', gender: 'P' },
  { id: 'std-07', studentNo: '120101007', name: 'Fajar Hidayatullah', classId: 'XII MIPA 1', gender: 'L' },
  { id: 'std-08', studentNo: '120101008', name: 'Gita Maharani Putri', classId: 'XII MIPA 1', gender: 'P' },
  { id: 'std-09', studentNo: '120101009', name: 'Hafiz Ananda Putra', classId: 'XII MIPA 1', gender: 'L' },
  { id: 'std-10', studentNo: '120101010', name: 'Indah Kusuma Wardani', classId: 'XII MIPA 1', gender: 'P' },
  { id: 'std-11', studentNo: '120101011', name: 'Jovan Nathaniel', classId: 'XII MIPA 1', gender: 'L' },
  { id: 'std-12', studentNo: '120101012', name: 'Khansa Nabila Zahra', classId: 'XII MIPA 1', gender: 'P' },
  { id: 'std-13', studentNo: '120101013', name: 'Lukman Hakim Siregar', classId: 'XII MIPA 1', gender: 'L' },
  { id: 'std-14', studentNo: '120101014', name: 'Maya Anggraini', classId: 'XII MIPA 2', gender: 'P' },
  { id: 'std-15', studentNo: '120101015', name: 'Naufal Rizky Maulana', classId: 'XII MIPA 2', gender: 'L' },
  { id: 'std-16', studentNo: '120101016', name: 'Olivia Salsabila', classId: 'XII MIPA 2', gender: 'P' },
  { id: 'std-17', studentNo: '120101017', name: 'Panji Gumilang Pangestu', classId: 'XII MIPA 2', gender: 'L' },
  { id: 'std-18', studentNo: '120101018', name: 'Qonita Salma Fauziyyah', classId: 'XII MIPA 2', gender: 'P' },
  { id: 'std-19', studentNo: '120101019', name: 'Rian Syahputra', classId: 'XII MIPA 2', gender: 'L' },
  { id: 'std-20', studentNo: '120101020', name: 'Siti Nurhaliza', classId: 'XII MIPA 2', gender: 'P' },
  { id: 'std-21', studentNo: '120101021', name: 'Taufiqurrahman', classId: 'XII MIPA 2', gender: 'L' },
  { id: 'std-22', studentNo: '120101022', name: 'Utami Rahayu', classId: 'XII IPS 1', gender: 'P' },
  { id: 'std-23', studentNo: '120101023', name: 'Vicky Alexander', classId: 'XII IPS 1', gender: 'L' },
  { id: 'std-24', studentNo: '120101024', name: 'Wulan Maulida', classId: 'XII IPS 1', gender: 'P' },
  { id: 'std-25', studentNo: '120101025', name: 'Zidan Al-Ghifari', classId: 'XII IPS 1', gender: 'L' }
];

export const SAMPLE_EXAMS: ExamConfig[] = [
  {
    id: 'exam-pts-mat-2025',
    title: 'Penilaian Tengah Semester (PTS) Ganjil',
    subject: 'Matematika Peminatan',
    gradeClass: 'XII MIPA 1',
    date: '2025-09-18',
    totalQuestions: 25,
    optionsCount: 5,
    packets: [
      {
        packetCode: 'A',
        keys: {
          1: 'C', 2: 'A', 3: 'B', 4: 'D', 5: 'E',
          6: 'A', 7: 'C', 8: 'D', 9: 'B', 10: 'A',
          11: 'E', 12: 'D', 13: 'B', 14: 'C', 15: 'A',
          16: 'D', 17: 'B', 18: 'E', 19: 'C', 20: 'A',
          21: 'B', 22: 'D', 23: 'C', 24: 'A', 25: 'E'
        }
      },
      {
        packetCode: 'B',
        keys: {
          1: 'A', 2: 'C', 3: 'D', 4: 'B', 5: 'A',
          6: 'E', 7: 'D', 8: 'B', 9: 'C', 10: 'A',
          11: 'D', 12: 'B', 13: 'E', 14: 'C', 15: 'A',
          16: 'C', 17: 'A', 18: 'B', 19: 'D', 20: 'E',
          21: 'E', 22: 'A', 23: 'D', 24: 'B', 25: 'C'
        }
      }
    ],
    questionWeights: {
      1: 4, 2: 4, 3: 4, 4: 4, 5: 4,
      6: 4, 7: 4, 8: 4, 9: 4, 10: 4,
      11: 4, 12: 4, 13: 4, 14: 4, 15: 4,
      16: 4, 17: 4, 18: 4, 19: 4, 20: 4,
      21: 4, 22: 4, 23: 4, 24: 4, 25: 4
    },
    penaltyNegativeScore: 0,
    kkm: 75,
    topics: {
      1: 'Limit Fungsi Trigonometri', 2: 'Limit Fungsi Trigonometri', 3: 'Limit Tak Hingga', 4: 'Limit Tak Hingga', 5: 'Turunan Trigonometri',
      6: 'Turunan Trigonometri', 7: 'Aplikasi Turunan', 8: 'Aplikasi Turunan', 9: 'Garis Singgung Kurva', 10: 'Nilai Maksimum & Minimum',
      11: 'Integral Parsial', 12: 'Integral Parsial', 13: 'Integral Trigonometri', 14: 'Integral Trigonometri', 15: 'Volume Benda Putar',
      16: 'Volume Benda Putar', 17: 'Distribusi Peluang', 18: 'Distribusi Peluang Binomial', 19: 'Distribusi Binomial', 20: 'Distribusi Normal',
      21: 'Uji Hipotesis', 22: 'Uji Hipotesis', 23: 'Vektor Dimensi 3', 24: 'Transformasi Geometri', 25: 'Matriks Transformasi'
    },
    createdAt: '2025-09-10T08:00:00.000Z',
    updatedAt: '2025-09-18T14:30:00.000Z'
  },
  {
    id: 'exam-uh1-mat-2025',
    title: 'Ulangan Harian 1: Limit & Turunan',
    subject: 'Matematika Peminatan',
    gradeClass: 'XII MIPA 1',
    date: '2025-08-25',
    totalQuestions: 20,
    optionsCount: 5,
    packets: [
      {
        packetCode: 'A',
        keys: {
          1: 'A', 2: 'B', 3: 'C', 4: 'D', 5: 'E',
          6: 'B', 7: 'C', 8: 'A', 9: 'E', 10: 'D',
          11: 'C', 12: 'A', 13: 'B', 14: 'D', 15: 'E',
          16: 'A', 17: 'C', 18: 'D', 19: 'B', 20: 'E'
        }
      }
    ],
    questionWeights: Object.fromEntries(Array.from({ length: 20 }, (_, i) => [i + 1, 5])),
    penaltyNegativeScore: 0,
    kkm: 75,
    createdAt: '2025-08-20T08:00:00.000Z',
    updatedAt: '2025-08-25T11:00:00.000Z'
  }
];

// Helper to generate realistic historical & initial results
export function generateInitialResults(exam: ExamConfig, students: Student[]): ScanResult[] {
  const packetA = exam.packets[0];
  const keys = packetA.keys;

  return students.slice(0, 18).map((student, idx) => {
    const isHighPerformer = idx < 6;
    const isMediumPerformer = idx >= 6 && idx < 14;

    const answers: Record<number, any> = {};
    const detailedAnswers: any[] = [];
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;

    for (let q = 1; q <= exam.totalQuestions; q++) {
      const correctOpt = keys[q] || 'A';
      let marked: any = null;

      const rand = Math.random();
      if (isHighPerformer) {
        marked = rand > 0.12 ? correctOpt : (rand > 0.04 ? ['A','B','C','D','E'].find(o => o !== correctOpt) : null);
      } else if (isMediumPerformer) {
        marked = rand > 0.28 ? correctOpt : (rand > 0.08 ? ['A','B','C','D','E'].find(o => o !== correctOpt) : null);
      } else {
        marked = rand > 0.48 ? correctOpt : (rand > 0.15 ? ['A','B','C','D','E'].find(o => o !== correctOpt) : null);
      }

      const isCorrect = marked === correctOpt;
      if (marked === null) blankCount++;
      else if (isCorrect) correctCount++;
      else wrongCount++;

      answers[q] = marked;
      detailedAnswers.push({
        questionNo: q,
        markedOption: marked,
        isCorrect,
        correctAnswer: correctOpt,
        confidence: marked ? 0.94 + Math.random() * 0.05 : 0.99
      });
    }

    const rawScore = correctCount * (exam.questionWeights[1] || 4);
    const finalScore = Math.round((correctCount / exam.totalQuestions) * 100);
    const isPassed = finalScore >= exam.kkm;

    return {
      id: `res-${student.id}-${exam.id}`,
      examId: exam.id,
      studentNo: student.studentNo,
      studentName: student.name,
      classId: student.classId,
      packetCode: 'A',
      answers,
      detailedAnswers,
      rawScore,
      finalScore,
      totalCorrect: correctCount,
      totalWrong: wrongCount,
      totalBlank: blankCount,
      isPassed,
      scannedAt: new Date(1758184200000 - idx * 60000).toISOString(),
      scanSource: idx % 2 === 0 ? 'ADF_KYOCERA' : 'CAMERA_REALTIME',
      status: 'VERIFIED',
      confidenceScore: 0.96
    };
  });
}

export const INITIAL_STUDENTS = SAMPLE_STUDENTS;
export const INITIAL_EXAM = SAMPLE_EXAMS[0];
export const INITIAL_EXAMS = SAMPLE_EXAMS;
export const INITIAL_TEACHER_PROFILE = DEFAULT_TEACHER_PROFILE;
export const INITIAL_KYOCERA_SETTINGS = DEFAULT_KYOCERA_CONFIG;
export const generateSampleScanResults = generateInitialResults;

