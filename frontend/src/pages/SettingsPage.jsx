import React, { useState, useEffect } from 'react';
import {
  Settings,
  Building,
  Save,
  Download,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import { getSettings, updateSettings } from '../services/api';

export default function SettingsPage({ onOpenBackup }) {
  const [formData, setFormData] = useState({
    businessName: 'KM Stonex',
    tagline: 'Premium Marble, Granite & Stone Khata',
    ownerName: '',
    phone: '',
    ownerWhatsApp: '',
    email: '',
    address: '',
    gstin: '',
    currencySymbol: '₹',
  });

  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const fetch = async () => {
      try {
        const res = await getSettings();
        if (res.data?.data) {
          setFormData((prev) => ({ ...prev, ...res.data.data }));
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      }
    };
    fetch();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSuccess('');
    setError('');

    try {
      await updateSettings(formData);
      setSuccess('Business profile updated successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-stone-100 text-stone-800 flex items-center justify-center border border-stone-200">
            <Settings className="w-6 h-6 text-stone-700" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              Business Profile &amp; Khata Settings
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Customize KM Stonex details and manage offline backup
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              KM Stonex Business Information
            </h2>
          </div>
          {success && (
            <span className="text-xs text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {success}
            </span>
          )}
        </div>

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business / Firm Name
            </label>
            <input
              type="text"
              value={formData.businessName}
              onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Tagline / Specialty
            </label>
            <input
              type="text"
              value={formData.tagline}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Owner / Proprietor Name
            </label>
            <input
              type="text"
              placeholder="e.g. KM Stonex Management"
              value={formData.ownerName}
              onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Business Phone / Mobile
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876500000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-emerald-800 mb-1">
              Owner Personal WhatsApp Number (For Monthly PDF/Summary) *
            </label>
            <input
              type="tel"
              placeholder="e.g. 9876543210 (Your WhatsApp number)"
              value={formData.ownerWhatsApp || ''}
              onChange={(e) => setFormData({ ...formData, ownerWhatsApp: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-emerald-50/50 border border-emerald-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 font-bold outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              GSTIN / Tax ID
            </label>
            <input
              type="text"
              placeholder="e.g. 08AABCK1234F1Z8"
              value={formData.gstin}
              onChange={(e) => setFormData({ ...formData, gstin: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg uppercase focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Office / Quarry Address
            </label>
            <input
              type="text"
              placeholder="e.g. Marble City, Kishangarh, Rajasthan"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-300 rounded-lg focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>
        </div>

        <div className="pt-3 flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-md flex items-center gap-2 transition disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </form>

      <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-sm space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-stone-900 uppercase tracking-wider">
                Khata Data Backup &amp; Recovery
              </h2>
              <p className="text-[11px] text-stone-500">
                Offline safety &amp; instant backup download
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 text-xs text-stone-600 leading-relaxed">
          <p>
            Your ledger transactions, party balances, and routing splits are safely recorded. You can download an offline JSON backup anytime to keep a permanent duplicate on your computer, phone, or Google Drive.
          </p>

          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={onOpenBackup}
              className="bg-stone-900 hover:bg-stone-800 text-stone-100 font-bold text-xs px-4 py-2.5 rounded-xl transition flex items-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span>Open Data Backup &amp; Restore Center</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
