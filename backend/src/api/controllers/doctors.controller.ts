import { Request, Response, NextFunction } from 'express';

export const listDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json([]);
  } catch (err) {
    next(err);
  }
};

export const getDoctor = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    res.json({ id, name: 'Dr. Ejemplo', specialty: 'General' });
  } catch (err) {
    next(err);
  }
};

export const searchDoctors = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { specialty } = req.query;
    res.json([]);
  } catch (err) {
    next(err);
  }
};
