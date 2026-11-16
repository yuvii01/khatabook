import React, { useState, useEffect } from 'react';
import {
  X,
  PlusCircle,
  ArrowDownLeft,
  ArrowUpRight,
  AlertCircle,
  Plus,
  Trash2,
} from 'lucide-react';
import { createTransaction } from '../services/api';

export default function AddTransactionModal({
  isOpen,
  onClose,
  parties,
  onSuccess,
  defaultPartyId = '',
  defaultType = 'YOU_GOT',
}) {
  const [party, setParty] = useState(defaultPartyId);
  const [type, setType] = useState(defaultType);
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [referenceNumber, setReferenceNumber] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [description, setDescription] = useState('');
  const [showItemized, setShowItemized] = useState(false);
  const [items, setItems] = useState([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setParty(defaultPartyId || '');
      setType(defaultType === 'YOU_GAVE' ? 'YOU_GAVE' : 'YOU_GOT');
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
      setPaymentMode('Cash');
      setReferenceNumber('');
      setBillNumber('');
      setDescription('');
      setItems([]);
      setShowItemized(false);
      setError('');
    }
  }, [isOpen, defaultPartyId, defaultType]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setItems([
      ...items,
      { itemName: '', quantity: 100, unit: 'sq.ft', rate: 50, total: 5000 },
    ]);
  };

  const handleItemChange = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    if (field === 'quantity' || field === 'rate') {
      const q = parseFloat(field === 'quantity' ? value : updated[index].quantity) || 0;
      const r = parseFloat(field === 'rate' ? value : updated[index].rate) || 0;
      updated[index].total = q * r;
    }
    setItems(updated);

    const sum = updated.reduce((s, it) => s + (parseFloat(it.total) || 0), 0);
    if (sum > 0) setAmount(String(sum));
  };

  const handleRemoveItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    const sum = updated.reduce((s, it) => s + (parseFloat(it.total) || 0), 0);
    if (sum > 0) setAmount(String(sum));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!party) {
      setError('Please select a party.');
      return;
    }

    const parsedAmt = parseFloat(amount);
    if (!parsedAmt || parsedAmt <= 0) {
      setError('Please enter a valid amount greater than 0.');
      return;
    }

    setLoading(true);
    try {
      await createTransaction({
        party,
        type,
        amount: parsedAmt,
        date,
        paymentMode,
        referenceNumber,
        billNumber,
        description,
        items: showItemized ? items : [],
      });

      if (onSuccess) {
        await onSuccess();
      }
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to record entry');
    } finally {
      setLoading(false);
    }
  };

  const selectedParty = parties.find((p) => String(p._id) === String(party));

  return (
    <div className="fixed inset-0 z-[70] overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-stone-200 overflow-hidden transform transition-all animate-in fade-in zoom-in-95 duration-200">
        <div className="bg-[#0b1f1a] p-5 text-white flex items-center justify-between border-b border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <PlusCircle className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">New Khata Entry</h2>
              <p className="text-xs text-emerald-300/80">
                Record Payment Received (You Got) or Payment Given (You Give)
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

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Select Entry Type *
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => setType('YOU_GOT')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition text-left ${
                  type === 'YOU_GOT'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-800 ring-2 ring-emerald-200 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ArrowDownLeft className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">YOU GOT (Aaya)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Payment Received</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setType('YOU_GAVE')}
                className={`p-3.5 rounded-xl border flex items-center gap-3 transition text-left ${
                  type === 'YOU_GAVE'
                    ? 'bg-rose-50 border-rose-500 text-rose-800 ring-2 ring-rose-200 shadow-sm'
                    : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold leading-tight">YOU GIVE (Diya)</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Payment Given</div>
                </div>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Select Party / Book *
            </label>
            <select
              value={party}
              onChange={(e) => setParty(e.target.value)}
              required
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            >
              <option value="">-- Choose Party --</option>
              {parties.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} {p.companyName ? `(${p.companyName})` : ''}
                </option>
              ))}
            </select>
            {selectedParty && (
              <p className="mt-1 text-[11px] text-slate-500">
                Current Balance:{' '}
                <span
                  className={
                    selectedParty.currentBalance > 0
                      ? 'text-emerald-600 font-semibold'
                      : selectedParty.currentBalance < 0
                      ? 'text-rose-600 font-semibold'
                      : 'text-slate-600 font-semibold'
                  }
                >
                  {selectedParty.currentBalance > 0
                    ? `You'll get ₹${selectedParty.currentBalance}`
                    : selectedParty.currentBalance < 0
                    ? `You'll give ₹${Math.abs(selectedParty.currentBalance)}`
                    : 'Settled ₹0'}
                </span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Amount (₹) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="0.01"
                  step="any"
                  placeholder="0.00"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full pl-8 pr-3 py-2 text-sm bg-slate-50 border border-slate-300 rounded-lg font-bold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Payment Mode
              </label>
              <select
                value={paymentMode}
                onChange={(e) => setPaymentMode(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              >
                <option value="Cash">Cash (Nagad)</option>
                <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                <option value="Bank Transfer (NEFT/RTGS/IMPS)">Bank Transfer</option>
                <option value="Cheque">Cheque</option>
                <option value="Credit Note">Credit Note</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Ref / Bill / Cheque No.
              </label>
              <input
                type="text"
                placeholder="e.g. INV-104 or UTR#49392"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Marble Details
            </label>
            <input
              type="text"
              placeholder="e.g. Payment for 500 sq.ft Italian Marble or Advance token"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <button
              type="button"
              onClick={() => {
                setShowItemized(!showItemized);
                if (!showItemized && items.length === 0) handleAddItem();
              }}
              className="text-xs text-teal-600 hover:text-teal-700 font-semibold flex items-center gap-1.5"
            >
              <span>{showItemized ? '- Hide Itemized Slabs / Stone Entry' : '+ Add Itemized Slabs / Sq.Ft Details (Optional)'}</span>
            </button>

            {showItemized && (
              <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-600 uppercase">
                    Stone / Slab Items
                  </span>
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="text-[11px] text-emerald-600 font-bold flex items-center gap-0.5 hover:underline"
                  >
                    <Plus className="w-3 h-3" /> Add Row
                  </button>
                </div>

                {items.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-1.5 items-center text-xs">
                    <input
                      type="text"
                      placeholder="Item name (e.g. Makrana White)"
                      value={item.itemName}
                      onChange={(e) => handleItemChange(idx, 'itemName', e.target.value)}
                      className="col-span-5 px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className="col-span-2 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                    <input
                      type="number"
                      placeholder="Rate"
                      value={item.rate}
                      onChange={(e) => handleItemChange(idx, 'rate', e.target.value)}
                      className="col-span-2 px-1.5 py-1 bg-white border border-slate-300 rounded text-xs"
                    />
                    <span className="col-span-2 font-semibold text-slate-700 text-right">
                      ₹{item.total || 0}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      className="col-span-1 text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
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
              className={`font-semibold text-xs px-6 py-2.5 rounded-xl shadow-md text-white transition disabled:opacity-50 ${
                type === 'YOU_GOT'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {loading ? 'Saving...' : type === 'YOU_GOT' ? 'Save "You Got" Entry' : 'Save "You Give" Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
