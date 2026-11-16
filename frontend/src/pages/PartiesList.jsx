import React, { useState } from 'react';
import {
  Search,
  Plus,
  Phone,
  Edit2,
  Trash2,
  BookOpen,
} from 'lucide-react';
import { deleteParty } from '../services/api';

export default function PartiesList({
  parties,
  onOpenAddParty,
  onEditParty,
  onSelectParty,
  onRefresh,
}) {
  const [search, setSearch] = useState('');
  const [balanceFilter, setBalanceFilter] = useState('all');

  const receivableCount = parties.filter((p) => (p.currentBalance || 0) > 0).length;
  const payableCount = parties.filter((p) => (p.currentBalance || 0) < 0).length;
  const settledCount = parties.filter((p) => (p.currentBalance || 0) === 0).length;

  const filtered = parties
    .filter((p) => {
      const bal = Number(p.currentBalance || 0);
      const q = search.trim().toLowerCase();

      // If user typed a search query, search across all parties
      if (q) {
        const matchesName = p.name && p.name.toLowerCase().includes(q);
        const matchesCompany = p.companyName && p.companyName.toLowerCase().includes(q);
        const matchesPhone = p.phone && p.phone.includes(q);
        const matchesGstin = p.gstin && p.gstin.toLowerCase().includes(q);
        return matchesName || matchesCompany || matchesPhone || matchesGstin;
      }

      // Filter by tab
      if (balanceFilter === 'receivable') return bal > 0;
      if (balanceFilter === 'payable') return bal < 0;
      if (balanceFilter === 'settled') return bal === 0;

      // 'all' shows all parties
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

      const isAGive = balA < 0;
      const isBGive = balB < 0;

      // Group 2: Ones to give payment to come second
      if (isAGive && !isBGive) return -1;
      if (!isAGive && isBGive) return 1;

      // Within Group 2 (Give): Highest payment to give comes first (descending by absolute value)
      if (isAGive && isBGive) {
        return Math.abs(balB) - Math.abs(balA);
      }

      // Group 3: Zero-balance / Settled parties: most recently added first
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Parties Directory
            </h1>
            <span className="text-xs bg-stone-100 text-stone-700 px-2.5 py-0.5 rounded-full font-bold border border-stone-200">
              {parties.length} Total Parties
            </span>
          </div>
          <p className="text-xs text-stone-500 mt-1">
            Manage your parties, opening balances, receivables, and advance dues
          </p>
        </div>

        <button
          onClick={() => onOpenAddParty()}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow-md flex items-center gap-2 self-start sm:self-auto active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add Party</span>
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex flex-wrap bg-stone-100 p-1 rounded-xl text-xs font-semibold gap-1 border border-stone-200/60">
          <button
            onClick={() => setBalanceFilter('all')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg transition ${
              balanceFilter === 'all'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All Parties ({parties.length})
          </button>
          <button
            onClick={() => setBalanceFilter('receivable')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg transition ${
              balanceFilter === 'receivable'
                ? 'bg-white text-emerald-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            To Collect ({receivableCount})
          </button>
          <button
            onClick={() => setBalanceFilter('payable')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg transition ${
              balanceFilter === 'payable'
                ? 'bg-white text-rose-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            To Give ({payableCount})
          </button>
          <button
            onClick={() => setBalanceFilter('settled')}
            className={`px-3 sm:px-4 py-1.5 rounded-lg transition ${
              balanceFilter === 'settled'
                ? 'bg-white text-stone-800 shadow-sm'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Settled / ₹0 ({settledCount})
          </button>
        </div>

        <div className="relative flex-1 md:w-64">
          <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search party by name, firm, phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-stone-50/80 border border-stone-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-600 outline-none text-stone-800 placeholder:text-stone-400"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center bg-white rounded-2xl border border-stone-200 text-stone-400 text-sm space-y-2">
            <p>No parties found matching this filter.</p>
            {balanceFilter !== 'all' && (
              <button
                onClick={() => setBalanceFilter('all')}
                className="text-xs text-emerald-700 font-bold hover:underline"
              >
                Switch to All Parties ({parties.length})
              </button>
            )}
          </div>
        ) : (
          filtered.map((party) => {
            const bal = party.currentBalance || 0;
            const isReceivable = bal > 0;
            const isPayable = bal < 0;

            return (
              <div
                key={party._id}
                onClick={() => onSelectParty(party)}
                className="bg-white rounded-2xl border border-stone-200 hover:border-emerald-500/70 hover:shadow-md transition p-5 flex flex-col justify-between cursor-pointer group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-xl bg-stone-100 text-stone-800 border border-stone-200 font-black text-base flex items-center justify-center group-hover:bg-emerald-700 group-hover:text-amber-200 group-hover:border-emerald-600 transition shadow-sm">
                        {party.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-sm text-stone-900 group-hover:text-emerald-800 transition">
                          {party.name}
                        </h3>
                        {party.companyName && (
                          <p className="text-xs text-stone-500 font-medium">
                            {party.companyName}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEditParty(party);
                        }}
                        className="p-1.5 text-stone-400 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition"
                        title={`Edit ${party.name}`}
                        aria-label={`Edit ${party.name}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(e, party._id, party.name)}
                        className="p-1.5 text-stone-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                        title={`Delete ${party.name}`}
                        aria-label={`Delete ${party.name}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-stone-500 py-2 border-t border-stone-100">
                    {party.phone && (
                      <p className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-stone-400" />
                        <span>{party.phone}</span>
                      </p>
                    )}
                    {party.gstin && (
                      <p className="text-[11px] text-stone-400 uppercase font-mono">
                        GST: {party.gstin}
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-3 border-t border-stone-100 flex items-center justify-between mt-3">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-stone-400">
                      Balance
                    </span>
                    <div
                      className={`text-base font-black ${
                        isReceivable
                          ? 'text-emerald-600'
                          : isPayable
                          ? 'text-rose-600'
                          : 'text-stone-600'
                      }`}
                    >
                      ₹{Math.abs(bal).toLocaleString('en-IN')}
                    </div>
                    <span
                      className={`text-[9px] font-bold uppercase ${
                        isReceivable
                          ? 'text-emerald-700'
                          : isPayable
                          ? 'text-rose-700'
                          : 'text-stone-500'
                      }`}
                    >
                      {isReceivable ? "To Collect (Lena)" : isPayable ? "To Give (Dena)" : 'Settled (₹0)'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditParty(party);
                      }}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-stone-50 hover:bg-amber-50 text-stone-600 hover:text-amber-700 rounded-lg border border-stone-200 transition flex items-center gap-1"
                      title={`Edit ${party.name}`}
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleDelete(e, party._id, party.name)}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-stone-50 hover:bg-rose-50 text-stone-600 hover:text-rose-600 rounded-lg border border-stone-200 transition flex items-center gap-1"
                      title={`Delete ${party.name}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete</span>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectParty(party);
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg transition flex items-center gap-1 border border-stone-200/60"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      <span>Ledger</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
