import express from 'express';
import { getSettings, updateSettings } from '../services/dataStore.js';
import { getDbStatus } from '../config/db.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const settings = await getSettings();
    const dbStatus = getDbStatus();
    res.json({ success: true, data: settings, dbStatus });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/', async (req, res) => {
  try {
    const settings = await updateSettings(req.body);
    res.json({ success: true, message: 'Settings updated successfully', data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
