import cron from 'node-cron';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendAllMonthlyReminders, sendPendingDuesReportToOwner } from './whatsappService.js';
import { generatePendingReceivablesPdf } from './reportService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPORTS_DIR = path.resolve(__dirname, '../../data/reports');

if (!fs.existsSync(REPORTS_DIR)) {
  fs.mkdirSync(REPORTS_DIR, { recursive: true });
}

let lastWhatsAppRun = null;
let lastOwnerReportRun = null;

export const initCronJobs = () => {
  cron.schedule('0 9 1 * *', async () => {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);

    try {
      const filePath = path.resolve(REPORTS_DIR, `KM_Stonex_Pending_Dues_${dateStr}.pdf`);
      const fileStream = fs.createWriteStream(filePath);
      await generatePendingReceivablesPdf(fileStream);
    } catch (err) {
      console.error('[Cron Error - PDF Archive]:', err.message);
    }

    try {
      const ownerResult = await sendPendingDuesReportToOwner();
      lastOwnerReportRun = {
        date: now.toISOString(),
        status: 'success',
        ownerPhone: ownerResult.ownerPhone,
        totalFirms: ownerResult.totalFirms,
      };
    } catch (err) {
      console.error('[Cron Error - Owner WhatsApp]:', err.message);
      lastOwnerReportRun = { date: now.toISOString(), status: 'error', error: err.message };
    }

    try {
      const result = await sendAllMonthlyReminders();
      lastWhatsAppRun = {
        date: now.toISOString(),
        status: 'success',
        sentCount: result.sentCount,
      };
    } catch (err) {
      console.error('[Cron Error - Client WhatsApp]:', err.message);
    }
  });
};

export const getCronStatus = () => ({
  firstOfMonthSchedule: 'Every 1st of month at 09:00 AM (0 9 1 * *)',
  lastOwnerReportRun,
  lastWhatsAppRun,
});
