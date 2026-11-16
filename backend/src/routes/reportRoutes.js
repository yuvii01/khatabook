import express from 'express';
import {
  getPendingReceivablesData,
  generatePendingReceivablesPdf,
} from '../services/reportService.js';
import {
  sendAllMonthlyReminders,
  sendPendingDuesReportToOwner,
  sendWhatsAppMessage,
  formatBalanceReminderMessage,
  cleanPhoneNumber,
} from '../services/whatsappService.js';
import { getPartyById, getTransactions, getSettings } from '../services/dataStore.js';
import { getCronStatus } from '../services/cronService.js';

const router = express.Router();

router.get('/pending-dues', async (req, res) => {
  try {
    const data = await getPendingReceivablesData();
    res.json({ success: true, data });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/pending-dues-pdf', async (req, res) => {
  try {
    const dateStr = new Date().toISOString().slice(0, 10);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="KM_Stonex_Pending_Dues_${dateStr}.pdf"`
    );

    await generatePendingReceivablesPdf(res);
  } catch (err) {
    console.error('Pending Dues PDF Generation Error:', err);
    res.status(500).send('Failed to generate PDF: ' + err.message);
  }
});

router.post('/send-owner-whatsapp', async (req, res) => {
  try {
    const result = await sendPendingDuesReportToOwner();
    res.json({
      success: true,
      message: `Pending dues report dispatched to Owner WhatsApp (${result.ownerPhone})`,
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/trigger-whatsapp', async (req, res) => {
  try {
    const result = await sendAllMonthlyReminders();
    res.json({
      success: true,
      message: `Triggered WhatsApp reminders: ${result.sentCount} sent, ${result.skippedCount} skipped, ${result.failedCount} failed.`,
      data: result,
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.post('/send-single-whatsapp', async (req, res) => {
  try {
    const { partyId, customMessage } = req.body;
    const party = await getPartyById(partyId);
    if (!party) {
      return res.status(404).json({ success: false, message: 'Party not found' });
    }
    if (!party.phone) {
      return res.status(400).json({ success: false, message: 'Party does not have a phone number' });
    }

    const settings = await getSettings();
    const allTxns = await getTransactions({});
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    let monthReceived = 0;
    for (const t of allTxns) {
      const pId = t.party?._id || t.party;
      if (String(pId) === String(party._id) && t.type === 'YOU_GOT') {
        const tDate = new Date(t.date);
        if (tDate >= thirtyDaysAgo) {
          monthReceived += Number(t.amount || 0);
        }
      }
    }

    const message =
      customMessage ||
      formatBalanceReminderMessage({
        party,
        balance: party.currentBalance || 0,
        monthReceived,
        settings,
      });

    const dispatch = await sendWhatsAppMessage({ to: party.phone, message });

    res.json({
      success: true,
      message: `WhatsApp message prepared for ${party.name}`,
      data: {
        party: party.name,
        phone: party.phone,
        message,
        directLink: `https://wa.me/${cleanPhoneNumber(party.phone)}?text=${encodeURIComponent(message)}`,
        dispatch,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/status', async (req, res) => {
  const settings = await getSettings();
  res.json({
    success: true,
    cron: getCronStatus(),
    ownerWhatsApp: settings?.ownerWhatsApp || settings?.phone || 'Not configured',
    whatsappProvider: process.env.WHATSAPP_PROVIDER || 'Simulation/DirectWA',
  });
});

export default router;
