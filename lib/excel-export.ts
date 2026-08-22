import * as XLSX from 'xlsx';
import { ExamConfig, ScanResult, TeacherProfile, ClassAnalytics } from '@/types/omr';

export function exportExamResultsToExcel(
  exam: ExamConfig,
  results: ScanResult[],
  teacher: TeacherProfile,
  analytics: ClassAnalytics
): void {
  const wb = XLSX.utils.book_new();

  // 1. Sheet: Rekap Nilai
  const rekapData: any[] = [
    ['LAPORAN REKAPITULASI PENILAIAN HASIL LJK (OMR)'],
    [`Sekolah: ${teacher.namaSekolah}`, `Mata Pelajaran: ${exam.subject}`],
    [`Kelas: ${exam.gradeClass}`, `Guru Pengampu: ${teacher.namaGuru} (NIP: ${teacher.nip})`],
    [`Tanggal Ujian: ${exam.date}`, `Batas Kelulusan (KKM): ${exam.kkm}`],
    [],
    ['STATISTIK KELAS'],
    ['Jumlah Siswa', results.length, 'Rata-rata Kelas', analytics.averageScore.toFixed(2)],
    ['Nilai Tertinggi', analytics.highestScore, 'Nilai Terendah', analytics.lowestScore],
    ['Jumlah Tuntas', analytics.passedCount, 'Jumlah Remedial', analytics.failedCount],
    ['Persentase Kelulusan', `${analytics.passingRate.toFixed(1)}%`, 'Standar Deviasi', analytics.standardDeviation.toFixed(2)],
    [],
    ['No', 'No. Peserta', 'Nama Lengkap', 'Paket', 'Jml Benar', 'Jml Salah', 'Jml Kosong', 'Skor Mentah', 'Nilai Akhir', 'Status', 'Metode Scan', 'Waktu Scan']
  ];

  results.forEach((res, idx) => {
    rekapData.push([
      idx + 1,
      res.studentNo,
      res.studentName,
      res.packetCode,
      res.totalCorrect,
      res.totalWrong,
      res.totalBlank,
      res.rawScore,
      res.finalScore,
      res.isPassed ? 'TUNTAS' : 'REMEDIAL',
      res.scanSource,
      new Date(res.scannedAt).toLocaleString('id-ID')
    ]);
  });

  const wsRekap = XLSX.utils.aoa_to_sheet(rekapData);
  XLSX.utils.book_append_sheet(wb, wsRekap, 'Rekap Nilai');

  // 2. Sheet: Matriks Jawaban Siswa
  const packetA = exam.packets[0];
  const keys = packetA ? packetA.keys : {};
  const questionHeaders = Array.from({ length: exam.totalQuestions }, (_, i) => `Soal ${i + 1}`);
  
  const matrixData: any[] = [
    ['MATRIKS JAWABAN SISWA LJK'],
    [`Ujian: ${exam.title}`, `Mata Pelajaran: ${exam.subject} (${exam.gradeClass})`],
    [],
    ['KUNCI JAWABAN (Paket A)', '', ...Array.from({ length: exam.totalQuestions }, (_, i) => keys[i + 1] || '-')],
    [],
    ['No', 'No Peserta', 'Nama Siswa', 'Paket', ...questionHeaders, 'Total Benar', 'Nilai']
  ];

  results.forEach((res, idx) => {
    const studentRow = [
      idx + 1,
      res.studentNo,
      res.studentName,
      res.packetCode
    ];

    for (let q = 1; q <= exam.totalQuestions; q++) {
      const ans = res.answers[q] || '-';
      studentRow.push(ans);
    }

    studentRow.push(res.totalCorrect);
    studentRow.push(res.finalScore);
    matrixData.push(studentRow);
  });

  const wsMatrix = XLSX.utils.aoa_to_sheet(matrixData);
  XLSX.utils.book_append_sheet(wb, wsMatrix, 'Matriks Jawaban');

  // 3. Sheet: Analisis Butir Soal & Daya Beda
  const itemData: any[] = [
    ['ANALISIS BUTIR SOAL & DAYA BEDA (ITEM ANALYSIS)'],
    [`Mata Pelajaran: ${exam.subject}`, `Kelas: ${exam.gradeClass}`, `Total Peserta: ${results.length}`],
    [],
    [
      'No. Soal',
      'Kunci',
      'Topik / Kompetensi',
      'Jml Benar',
      'Jml Salah',
      'Jml Kosong',
      '% Kebenaran',
      'Tingkat Kesukaran',
      'Daya Beda (Index)',
      'Distribusi A',
      'Distribusi B',
      'Distribusi C',
      'Distribusi D',
      'Distribusi E'
    ]
  ];

  analytics.itemAnalyses.forEach(item => {
    itemData.push([
      item.questionNo,
      item.correctAnswer,
      item.topic || `Materi Soal ${item.questionNo}`,
      item.correctCount,
      item.wrongCount,
      item.blankCount,
      `${item.correctRate.toFixed(1)}%`,
      item.difficultyLevel,
      item.discriminatingPower.toFixed(2),
      item.optionPicks['A'] || 0,
      item.optionPicks['B'] || 0,
      item.optionPicks['C'] || 0,
      item.optionPicks['D'] || 0,
      item.optionPicks['E'] || 0
    ]);
  });

  const wsItem = XLSX.utils.aoa_to_sheet(itemData);
  XLSX.utils.book_append_sheet(wb, wsItem, 'Analisis Butir Soal');

  // Write file
  const fileName = `Rekap-Nilai-LJK-${exam.subject.replace(/\s+/g, '_')}_${exam.gradeClass.replace(/\s+/g, '_')}.xlsx`;
  XLSX.writeFile(wb, fileName);
}
