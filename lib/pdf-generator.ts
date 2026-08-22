import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TeacherProfile, ExamConfig, ScanResult, ClassAnalytics } from '@/types/omr';

/**
 * Generates and downloads Minimalist LJK A4 Divided by 2 (Landscape: 2x A5 LJKs side-by-side)
 */
export function generatePrintableLjkA4DividedBy2(
  exam: ExamConfig,
  teacher: TeacherProfile
): void {
  // A4 Landscape is 297mm x 210mm
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = 297;
  const pageHeight = 210;
  const halfWidth = pageWidth / 2; // 148.5mm per LJK

  // Draw two identical A5 LJKs: Left (X: 0) and Right (X: 148.5)
  [0, halfWidth].forEach((offsetX, sheetIndex) => {
    const margin = 8;
    const startX = offsetX + margin;
    const startY = margin;
    const sheetW = halfWidth - margin * 2;
    const sheetH = pageHeight - margin * 2;

    // 1. Fiducial Corner Markers (Black solid squares for high-precision scanner alignment)
    const markerSize = 4;
    doc.setFillColor(0, 0, 0);
    // Top-Left
    doc.rect(startX, startY, markerSize, markerSize, 'F');
    // Top-Right
    doc.rect(startX + sheetW - markerSize, startY, markerSize, markerSize, 'F');
    // Bottom-Left
    doc.rect(startX, startY + sheetH - markerSize, markerSize, markerSize, 'F');
    // Bottom-Right
    doc.rect(startX + sheetW - markerSize, startY + sheetH - markerSize, markerSize, markerSize, 'F');

    // 2. Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(teacher.namaSekolah.toUpperCase(), startX + sheetW / 2, startY + 5, { align: 'center' });
    doc.setFontSize(8);
    doc.text('LEMBAR JAWABAN KOMPUTER (LJK) FORMAT MINIMALIS', startX + sheetW / 2, startY + 9, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.text(`Mata Pelajaran: ${exam.subject} | Kelas: ${exam.gradeClass} | Th. Ajaran: ${teacher.tahunAjaran}`, startX + sheetW / 2, startY + 12.5, { align: 'center' });

    // Decorative Separator
    doc.setLineWidth(0.3);
    doc.line(startX + 4, startY + 14.5, startX + sheetW - 4, startY + 14.5);

    // 3. Petunjuk Singkat
    doc.setFontSize(5.5);
    doc.setFont('helvetica', 'italic');
    doc.text('Petunjuk: Hitamkan penuh bulatan [O] dengan Pensil 2B / Pulpen Hitam. Jangan terlipat/robek.', startX + 4, startY + 17.5);

    // 4. Identitas Siswa (Left Box) & Paket Soal (Right Box)
    const idBoxX = startX + 4;
    const idBoxY = startY + 19;
    const idBoxW = 75;
    const idBoxH = 50;

    doc.setDrawColor(50, 50, 50);
    doc.setLineWidth(0.2);
    doc.rect(idBoxX, idBoxY, idBoxW, idBoxH);

    // Fields: Nama, No Peserta, Tanggal, Tanda Tangan
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('NAMA PESERTA:', idBoxX + 2, idBoxY + 4);
    doc.setLineWidth(0.1);
    doc.rect(idBoxX + 2, idBoxY + 5.5, idBoxW - 4, 5); // Box to write name

    doc.text('NOMOR PESERTA (9 DIGIT):', idBoxX + 2, idBoxY + 14);
    // 9 Digit Columns with numbers 0..9 bubbles
    const digitStartX = idBoxX + 3;
    const digitStartY = idBoxY + 16;
    const colSpacing = 7.5;
    const rowSpacing = 3.2;

    for (let c = 0; c < 9; c++) {
      const cx = digitStartX + c * colSpacing;
      // Digit Header Box
      doc.rect(cx - 1.5, digitStartY - 1, 6, 3.5);
      
      // 0-9 Bubbles
      for (let r = 0; r <= 9; r++) {
        const cy = digitStartY + 5.5 + r * rowSpacing;
        doc.circle(cx + 1.5, cy, 1.2);
        doc.setFontSize(5);
        doc.setFont('helvetica', 'normal');
        doc.text(r.toString(), cx + 1.5, cy + 0.6, { align: 'center' });
      }
    }

    // Packet Box (A, B, C, D)
    const pktBoxX = idBoxX + idBoxW + 3;
    const pktBoxY = idBoxY;
    const pktBoxW = sheetW - idBoxW - 11;
    const pktBoxH = 22;

    doc.rect(pktBoxX, pktBoxY, pktBoxW, pktBoxH);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.text('PAKET SOAL', pktBoxX + pktBoxW / 2, pktBoxY + 4, { align: 'center' });

    ['A', 'B', 'C', 'D'].forEach((pkt, pIdx) => {
      const px = pktBoxX + 5 + pIdx * (pktBoxW / 4);
      const py = pktBoxY + 12;
      doc.circle(px + 4, py, 1.8);
      doc.setFontSize(6);
      doc.text(pkt, px + 4, py + 0.8, { align: 'center' });
    });

    // Tanggal & Tanda Tangan Box
    const signBoxY = pktBoxY + pktBoxH + 2;
    const signBoxH = idBoxH - pktBoxH - 2;
    doc.rect(pktBoxX, signBoxY, pktBoxW, signBoxH);
    doc.setFontSize(5.5);
    doc.text('TANGGAL: ____/____/202__', pktBoxX + 2, signBoxY + 4);
    doc.text('TANDA TANGAN SISWA:', pktBoxX + 2, signBoxY + 8);

    // 5. Grid Lembar Jawaban (Kolom 1: No 1-25, Kolom 2: No 26-50)
    const ansStartY = idBoxY + idBoxH + 4;
    const totalQ = exam.totalQuestions;
    const halfQ = Math.ceil(totalQ / 2);
    const options: string[] = exam.optionsCount === 4 ? ['A', 'B', 'C', 'D'] : ['A', 'B', 'C', 'D', 'E'];

    const col1X = startX + 4;
    const col2X = startX + sheetW / 2 + 2;
    const colW = sheetW / 2 - 6;

    // Sub-header Answers
    doc.setFillColor(240, 240, 240);
    doc.rect(col1X, ansStartY, colW, 4, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    doc.text('NO. JAWABAN PILIHAN GANDA (1 - ' + halfQ + ')', col1X + colW / 2, ansStartY + 2.8, { align: 'center' });

    if (totalQ > halfQ) {
      doc.rect(col2X, ansStartY, colW, 4, 'F');
      doc.text('NO. JAWABAN PILIHAN GANDA (' + (halfQ + 1) + ' - ' + totalQ + ')', col2X + colW / 2, ansStartY + 2.8, { align: 'center' });
    }

    const qRowH = Math.min(4.8, (sheetH - (ansStartY - startY) - 8) / halfQ);
    const bubbleSpacing = 7;

    for (let q = 1; q <= totalQ; q++) {
      const isCol2 = q > halfQ;
      const rowIdx = isCol2 ? q - halfQ - 1 : q - 1;
      const rowX = isCol2 ? col2X : col1X;
      const rowY = ansStartY + 5.5 + rowIdx * qRowH;

      // Question Number
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(5.5);
      doc.text(q.toString().padStart(2, '0') + '.', rowX + 2, rowY + 0.8);

      // Options Bubbles
      options.forEach((opt, optIdx) => {
        const bx = rowX + 11 + optIdx * bubbleSpacing;
        const by = rowY;

        doc.setDrawColor(60, 60, 60);
        doc.setLineWidth(0.2);
        doc.circle(bx, by, 1.5);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(5);
        doc.text(opt, bx, by + 0.6, { align: 'center' });
      });
    }

    // Bottom Verification Bar & Sheet ID
    doc.setFontSize(4.5);
    doc.setFont('helvetica', 'normal');
    doc.text(`[LJK-ID: ${exam.id}-S${sheetIndex + 1}] Valid for ADF Kyocera M2535dn & Live Cam OMR Scan`, startX + 6, startY + sheetH - 2);
  });

  // Center Cut-line (Garis Gunting / Pemotong A4 menjadi 2 Lembar A5)
  doc.setDrawColor(150, 150, 150);
  doc.setLineDashPattern([2, 2], 0);
  doc.line(halfWidth, 5, halfWidth, pageHeight - 5);
  doc.setFontSize(6);
  doc.setTextColor(120, 120, 120);
  doc.text('✂ GARIS POTONG (A4 DIBAGI 2 / FORMAT A5 HEMAT KERTAS) ✂', halfWidth, 6, { align: 'center', angle: 90 });

  doc.save(`LJK-Minimalis-A4-Bagi-2-${exam.subject.replace(/\s+/g, '-')}.pdf`);
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
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(teacher.namaSekolah.toUpperCase(), 105, 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text('LAPORAN HASIL PENILAIAN LEMBAR JAWABAN KOMPUTER (LJK)', 105, 20, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`${exam.title} - Mata Pelajaran: ${exam.subject} (${exam.gradeClass})`, 105, 25, { align: 'center' });
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

  doc.save(`Laporan-Nilai-${exam.subject.replace(/\s+/g, '-')}-${exam.gradeClass}.pdf`);
}
