import express from 'express';
import {
  createPaymentSplit,
  getPaymentSplits,
} from '../services/dataStore.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const splits = await getPaymentSplits();
    res.json({ success: true, count: splits.length, data: splits });
  } catch (error) {
    console.error('[Route Payment Failed]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to route payment' });
  }
});

router.post('/', async (req, res) => {
  try {
    const {
      sourcePartyId,
      totalAmount,
      paymentMode,
      referenceNumber,
      date,
      description,
      distributions,
    } = req.body;

    if (!sourcePartyId) {
      return res.status(400).json({
        success: false,
        message: 'Source party (payer, e.g. Ram) is required',
      });
    }

    const parsedTotal = Number(totalAmount);
    if (!parsedTotal || parsedTotal <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Total received amount must be greater than 0',
      });
    }

    if (!Array.isArray(distributions) || distributions.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Please provide at least one recipient to forward payments to',
      });
    }

    let totalAllocated = 0;
    for (const d of distributions) {
      if (!d.recipientPartyId) {
        return res.status(400).json({
          success: false,
          message: 'All distribution entries must have a selected recipient party',
        });
      }
      const distAmt = Number(d.amount);
      if (!distAmt || distAmt <= 0) {
        return res.status(400).json({
          success: false,
          message: 'All split amounts must be greater than 0',
        });
      }
      totalAllocated += distAmt;
    }

    if (totalAllocated > parsedTotal) {
      return res.status(400).json({
        success: false,
        message: `Total allocated amount (₹${totalAllocated}) cannot exceed incoming received payment (₹${parsedTotal})`,
      });
    }

    const result = await createPaymentSplit({
      sourcePartyId,
      totalAmount: parsedTotal,
      paymentMode: paymentMode || 'Cash',
      referenceNumber: referenceNumber || '',
      date: date || new Date(),
      description: description || '',
      distributions,
    });

    res.status(201).json({
      success: true,
      message: `Payment of ₹${parsedTotal} routed successfully: ₹${totalAllocated} distributed to ${distributions.length} recipients`,
      data: result,
    });
  } catch (error) {
    console.error('[Route Payment Failed]:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to route payment' });
  }
});

export default router;
