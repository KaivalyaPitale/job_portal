import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import jobsRouter from './routes/jobs';
import authRouter from './routes/auth';
import profileRouter from './routes/profile';
import employerRouter from './routes/employer';
import subscriptionRouter from './routes/subscription';
import jobseekerRouter from './routes/jobseeker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(morgan('dev'));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Job portal API skeleton running' });
});

// Routes
app.use('/api/jobs', jobsRouter);
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/employer', employerRouter);
app.use('/api/subscription', subscriptionRouter);
app.use('/api/jobseeker', jobseekerRouter);

// Start server
app.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`);
});
