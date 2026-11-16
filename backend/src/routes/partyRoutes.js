import express from 'express';
import {
  getParties,
  getPartyById,
  createParty,
  updateParty,
  deleteParty,
  calculatePartyBalance,
} from '../services/dataStore.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { type } = req.query;
    const parties = await getParties(type);
    res.json({ success: true, count: parties.length, data: parties });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const party = await getPartyById(req.params.id);
    if (!party) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }
    res.json({ success: true, data: party });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { name, companyName, type, phone, email, address, gstin, openingBalance, notes } = req.body;
    if (!name) {
      return res.status(400).json({ success: false, message: 'Name is required' });
    }

    const party = await createParty({
      name,
      companyName,
      type: type || 'party',
      phone,
      email,
      address,
      gstin,
      openingBalance: Number(openingBalance || 0),
      notes,
    });

    res.status(201).json({ success: true, message: 'Party created successfully', data: party });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const party = await updateParty(req.params.id, req.body);
    if (!party) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }
    res.json({ success: true, message: 'Party updated successfully', data: party });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await deleteParty(req.params.id);
    res.json({ success: true, message: 'Party removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/:id/recalculate', async (req, res) => {
  try {
    const balance = await calculatePartyBalance(req.params.id);
    res.json({ success: true, currentBalance: balance });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
