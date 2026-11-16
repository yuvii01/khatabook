import PDFDocument from 'pdfkit';
import { getParties, getTransactions, getSettings } from './dataStore.js';

export const getPendingReceivablesData = async () => {
  const allParties = await getParties('all');
  const allTxns = await getTransactions({});
  const settings = await getSettings();

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const pendingFirms = allParties
    .filter((p) => Number(p.currentBalance || 0) > 0)
    .sort((a, b) => Number(b.currentBalance || 0) - Number(a.currentBalance || 0));

  let grandTotalReceivedLast30Days = 0;
  let grandTotalRemainingToReceive = 0;

  const rows = pendingFirms.map((p, idx) => {
    let receivedLast30Days = 0;

    for (const t of allTxns) {
      const pId = t.party?._id || t.party;
      if (String(pId) === String(p._id) && t.type === 'YOU_GOT') {
        const tDate = new Date(t.date);
        if (tDate >= thirtyDaysAgo) {
          receivedLast30Days += Number(t.amount || 0);
        }
      }
    }

    const remainingBal = Number(p.currentBalance || 0);
    grandTotalReceivedLast30Days += receivedLast30Days;
    grandTotalRemainingToReceive += remainingBal;

    return {
      sNo: idx + 1,
      partyId: p._id,
      name: p.name,
      companyName: p.companyName || '',
      phone: p.phone || 'N/A',
      receivedLast30Days,
      remainingPaymentToReceive: remainingBal,
    };
  });

  return {
    generatedAt: now.toISOString(),
    thirtyDaysPeriod: `${thirtyDaysAgo.toLocaleDateString('en-IN')} to ${now.toLocaleDateString('en-IN')}`,
    settings,
    summary: {
      totalPendingFirms: pendingFirms.length,
      grandTotalReceivedLast30Days,
      grandTotalRemainingToReceive,
    },
    rows,
  };
};

