import { Request, Response, NextFunction } from 'express';

export const createMedicineRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({ id: 'med-req-temp', message: 'Medicine request created (skeleton)' });
  } catch (err) {
    next(err);
  }
};

export const listMedicineRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json([]);
  } catch (err) {
    next(err);
  }
};

export const updateMedicineRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    res.json({ id, message: 'Medicine request updated (skeleton)' });
  } catch (err) {
    next(err);
  }
};

export const createSickLeaveRequest = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.status(201).json({ id: 'sick-req-temp', message: 'Sick leave request created (skeleton)' });
  } catch (err) {
    next(err);
  }
};

export const listSickLeaveRequests = async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json([]);
  } catch (err) {
    next(err);
  }
};
