import express from 'express';
import cors from 'cors';
import authRouter from './api/routes/auth.routes';
import appointmentsRouter from './api/routes/appointments.routes';
import doctorsRouter from './api/routes/doctors.routes';
import triageRouter from './api/routes/triage.routes';
import requestsRouter from './api/routes/requests.routes';
import errorHandler from './api/middleware/errorHandler.middleware';

const app = express();

// Enable CORS for frontend
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'imss-medical-backend' });
});

// API routes
app.use('/api/auth', authRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/triage', triageRouter);
app.use('/api/requests', requestsRouter);

// Error handler (last)
app.use(errorHandler);

export default app;
