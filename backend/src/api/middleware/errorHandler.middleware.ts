import { Request, Response, NextFunction } from 'express';

export default function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  // Minimal error handler: log and return generic message
  // TODO: integrate structured logger and error codes
  // eslint-disable-next-line no-console
  console.error(err);
  const status = err && err.status ? err.status : 500;
  res.status(status).json({ message: err.message || 'Internal Server Error' });
}
