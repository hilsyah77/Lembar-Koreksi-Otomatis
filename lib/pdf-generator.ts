import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TeacherProfile, ExamConfig, ScanResult, ClassAnalytics } from '@/types/omr';

/**
 * Generates and downloads Full 1-Sheet A4 LJK (Single Student per Page, Full 1 Lembar A4 Portrait)
 * Configured with standard symmetric margins for neat border spacing & camera/scanner ADF alignment.
 */
export function generatePrintableLjkFullA4(
  exam: ExamConfig,
  teacher: TeacherProfile,
  marginMm: number = 10 // Standard 10mm symmetric margin
): void {
  // A4 Portrait: 210mm x 297mm
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginLeft = marginMm;
  const marginRight = marginMm;
  const marginTop = 8;
  const marginBottom = 8;
  const sheetW = pageWidth - marginLeft - marginRight;
  const sheetH = pageHeight - marginTop - marginBottom;

  // Use teacher subject and class (data guru pengampu)
  const displaySubject = teacher.mataPelajaran || exam.subject;
  const displayClass = teacher.tingkatKelas || exam.gradeClass;

  // 1. Fiducial Corner Markers (5mm x 5mm black squares for scanner alignment)
  const markerSize = 5;
  doc.setFillColor(0, 0, 0);
  doc.rect(marginLeft, marginTop, markerSize, markerSize, 'F'); // Top-Left
  doc.rect(marginLeft + sheetW - markerSize, marginTop, markerSize, markerSize, 'F'); // Top-Right
  doc.rect(marginLeft, marginTop + sheetH - markerSize, markerSize, markerSize, 'F'); // Bottom-Left
  doc.rect(marginLeft + sheetW - markerSize, marginTop + sheetH - markerSize, markerSize, markerSize, 'F'); // Bottom-Right

  // 2. Official Header (Kop Lembar Jawaban Komputer)
  const centerX = marginLeft + sheetW / 2;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12.5);
  doc.text(teacher.namaSekolah.toUpperCase(), centerX, marginTop + 6.5, { align: 'center' });
  doc.setFontSize(10.5);
  doc.text('LEMBAR JAWABAN KOMPUTER (LJK)', centerX, marginTop + 11.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(
    `Mata Pelajaran: ${displaySubject}  |  Kelas: ${displayClass}  |  Tahun Ajaran: ${teacher.tahunAjaran} (${teacher.semester})`,
    centerX,
    marginTop + 16,
    { align: 'center' }
  );

  // Decorative Double Lines
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(marginLeft + 3, marginTop + 18.2, marginLeft + sheetW - 3, marginTop + 18.2);
  doc.setLineWidth(0.2);
  doc.line(marginLeft + 3, marginTop + 19.2, marginLeft + sheetW - 3, marginTop + 19.2);

  // 3. Petunjuk Pengisian Singkat (Petunjuk Pensil 2B)
  const petunjukY = marginTop + 21;
  const contentW = sheetW - 6;
  doc.setFillColor(248, 248, 248);
  doc.rect(marginLeft + 3, petunjukY, contentW, 7.5, 'F');
  doc.rect(marginLeft + 3, petunjukY, contentW, 7.5, 'S');

  doc.setFontSize(6.5);
  doc.setFont('helvetica', 'bold');
  doc.text('PETUNJUK PENGISIAN:', marginLeft + 5, petunjukY + 3.2);
  doc.setFont('helvetica', 'normal');
  doc.text(
    '1. Hitamkan bulatan penuh [●] dengan Pensil 2B / Pulpen Hitam.  2. Jangan melipat atau merobek LJK.  3. Hapus bersih jika ada kesalahan.',
    marginLeft + 5,
    petunjukY + 6.2
  );

  // 4. Identitas Siswa & NISN Matrix Box (Left) & Paket / Info (Right)
  const idStartY = petunjukY + 9;
  const idBoxW = contentW;
  const idBoxH = 68;

  doc.setLineWidth(0.3);
  doc.rect(marginLeft + 3, idStartY, idBoxW, idBoxH);

  // Nama Peserta (Upper identity box)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text('NAMA PESERTA :', marginLeft + 6, idStartY + 4.8);
  doc.rect(marginLeft + 32, idStartY + 1.5, idBoxW - 31, 5.5); // Nama input box

  // Split section under Name: NISN Matrix (Left) and Paket/Sign/Tgl (Right)
  const subIdY = idStartY + 8.5;
  const nisnBoxW = 106;
  const sideBoxW = idBoxW - nisnBoxW - 4;
  const sideBoxX = marginLeft + 3 + nisnBoxW + 2;

  // --- NISN / NOMOR PESERTA MATRIX ---
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('NOMOR PESERTA / NISN (10 DIGIT):', marginLeft + 6, subIdY + 3.8);

  const digitStartX = marginLeft + 6;
  const digitStartY = subIdY + 5.5;
  const colSpacing = 10.0;
  const rowSpacing = 4.3;

  for (let c = 0; c < 10; c++) {
    const cx = digitStartX + c * colSpacing;
    // Digit Header Box (for written number)
    doc.setLineWidth(0.2);
    doc.rect(cx, digitStartY, 8.2, 4.8);

    // Bubbles 0 - 9
    for (let r = 0; r <= 9; r++) {
      const cy = digitStartY + 7.2 + r * rowSpacing;
      doc.circle(cx + 4.1, cy, 1.7);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6);
      doc.text(r.toString(), cx + 4.1, cy + 0.7, { align: 'center' });
    }
  }

  // --- RIGHT PANEL: Paket Soal, Tanggal, Ruang & Tanda Tangan ---
  // Paket Soal
  doc.rect(sideBoxX, subIdY, sideBoxW, 15.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.text('PAKET SOAL', sideBoxX + sideBoxW / 2, subIdY + 3.8, { align: 'center' });

  ['A', 'B', 'C', 'D'].forEach((pkt, pIdx) => {
    const px = sideBoxX + 6 + pIdx * (sideBoxW / 4.3);
    const py = subIdY + 9.5;
    doc.circle(px + 3.5, py, 2.1);
    doc.setFontSize(7);
    doc.setFont('helvetica', 'bold');
    doc.text(pkt, px + 3.5, py + 0.9, { align: 'center' });
  });

  // Tanggal & Ruang Ujian
  const tglY = subIdY + 17;
  doc.rect(sideBoxX, tglY, sideBoxW, 14.5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('RUANG / KELAS :', sideBoxX + 2.5, tglY + 4.2);
  doc.text('TGL UJIAN      :', sideBoxX + 2.5, tglY + 9.5);
  doc.setFont('helvetica', 'normal');
  doc.text(`${displayClass}`, sideBoxX + 25, tglY + 4.2);
  doc.text(`${exam.date || '___/___/202_'}`, sideBoxX + 25, tglY + 9.5);

  // Tanda Tangan Peserta
  const ttdY = tglY + 16;
  const ttdH = idBoxH - (ttdY - idStartY) - 2;
  doc.rect(sideBoxX, ttdY, sideBoxW, ttdH);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.text('TANDA TANGAN PESERTA :', sideBoxX + 2.5, ttdY + 4.2);

  // 5. Lembar Jawaban Pilihan Ganda (1 - 50 Soal)
  const ansStartY = idStartY + idBoxH + 3;
  const ansBoxH = sheetH - (ansStartY - marginTop) - 13;
  doc.rect(marginLeft + 3, ansStartY, idBoxW, ansBoxH);

  // Answer Grid Header
  doc.setFillColor(240, 240, 240);
  doc.rect(marginLeft + 3, ansStartY, idBoxW, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(
    `LEMBAR JAWABAN PILIHAN GANDA (NOMOR 1 s.d ${exam.totalQuestions})`,
    centerX,
    ansStartY + 3.9,
    { align: 'center' }
  );

  const totalQ = exam.totalQuestions;
  const options: string[] = exam.optionsCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

  // Columns layout: 2 columns for <=25, 3 columns for 30-40, 4 columns for 50
  const numCols = totalQ <= 25 ? 2 : totalQ <= 40 ? 3 : 4;
  const qPerCol = Math.ceil(totalQ / numCols);
  const colWidth = (idBoxW - 4) / numCols;
  const rowSpacingAns = Math.min(8.0, (ansBoxH - 10) / qPerCol);
  const bubbleSpacing = exam.optionsCount === 4 ? 5.8 : 4.8;

  for (let q = 1; q <= totalQ; q++) {
    const colIdx = Math.floor((q - 1) / qPerCol);
    const rowIdx = (q - 1) % qPerCol;

    const qX = marginLeft + 5 + colIdx * colWidth;
    const qY = ansStartY + 8.0 + rowIdx * rowSpacingAns;

    // Nomor Soal
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.text(q.toString().padStart(2, '0') + '.', qX + 1.2, qY + 0.9);

    // Bulatan Jawaban (Posisi dekat dan rapat dengan nomor urut)
    options.forEach((opt, optIdx) => {
      const bx = qX + 6.8 + optIdx * bubbleSpacing;
      const by = qY;

      doc.setDrawColor(50, 50, 50);
      doc.setLineWidth(0.2);
      doc.circle(bx, by, 1.8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text(opt, bx, by + 0.7, { align: 'center' });
    });
  }

  // Draw subtle column dividers
  for (let c = 1; c < numCols; c++) {
    const divX = marginLeft + 3 + c * colWidth;
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(divX, ansStartY + 5.5, divX, ansStartY + ansBoxH);
  }

  // 6. Bottom Calibration & Metadata Footer
  const footerY = marginTop + sheetH - 3.5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6);
  doc.text(
    `[LJK STANDAR A4 • ID: ${exam.id}] Terkalibrasi ADF Kyocera ECOSYS M2535dn & Kamera Ponsel`,
    marginLeft + 4,
    footerY
  );
  doc.setFont('helvetica', 'bold');
  doc.text('KEMENTERIAN AGAMA / DINAS PENDIDIKAN', marginLeft + sheetW - 4, footerY, { align: 'right' });

  doc.save(`LJK-Standar-A4-${displaySubject.replace(/\s+/g, '-')}.pdf`);
}

/**
 * Generates and downloads Minimalist LJK A4 Divided by 2 (Full 1 Sheet A4 divided for 2 Students)
 * Supports Landscape (Left & Right halves) or Portrait (Top & Bottom halves) for 50% paper saving.
 */
export function generatePrintableLjkA4DividedBy2(
  exam: ExamConfig,
  teacher: TeacherProfile,
  orientation: 'portrait' | 'landscape' = 'landscape',
  marginMm: number = 5
): void {
  const isPortrait = orientation === 'portrait';

  // A4 Dimensions: Portrait is 210mm x 297mm, Landscape is 297mm x 210mm
  const doc = new jsPDF({
    orientation: isPortrait ? 'portrait' : 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = isPortrait ? 210 : 297;
  const pageHeight = isPortrait ? 297 : 210;

  if (isPortrait) {
    // PORTRAIT: Top (Y: 0..148.5) and Bottom (Y: 148.5..297)
    const halfHeight = pageHeight / 2; // 148.5mm per LJK
    const marginLeft = marginMm;
    const marginRight = marginMm;
    const marginY = 6;

    [0, halfHeight].forEach((offsetY, sheetIndex) => {
      const startX = marginLeft;
      const startY = offsetY + marginY;
      const sheetW = pageWidth - marginLeft - marginRight;
      const sheetH = halfHeight - marginY * 2;

      // 1. Fiducial Corner Markers
      const markerSize = 3.5;
      doc.setFillColor(0, 0, 0);
      doc.rect(startX, startY, markerSize, markerSize, 'F');
      doc.rect(startX + sheetW - markerSize, startY, markerSize, markerSize, 'F');
      doc.rect(startX, startY + sheetH - markerSize, markerSize, markerSize, 'F');
      doc.rect(startX + sheetW - markerSize, startY + sheetH - markerSize, markerSize, markerSize, 'F');

      // 2. Header
      const displaySubject = teacher.mataPelajaran || exam.subject;
      const displayClass = teacher.tingkatKelas || exam.gradeClass;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(teacher.namaSekolah.toUpperCase(), startX + sheetW / 2, startY + 4.5, { align: 'center' });
      doc.setFontSize(7.5);
      doc.text('LEMBAR JAWABAN KOMPUTER (LJK) - A4 DIBAGI 2', startX + sheetW / 2, startY + 8.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.text(`Mata Pelajaran: ${displaySubject} | Kelas: ${displayClass} | Th. Ajaran: ${teacher.tahunAjaran} (${teacher.semester})`, startX + sheetW / 2, startY + 12, { align: 'center' });

      // Decorative Separator
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.3);
      doc.line(startX + 4, startY + 13.8, startX + sheetW - 4, startY + 13.8);

      // 3. Petunjuk Singkat
      doc.setFontSize(5);
      doc.setFont('helvetica', 'italic');
      doc.text('Petunjuk: Hitamkan penuh bulatan [●] dengan Pensil 2B / Pulpen Hitam. Jangan terlipat, robek, atau kotor.', startX + 4, startY + 16.8);

      // 4. Main Body: Split into Left Box (Identitas) and Right Box (Pilihan Ganda)
      const contentStartY = startY + 18.5;
      const idBoxW = 84;
      const ansBoxW = sheetW - idBoxW - 4;

      // --- LEFT BOX: Identitas & NISN & Paket ---
      const idBoxX = startX + 2;
      const idBoxY = contentStartY;
      const idBoxH = sheetH - 24;

      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.2);
      doc.rect(idBoxX, idBoxY, idBoxW, idBoxH);

      // Nama Peserta
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text('NAMA PESERTA:', idBoxX + 2.5, idBoxY + 3.8);
      doc.rect(idBoxX + 2.5, idBoxY + 4.8, idBoxW - 5, 4.5);

      // NISN (10 DIGIT)
      doc.text('NOMOR PESERTA / NISN (10 DIGIT):', idBoxX + 2.5, idBoxY + 13);
      const digitStartX = idBoxX + 3;
      const digitStartY = idBoxY + 14.5;
      const colSpacing = 5.4;
      const rowSpacing = 2.8;

      for (let c = 0; c < 10; c++) {
        const cx = digitStartX + c * colSpacing;
        doc.rect(cx - 1.2, digitStartY, 4.5, 3.2);
        
        for (let r = 0; r <= 9; r++) {
          const cy = digitStartY + 4.8 + r * rowSpacing;
          doc.circle(cx + 1.1, cy, 1.0);
          doc.setFontSize(4.5);
          doc.setFont('helvetica', 'normal');
          doc.text(r.toString(), cx + 1.1, cy + 0.5, { align: 'center' });
        }
      }

      // NISN Right details: Paket Soal, Tanggal, Tanda Tangan
      const sideBoxX = digitStartX + 10 * colSpacing + 1.5;
      const sideBoxW = idBoxW - (sideBoxX - idBoxX) - 2;

      // Paket Soal Box
      doc.rect(sideBoxX, digitStartY, sideBoxW, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text('PAKET', sideBoxX + sideBoxW / 2, digitStartY + 3.2, { align: 'center' });

      ['A', 'B', 'C', 'D'].forEach((pkt, pIdx) => {
        const col = pIdx % 2;
        const row = Math.floor(pIdx / 2);
        const px = sideBoxX + 3.5 + col * 9;
        const py = digitStartY + 6.5 + row * 4.5;
        doc.circle(px, py, 1.1);
        doc.setFontSize(4.5);
        doc.setFont('helvetica', 'normal');
        doc.text(pkt, px, py + 0.5, { align: 'center' });
      });

      // Tanggal & Tanda Tangan Box
      const signY = digitStartY + 15.5;
      const signH = idBoxH - (signY - idBoxY) - 2;
      doc.rect(sideBoxX, signY, sideBoxW, signH);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(4.5);
      doc.text('TGL: ___/___', sideBoxX + 1.5, signY + 3.5);
      doc.text('TTD:', sideBoxX + 1.5, signY + 7);

      // --- RIGHT BOX: Lembar Pilihan Ganda (1 - N Soal) ---
      const ansBoxX = idBoxX + idBoxW + 2;
      const ansBoxY = contentStartY;
      const ansBoxH = idBoxH;

      doc.rect(ansBoxX, ansBoxY, ansBoxW, ansBoxH);

      // Header Answers
      doc.setFillColor(242, 242, 242);
      doc.rect(ansBoxX, ansBoxY, ansBoxW, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text(`PILIHAN JAWABAN GANDA (1 - ${exam.totalQuestions})`, ansBoxX + ansBoxW / 2, ansBoxY + 2.8, { align: 'center' });

      const totalQ = exam.totalQuestions;
      const options: string[] = exam.optionsCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];
      
      const numCols = totalQ <= 30 ? 2 : totalQ <= 45 ? 3 : 3;
      const qPerCol = Math.ceil(totalQ / numCols);
      const colWidth = ansBoxW / numCols;
      const rowSpacingAns = Math.min(4.4, (ansBoxH - 7) / qPerCol);
      const bubbleSpacing = exam.optionsCount === 4 ? 4.5 : 3.8;

      for (let q = 1; q <= totalQ; q++) {
        const colIdx = Math.floor((q - 1) / qPerCol);
        const rowIdx = (q - 1) % qPerCol;

        const qX = ansBoxX + 1.2 + colIdx * colWidth;
        const qY = ansBoxY + 5.5 + rowIdx * rowSpacingAns;

        // Question Number
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5);
        doc.text(q.toString().padStart(2, '0') + '.', qX + 1, qY + 0.6);

        // Option Bubbles (closer to question number)
        options.forEach((opt, optIdx) => {
          const bx = qX + 5.0 + optIdx * bubbleSpacing;
          const by = qY;

          doc.setDrawColor(60, 60, 60);
          doc.setLineWidth(0.18);
          doc.circle(bx, by, 1.2);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(4.5);
          doc.text(opt, bx, by + 0.5, { align: 'center' });
        });
      }

      // Bottom Bar
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`[LJK-A4-BAGI-2 • SISWA ${sheetIndex + 1}] Scan via Kyocera M2535dn`, startX + 4, startY + sheetH - 1.5);
    });

    // Horizontal Center Cut-Line (Garis Potong Tengah Bersih)
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(marginLeft, halfHeight, pageWidth - marginRight, halfHeight);
    doc.setLineDashPattern([], 0);
  } else {
    // LANDSCAPE: Left (140 mm) and Right (140 mm) centered on A4 Landscape (297 x 210 mm)
    // Paper size: 297mm width x 210mm height
    // Exactly 140 mm for Left LJK & 140 mm for Right LJK
    // Half A4 width = 148.5 mm
    // Centered per half sheet: marginX = (148.5 - 140.0) / 2 = 4.25 mm (0.425 cm)
    // Vertical margin: marginY = 5.0 mm (0.5 cm) -> Height = 200.0 mm
    const sheetW = 140.0; // Exact 140 mm
    const marginY = 5.0; // 5 mm (0.5 cm)
    const sheetH = pageHeight - marginY * 2; // 200 mm
    const halfWidth = pageWidth / 2; // 148.5 mm
    const halfMargin = (halfWidth - sheetW) / 2; // 4.25 mm

    [0, 1].forEach((sheetIndex) => {
      const startX = sheetIndex === 0 ? halfMargin : halfWidth + halfMargin;
      const startY = marginY;

      // 1. Fiducial Corner Markers for scanner auto-calibration (precise 4 corners)
      const markerSize = 3.8;
      doc.setFillColor(0, 0, 0);
      doc.rect(startX, startY, markerSize, markerSize, 'F'); // Top-Left
      doc.rect(startX + sheetW - markerSize, startY, markerSize, markerSize, 'F'); // Top-Right
      doc.rect(startX, startY + sheetH - markerSize, markerSize, markerSize, 'F'); // Bottom-Left
      doc.rect(startX + sheetW - markerSize, startY + sheetH - markerSize, markerSize, markerSize, 'F'); // Bottom-Right

      // 2. Official Header
      const displaySubject = teacher.mataPelajaran || exam.subject;
      const displayClass = teacher.tingkatKelas || exam.gradeClass;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(teacher.namaSekolah.toUpperCase(), startX + sheetW / 2, startY + 4.5, { align: 'center' });
      doc.setFontSize(7.5);
      doc.text('LEMBAR JAWABAN KOMPUTER (LJK)', startX + sheetW / 2, startY + 8.2, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.2);
      doc.text(`Mapel: ${displaySubject} | Kelas: ${displayClass} | Th. Ajaran: ${teacher.tahunAjaran}`, startX + sheetW / 2, startY + 11.5, { align: 'center' });

      // Separator Double Line
      doc.setDrawColor(0, 0, 0);
      doc.setLineWidth(0.4);
      doc.line(startX + 3, startY + 13.2, startX + sheetW - 3, startY + 13.2);
      doc.setLineWidth(0.15);
      doc.line(startX + 3, startY + 14.0, startX + sheetW - 3, startY + 14.0);

      // 3. Petunjuk Singkat
      const petunjukY = startY + 15.2;
      doc.setFillColor(248, 248, 248);
      doc.rect(startX + 3, petunjukY, sheetW - 6, 6, 'F');
      doc.rect(startX + 3, petunjukY, sheetW - 6, 6, 'S');
      doc.setFontSize(5);
      doc.setFont('helvetica', 'bold');
      doc.text('PETUNJUK:', startX + 4.5, petunjukY + 2.5);
      doc.setFont('helvetica', 'normal');
      doc.text('1. Hitamkan bulatan [●] dgn Pensil 2B/Pulpen. 2. Jgn lipat/robek. 3. Hapus bersih jika salah.', startX + 4.5, petunjukY + 4.8);

      // 4. Identitas Siswa Box (Left: NISN 10-Digit Matrix, Right: Nama, Paket, TTD)
      const idStartY = petunjukY + 7.5;
      const idBoxH = 63;
      const idBoxW = sheetW - 6; // 134.0mm

      doc.setDrawColor(60, 60, 60);
      doc.setLineWidth(0.2);
      doc.rect(startX + 3, idStartY, idBoxW, idBoxH);

      // Nama Peserta (Top Row)
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6);
      doc.text('NAMA PESERTA:', startX + 5, idStartY + 3.8);
      doc.rect(startX + 23, idStartY + 1.2, idBoxW - 22, 4.2);

      // Left Column inside ID box: NISN 10 Digit Matrix
      const nisnBoxW = 75;
      const nisnStartY = idStartY + 6.8;
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text('NOMOR PESERTA / NISN (10 DIGIT):', startX + 5, nisnStartY + 3.0);

      const digitStartX = startX + 5.5;
      const digitStartY = nisnStartY + 4.5;
      const colSpacing = 6.7;
      const rowSpacing = 3.4;

      for (let c = 0; c < 10; c++) {
        const cx = digitStartX + c * colSpacing;
        doc.rect(cx - 1.2, digitStartY, 5.0, 3.2); // input box
        
        for (let r = 0; r <= 9; r++) {
          const cy = digitStartY + 5.0 + r * rowSpacing;
          doc.setDrawColor(60, 60, 60);
          doc.circle(cx + 1.3, cy, 1.2);
          doc.setFontSize(4.5);
          doc.setFont('helvetica', 'normal');
          doc.text(r.toString(), cx + 1.3, cy + 0.6, { align: 'center' });
        }
      }

      // Right Column inside ID box: Paket Soal, Ruang & Tanda Tangan
      const rightColX = startX + 3 + nisnBoxW + 3;
      const rightColW = idBoxW - nisnBoxW - 5;

      // Paket Soal Box
      doc.rect(rightColX, nisnStartY, rightColW, 14);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text('PAKET SOAL', rightColX + rightColW / 2, nisnStartY + 3.2, { align: 'center' });

      ['A', 'B', 'C', 'D'].forEach((pkt, pIdx) => {
        const px = rightColX + 3.2 + pIdx * (rightColW / 4);
        const py = nisnStartY + 8.5;
        doc.circle(px + 2.8, py, 1.4);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'bold');
        doc.text(pkt, px + 2.8, py + 0.7, { align: 'center' });
      });

      // Ruang & Tanggal Box
      const infoY = nisnStartY + 15.5;
      doc.rect(rightColX, infoY, rightColW, 9.5);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.text(`RUANG : ${displayClass}`, rightColX + 2, infoY + 3.5);
      doc.text(`TGL   : ${exam.date || '___/___/202_'}`, rightColX + 2, infoY + 7.5);

      // TTD Peserta Box
      const signY = infoY + 11;
      const signH = idBoxH - (signY - idStartY) - 2;
      doc.rect(rightColX, signY, rightColW, signH);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5);
      doc.text('TTD PESERTA:', rightColX + 2, signY + 3.5);
      doc.setLineDashPattern([1, 1], 0);
      doc.line(rightColX + 4, signY + signH - 2, rightColX + rightColW - 4, signY + signH - 2);
      doc.setLineDashPattern([], 0); // reset dash

      // 5. Multiple Choice Answer Grid (1 - N Soal)
      const ansStartY = idStartY + idBoxH + 3.5;
      const ansBoxH = sheetH - (ansStartY - startY) - 5.5;
      const totalQ = exam.totalQuestions;
      const options: string[] = exam.optionsCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

      doc.rect(startX + 3, ansStartY, idBoxW, ansBoxH);

      // Header Answers
      doc.setFillColor(242, 242, 242);
      doc.rect(startX + 3, ansStartY, idBoxW, 4, 'F');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text(`LEMBAR JAWABAN PILIHAN GANDA (1 s.d ${totalQ})`, startX + 3 + idBoxW / 2, ansStartY + 2.8, { align: 'center' });

      // Column calculations
      const numCols = totalQ <= 25 ? 2 : totalQ <= 40 ? 3 : 4;
      const qPerCol = Math.ceil(totalQ / numCols);
      const colWidth = (idBoxW - 4) / numCols;
      const rowSpacingAns = Math.min(5.0, (ansBoxH - 6.5) / qPerCol);
      const bubbleSpacing = exam.optionsCount === 4 ? 4.9 : 4.1;

      for (let q = 1; q <= totalQ; q++) {
        const colIdx = Math.floor((q - 1) / qPerCol);
        const rowIdx = (q - 1) % qPerCol;

        const qX = startX + 5 + colIdx * colWidth;
        const qY = ansStartY + 6.0 + rowIdx * rowSpacingAns;

        // Question Number
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(5);
        doc.text(q.toString().padStart(2, '0') + '.', qX + 1, qY + 0.6);

        // Bubbles
        options.forEach((opt, optIdx) => {
          const bx = qX + 5.5 + optIdx * bubbleSpacing;
          const by = qY;

          doc.setDrawColor(60, 60, 60);
          doc.setLineWidth(0.18);
          doc.circle(bx, by, 1.3);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(4.5);
          doc.text(opt, bx, by + 0.5, { align: 'center' });
        });
      }

      // Footer Info
      doc.setFontSize(4.5);
      doc.setFont('helvetica', 'normal');
      doc.text(`[LJK-A4-LANDSCAPE • 140mm • SISWA ${sheetIndex + 1} • ID: ${exam.id}] Kyocera M2535dn`, startX + 4, startY + sheetH - 1.5);
      doc.setFont('helvetica', 'bold');
      doc.text('KEMENAG / DISDIK', startX + sheetW - 4, startY + sheetH - 1.5, { align: 'right' });
    });

    // Vertical Center Cut Line (Garis Potong Tengah Presisi di X = 148.5 mm)
    doc.setDrawColor(160, 160, 160);
    doc.setLineWidth(0.2);
    doc.setLineDashPattern([2, 2], 0);
    doc.line(halfWidth, marginY, halfWidth, pageHeight - marginY);
    doc.setLineDashPattern([], 0);
  }

  const orientationLabel = isPortrait ? 'Portrait' : 'Landscape';
  const displaySubject = teacher.mataPelajaran || exam.subject;
  doc.save(`LJK-A4-${orientationLabel}-Bagi-2-${displaySubject.replace(/\s+/g, '-')}.pdf`);
}

