import { Request, Response, NextFunction } from 'express';

export const assessTriage = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { questions } = req.body;
    // TODO: implement scoring logic
    const score = Array.isArray(questions) ? questions.reduce((s: number, q: any) => s + (q.answer || 0), 0) : 0;
    const emergency_flag = (questions || []).some((q: any) => q.id && q.answer >= 3);
    const urgency = emergency_flag ? 'EMERGENCY' : score >= 9 ? 'HIGH' : score >= 5 ? 'MID' : 'LOW';
    res.json({ score, urgency, emergency_flag, recommendations: [] });
  } catch (err) {
    next(err);
  }
};
