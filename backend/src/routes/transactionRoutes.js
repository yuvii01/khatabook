import express from 'express';
import {
  getTransactions,
  createTransaction,
  deleteTransaction,
} from '../services/dataStore.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { partyId, type } = req.query;
    const transactions = await getTransactions({ partyId, type });
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      party,
      type,
      amount,
      date,
      paymentMode,
      referenceNumber,
      description,
      billNumber,
      items,
    } = req.body;

    if (!party || !type || amount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Party, transaction type, and valid amount are required',
      });
    }

    if (Number(amount) <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0',
      });
    }

    const txn = await createTransaction({
      party,
      type,
      amount: Number(amount),
      date: date || new Date(),
      paymentMode: paymentMode || 'Cash',
      referenceNumber: referenceNumber || '',
      description: description || '',
      billNumber: billNumber || '',
      items: items || [],
    });

    res.status(201).json({ success: true, message: 'Transaction recorded successfully', data: txn });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await deleteTransaction(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
