import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Sparkles,
  Search,
  PlusCircle,
  Download,
  BookOpen,
  Edit2,
  Trash2,
  ArrowRight,
} from 'lucide-react';
import { getPendingDuesPdfUrl, deleteParty } from '../services/api';

export default function Dashboard({
  dashboardData,
  parties = [],
  onOpenRoutePayment,
  onOpenAddParty,
  onOpenAddTxn,
  onSelectParty,
  onEditParty,
  onRefresh,
  onNavigateToParties,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [balanceFilterTab, setBalanceFilterTab] = useState('all');

  const receivablePartiesCount = parties.filter((p) => (p.currentBalance || 0) > 0).length;
  const payablePartiesCount = parties.filter((p) => (p.currentBalance || 0) < 0).length;
  const activeDuesCount = receivablePartiesCount + payablePartiesCount;

  const handleDelete = async (e, id, name) => {
    e.stopPropagation();
    if (
      window.confirm(
        `Are you sure you want to remove party "${name}" from your books?\n\nThis will permanently delete this party and all associated khata transactions.`
      )
    ) {
      try {
        await deleteParty(id);
        if (onRefresh) {
          await onRefresh();
        }
      } catch (err) {
        alert('Failed to delete party: ' + (err.response?.data?.message || err.message));
      }
    }
  };

  const {
    totalReceivable = 0,
    totalPayable = 0,
  } = dashboardData || {};

  // Dashboard strictly excludes zero-balance parties
  const filteredParties = parties
    .filter((p) => {
      const bal = Number(p.currentBalance || 0);

      // Do not show zero-balance parties on the dashboard
      if (bal === 0) return false;

      // Tab filtering
      if (balanceFilterTab === 'receivable' && bal <= 0) return false;
      if (balanceFilterTab === 'payable' && bal >= 0) return false;

      const q = searchQuery.trim().toLowerCase();
      if (q) {
        return (
          (p.name && p.name.toLowerCase().includes(q)) ||
          (p.companyName && p.companyName.toLowerCase().includes(q)) ||
          (p.phone && p.phone.includes(q))
        );
      }

      return true;
    })
    .sort((a, b) => {
      const balA = Number(a.currentBalance || 0);
      const balB = Number(b.currentBalance || 0);

      const isACollect = balA > 0;
      const isBCollect = balB > 0;

      // Group 1: Ones to collect payment from come first
      if (isACollect && !isBCollect) return -1;
      if (!isACollect && isBCollect) return 1;

      // Within Group 1 (Collect): Highest payment to collect comes first (descending)
      if (isACollect && isBCollect) {
        return balB - balA;
      }

      // Group 2: Ones to give payment to come second (highest payment to give first)
      return Math.abs(balB) - Math.abs(balA);
    });

  const pdfDownloadUrl = getPendingDuesPdfUrl();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-6 bg-gradient-to-br from-emerald-50 via-teal-50/50 to-stone-50 border-2 border-emerald-300/90 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-emerald-900 text-xs font-black uppercase tracking-wider">
              <ArrowDownLeft className="w-4 h-4 text-emerald-700" />
              <span>You'll Get (To Collect)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-900 mt-2">
              ₹{Number(totalReceivable).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-emerald-800/80 font-bold mt-1">
              From {receivablePartiesCount} buyer/contractor parties
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-600/15 border border-emerald-500/30 flex items-center justify-center text-emerald-800">
            <ArrowDownLeft className="w-6 h-6 text-emerald-700" />
          </div>
        </div>

        <div className="p-6 bg-gradient-to-br from-rose-50 via-amber-50/30 to-stone-50 border-2 border-rose-300/80 rounded-3xl shadow-sm flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-rose-900 text-xs font-black uppercase tracking-wider">
              <ArrowUpRight className="w-4 h-4 text-rose-700" />
              <span>You'll Give (To Pay)</span>
            </div>
            <div className="text-2xl sm:text-3xl font-black text-rose-900 mt-2">
              ₹{Number(totalPayable).toLocaleString('en-IN')}
            </div>
            <p className="text-[11px] text-rose-800/80 font-bold mt-1">
              To {payablePartiesCount} quarry &amp; transport suppliers
            </p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-rose-600/15 border border-rose-500/30 flex items-center justify-center text-rose-800">
            <ArrowUpRight className="w-6 h-6 text-rose-700" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={onOpenRoutePayment}
          className="p-4 bg-emerald-800 hover:bg-emerald-900 text-amber-200 border border-emerald-700 rounded-2xl shadow-md flex items-center justify-center gap-2 font-bold text-sm transition active:scale-95"
        >
          <Sparkles className="w-5 h-5 text-amber-300" />
          <span>Smart Route Payment</span>
        </button>

        <button
          onClick={() => onOpenAddParty()}
          className="p-4 bg-stone-900 hover:bg-stone-800 text-stone-100 rounded-2xl shadow-md border border-stone-800 flex items-center justify-center gap-2 font-bold text-sm transition active:scale-95"
        >
          <PlusCircle className="w-5 h-5 text-emerald-400" />
          <span>+ Add Party</span>
        </button>

        <a
          href={pdfDownloadUrl}
          download="KM_Stonex_Pending_Dues_Report.pdf"
          className="p-4 bg-white hover:bg-stone-50 border-2 border-stone-200 text-stone-800 rounded-2xl shadow-sm flex items-center justify-center gap-2 font-bold text-sm transition active:scale-95"
        >
          <Download className="w-5 h-5 text-emerald-700" />
          <span>Download Pending PDF</span>
        </a>
      </div>

      <div className="bg-white rounded-3xl border border-stone-200 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black text-stone-900">
              Parties Khata Book
            </h2>
            <span className="text-xs bg-stone-100 text-stone-700 font-bold px-2.5 py-0.5 rounded-full border border-stone-200">
              {activeDuesCount} Active Dues
            </span>
          </div>

          <div className="flex flex-wrap bg-stone-100 p-1 rounded-xl text-xs font-bold gap-1 border border-stone-200/60">
            <button
              onClick={() => setBalanceFilterTab('all')}
              className={`px-3 py-1 rounded-lg transition ${
                balanceFilterTab === 'all'
                  ? 'bg-white text-stone-900 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              All Active Dues ({activeDuesCount})
            </button>
            <button
              onClick={() => setBalanceFilterTab('receivable')}
              className={`px-3 py-1 rounded-lg transition ${
                balanceFilterTab === 'receivable'
                  ? 'bg-white text-emerald-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              To Collect ({receivablePartiesCount})
            </button>
            <button
              onClick={() => setBalanceFilterTab('payable')}
              className={`px-3 py-1 rounded-lg transition ${
                balanceFilterTab === 'payable'
                  ? 'bg-white text-rose-800 shadow-sm'
                  : 'text-stone-500 hover:text-stone-900'
              }`}
            >
              To Give ({payablePartiesCount})
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Type party name, firm name, or phone to search active dues..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs bg-stone-50/80 border border-stone-200 rounded-2xl focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none font-semibold text-stone-800 placeholder:text-stone-400"
          />
        </div>

        <div className="space-y-2">
          {filteredParties.length === 0 ? (
            <div className="text-center py-12 text-stone-500 text-xs font-medium space-y-3">
              <div className="w-10 h-10 rounded-full bg-stone-100 text-stone-400 flex items-center justify-center mx-auto border border-stone-200">
                <Sparkles className="w-5 h-5 text-emerald-700" />
              </div>
              <div>
                <p className="font-bold text-stone-800 text-sm">No Active Dues Pending</p>
                <p className="text-stone-500 text-xs mt-0.5">
                  Parties with zero balance are managed in the Parties Directory.
                </p>
              </div>
              {onNavigateToParties && (
                <button
                  onClick={onNavigateToParties}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold shadow-sm transition active:scale-95"
                >
                  <span>View All Parties ({parties.length})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            filteredParties.map((p) => {
              const bal = p.currentBalance || 0;
              const isReceivable = bal > 0;
              const isPayable = bal < 0;
              return (
                <div
                  key={p._id}
                  onClick={() => onSelectParty(p)}
                  className="p-3.5 sm:p-4 rounded-2xl border border-stone-200 hover:border-emerald-500/70 hover:bg-stone-50/70 bg-white shadow-sm cursor-pointer transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-stone-100 text-stone-800 border border-stone-200 font-black text-sm flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-amber-200 group-hover:border-emerald-600 transition">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-sm text-stone-900 group-hover:text-emerald-800 transition">
                          {p.name}
                        </h4>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            isReceivable
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : 'bg-rose-100 text-rose-800 border border-rose-200'
                          }`}
                        >
                          {isReceivable ? "To Collect (Lena)" : "To Give (Dena)"}
                        </span>
                      </div>
                      <p className="text-xs text-stone-500 mt-0.5 flex items-center gap-2">
                        {p.companyName && <span>{p.companyName} • </span>}
                        {p.phone || 'No phone'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <div className="text-right">
                      <div
                        className={`text-base font-black ${
                          isReceivable ? 'text-emerald-700' : 'text-rose-700'
                        }`}
                      >
                        ₹{Math.abs(bal).toLocaleString('en-IN')}
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase ${
                          isReceivable ? 'text-emerald-600' : 'text-rose-600'
                        }`}
                      >
                        {isReceivable ? "You'll Get (Lena)" : "You'll Give (Dena)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onEditParty) onEditParty(p);
                        }}
                        className="p-2 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition border border-transparent hover:border-amber-200"
                        title={`Edit ${p.name}`}
                        aria-label={`Edit ${p.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, p._id, p.name)}
                        className="p-2 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition border border-transparent hover:border-rose-200"
                        title={`Delete ${p.name}`}
                        aria-label={`Delete ${p.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectParty(p);
                        }}
                        className="hidden sm:flex px-3 py-1.5 text-xs font-bold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl transition items-center gap-1 border border-stone-200/60"
                        title="Open Ledger"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
