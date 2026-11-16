import React, { useState } from 'react';
import {
  X,
  Download,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { exportBackup, restoreBackup } from '../services/api';

export default function BackupModal({ isOpen, onClose, onRestoreSuccess }) {
  const [restoring, setRestoring] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [restoreMessage, setRestoreMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  if (!isOpen) return null;

  const handleExport = async () => {
    setDownloading(true);
    setErrorMessage('');
    try {
      const res = await exportBackup();
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute(
        'download',
        `km_stonex_khata_backup_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setErrorMessage('Failed to export backup: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoring(true);
    setRestoreMessage('');
    setErrorMessage('');

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);

      if (!parsed.data || !parsed.data.parties) {
        throw new Error('Invalid KM Stonex Khata backup JSON file.');
      }

      const res = await restoreBackup(parsed);
      setRestoreMessage(
        res.data.message || 'Data restored successfully!'
      );
      if (onRestoreSuccess) {
        onRestoreSuccess();
      }
    } catch (err) {
      setErrorMessage('Restore failed: ' + err.message);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full border border-stone-200 overflow-hidden">
        <div className="bg-[#0b1f1a] p-5 text-white flex items-center justify-between border-b border-emerald-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-stone-100">Khata Backup &amp; Recovery Center</h2>
              <p className="text-xs text-emerald-300/80">
                Offline Data Protection &amp; Safe Export for KM Stonex
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

        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {restoreMessage && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span>{restoreMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="p-4 rounded-xl border bg-emerald-50/50 border-emerald-200/80 flex items-center gap-3.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-stone-900">
                Safe &amp; Permanent Khata Records
              </h4>
              <p className="text-xs text-stone-600 leading-relaxed">
                All ledger transactions, party dues, and routing splits are automatically preserved. Download an offline backup file anytime to keep a personal duplicate on your computer, phone, or Google Drive.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-emerald-900 font-bold text-sm mb-1">
                  <Download className="w-4 h-4 text-emerald-700" />
                  <span>Download Full Backup</span>
                </div>
                <p className="text-xs text-stone-600 mb-4">
                  Exports 100% of your parties, ledger transactions, and split records to an offline JSON file.
                </p>
              </div>
              <button
                onClick={handleExport}
                disabled={downloading}
                className="w-full py-2.5 px-4 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{downloading ? 'Exporting...' : 'Download Backup File (.json)'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl border border-stone-200 bg-stone-50 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-stone-800 font-bold text-sm mb-1">
                  <Upload className="w-4 h-4 text-stone-700" />
                  <span>Restore from Backup</span>
                </div>
                <p className="text-xs text-stone-600 mb-4">
                  Select a previously downloaded backup JSON file to restore all books and records seamlessly.
                </p>
              </div>
              <label className="w-full py-2.5 px-4 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-lg shadow-sm transition flex items-center justify-center gap-2 cursor-pointer text-center">
                <Upload className="w-3.5 h-3.5 text-stone-200" />
                <span>{restoring ? 'Restoring Books...' : 'Upload & Restore File'}</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          <div className="border border-stone-200 rounded-xl p-4 bg-stone-50/80 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wider text-stone-700 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-700" />
              Khata Data Best Practices
            </h4>

            <div className="space-y-2 text-xs text-stone-600 leading-relaxed">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Regular Offline Backups:</strong> Click <strong>Download Full Backup</strong> at the end of each week or month to keep an offline JSON copy on your device or Google Drive.
                </p>
              </div>

              <div className="flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <p>
                  <strong>Instant 1-Click Restore:</strong> If you ever switch computers or phones, simply click <strong>Upload &amp; Restore File</strong> to bring back 100% of your party ledgers in one second.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 bg-stone-50 border-t border-stone-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-stone-800 hover:bg-stone-700 text-white font-bold text-xs rounded-lg transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
