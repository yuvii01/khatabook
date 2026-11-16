import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { getParties, getTransactions, getSettings } from './dataStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export const formatBalanceReminderMessage = ({ party, balance, monthReceived, settings }) => {
  const businessName = settings?.businessName || 'KM Stonex';
  const phone = settings?.phone || '';
  const absBal = Math.abs(balance || 0).toLocaleString('en-IN');
  const balStatus =
    balance > 0
      ? 'Outstanding Due (Aapki Taraf Baaki / You Owe)'
      : balance < 0
      ? 'Advance Balance (Aapka Jama / In Your Credit)'
      : 'Settled (Hisab Barabar / Nil)';

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    `*Statement from ${businessName}*\n` +
    `Date: ${currentDate}\n\n` +
    `Namaskar *${party.name}* ji ${party.companyName ? `(${party.companyName})` : ''},\n\n` +
    `Here is your monthly account summary as of the 1st of the month:\n` +
    `• *Current Balance:* ₹${absBal}\n` +
    `• *Status:* ${balStatus}\n` +
    `• *Payment Received This Past Month:* ₹${Number(monthReceived || 0).toLocaleString('en-IN')}\n\n` +
    (balance > 0
      ? `Kindly arrange payment at your earliest convenience. Thank you for your continued partnership with ${businessName}!\n\n`
      : `Thank you for your partnership with ${businessName}!\n\n`) +
    (phone ? `For payment or account queries, contact us at: ${phone}` : '')
  );
};

export const cleanPhoneNumber = (phone) => {
  if (!phone) return '';
  let clean = phone.replace(/\D/g, '');
  if (clean.length === 10) {
    clean = '91' + clean;
  }
  return clean;
};

export const sendWhatsAppMessage = async ({ to, message }) => {
  const cleanPhone = cleanPhoneNumber(to);
  if (!cleanPhone) {
    throw new Error('Invalid or missing phone number');
  }

  const provider = (process.env.WHATSAPP_PROVIDER || 'SIMULATION').toUpperCase();

  if (provider === 'ULTRAMSG') {
    const instanceId = process.env.ULTRAMSG_INSTANCE_ID;
    const token = process.env.ULTRAMSG_TOKEN;
    if (!instanceId || !token) {
      throw new Error('UltraMsg INSTANCE_ID or TOKEN missing in backend/.env');
    }

    const params = new URLSearchParams();
    params.append('token', token);
    params.append('to', cleanPhone);
    params.append('body', message);

    const response = await fetch(`https://api.ultramsg.com/${instanceId}/messages/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params,
    });
    const resData = await response.json();
    return { provider: 'UltraMsg', status: 'sent', details: resData };
  }

  if (provider === 'TWILIO') {
    const accountSid = process.env.TWILIO_ACCOUNT_SID;
    const authToken = process.env.TWILIO_AUTH_TOKEN;
    const fromNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';

    if (!accountSid || !authToken) {
      throw new Error('Twilio ACCOUNT_SID or AUTH_TOKEN missing in backend/.env');
    }

    const authHeader = 'Basic ' + Buffer.from(`${accountSid}:${authToken}`).toString('base64');
    const params = new URLSearchParams();
    params.append('From', fromNumber.startsWith('whatsapp:') ? fromNumber : `whatsapp:${fromNumber}`);
    params.append('To', `whatsapp:+${cleanPhone}`);
    params.append('Body', message);

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`,
      {
        method: 'POST',
        headers: {
          Authorization: authHeader,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      }
    );
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.message || 'Twilio WhatsApp sending failed');
    }
    return { provider: 'Twilio', status: 'sent', details: resData };
  }

  if (provider === 'META') {
    const token = process.env.META_WHATSAPP_TOKEN;
    const phoneId = process.env.META_PHONE_NUMBER_ID;
    if (!token || !phoneId) {
      throw new Error('Meta WHATSAPP_TOKEN or PHONE_NUMBER_ID missing in backend/.env');
    }

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneId}/messages`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: cleanPhone,
          type: 'text',
          text: { body: message },
        }),
      }
    );
    const resData = await response.json();
    if (!response.ok) {
      throw new Error(resData.error?.message || 'Meta Cloud API sending failed');
    }
    return { provider: 'MetaCloud', status: 'sent', details: resData };
  }

  const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  console.log(`[WhatsApp Dispatch to +${cleanPhone}]: ${waUrl}`);
  return {
    provider: 'Simulation/DirectWA',
    status: 'simulated',
    directLink: waUrl,
    to: cleanPhone,
  };
};

export const sendAllMonthlyReminders = async () => {
  const parties = await getParties('all');
  const allTxns = await getTransactions({});
  const settings = await getSettings();

  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const results = [];

  for (const party of parties) {
    if (!party.phone) {
      results.push({
        partyId: party._id,
        partyName: party.name,
        phone: 'None',
        status: 'skipped',
        reason: 'No phone number provided',
      });
      continue;
    }

    let monthReceived = 0;
    for (const t of allTxns) {
      const pId = t.party?._id || t.party;
      if (String(pId) === String(party._id) && t.type === 'YOU_GOT') {
        const tMonth = new Date(t.date).toISOString().slice(0, 7);
        if (tMonth === currentMonthStr) {
          monthReceived += Number(t.amount || 0);
        }
      }
    }

    const message = formatBalanceReminderMessage({
      party,
      balance: party.currentBalance || 0,
      monthReceived,
      settings,
    });

    try {
      const dispatch = await sendWhatsAppMessage({ to: party.phone, message });
      results.push({
        partyId: party._id,
        partyName: party.name,
        phone: party.phone,
        balance: party.currentBalance,
        status: dispatch.status,
        provider: dispatch.provider,
        directLink: dispatch.directLink || `https://wa.me/${cleanPhoneNumber(party.phone)}?text=${encodeURIComponent(message)}`,
      });
    } catch (err) {
      results.push({
        partyId: party._id,
        partyName: party.name,
        phone: party.phone,
        status: 'failed',
        error: err.message,
      });
    }
  }

  return {
    totalParties: parties.length,
    sentCount: results.filter((r) => r.status === 'sent' || r.status === 'simulated').length,
    failedCount: results.filter((r) => r.status === 'failed').length,
    skippedCount: results.filter((r) => r.status === 'skipped').length,
    results,
    executedAt: new Date().toISOString(),
  };
};

