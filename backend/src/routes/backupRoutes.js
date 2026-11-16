import express from 'express';
import { exportFullBackup, restoreFullBackup } from '../services/dataStore.js';

const router = express.Router();

router.get('/export', async (req, res) => {
  try {
    const backup = await exportFullBackup();
    const filename = `km_stonex_khata_backup_${new Date().toISOString().slice(0, 10)}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify(backup, null, 2));
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/restore', async (req, res) => {
  try {
    const backupData = req.body;
    const result = await restoreFullBackup(backupData);
    res.json({
      success: true,
      message: `Data restored successfully (${result.partiesCount} parties, ${result.transactionsCount} transactions)`,
      data: result,
    });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
});

export default router;
