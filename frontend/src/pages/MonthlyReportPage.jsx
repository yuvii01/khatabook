import React, { useState, useEffect } from 'react';
import {
  Download,
  Printer,
  Phone,
  CheckCircle2,
  MessageSquare,
  RefreshCw,
  Share2,
  Trash2,
} from 'lucide-react';
import {
  getPendingDuesData,
  getPendingDuesPdfUrl,
  sendOwnerWhatsApp,
  sendSingleWhatsApp,
  getReportStatus,
  deleteParty,
} from '../services/api';

export default function MonthlyReportPage() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusInfo, setStatusInfo] = useState(null);
  const [sendingToOwner, setSendingToOwner] = useState(false);
  const [ownerMsgResult, setOwnerMsgResult] = useState(null);
  const [singleLoadingId, setSingleLoadingId] = useState(null);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const [repRes, statRes] = await Promise.all([
        getPendingDuesData(),
        getReportStatus(),
      ]);
      setReportData(repRes.data.data);
      setStatusInfo(statRes.data);
    } catch (err) {
      console.error('Failed to load pending dues report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const instantPdfDownloadUrl = getPendingDuesPdfUrl();

  const handleDeleteParty = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete "${name}" from your books?\n\nThis will permanently delete this party and all associated khata transactions.`
      )
    ) {
      try {
        await deleteParty(id);
        fetchReport();
      } catch (err) {
        alert('Failed to delete party: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handleSendToOwnerWhatsApp = async () => {
    setSendingToOwner(true);
    setOwnerMsgResult(null);
    try {
      const res = await sendOwnerWhatsApp();
      setOwnerMsgResult(res.data.data);
      if (res.data.data?.directLink) {
        window.open(res.data.data.directLink, '_blank');
      }
    } catch (err) {
      alert('Failed to send WhatsApp to owner: ' + (err.response?.data?.message || err.message));
    } finally {
      setSendingToOwner(false);
    }
  };

  const handleSendSingle = async (partyId) => {
    setSingleLoadingId(partyId);
    try {
      const res = await sendSingleWhatsApp(partyId);
      if (res.data.data?.directLink) {
        window.open(res.data.data.directLink, '_blank');
      }
    } catch (err) {
      alert('Failed to send WhatsApp: ' + err.message);
    } finally {
      setSingleLoadingId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Pending Payments & 30-Day Collections Report
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Strict list of firms from which payments are due, their contact numbers, and 30-day collections
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={instantPdfDownloadUrl}
            download="KM_Stonex_Pending_Dues_Report.pdf"
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm px-5 py-2.5 rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-2 active:scale-95 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download Instant PDF</span>
          </a>

          <button
            onClick={handleSendToOwnerWhatsApp}
            disabled={sendingToOwner}
            className="bg-slate-900 hover:bg-slate-800 text-emerald-300 hover:text-emerald-200 font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md border border-slate-700 flex items-center gap-2 transition disabled:opacity-50"
            title="Send strict pending dues statement directly to your WhatsApp"
          >
            <Share2 className="w-4 h-4 text-emerald-400" />
            <span>{sendingToOwner ? 'Preparing WhatsApp...' : 'Send to My WhatsApp'}</span>
          </button>

          <button
            onClick={() => window.print()}
            className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
            title="Print Report"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-teal-950 text-white p-5 rounded-2xl shadow-lg border border-emerald-800/40 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
              Automated 1st-of-Month Routine Active
            </span>
          </div>
          <h3 className="text-base font-bold text-white">
            Auto-Delivery to Your WhatsApp on Every 1st of the Month
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
            On the 1st of every month at 9:00 AM, the system automatically compiles this strict list of firms who owe you payments, records their 30-day payment history, and lands it directly over your WhatsApp.
          </p>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs text-slate-400 block">Your Registered WhatsApp:</span>
          <span className="text-sm font-bold text-emerald-300 font-mono">
            {statusInfo?.ownerWhatsApp || '9876500000'}
          </span>
          <span className="text-[10px] text-slate-400 block mt-0.5">
            (Editable in Settings)
          </span>
        </div>
      </div>

      {ownerMsgResult && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1.5 text-emerald-900">
          <div className="flex items-center gap-2 font-bold text-sm">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Report prepared for Owner WhatsApp ({ownerMsgResult.ownerPhone})</span>
          </div>
          <p className="text-slate-600">
            Total {ownerMsgResult.totalFirms} firms with pending dues (Total: ₹{ownerMsgResult.grandTotalDue?.toLocaleString('en-IN')}). If WhatsApp Web didn't open automatically, <a href={ownerMsgResult.directLink} target="_blank" rel="noopener noreferrer" className="font-bold underline text-emerald-700">click here to open in WhatsApp</a>.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Firms from which Payment is Due
          </span>
          <div className="text-2xl font-black text-slate-900 mt-1">
            {reportData?.summary?.totalPendingFirms || 0} Firms
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Only parties with pending receivables (excludes settled accounts)
          </p>
        </div>

        <div className="p-5 bg-emerald-50/60 rounded-2xl border border-emerald-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-700">
            Payments Received (Last 30 Days)
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1">
            ₹{(reportData?.summary?.grandTotalReceivedLast30Days || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-emerald-600 mt-1">
            Collections from these firms in past 30 days
          </p>
        </div>

        <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-200 shadow-sm">
          <span className="text-xs font-bold uppercase tracking-wider text-blue-700">
            Total Remaining to Receive
          </span>
          <div className="text-2xl font-black text-blue-700 mt-1">
            ₹{(reportData?.summary?.grandTotalRemainingToReceive || 0).toLocaleString('en-IN')}
          </div>
          <p className="text-[11px] text-blue-600 mt-1">
            Total outstanding balance across all debtors
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Firms with Pending Payments (Strict Filter)
            </h3>
            <p className="text-xs text-slate-500">
              Only firms with positive outstanding balance are listed below
            </p>
          </div>

          <button
            onClick={fetchReport}
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
        </div>

        {loading ? (
          <div className="p-16 text-center text-slate-400 text-xs">
            Loading pending dues...
          </div>
        ) : !reportData || reportData.rows.length === 0 ? (
          <div className="p-16 text-center text-slate-400 text-xs space-y-1">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="font-bold text-slate-700 text-sm">No Pending Payments Due!</p>
            <p className="text-slate-400">All parties have cleared their dues or have zero balance.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-3 px-4 w-12">S.No</th>
                  <th className="py-3 px-4">Firm / Party Name</th>
                  <th className="py-3 px-4">Contact Number</th>
                  <th className="py-3 px-4 text-right text-emerald-700">
                    Payment Received in Last 30 Days (₹)
                  </th>
                  <th className="py-3 px-4 text-right text-blue-700">
                    Remaining Payment to Receive (₹)
                  </th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[...reportData.rows]
                  .sort(
                    (a, b) =>
                      Number(b.remainingPaymentToReceive || 0) -
                      Number(a.remainingPaymentToReceive || 0)
                  )
                  .map((row, idx) => (
                    <tr
                      key={row.partyId}
                      className="hover:bg-slate-50/80 transition duration-150"
                    >
                      <td className="py-3 px-4 font-bold text-slate-400">
                        {idx + 1}
                      </td>

                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{row.name}</div>
                      {row.companyName && (
                        <div className="text-[10px] text-slate-400">
                          {row.companyName}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {row.phone !== 'N/A' ? (
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{row.phone}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">No number</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right font-black whitespace-nowrap">
                      {row.receivedLast30Days > 0 ? (
                        <span className="text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md">
                          ₹{row.receivedLast30Days.toLocaleString('en-IN')}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">₹0</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-right whitespace-nowrap font-black text-sm text-blue-700">
                      ₹{row.remainingPaymentToReceive.toLocaleString('en-IN')}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {row.phone !== 'N/A' && (
                          <button
                            type="button"
                            onClick={() => handleSendSingle(row.partyId)}
                            disabled={singleLoadingId === row.partyId}
                            className="inline-flex items-center gap-1 text-[11px] bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 font-semibold px-2.5 py-1 rounded-lg border border-slate-200 transition"
                            title="Send balance reminder to this firm"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-600" />
                            <span>WhatsApp</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleDeleteParty(row.partyId, row.name)}
                          className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                          title={`Delete ${row.name} from khata`}
                          aria-label={`Delete ${row.name}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
