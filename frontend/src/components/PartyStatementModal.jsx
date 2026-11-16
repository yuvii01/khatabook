import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Share2,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Calendar,
  Check,
  RefreshCw,
  Edit2,
} from 'lucide-react';
import {
  getTransactions,
  deleteTransaction,
  deleteParty,
  recalculatePartyBalance,
} from '../services/api';

export default function PartyStatementModal({
  isOpen,
  onClose,
  party,
  onAddTransaction,
  onRefreshParties,
  onEditParty,
  refreshTrigger,
}) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [copiedReminder, setCopiedReminder] = useState(false);

  const fetchLedger = async () => {
    if (!party) return;
    setLoading(true);
    try {
      const res = await getTransactions({ partyId: party._id });
      setTransactions(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && party) {
      fetchLedger();
    }
  }, [isOpen, party, refreshTrigger]);

  if (!isOpen || !party) return null;

  // 1. Sort all transactions chronologically (oldest to newest)
  // Handles same-date transactions with sub-second / createdAt precision
  const allSortedChronological = [...transactions].sort((a, b) => {
    const timeA = new Date(a.date).getTime();
    const timeB = new Date(b.date).getTime();
    if (timeA !== timeB) return timeA - timeB;
    const createA = new Date(a.createdAt || a.date).getTime();
    const createB = new Date(b.createdAt || b.date).getTime();
    if (createA !== createB) return createA - createB;
    return String(a._id || '').localeCompare(String(b._id || ''));
  });

  const rawOpeningBal = Number(party.openingBalance || 0);

  // 2. Real-time ledger final balance computed strictly from transactions + opening balance
  const fullLedgerFinalBalance = allSortedChronological.reduce((acc, t) => {
    const amt = Number(t.amount || 0);
    if (t.type === 'YOU_GAVE' || t.type === 'SALE_BILL') return acc + amt;
    if (t.type === 'YOU_GOT' || t.type === 'PURCHASE_BILL') return acc - amt;
    return acc;
  }, rawOpeningBal);

  const currentBal = fullLedgerFinalBalance;

  // 3. Separate transactions before startDate vs in-range
  let initialBalanceForPeriod = rawOpeningBal;
  const inRangeTxns = [];

  for (const t of allSortedChronological) {
    const tDate = t.date ? String(t.date).slice(0, 10) : '';
    if (startDate && tDate < startDate) {
      const amt = Number(t.amount || 0);
      if (t.type === 'YOU_GAVE' || t.type === 'SALE_BILL') {
        initialBalanceForPeriod += amt;
      } else if (t.type === 'YOU_GOT' || t.type === 'PURCHASE_BILL') {
        initialBalanceForPeriod -= amt;
      }
    } else if (!endDate || tDate <= endDate) {
      inRangeTxns.push(t);
    }
  }

  // 4. Compute running balance forward in chronological order
  let running = initialBalanceForPeriod;
  const ledgerRows = inRangeTxns.map((t) => {
    const amt = Number(t.amount || 0);
    let gave = 0;
    let got = 0;

    if (t.type === 'YOU_GAVE' || t.type === 'SALE_BILL') {
      gave = amt;
      running += gave;
    } else if (t.type === 'YOU_GOT' || t.type === 'PURCHASE_BILL') {
      got = amt;
      running -= got;
    }

    return {
      ...t,
      gave,
      got,
      runningBalance: running,
    };
  });

  // 5. Reverse for display so the most recent entry is at the top
  const displayRows = [...ledgerRows].reverse();

  // Period totals
  const totalGivenInPeriod = inRangeTxns.reduce(
    (sum, t) => sum + (t.type === 'YOU_GAVE' || t.type === 'SALE_BILL' ? Number(t.amount || 0) : 0),
    0
  );
  const totalGotInPeriod = inRangeTxns.reduce(
    (sum, t) => sum + (t.type === 'YOU_GOT' || t.type === 'PURCHASE_BILL' ? Number(t.amount || 0) : 0),
    0
  );

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this khata entry?')) {
      try {
        await deleteTransaction(id);
        await recalculatePartyBalance(party._id);
        await fetchLedger();
        if (onRefreshParties) {
          onRefreshParties();
        }
      } catch (err) {
        alert('Failed to delete transaction: ' + err.message);
      }
    }
  };

  const handleDeleteParty = async (id, name) => {
    if (
      window.confirm(
        `Are you sure you want to delete ${name} from your books?\n\nThis will permanently delete this record and all associated transactions from your khata.`
      )
    ) {
      try {
        await deleteParty(id);
        if (onRefreshParties) {
          await onRefreshParties();
        }
        onClose();
      } catch (err) {
        alert('Failed to delete party: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const generateWhatsAppMessage = () => {
    const msg =
      currentBal > 0
        ? `Namaskar ${party.name} ji, this is a friendly reminder from KM Stonex regarding your outstanding balance of ₹${Math.abs(currentBal).toLocaleString('en-IN')}. Kindly clear the pending dues at your earliest convenience. Thank you!`
        : `Namaskar ${party.name} ji, this is an account statement update from KM Stonex. Your current account balance is ₹${Math.abs(currentBal).toLocaleString('en-IN')}. Thank you for your partnership!`;
    navigator.clipboard.writeText(msg);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  const openingRowDate = party.createdAt
    ? new Date(party.createdAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : '-';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
        {/* Header */}
        <div className="bg-[#0b1f1a] p-5 text-white flex items-center justify-between border-b border-emerald-900/60 print:bg-white print:text-black print:border-b-2 print:border-black">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center font-black text-xl text-amber-200 shadow-md border border-emerald-500/30 print:hidden">
              {party.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold tracking-tight text-stone-100">{party.name}</h2>
                <span className="text-xs uppercase px-2 py-0.5 rounded-full font-semibold bg-emerald-900/60 text-emerald-300 border border-emerald-700/50 print:text-black">
                  Party
                </span>
              </div>
              <p className="text-xs text-stone-300/80 flex items-center gap-2 mt-0.5 print:text-stone-700">
                {party.companyName && <span>{party.companyName}</span>}
                {party.phone && <span>• Phone: {party.phone}</span>}
                {party.gstin && <span>• GST: {party.gstin}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 print:hidden">
            <button
              onClick={() => onEditParty && onEditParty(party)}
              className="p-2 text-stone-300 hover:text-emerald-400 hover:bg-stone-800 rounded-lg transition"
              title="Edit Party Profile"
              aria-label="Edit Party"
            >
              <Edit2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={() => handleDeleteParty(party._id, party.name)}
              className="p-2 text-stone-300 hover:text-rose-400 hover:bg-stone-800 rounded-lg transition"
              title="Remove Party"
              aria-label="Remove Party"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={handlePrint}
              className="p-2 text-stone-300 hover:text-white hover:bg-stone-800 rounded-lg transition"
              title="Print Statement"
            >
              <Printer className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={generateWhatsAppMessage}
              className="px-3 py-1.5 text-xs bg-emerald-600/30 text-emerald-300 hover:bg-emerald-600 hover:text-white rounded-lg border border-emerald-500/30 transition flex items-center gap-1.5"
              title="Copy WhatsApp reminder text"
            >
              {copiedReminder ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied!
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5" /> WhatsApp Reminder
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Current Balance Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              Current Outstanding Balance
            </span>
            <div className="flex items-baseline gap-2 mt-0.5">
              <span
                className={`text-2xl font-black ${
                  currentBal > 0
                    ? 'text-emerald-600'
                    : currentBal < 0
                    ? 'text-rose-600'
                    : 'text-slate-700'
                }`}
              >
                ₹{Math.abs(currentBal).toLocaleString('en-IN')}
              </span>
              <span
                className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${
                  currentBal > 0
                    ? 'bg-emerald-100 text-emerald-800'
                    : currentBal < 0
                    ? 'bg-rose-100 text-rose-800'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {currentBal > 0
                  ? "YOU'LL GET (Lena Hai)"
                  : currentBal < 0
                  ? "YOU'LL GIVE (Dena Hai)"
                  : 'SETTLED (Hisab Barabar)'}
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Opening Balance: ₹{Math.abs(rawOpeningBal).toLocaleString('en-IN')}{' '}
              <span className="text-[10px] font-semibold text-slate-600">
                ({rawOpeningBal > 0 ? "You'll Get" : rawOpeningBal < 0 ? "You'll Give" : 'Settled ₹0'})
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 print:hidden">
            <button
              onClick={() => onAddTransaction(party._id, 'YOU_GAVE')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>You Give (Diya)</span>
            </button>
            <button
              onClick={() => onAddTransaction(party._id, 'YOU_GOT')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>You Got (Aaya)</span>
            </button>
          </div>
        </div>

        {/* Date Filter & Status */}
        <div className="px-5 py-2.5 bg-white border-b border-slate-100 flex items-center justify-between text-xs text-slate-600 print:hidden">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>Filter Dates:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded text-xs"
            />
            <span>to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2 py-1 border border-slate-200 rounded text-xs"
            />
            {(startDate || endDate) && (
              <button
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-teal-600 hover:underline"
              >
                Clear
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              Total {inRangeTxns.length} entries
            </span>
            <button
              onClick={fetchLedger}
              className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
              title="Refresh"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Ledger Table */}
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading ledger statements...
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Entry Details / Particulars</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3 text-right text-rose-700">You Give (Diya)</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">You Got (Aaya)</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-2 text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {/* Transaction Rows (Newest to Oldest) */}
                {displayRows.map((txn) => {
                  const txnDateStr = new Date(txn.date).toLocaleDateString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const timeStr = txn.createdAt
                    ? new Date(txn.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })
                    : null;

                  return (
                    <tr
                      key={txn._id}
                      className="hover:bg-slate-50 transition duration-150"
                    >
                      <td className="py-3 px-3 font-medium text-slate-600 whitespace-nowrap">
                        <div>{txnDateStr}</div>
                        {timeStr && (
                          <div className="text-[10px] text-slate-400 font-normal">{timeStr}</div>
                        )}
                      </td>

                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-800">
                          {txn.type === 'YOU_GOT'
                            ? 'Payment Received (You Got)'
                            : txn.type === 'YOU_GAVE'
                            ? 'Payment Given (You Give)'
                            : txn.type === 'SALE_BILL'
                            ? 'Sale Bill'
                            : txn.type === 'PURCHASE_BILL'
                            ? 'Purchase Bill'
                            : txn.type.replace('_', ' ')}
                        </div>
                        {txn.description && (
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {txn.description}
                          </p>
                        )}
                        {txn.referenceNumber && (
                          <span className="inline-block text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded mr-1">
                            Ref: {txn.referenceNumber}
                          </span>
                        )}
                        {txn.isRouted && (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-semibold">
                            <Sparkles className="w-2.5 h-2.5" /> Routed Transfer
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-slate-600">
                        {txn.paymentMode || 'Cash'}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-rose-600">
                        {txn.gave > 0 ? `₹${txn.gave.toLocaleString('en-IN')}` : '-'}
                      </td>

                      <td className="py-3 px-3 text-right font-bold text-emerald-600">
                        {txn.got > 0 ? `₹${txn.got.toLocaleString('en-IN')}` : '-'}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div
                          className={`font-black text-sm ${
                            txn.runningBalance > 0
                              ? 'text-emerald-700'
                              : txn.runningBalance < 0
                              ? 'text-rose-700'
                              : 'text-slate-600'
                          }`}
                        >
                          ₹{Math.abs(txn.runningBalance).toLocaleString('en-IN')}
                        </div>
                        <div
                          className={`text-[9px] font-bold uppercase tracking-wider ${
                            txn.runningBalance > 0
                              ? 'text-emerald-600'
                              : txn.runningBalance < 0
                              ? 'text-rose-600'
                              : 'text-slate-500'
                          }`}
                        >
                          {txn.runningBalance > 0
                            ? "You'll Get"
                            : txn.runningBalance < 0
                            ? "You'll Give"
                            : 'Settled'}
                        </div>
                      </td>

                      <td className="py-3 px-2 text-center print:hidden">
                        <button
                          onClick={() => handleDelete(txn._id)}
                          className="text-slate-300 hover:text-rose-600 p-1 rounded transition"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Opening Balance Row */}
                <tr className="bg-amber-50/50 border-t-2 border-dashed border-amber-200/80 font-medium text-slate-700">
                  <td className="py-3 px-3 whitespace-nowrap text-slate-500">
                    {openingRowDate}
                  </td>
                  <td className="py-3 px-3">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0"></span>
                      <span>{startDate ? `Opening Balance (Before ${startDate})` : 'Opening Khata Balance'}</span>
                    </div>
                    <p className="text-[10px] text-amber-800/80 mt-0.5">
                      Initial balance recorded when account was opened
                    </p>
                  </td>
                  <td className="py-3 px-3 text-slate-400 font-medium">-</td>
                  <td className="py-3 px-3 text-right text-slate-400 font-normal">-</td>
                  <td className="py-3 px-3 text-right text-slate-400 font-normal">-</td>
                  <td className="py-3 px-3 text-right">
                    <div
                      className={`font-black text-sm ${
                        initialBalanceForPeriod > 0
                          ? 'text-emerald-700'
                          : initialBalanceForPeriod < 0
                          ? 'text-rose-700'
                          : 'text-slate-600'
                      }`}
                    >
                      ₹{Math.abs(initialBalanceForPeriod).toLocaleString('en-IN')}
                    </div>
                    <div
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        initialBalanceForPeriod > 0
                          ? 'text-emerald-600'
                          : initialBalanceForPeriod < 0
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {initialBalanceForPeriod > 0
                        ? "You'll Get"
                        : initialBalanceForPeriod < 0
                        ? "You'll Give"
                        : 'Settled'}
                    </div>
                  </td>
                  <td className="py-3 px-2 text-center text-slate-300 print:hidden">-</td>
                </tr>
              </tbody>

              {/* Summary / Total Footer */}
              <tfoot className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-xs">
                <tr>
                  <td colSpan={3} className="py-2.5 px-3 text-slate-700">
                    Period Total ({inRangeTxns.length} entries)
                  </td>
                  <td className="py-2.5 px-3 text-right text-rose-700 font-black">
                    {totalGivenInPeriod > 0 ? `₹${totalGivenInPeriod.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right text-emerald-700 font-black">
                    {totalGotInPeriod > 0 ? `₹${totalGotInPeriod.toLocaleString('en-IN')}` : '-'}
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <div
                      className={`font-black text-sm ${
                        running > 0
                          ? 'text-emerald-700'
                          : running < 0
                          ? 'text-rose-700'
                          : 'text-slate-700'
                      }`}
                    >
                      ₹{Math.abs(running).toLocaleString('en-IN')}
                    </div>
                    <div
                      className={`text-[9px] font-bold uppercase tracking-wider ${
                        running > 0
                          ? 'text-emerald-600'
                          : running < 0
                          ? 'text-rose-600'
                          : 'text-slate-500'
                      }`}
                    >
                      {running > 0 ? "You'll Get" : running < 0 ? "You'll Give" : 'Settled'}
                    </div>
                  </td>
                  <td className="print:hidden"></td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 print:hidden">
          <span>
            KM Stonex Khata • Certified Double Entry Accounting
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold rounded-lg transition"
          >
            Close Statement
          </button>
        </div>
      </div>
    </div>
  );
}
