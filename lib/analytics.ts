import { ExamConfig, ScanResult, ClassAnalytics, ItemAnalysis, OptionLetter } from '@/types/omr';

export function calculateClassAnalytics(
  exam: ExamConfig,
  results: ScanResult[]
): ClassAnalytics {
  if (!results || results.length === 0) {
    return {
      examId: exam.id,
      classId: exam.gradeClass,
      totalStudents: 0,
      averageScore: 0,
      highestScore: 0,
      lowestScore: 0,
      passingRate: 0,
      passedCount: 0,
      failedCount: 0,
      standardDeviation: 0,
      gradeDistribution: { gradeA: 0, gradeB: 0, gradeC: 0, gradeD: 0, gradeE: 0 },
      itemAnalyses: []
    };
  }

  const scores = results.map(r => r.finalScore);
  const totalStudents = results.length;
  const sumScores = scores.reduce((a, b) => a + b, 0);
  const averageScore = Math.round((sumScores / totalStudents) * 10) / 10;
  const highestScore = Math.max(...scores);
  const lowestScore = Math.min(...scores);

  const passedResults = results.filter(r => r.finalScore >= exam.kkm);
  const passedCount = passedResults.length;
  const failedCount = totalStudents - passedCount;
  const passingRate = Math.round((passedCount / totalStudents) * 1000) / 10;

  // Standard Deviation
  const variance = scores.reduce((sum, score) => sum + Math.pow(score - averageScore, 2), 0) / totalStudents;
  const standardDeviation = Math.round(Math.sqrt(variance) * 100) / 100;

  // Grade Distribution
  const gradeDistribution = {
    gradeA: results.filter(r => r.finalScore >= 90).length,
    gradeB: results.filter(r => r.finalScore >= 80 && r.finalScore < 90).length,
    gradeC: results.filter(r => r.finalScore >= 70 && r.finalScore < 80).length,
    gradeD: results.filter(r => r.finalScore >= 60 && r.finalScore < 70).length,
    gradeE: results.filter(r => r.finalScore < 60).length
  };

  // Item Analysis & Discriminating Power
  // Sort students by score descending for Upper 27% vs Lower 27% discrimination
  const sortedResults = [...results].sort((a, b) => b.finalScore - a.finalScore);
  const groupSize = Math.max(1, Math.round(totalStudents * 0.27));
  const upperGroup = sortedResults.slice(0, groupSize);
  const lowerGroup = sortedResults.slice(-groupSize);

  const primaryPacket = exam.packets[0];
  const keys = primaryPacket ? primaryPacket.keys : {};
  const itemAnalyses: ItemAnalysis[] = [];

  for (let q = 1; q <= exam.totalQuestions; q++) {
    const correctKey = keys[q] || 'A';
    let correctCount = 0;
    let wrongCount = 0;
    let blankCount = 0;
    const optionPicks: Record<OptionLetter, number> = { A: 0, B: 0, C: 0, D: 0, E: 0 };

    results.forEach(res => {
      const studentAns = res.answers[q];
      if (!studentAns) {
        blankCount++;
      } else {
        optionPicks[studentAns] = (optionPicks[studentAns] || 0) + 1;
        if (studentAns === correctKey) {
          correctCount++;
        } else {
          wrongCount++;
        }
      }
    });

    const correctRate = Math.round((correctCount / totalStudents) * 1000) / 10;

    // Tingkat Kesukaran (P):
    // P > 70% : MUDAH
    // 30% <= P <= 70% : SEDANG
    // P < 30% : SUKAR
    let difficultyLevel: 'MUDAH' | 'SEDANG' | 'SUKAR' = 'SEDANG';
    if (correctRate > 70) difficultyLevel = 'MUDAH';
    else if (correctRate < 30) difficultyLevel = 'SUKAR';

    // Daya Beda (D) = (Correct in Upper - Correct in Lower) / GroupSize
    const upperCorrect = upperGroup.filter(r => r.answers[q] === correctKey).length;
    const lowerCorrect = lowerGroup.filter(r => r.answers[q] === correctKey).length;
    const discriminatingPower = Math.round(((upperCorrect - lowerCorrect) / groupSize) * 100) / 100;

    itemAnalyses.push({
      questionNo: q,
      correctAnswer: correctKey,
      totalAnswered: correctCount + wrongCount,
      correctCount,
      wrongCount,
      blankCount,
      correctRate,
      difficultyLevel,
      discriminatingPower,
      optionPicks,
      topic: exam.topics?.[q]
    });
  }

  return {
    examId: exam.id,
    classId: exam.gradeClass,
    totalStudents,
    averageScore,
    highestScore,
    lowestScore,
    passingRate,
    passedCount,
    failedCount,
    standardDeviation,
    gradeDistribution,
    itemAnalyses
  };
}
