import { GoogleGenAI, Type } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { imageBase64, totalQuestions = 25, optionsCount = 5, packetCode = 'A' } = body;

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({
        error: "GEMINI_API_KEY is not configured.",
        mockFallback: true
      }, { status: 200 });
    }

    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });

    const systemInstruction = `Anda adalah asisten AI pemeriksa Lembar Jawaban Komputer (LJK) & OMR Vision tingkat profesional untuk sekolah di Indonesia.
Tugas Anda adalah menganalisis gambar LJK, mengenali nomor peserta, paket soal, dan pilihan jawaban pada bulatan hitam (A, B, C, D, E).
Perhatikan arsiran pensil 2B, abaikan coretan atau bekas penghapus tipis.
Kembalikan data terstruktur dalam format JSON yang tepat.`;

    const promptText = `Periksa Lembar Jawaban Komputer (LJK) ini.
Total Soal: ${totalQuestions} butir pilihan ganda (${optionsCount === 4 ? 'A-D' : 'A-E'}).
Deteksi:
1. Nomor Peserta (9 atau 10 digit)
2. Paket Soal (A, B, C, atau D)
3. Jawaban setiap butir soal 1 sampai ${totalQuestions} (Pilihan huruf 'A'|'B'|'C'|'D'|'E', atau null jika tidak diarsir/kosong).
4. Catatan kualitas arsiran atau koreksi.`;

    const contents: any[] = [{ text: promptText }];

    if (imageBase64) {
      const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      contents.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: cleanBase64
        }
      });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.7-flash',
      contents: { parts: contents },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            studentNo: { type: Type.STRING, description: "Nomor peserta siswa yang terdeteksi dari bulatan LJK" },
            studentName: { type: Type.STRING, description: "Nama siswa jika terbaca dari kotak nama" },
            detectedPacket: { type: Type.STRING, description: "Kode paket soal (A, B, C, atau D)" },
            confidenceScore: { type: Type.NUMBER, description: "Skor keyakinan 0.0 - 1.0" },
            answers: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  questionNo: { type: Type.INTEGER },
                  markedOption: { type: Type.STRING, description: "Huruf 'A','B','C','D','E' atau null" },
                  isAmbiguous: { type: Type.BOOLEAN }
                },
                required: ["questionNo", "markedOption"]
              }
            },
            diagnosticNotes: { type: Type.STRING, description: "Catatan evaluasi visual atau kualitas pengisian LJK" }
          },
          required: ["studentNo", "detectedPacket", "answers", "confidenceScore"]
        }
      }
    });

    const rawText = response.text || '{}';
    const parsed = JSON.parse(rawText);

    return NextResponse.json({
      success: true,
      data: parsed
    });
  } catch (error: any) {
    console.error("Gemini OMR Correction API error:", error);
    return NextResponse.json({
      error: error.message || "Failed to process OMR with Gemini AI",
      success: false
    }, { status: 500 });
  }
}
