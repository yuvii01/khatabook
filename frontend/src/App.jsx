import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import PartiesList from './pages/PartiesList';
import SettingsPage from './pages/SettingsPage';
import MonthlyReportPage from './pages/MonthlyReportPage';

import RoutePaymentModal from './components/RoutePaymentModal';
import AddPartyModal from './components/AddPartyModal';
import AddTransactionModal from './components/AddTransactionModal';
import PartyStatementModal from './components/PartyStatementModal';
import BackupModal from './components/BackupModal';

import { getDashboardData, getParties } from './services/api';

export default function App() {
  const [currentView, setCurrentView] = useState('dashboard');
  const [parties, setParties] = useState([]);
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [isRoutePaymentOpen, setIsRoutePaymentOpen] = useState(false);
  const [isAddPartyOpen, setIsAddPartyOpen] = useState(false);
  const [editingParty, setEditingParty] = useState(null);
  const [isAddTxnOpen, setIsAddTxnOpen] = useState(false);
  const [defaultTxnPartyId, setDefaultTxnPartyId] = useState('');
  const [defaultTxnType, setDefaultTxnType] = useState('YOU_GOT');
  const [selectedPartyForLedger, setSelectedPartyForLedger] = useState(null);
  const [isBackupOpen, setIsBackupOpen] = useState(false);

  const loadAllData = async () => {
    try {
      const [dashRes, partiesRes] = await Promise.all([
        getDashboardData(),
        getParties('all'),
      ]);

      setDashboardData(dashRes.data?.data || null);
      setParties(partiesRes.data?.data || []);

      if (selectedPartyForLedger) {
        const updated = partiesRes.data?.data?.find(
          (p) => String(p._id) === String(selectedPartyForLedger._id)
        );
        if (updated) setSelectedPartyForLedger(updated);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleOpenAddTxn = (partyId = '', type = 'YOU_GOT') => {
    setDefaultTxnPartyId(partyId);
    setDefaultTxnType(type);
    setIsAddTxnOpen(true);
  };

  const handleOpenEditParty = (party) => {
    setEditingParty(party);
    setIsAddPartyOpen(true);
  };

  const handleClosePartyModal = () => {
    setIsAddPartyOpen(false);
    setEditingParty(null);
  };

  return (
    <div className="min-h-screen bg-[#faf8f5] flex flex-col text-stone-800">
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        onOpenRoutePayment={() => setIsRoutePaymentOpen(true)}
        onOpenAddParty={() => {
          setEditingParty(null);
          setIsAddPartyOpen(true);
        }}
        onOpenAddTxn={handleOpenAddTxn}
        onOpenBackup={() => setIsBackupOpen(true)}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {loading ? (
          <div className="py-24 text-center text-stone-400">
            <div className="w-10 h-10 border-4 border-emerald-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs font-semibold uppercase tracking-wider text-stone-500">
              Loading KM Stonex Khata Books...
            </p>
          </div>
        ) : (
          <>
            {currentView === 'dashboard' && (
              <Dashboard
                dashboardData={dashboardData}
                parties={parties}
                onOpenRoutePayment={() => setIsRoutePaymentOpen(true)}
                onOpenAddParty={() => {
                  setEditingParty(null);
                  setIsAddPartyOpen(true);
                }}
                onOpenAddTxn={handleOpenAddTxn}
                onSelectParty={(party) => setSelectedPartyForLedger(party)}
                onEditParty={handleOpenEditParty}
                onRefresh={loadAllData}
                onNavigateToParties={() => setCurrentView('parties')}
              />
            )}

            {currentView === 'parties' && (
              <PartiesList
                parties={parties}
                onOpenAddParty={() => {
                  setEditingParty(null);
                  setIsAddPartyOpen(true);
                }}
                onEditParty={handleOpenEditParty}
                onSelectParty={(party) => setSelectedPartyForLedger(party)}
                onAddTransactionForParty={handleOpenAddTxn}
                onRefresh={loadAllData}
              />
            )}

            {currentView === 'reports' && (
              <MonthlyReportPage />
            )}

            {currentView === 'settings' && (
              <SettingsPage
                onOpenBackup={() => setIsBackupOpen(true)}
              />
            )}
          </>
        )}
      </main>

      <footer className="bg-white/80 border-t border-stone-200/80 py-4 text-center text-xs text-stone-500">
        <p>
          KM STONEX • Green Marble, Granite &amp; Natural Stone Double-Entry Khata
        </p>
      </footer>

      <RoutePaymentModal
        isOpen={isRoutePaymentOpen}
        onClose={() => setIsRoutePaymentOpen(false)}
        parties={parties}
        onSuccess={loadAllData}
      />

      <AddPartyModal
        isOpen={isAddPartyOpen}
        onClose={handleClosePartyModal}
        onSuccess={loadAllData}
        initialParty={editingParty}
      />

      <AddTransactionModal
        isOpen={isAddTxnOpen}
        onClose={() => setIsAddTxnOpen(false)}
        parties={parties}
        onSuccess={loadAllData}
        defaultPartyId={defaultTxnPartyId}
        defaultType={defaultTxnType}
      />

      <PartyStatementModal
        isOpen={Boolean(selectedPartyForLedger)}
        onClose={() => setSelectedPartyForLedger(null)}
        party={selectedPartyForLedger}
        onAddTransaction={handleOpenAddTxn}
        onRefreshParties={loadAllData}
        onEditParty={(p) => {
          setSelectedPartyForLedger(null);
          handleOpenEditParty(p);
        }}
      />

      <BackupModal
        isOpen={isBackupOpen}
        onClose={() => setIsBackupOpen(false)}
        onRestoreSuccess={loadAllData}
      />
    </div>
  );
}