export const sendPendingDuesReportToOwner = async () => {
  const { getPendingReceivablesData } = await import('./reportService.js');
  const data = await getPendingReceivablesData();
  const settings = await getSettings();

  const ownerPhone = settings?.ownerWhatsApp || settings?.phone || process.env.OWNER_WHATSAPP_NUMBER || '';
  if (!ownerPhone) {
    throw new Error('Owner WhatsApp phone number is not configured in Settings.');
  }

  const currentDate = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  let message =
    `*KM STONEX — PENDING PAYMENT RECEIVABLES REPORT*\n` +
    `Date: ${currentDate} (1st of Month Statement)\n\n` +
    `• *Total Firms with Pending Payments:* ${data.summary.totalPendingFirms}\n` +
    `• *Total Payments to Receive:* ₹${data.summary.grandTotalRemainingToReceive.toLocaleString('en-IN')}\n` +
    `• *Total Received in Last 30 Days:* ₹${data.summary.grandTotalReceivedLast30Days.toLocaleString('en-IN')}\n\n` +
    `*LIST OF FIRMS FROM WHICH PAYMENTS ARE DUE:*\n`;

  if (data.rows.length === 0) {
    message += `No firms currently have pending balances to receive. All clear!\n`;
  } else {
    data.rows.forEach((r, idx) => {
      const name = r.companyName ? `${r.name} (${r.companyName})` : r.name;
      message +=
        `\n*${idx + 1}. ${name}*\n` +
        `   • Mob: ${r.phone}\n` +
        `   • Remaining to Receive: *₹${r.remainingPaymentToReceive.toLocaleString('en-IN')}*\n` +
        `   • Received in Last 30 Days: ₹${r.receivedLast30Days.toLocaleString('en-IN')}\n`;
    });
  }

  message += `\n_Generated automatically by KM Stonex Khata._`;

  const dispatch = await sendWhatsAppMessage({ to: ownerPhone, message });
  return {
    ownerPhone,
    totalFirms: data.summary.totalPendingFirms,
    grandTotalDue: data.summary.grandTotalRemainingToReceive,
    grandTotalReceivedLast30Days: data.summary.grandTotalReceivedLast30Days,
    message,
    dispatch,
    directLink: `https://wa.me/${cleanPhoneNumber(ownerPhone)}?text=${encodeURIComponent(message)}`,
  };
};
