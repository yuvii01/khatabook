import React, { useState, useEffect } from 'react';
import { X, UserPlus, AlertCircle } from 'lucide-react';
import { createParty, updateParty } from '../services/api';

export default function AddPartyModal({ isOpen, onClose, onSuccess, initialParty = null }) {
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [type] = useState('party');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [balanceType, setBalanceType] = useState('get');
  const [openingBalance, setOpeningBalance] = useState('');
  const [notes, setNotes] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialParty) {
      setName(initialParty.name || '');
      setCompanyName(initialParty.companyName || '');
      setPhone(initialParty.phone || '');
      setEmail(initialParty.email || '');
      setAddress(initialParty.address || '');
      setGstin(initialParty.gstin || '');
      setNotes(initialParty.notes || '');

      const openBal = initialParty.openingBalance || 0;
      if (openBal >= 0) {
        setBalanceType('get');
        setOpeningBalance(openBal ? String(openBal) : '');
      } else {
        setBalanceType('give');
        setOpeningBalance(String(Math.abs(openBal)));
      }
    } else {
      setName('');
      setCompanyName('');
      setPhone('');
      setEmail('');
      setAddress('');
      setGstin('');
      setBalanceType('get');
      setOpeningBalance('');
      setNotes('');
    }
    setError('');
  }, [isOpen, initialParty]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Party name is required.');
      return;
    }

    setLoading(true);
    try {
      const parsedBal = parseFloat(openingBalance) || 0;
      const signedBal = balanceType === 'give' ? -parsedBal : parsedBal;

      const payload = {
        name: name.trim(),
        companyName: companyName.trim(),
        type,
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        gstin: gstin.trim(),
        openingBalance: signedBal,
        notes: notes.trim(),
      };

      if (initialParty) {
        await updateParty(initialParty._id, payload);
      } else {
        await createParty(payload);
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save party');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#0b1f1a] p-5 text-white flex items-center justify-between border-b border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <UserPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">
                {initialParty ? 'Edit Party Profile' : 'Add New Party'}
              </h2>
              <p className="text-xs text-emerald-300/80">
                Manage party details, receivables, and advance dues
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-white p-1 rounded-lg hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Party / Contact Person Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Ram Kumar"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Company / Firm Name
              </label>
              <input
                type="text"
                placeholder="e.g. Shree Ram Marble Traders"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Phone / Mobile
              </label>
              <input
                type="tel"
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GSTIN / Tax ID
              </label>
              <input
                type="text"
                placeholder="e.g. 08AAAAA0000A1Z5"
                value={gstin}
                onChange={(e) => setGstin(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 uppercase outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Address / Quarry Location
            </label>
            <input
              type="text"
              placeholder="e.g. Plot 12, Marble Market, Kishangarh"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Opening Balance (Starting Dues / Advance)
              </label>
              <p className="text-[11px] text-slate-500">
                How much money do you need to get from this party, or did they pay in advance?
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setBalanceType('get')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition text-center ${
                    balanceType === 'get'
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  You'll Get (Lena)
                </button>
                <button
                  type="button"
                  onClick={() => setBalanceType('give')}
                  className={`flex-1 py-1.5 px-2 text-xs font-bold rounded-lg border transition text-center ${
                    balanceType === 'give'
                      ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                      : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  Advance / Give (Dena)
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1.5 text-slate-400 font-bold text-xs">
                  ₹
                </span>
                <input
                  type="number"
                  min="0"
                  step="any"
                  placeholder="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
            <p className="text-[10px] text-slate-500 italic">
              {balanceType === 'get'
                ? "• Party owes you this money for material supplied."
                : "• Advance payment from party: You need to supply material accordingly."}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Remarks / Notes
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Deals in Italian marble, pays via NEFT on the 10th"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs px-6 py-2 rounded-xl shadow-md transition disabled:opacity-50"
            >
              {loading ? 'Saving...' : initialParty ? 'Update Party' : 'Add Party to Books'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
