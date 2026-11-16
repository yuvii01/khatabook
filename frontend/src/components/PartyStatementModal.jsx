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

  const filtered = transactions.filter((t) => {
    const tDate = t.date.slice(0, 10);
    if (startDate && tDate < startDate) return false;
    if (endDate && tDate > endDate) return false;
    return true;
  });

  const sortedChronological = [...filtered].sort(
    (a, b) => new Date(a.date) - new Date(b.date)
  );

  let running = Number(party.openingBalance || 0);
  const ledgerRows = sortedChronological.map((t) => {
    let debit = 0;
    let credit = 0;

    if (t.type === 'SALE_BILL') {
      debit = Number(t.amount);
      running += debit;
    } else if (t.type === 'YOU_GOT') {
      credit = Number(t.amount);
      running -= credit;
    } else if (t.type === 'PURCHASE_BILL') {
      credit = Number(t.amount);
      running -= credit;
    } else if (t.type === 'YOU_GAVE') {
      debit = Number(t.amount);
      running += debit;
    }

    return {
      ...t,
      debit,
      credit,
      runningBalance: running,
    };
  });

  const displayRows = [...ledgerRows].reverse();

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this khata entry?')) {
      try {
        await deleteTransaction(id);
        await recalculatePartyBalance(party._id);
        await fetchLedger();
        onRefreshParties();
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

  const currentBal = party.currentBalance || 0;
  const generateWhatsAppMessage = () => {
    const msg = currentBal > 0
      ? `Namaskar ${party.name} ji, this is a friendly reminder from KM Stonex regarding your outstanding balance of ₹${Math.abs(currentBal)}. Kindly clear the pending dues at your earliest convenience. Thank you!`
      : `Namaskar ${party.name} ji, this is an account statement update from KM Stonex. Your current account balance is ₹${Math.abs(currentBal)}. Thank you for your partnership!`;
    navigator.clipboard.writeText(msg);
    setCopiedReminder(true);
    setTimeout(() => setCopiedReminder(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 print:p-0 print:bg-white">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-stone-200 overflow-hidden flex flex-col max-h-[92vh] print:max-h-none print:shadow-none print:border-none">
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
                className={`text-xs font-bold px-2 py-0.5 rounded-full ${
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
              Opening Balance: ₹{party.openingBalance || 0}
            </p>
          </div>

          <div className="flex items-center gap-2 print:hidden">
            <button
              onClick={() => onAddTransaction(party._id, 'YOU_GAVE')}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>You Gave (Diya)</span>
            </button>
            <button
              onClick={() => onAddTransaction(party._id, 'YOU_GOT')}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 shadow-sm active:scale-95 transition"
            >
              <ArrowDownLeft className="w-4 h-4" />
              <span>You Got (Aaya)</span>
            </button>
          </div>
        </div>

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
              Total {displayRows.length} transactions
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

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-12 text-center text-slate-400 text-sm">
              Loading ledger statements...
            </div>
          ) : displayRows.length === 0 ? (
            <div className="py-12 text-center text-slate-500 text-sm">
              No transactions recorded yet for {party.name}. Click "You Got" or "You Gave" above to add the first entry!
            </div>
          ) : (
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-600 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Entry Details / Particulars</th>
                  <th className="py-2.5 px-3">Payment Mode</th>
                  <th className="py-2.5 px-3 text-right text-rose-700">You Gave (-)</th>
                  <th className="py-2.5 px-3 text-right text-emerald-700">You Got (+)</th>
                  <th className="py-2.5 px-3 text-right">Balance</th>
                  <th className="py-2.5 px-2 text-center print:hidden">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayRows.map((txn) => (
                  <tr
                    key={txn._id}
                    className="hover:bg-slate-50 transition duration-150"
                  >
                    <td className="py-3 px-3 font-medium text-slate-600 whitespace-nowrap">
                      {new Date(txn.date).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-800">
                        {txn.type.replace('_', ' ')}
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
                      {txn.debit > 0 ? `₹${txn.debit.toLocaleString('en-IN')}` : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-bold text-emerald-600">
                      {txn.credit > 0 ? `₹${txn.credit.toLocaleString('en-IN')}` : '-'}
                    </td>

                    <td className="py-3 px-3 text-right font-black">
                      <span
                        className={
                          txn.runningBalance > 0
                            ? 'text-emerald-700'
                            : txn.runningBalance < 0
                            ? 'text-rose-700'
                            : 'text-slate-600'
                        }
                      >
                        ₹{Math.abs(txn.runningBalance).toLocaleString('en-IN')}
                        <span className="text-[9px] font-bold ml-1 uppercase">
                          {txn.runningBalance > 0 ? 'Dr' : txn.runningBalance < 0 ? 'Cr' : ''}
                        </span>
                      </span>
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
                ))}
              </tbody>
            </table>
          )}
        </div>

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
