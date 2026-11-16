import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { connectDB, getDbStatus } from './config/db.js';
import { seedMongoIfEmpty } from './services/dataStore.js';
import partyRoutes from './routes/partyRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import routePaymentRoutes from './routes/routePaymentRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import backupRoutes from './routes/backupRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import reportRoutes from './routes/reportRoutes.js';
import { initCronJobs } from './services/cronService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = [
  'https://khatabook-nu-peach.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173',
  process.env.CLIENT_URL,
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowedOrigins.includes(origin) ||
        origin.endsWith('.vercel.app') ||
        origin.includes('localhost')
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

// Ensure DB is connected for serverless invocations (e.g. Vercel)
let dbPromise = null;
app.use(async (req, res, next) => {
  try {
    if (!dbPromise) {
      dbPromise = connectDB().then((connected) => {
        if (connected) return seedMongoIfEmpty();
      });
    }
    await dbPromise;
  } catch (err) {
    console.error('DB connect middleware error:', err);
  }
  next();
});

app.use('/api/parties', partyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/routed-payments', routePaymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);

app.get('/', (req, res) => {
  res.json({
    status: 'OK',
    app: 'KM Stonex Khata API (Live on Vercel)',
    database: getDbStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    app: 'KM Stonex Khata API',
    database: getDbStatus(),
    timestamp: new Date().toISOString(),
  });
});

app.use((err, req, res, next) => {
  console.error('[API Error]:', err);
  res.status(500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Run standalone server when not in a serverless environment (e.g. local dev)
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`KM Stonex Khata API running on http://localhost:${PORT}`);
    const connected = await connectDB();
    if (connected) {
      await seedMongoIfEmpty();
    }
    initCronJobs();
  });
}

export default app;
