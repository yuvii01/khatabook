import React from 'react';
import {
  Users,
  PlusCircle,
  Download,
  Settings,
  Sparkles,
  Home,
} from 'lucide-react';

export default function Navbar({
  currentView,
  setCurrentView,
  onOpenRoutePayment,
  onOpenAddParty,
}) {
  return (
    <header className="bg-[#0b1f1a] text-white sticky top-0 z-40 shadow-lg border-b border-emerald-900/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <div
            onClick={() => setCurrentView('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-600 to-teal-800 flex items-center justify-center font-black text-amber-200 text-base shadow-inner border border-emerald-500/30">
              KM
            </div>
            <div>
              <span className="font-extrabold text-base tracking-wider text-stone-100 block leading-tight">
                KM STONEX
              </span>
              <span className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">
                Green Marble &amp; Stone Khata
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-1.5 text-xs font-bold">
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                currentView === 'dashboard'
                  ? 'bg-emerald-800/80 text-emerald-200 shadow-sm border border-emerald-700/60'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <Home className="w-4 h-4" />
              <span>Khata (Home)</span>
            </button>

            <button
              onClick={() => setCurrentView('parties')}
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                currentView === 'parties'
                  ? 'bg-emerald-800/80 text-emerald-200 shadow-sm border border-emerald-700/60'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Parties</span>
            </button>

            <button
              onClick={() => setCurrentView('reports')}
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                currentView === 'reports'
                  ? 'bg-emerald-800/80 text-emerald-200 shadow-sm border border-emerald-700/60'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <Download className="w-4 h-4 text-emerald-300" />
              <span>Pending Dues PDF</span>
            </button>

            <button
              onClick={() => setCurrentView('settings')}
              className={`px-3 py-2 rounded-xl transition flex items-center gap-1.5 ${
                currentView === 'settings'
                  ? 'bg-emerald-800/80 text-emerald-200 shadow-sm border border-emerald-700/60'
                  : 'text-stone-300 hover:bg-stone-800/60 hover:text-white'
              }`}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </button>
          </nav>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenRoutePayment}
              className="bg-gradient-to-r from-emerald-400 to-teal-400 hover:from-emerald-300 hover:to-teal-300 text-stone-950 font-black text-xs sm:text-sm px-3.5 py-2 rounded-xl shadow flex items-center gap-1.5 transition active:scale-95"
              title="When customer pays you and you want to forward to suppliers"
            >
              <Sparkles className="w-4 h-4 text-emerald-950" />
              <span>Divide Payment</span>
            </button>

            <button
              onClick={() => onOpenAddParty()}
              className="bg-stone-800/90 hover:bg-stone-700 text-stone-100 px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 border border-stone-700 shadow-sm transition"
            >
              <PlusCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Add Party</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
