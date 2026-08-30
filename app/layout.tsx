import type {Metadata} from 'next';
import './globals.css'; // Global styles

export const metadata: Metadata = {
  title: 'Koreksi LJK Pro & Scanner ADF Kyocera',
  description: 'Aplikasi Penilaian Otomatis Lembar Jawaban Komputer (LJK Standar 1 Lembar A4 & A4 Dibagi 2) dengan pemindaian kamera real-time, analisis butir soal, analitik performa kelas, dan ekspor laporan Excel/PDF.',
  openGraph: {
    title: 'Koreksi LJK Pro & Scanner ADF Kyocera',
    description: 'Aplikasi Penilaian Otomatis Lembar Jawaban Komputer (LJK Standar 1 Lembar A4 & A4 Dibagi 2) dengan pemindaian kamera real-time, analisis butir soal, analitik performa kelas, dan ekspor laporan Excel/PDF.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Koreksi LJK Pro & Scanner ADF Kyocera',
    description: 'Aplikasi Penilaian Otomatis Lembar Jawaban Komputer (LJK Standar 1 Lembar A4 & A4 Dibagi 2) dengan pemindaian kamera real-time, analisis butir soal, analitik performa kelas, dan ekspor laporan Excel/PDF.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
