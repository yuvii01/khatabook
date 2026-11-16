import express from 'express';
import { getDashboardSummary } from '../services/dataStore.js';
import { getDbStatus } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const summary = await getDashboardSummary();
    const dbStatus = getDbStatus();
    res.json({
      success: true,
      data: {
        ...summary,
        database: dbStatus,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
