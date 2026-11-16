import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { executeRoutePayment } from '../services/api';

export default function RoutePaymentModal({ isOpen, onClose, parties, onSuccess }) {
  const [sourcePartyId, setSourcePartyId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState('');
  
  const [distributions, setDistributions] = useState([
    { recipientPartyId: '', amount: '', note: '' },
  ]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setSourcePartyId('');
      setTotalAmount('');
      setPaymentMode('Cash');
      setDate(new Date().toISOString().slice(0, 10));
      setDescription('');
      setDistributions([{ recipientPartyId: '', amount: '', note: '' }]);
      setError('');
      setSuccessMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const parsedTotal = parseFloat(totalAmount) || 0;
  const totalAllocated = distributions.reduce(
    (sum, d) => sum + (parseFloat(d.amount) || 0),
    0
  );
  const remaining = Math.max(0, parsedTotal - totalAllocated);
  const isOverAllocated = totalAllocated > parsedTotal && parsedTotal > 0;

  const handleAddDistribution = () => {
    setDistributions([
      ...distributions,
      { recipientPartyId: '', amount: '', note: '' },
    ]);
  };

  const handleRemoveDistribution = (index) => {
    if (distributions.length <= 1) return;
    setDistributions(distributions.filter((_, i) => i !== index));
  };

  const handleDistributionChange = (index, field, value) => {
    const updated = [...distributions];
    updated[index][field] = value;
    setDistributions(updated);
  };

  const handleAutoFillRemaining = (index) => {
    if (remaining > 0) {
      const currentAmt = parseFloat(distributions[index].amount) || 0;
      handleDistributionChange(index, 'amount', String(currentAmt + remaining));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!sourcePartyId) {
      setError('Please select who gave you the money.');
      return;
    }

    if (parsedTotal <= 0) {
      setError('Please enter the amount you received.');
      return;
    }

    if (isOverAllocated) {
      setError(`Allocated amount (₹${totalAllocated}) is greater than received amount (₹${parsedTotal}).`);
      return;
    }

    const validDists = distributions.filter(
      (d) => d.recipientPartyId && parseFloat(d.amount) > 0
    );

    if (validDists.length === 0) {
      setError('Please select at least one party and enter the amount to pay them.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        sourcePartyId,
        totalAmount: parsedTotal,
        paymentMode,
        date,
        description,
        distributions: validDists.map((d) => ({
          recipientPartyId: d.recipientPartyId,
          amount: parseFloat(d.amount),
          note: d.note || '',
        })),
      };

      const res = await executeRoutePayment(payload);
      setSuccessMsg(res.data.message || 'Payment successfully divided and updated!');
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1000);
    } catch (err) {
      console.error('Route payment error:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to process payment division';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const selectedSource = parties.find((p) => String(p._id) === String(sourcePartyId));

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full border border-slate-200 overflow-hidden">
        <div className="bg-emerald-700 p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">
                Divide Payment (Aaya Aur Baata)
              </h2>
              <p className="text-xs text-emerald-100">
                Receive from one party & route to other parties in 1 step
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white p-1.5 rounded-xl hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{successMsg}</span>
            </div>
          )}

          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-emerald-700 text-white flex items-center justify-center text-xs font-bold">
                1
              </span>
              <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-900">
                Money Received (Kisne Diya Aur Kitna?)
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Paying Party *
                </label>
                <select
                  value={sourcePartyId}
                  onChange={(e) => setSourcePartyId(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Choose Paying Party --</option>
                  {parties.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} {p.companyName ? `(${p.companyName})` : ''}
                    </option>
                  ))}
                </select>
                {selectedSource && (
                  <p className="mt-1 text-[11px] text-emerald-800 font-semibold">
                    Current Balance: {selectedSource.currentBalance > 0 ? `Owes ₹${selectedSource.currentBalance}` : 'Settled'}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Amount Received (₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-slate-400 font-bold text-sm">
                    ₹
                  </span>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    placeholder="e.g. 500"
                    value={totalAmount}
                    onChange={(e) => setTotalAmount(e.target.value)}
                    required
                    className="w-full pl-8 pr-3 py-2 text-sm bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Payment Mode
                </label>
                <select
                  value={paymentMode}
                  onChange={(e) => setPaymentMode(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                >
                  <option value="Cash">Cash (Nagad)</option>
                  <option value="UPI / GPay / PhonePe">UPI / GPay / PhonePe</option>
                  <option value="Bank Transfer (NEFT/RTGS/IMPS)">Bank Transfer</option>
                  <option value="Cheque">Cheque</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                  Date
                </label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-none"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                  Route To Parties (Kisko Kitna Dena Hai?)
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddDistribution}
                className="text-xs font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Party</span>
              </button>
            </div>

            <div className="space-y-2">
              {distributions.map((dist, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-center gap-2"
                >
                  <div className="flex-1 w-full">
                    <select
                      value={dist.recipientPartyId}
                      onChange={(e) =>
                        handleDistributionChange(idx, 'recipientPartyId', e.target.value)
                      }
                      required
                      className="w-full px-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-500 outline-none"
                    >
                      <option value="">-- Choose Party to Pay --</option>
                      {parties
                        .filter((p) => String(p._id) !== String(sourcePartyId))
                        .map((p) => (
                          <option key={p._id} value={p._id}>
                            {p.name} {p.companyName ? `(${p.companyName})` : ''} -{' '}
                            {p.currentBalance < 0
                              ? `You owe ₹${Math.abs(p.currentBalance)}`
                              : p.currentBalance > 0
                              ? `Advance ₹${p.currentBalance}`
                              : 'Settled'}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div className="w-full sm:w-36 relative">
                    <span className="absolute left-3 top-1.5 text-slate-400 text-xs font-bold">
                      ₹
                    </span>
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Amount"
                      value={dist.amount}
                      onChange={(e) =>
                        handleDistributionChange(idx, 'amount', e.target.value)
                      }
                      required
                      className="w-full pl-7 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                    {remaining > 0 && (
                      <button
                        type="button"
                        onClick={() => handleAutoFillRemaining(idx)}
                        className="text-[11px] bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-lg hover:bg-emerald-200 transition"
                      >
                        +₹{remaining}
                      </button>
                    )}
                    {distributions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveDistribution(idx)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 bg-slate-100 rounded-2xl flex items-center justify-between text-xs font-bold text-slate-700">
              <div>Received: ₹{parsedTotal}</div>
              <div className="text-emerald-700">Paying: ₹{totalAllocated}</div>
              <div>
                {remaining > 0 ? (
                  <span className="text-amber-700">Cash in Hand: ₹{remaining}</span>
                ) : isOverAllocated ? (
                  <span className="text-rose-600 font-black">
                    Exceeded by ₹{totalAllocated - parsedTotal}
                  </span>
                ) : (
                  <span className="text-emerald-700 flex items-center gap-1 font-bold">
                    <CheckCircle2 className="w-3.5 h-3.5" /> 100% Fully Divided
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="pt-2 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || isOverAllocated || parsedTotal <= 0}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm px-6 py-2.5 rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center gap-2 transition disabled:opacity-50"
            >
              {loading ? (
                <span>Saving...</span>
              ) : (
                <>
                  <span>Save & Update All Books</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