/**
 * Generates Comprehensive Exam Score Report PDF
 */
export function generateExamReportPdf(
  exam: ExamConfig,
  results: ScanResult[],
  teacher: TeacherProfile,
  analytics: ClassAnalytics
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // 1. Kop Surat Resmi
  const displaySubject = teacher.mataPelajaran || exam.subject;
  const displayClass = teacher.tingkatKelas || exam.gradeClass;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(teacher.namaSekolah.toUpperCase(), 105, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text('LAPORAN HASIL PENILAIAN LEMBAR JAWABAN KOMPUTER (LJK)', 105, 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${exam.title} - Mata Pelajaran: ${displaySubject} (${displayClass})`, 105, 25, { align: 'center' });
  doc.text(`Tahun Ajaran: ${teacher.tahunAjaran} | Semester: ${teacher.semester} | Tanggal: ${exam.date}`, 105, 29, { align: 'center' });

  doc.setLineWidth(0.6);
  doc.line(14, 32, 196, 32);
  doc.setLineWidth(0.2);
  doc.line(14, 33, 196, 33);

  // 2. Summary Statistics Box
  doc.setFillColor(245, 247, 250);
  doc.rect(14, 36, 182, 22, 'F');
  doc.setDrawColor(210, 220, 230);
  doc.rect(14, 36, 182, 22, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('RINGKASAN STATISTIK KELAS:', 18, 41);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.text(`• Total Peserta: ${results.length} Siswa`, 18, 46);
  doc.text(`• Rata-rata Kelas: ${analytics.averageScore.toFixed(1)}`, 18, 51);
  doc.text(`• Nilai Tertinggi: ${analytics.highestScore}`, 18, 56);

  doc.text(`• Nilai Terendah: ${analytics.lowestScore}`, 85, 46);
  doc.text(`• Standar Deviasi: ${analytics.standardDeviation.toFixed(2)}`, 85, 51);
  doc.text(`• Batas Kelulusan (KKM): ${exam.kkm}`, 85, 56);

  doc.text(`• Jumlah Tuntas: ${analytics.passedCount} Siswa (${analytics.passingRate.toFixed(1)}%)`, 140, 46);
  doc.text(`• Jumlah Remedial: ${analytics.failedCount} Siswa`, 140, 51);
  doc.text(`• Metode Koreksi: OMR Scan & ADF Kyocera`, 140, 56);

  // 3. Student Table
  const tableData = results.map((res, idx) => [
    idx + 1,
    res.studentNo,
    res.studentName,
    res.packetCode,
    res.totalCorrect,
    res.totalWrong,
    res.totalBlank,
    res.finalScore,
    res.isPassed ? 'TUNTAS' : 'REMEDIAL'
  ]);

  autoTable(doc, {
    startY: 62,
    head: [['No', 'No. Peserta', 'Nama Siswa', 'Pkt', 'Benar', 'Salah', 'Kosong', 'Nilai', 'Keterangan']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 64, 175], // Deep Indigo / Blue
      textColor: [255, 255, 255],
      fontSize: 7.5,
      halign: 'center'
    },
    bodyStyles: {
      fontSize: 7,
      cellPadding: 1.5
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { halign: 'center', cellWidth: 24 },
      2: { halign: 'left', cellWidth: 58 },
      3: { halign: 'center', cellWidth: 10 },
      4: { halign: 'center', cellWidth: 14 },
      5: { halign: 'center', cellWidth: 14 },
      6: { halign: 'center', cellWidth: 14 },
      7: { halign: 'center', fontStyle: 'bold', cellWidth: 16 },
      8: { halign: 'center', cellWidth: 24 }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 8) {
        if (data.cell.raw === 'TUNTAS') {
          data.cell.styles.textColor = [22, 101, 52]; // Green
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [185, 28, 28]; // Red
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });

  // 4. Signature Section (Tanda Tangan Guru & Kepala Sekolah)
  const finalY = (doc as any).lastAutoTable ? (doc as any).lastAutoTable.finalY + 12 : 230;
  
  if (finalY < 250) {
    const signY = finalY;
    doc.setFontSize(8);
    doc.text(`Mengetahui,`, 30, signY);
    doc.text(`Kepala Sekolah`, 30, signY + 4);
    doc.text(`( .................................................. )`, 30, signY + 22);
    doc.text(`NIP. .............................................`, 30, signY + 26);

    doc.text(`${teacher.namaSekolah.split(' ')[0] || 'Kota'}, ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 140, signY);
    doc.text(`Guru Pengampu Mata Pelajaran`, 140, signY + 4);
    doc.setFont('helvetica', 'bold');
    doc.text(teacher.tandaTanganNama || teacher.namaGuru, 140, signY + 22);
    doc.setFont('helvetica', 'normal');
    doc.text(`NIP. ${teacher.nip}`, 140, signY + 26);
  }

  doc.save(`Laporan-Nilai-${displaySubject.replace(/\s+/g, '-')}-${displayClass.replace(/\s+/g, '-')}.pdf`);
}
