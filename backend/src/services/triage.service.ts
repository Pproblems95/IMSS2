export type TriageAnswer = number; // 0..3 per question

export interface TriageResult {
  score: number;
  urgency: 'LOW' | 'MID' | 'HIGH' | 'EMERGENCY';
  emergencyFlag: boolean;
}

// Weighted scoring for 5 questions: weights set to 1 to match research thresholds
const WEIGHTS = [1, 1, 1, 1, 1];

// Only question 0 is considered an emergency trigger in the MVP prototype
const EMERGENCY_QUESTIONS = [0]; // index of questions that indicate emergency (example: chest pain)

export function assessTriage(answers: TriageAnswer[]): TriageResult {
  // normalize answers length
  const padded = answers.slice(0, 5);
  while (padded.length < 5) padded.push(0);

  let score = 0;
  let emergencyFlag = false;

  for (let i = 0; i < 5; i++) {
    const a = Number(padded[i]) || 0;
    const w = WEIGHTS[i] || 1;
    score += a * w;
    if (EMERGENCY_QUESTIONS.includes(i) && a >= 2) emergencyFlag = true;
  }

  // Map score to urgency thresholds (research.md): 0-4 LOW, 5-8 MID, 9-15 HIGH
  // Treat emergency as a special flag for lower total scores; high total score takes precedence.
  let urgency: TriageResult['urgency'] = 'LOW';
  if (score >= 9) urgency = 'HIGH';
  else if (emergencyFlag) urgency = 'EMERGENCY';
  else if (score >= 5) urgency = 'MID';
  else urgency = 'LOW';

  return { score, urgency, emergencyFlag };
}
