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

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(morgan('dev'));

app.use('/api/parties', partyRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/routed-payments', routePaymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);

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

app.listen(PORT, async () => {
  console.log(`KM Stonex Khata API running on http://localhost:${PORT}`);
  const connected = await connectDB();
  if (connected) {
    await seedMongoIfEmpty();
  }
  initCronJobs();
});