export const generatePendingReceivablesPdf = async (res) => {
  const data = await getPendingReceivablesData();
  const doc = new PDFDocument({ margin: 36, size: 'A4', bufferPages: true });

  if (res) {
    doc.pipe(res);
  }

  const primaryColor = '#0f172a';
  const emeraldColor = '#15803d';
  const brandDark = '#1e293b';

  doc
    .fillColor(primaryColor)
    .fontSize(18)
    .font('Helvetica-Bold')
    .text((data.settings?.businessName || 'KM STONEX').toUpperCase(), { align: 'center' });

  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#475569')
    .text(data.settings?.tagline || 'Marble, Granite & Natural Stone Khata', { align: 'center' })
    .moveDown(0.2);

  if (data.settings?.address || data.settings?.phone) {
    doc
      .fontSize(8)
      .fillColor('#64748b')
      .text(
        `${data.settings?.address || ''} • Phone: ${data.settings?.phone || ''} • GSTIN: ${data.settings?.gstin || 'N/A'}`,
        { align: 'center' }
      )
      .moveDown(0.6);
  }

  doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(36, doc.y).lineTo(559, doc.y).stroke().moveDown(0.5);

  doc
    .fontSize(13)
    .font('Helvetica-Bold')
    .fillColor('#0369a1')
    .text('PENDING PAYMENT RECEIVABLES REPORT', 36, doc.y, { align: 'left' });

  const genDateStr = new Date().toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  doc
    .fontSize(8)
    .font('Helvetica')
    .fillColor('#64748b')
    .text(`Report Date: ${genDateStr} | Window: Last 30 Days (${data.thirtyDaysPeriod})`, {
      align: 'left',
    })
    .moveDown(0.8);

  const kpiTop = doc.y;
  doc.rect(36, kpiTop, 523, 44).fillAndStroke('#f8fafc', '#cbd5e1');

  doc
    .fillColor('#475569')
    .fontSize(8)
    .font('Helvetica-Bold')
    .text('FIRMS WITH PENDING PAYMENTS', 48, kpiTop + 9)
    .text('PAYMENTS RECEIVED (LAST 30 DAYS)', 220, kpiTop + 9)
    .text('TOTAL REMAINING TO RECEIVE', 390, kpiTop + 9);

  doc
    .fontSize(12)
    .font('Helvetica-Bold')
    .fillColor('#0f172a')
    .text(`${data.summary.totalPendingFirms} Firms`, 48, kpiTop + 24)
    .fillColor(emeraldColor)
    .text(`Rs. ${data.summary.grandTotalReceivedLast30Days.toLocaleString('en-IN')}`, 220, kpiTop + 24)
    .fillColor('#0284c7')
    .text(`Rs. ${data.summary.grandTotalRemainingToReceive.toLocaleString('en-IN')}`, 390, kpiTop + 24);

  doc.y = kpiTop + 54;

  const tableTop = doc.y + 6;
  const colX = {
    sNo: 36,
    firmName: 64,
    phone: 250,
    received30Days: 350,
    remainingBalance: 460,
  };

  doc.rect(36, tableTop, 523, 22).fill(brandDark);

  doc
    .fontSize(8)
    .font('Helvetica-Bold')
    .fillColor('#ffffff')
    .text('S.No', colX.sNo + 4, tableTop + 7)
    .text('Firm / Customer Name', colX.firmName, tableTop + 7)
    .text('Contact Mobile', colX.phone, tableTop + 7)
    .text('Received Last 30 Days (Rs.)', colX.received30Days, tableTop + 7, { width: 100, align: 'right' })
    .text('Remaining to Receive (Rs.)', colX.remainingBalance, tableTop + 7, { width: 95, align: 'right' });

  let curY = tableTop + 22;

  if (data.rows.length === 0) {
    doc
      .fillColor('#64748b')
      .fontSize(9)
      .font('Helvetica')
      .text('Great news! There are currently no firms with pending payments to receive.', 36, curY + 20, {
        align: 'center',
        width: 523,
      });
    curY += 50;
  } else {
    data.rows.forEach((row, i) => {
      if (curY > 740) {
        doc.addPage();
        curY = 36;
        doc.rect(36, curY, 523, 22).fill(brandDark);
        doc
          .fontSize(8)
          .font('Helvetica-Bold')
          .fillColor('#ffffff')
          .text('S.No', colX.sNo + 4, curY + 7)
          .text('Firm / Party Name', colX.firmName, curY + 7)
          .text('Contact Mobile', colX.phone, curY + 7)
          .text('Received Last 30 Days (Rs.)', colX.received30Days, curY + 7, { width: 100, align: 'right' })
          .text('Remaining to Receive (Rs.)', colX.remainingBalance, curY + 7, { width: 95, align: 'right' });
        curY += 22;
      }

      if (i % 2 === 0) {
        doc.rect(36, curY, 523, 19).fill('#f8fafc');
      }

      const fullName = row.companyName ? `${row.name} (${row.companyName})` : row.name;

      doc
        .font('Helvetica')
        .fontSize(8)
        .fillColor('#1e293b')
        .text(`${row.sNo}`, colX.sNo + 4, curY + 6)
        .text(fullName, colX.firmName, curY + 6, { width: 180, ellipsis: true })
        .text(row.phone, colX.phone, curY + 6);

      doc
        .fillColor(row.receivedLast30Days > 0 ? emeraldColor : '#64748b')
        .font('Helvetica')
        .text(
          row.receivedLast30Days > 0 ? `Rs. ${row.receivedLast30Days.toLocaleString('en-IN')}` : '-',
          colX.received30Days,
          curY + 6,
          { width: 100, align: 'right' }
        );

      doc
        .fillColor('#0284c7')
        .font('Helvetica-Bold')
        .text(`Rs. ${row.remainingPaymentToReceive.toLocaleString('en-IN')}`, colX.remainingBalance, curY + 6, {
          width: 95,
          align: 'right',
        });

      curY += 19;
    });

    doc.rect(36, curY, 523, 22).fill('#e2e8f0');
    doc
      .fontSize(8)
      .font('Helvetica-Bold')
      .fillColor('#0f172a')
      .text('GRAND TOTAL PENDING', colX.firmName, curY + 7)
      .text(
        `Rs. ${data.summary.grandTotalReceivedLast30Days.toLocaleString('en-IN')}`,
        colX.received30Days,
        curY + 7,
        { width: 100, align: 'right' }
      )
      .text(
        `Rs. ${data.summary.grandTotalRemainingToReceive.toLocaleString('en-IN')}`,
        colX.remainingBalance,
        curY + 7,
        { width: 95, align: 'right' }
      );
  }

  const totalPages = doc.bufferedPageRange().count;
  for (let p = 0; p < totalPages; p++) {
    doc.switchToPage(p);
    doc
      .fontSize(7)
      .fillColor('#94a3b8')
      .text(
        `KM Stonex Khata • Page ${p + 1} of ${totalPages} • Strict Pending Payments Ledger`,
        36,
        805,
        { align: 'center', width: 523 }
      );
  }

  doc.end();
  return doc;
};
