export type OptionLetter = 'A' | 'B' | 'C' | 'D' | 'E';

export interface TeacherProfile {
  namaGuru: string;
  nip: string;
  namaSekolah: string;
  mataPelajaran: string;
  tingkatKelas: string;
  semester: 'Ganjil' | 'Genap';
  tahunAjaran: string;
  kkmDefault: number;
  kontakEmail?: string;
  tandaTanganNama?: string;
}

export interface ExamPacket {
  packetCode: string; // 'A' | 'B' | 'C' | 'D'
  keys: Record<number, OptionLetter>; // 1: 'A', 2: 'C', etc.
}

export interface ExamConfig {
  id: string;
  title: string;
  subject: string;
  gradeClass: string;
  date: string;
  totalQuestions: number; // e.g. 20, 25, 30, 40, 50
  optionsCount: 4 | 5; // 4 (A-D) or 5 (A-E)
  packets: ExamPacket[];
  questionWeights: Record<number, number>; // default 1 or custom weight
  penaltyNegativeScore: number; // e.g. 0 or -0.25
  kkm: number;
  topics?: Record<number, string>; // e.g. 1: "Aljabar", 2: "Geometri"
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  studentNo: string; // e.g. "0123456789" (Nomor Peserta)
  name: string;
  classId: string;
  gender?: 'L' | 'P';
}

export interface ScannedAnswer {
  questionNo: number;
  markedOption: OptionLetter | null; // null if blank / unscored
  isCorrect: boolean;
  correctAnswer: OptionLetter;
  confidence: number; // 0 to 1
  isMultipleMarked?: boolean;
}

export interface ScanResult {
  id: string;
  examId: string;
  studentNo: string;
  studentName: string;
  classId: string;
  packetCode: string; // 'A', 'B', etc.
  answers: Record<number, OptionLetter | null>; // Question number -> marked option
  detailedAnswers: ScannedAnswer[];
  rawScore: number;
  finalScore: number; // 0 - 100
  totalCorrect: number;
  totalWrong: number;
  totalBlank: number;
  isPassed: boolean; // >= KKM
  scannedAt: string;
  scanSource: 'CAMERA_REALTIME' | 'ADF_KYOCERA' | 'BATCH_UPLOAD' | 'MANUAL_EDIT';
  status: 'VERIFIED' | 'NEEDS_REVIEW' | 'AUTO_CONFIRMED';
  reviewNotes?: string;
  capturedImageUrl?: string;
  confidenceScore?: number;
  aiAssisted?: boolean;
  aiExplanation?: string;
}

export interface ItemAnalysis {
  questionNo: number;
  correctAnswer: OptionLetter;
  totalAnswered: number;
  correctCount: number;
  wrongCount: number;
  blankCount: number;
  correctRate: number; // Percentage 0 - 100%
  difficultyLevel: 'MUDAH' | 'SEDANG' | 'SUKAR';
  discriminatingPower: number; // Daya Beda (-1 to +1)
  optionPicks: Record<OptionLetter, number>;
  topic?: string;
}

export interface ClassAnalytics {
  examId: string;
  classId: string;
  totalStudents: number;
  averageScore: number;
  highestScore: number;
  lowestScore: number;
  passingRate: number; // percentage
  passedCount: number;
  failedCount: number;
  standardDeviation: number;
  gradeDistribution: {
    gradeA: number; // 90-100
    gradeB: number; // 80-89
    gradeC: number; // 70-79
    gradeD: number; // 60-69
    gradeE: number; // < 60
  };
  itemAnalyses: ItemAnalysis[];
}

export interface StudentHistoryRecord {
  examId: string;
  examTitle: string;
  subject: string;
  date: string;
  score: number;
  isPassed: boolean;
  kkm: number;
  rankInClass?: number;
  totalStudentsInClass?: number;
}

export interface KyoceraSettings {
  printerModel: string; // 'Kyocera ECOSYS M2535dn'
  ipAddress: string; // e.g. '192.168.1.200'
  port: number; // e.g. 9010 (Command Center RX / FTP port)
  protocol: 'NETWORK_PUSH' | 'FTP_SERVER' | 'SMB_SHARE' | 'DIRECT_HTTP';
  resolutionDpi: 200 | 300 | 400;
  colorMode: 'BLACK_WHITE' | 'GREYSCALE' | 'COLOR';
  duplexMode: 'SIMPLEX' | 'DUPLEX';
  autoSplitA4ToA5: boolean; // Otomatis potong A4 menjadi 2 LJK A5
  enableAutoCorrect: boolean;
  pollingIntervalSeconds: number;
}
