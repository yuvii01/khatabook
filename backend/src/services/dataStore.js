import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import Party from '../models/Party.js';
import Transaction from '../models/Transaction.js';
import PaymentSplit from '../models/PaymentSplit.js';
import Settings from '../models/Settings.js';
import { getDbStatus } from '../config/db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.resolve(__dirname, '../../data');
const DB_FILE = path.resolve(DATA_DIR, 'db.json');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const getInitialData = () => ({
  parties: [
    {
      _id: 'p_1',
      name: 'Ram Sharma',
      companyName: 'Ram Marble Traders',
      type: 'customer',
      phone: '9876543210',
      email: 'ram@example.com',
      address: 'Plot 42, Stone Market, Kishangarh',
      gstin: '08AAAAA0000A1Z5',
      openingBalance: 15000,
      currentBalance: 15000,
      notes: 'Regular buyer of Makrana White slabs',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'p_2',
      name: 'Ambaji Stone Suppliers',
      companyName: 'Ambaji Mining Corp',
      type: 'supplier',
      phone: '9822334455',
      email: 'ambaji@example.com',
      address: 'Industrial Area, Abu Road',
      gstin: '08BBBBB1111B1Z2',
      openingBalance: -25000,
      currentBalance: -25000,
      notes: 'Provides premium white raw marble blocks',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'p_3',
      name: 'Makrana Granite Works',
      companyName: 'Makrana Granite Ltd',
      type: 'supplier',
      phone: '9811223344',
      email: 'makrana@example.com',
      address: 'Bypass Road, Makrana',
      gstin: '08CCCCC2222C1Z9',
      openingBalance: -10000,
      currentBalance: -10000,
      notes: 'Black Galaxy & Tiger Skin granite supplier',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  transactions: [],
  splits: [],
  settings: {
    businessName: 'KM Stonex',
    tagline: 'Premium Marble, Granite & Natural Stones',
    ownerName: 'KM Stonex Management',
    phone: '9876500000',
    ownerWhatsApp: '9876500000',
    email: 'info@kmstonex.com',
    address: 'Marble City, Kishangarh, Rajasthan - 305801',
    gstin: '08AABCK1234F1Z8',
    currencySymbol: '₹',
  },
});

const readLocalData = () => {
  if (!fs.existsSync(DB_FILE)) {
    const init = getInitialData();
    fs.writeFileSync(DB_FILE, JSON.stringify(init, null, 2), 'utf-8');
    return init;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading local db.json:', err);
    return getInitialData();
  }
};

const writeLocalData = (data) => {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing local db.json:', err);
  }
};

export const calculatePartyBalance = async (partyId) => {
  const status = getDbStatus();
  if (status.connected) {
    if (!mongoose.Types.ObjectId.isValid(partyId)) return 0;
    const party = await Party.findById(partyId);
    if (!party) return 0;

    const txns = await Transaction.find({ party: partyId });
    let balance = Number(party.openingBalance || 0);

    for (const t of txns) {
      if (t.type === 'SALE_BILL') {
        balance += Number(t.amount);
      } else if (t.type === 'YOU_GOT') {
        balance -= Number(t.amount);
      } else if (t.type === 'PURCHASE_BILL') {
        balance -= Number(t.amount);
      } else if (t.type === 'YOU_GAVE') {
        balance += Number(t.amount);
      }
    }

    party.currentBalance = balance;
    await party.save();
    return balance;
  } else {
    const data = readLocalData();
    const party = data.parties.find((p) => String(p._id) === String(partyId));
    if (!party) return 0;

    const txns = data.transactions.filter((t) => String(t.party) === String(partyId));
    let balance = Number(party.openingBalance || 0);

    for (const t of txns) {
      if (t.type === 'SALE_BILL') {
        balance += Number(t.amount);
      } else if (t.type === 'YOU_GOT') {
        balance -= Number(t.amount);
      } else if (t.type === 'PURCHASE_BILL') {
        balance -= Number(t.amount);
      } else if (t.type === 'YOU_GAVE') {
        balance += Number(t.amount);
      }
    }

    party.currentBalance = balance;
    party.updatedAt = new Date().toISOString();
    writeLocalData(data);
    return balance;
  }
};

export const seedMongoIfEmpty = async () => {
  const count = await Party.countDocuments();
  if (count === 0) {
    console.log('Seeding MongoDB with initial KM Stonex data...');
    const local = readLocalData();
    for (const p of local.parties) {
      const clean = { ...p };
      delete clean._id;
      await Party.create(clean);
    }
    const settingsCount = await Settings.countDocuments();
    if (settingsCount === 0) {
      await Settings.create(local.settings);
    }
  }
};

export const getParties = async (typeFilter) => {
  const status = getDbStatus();
  if (status.connected) {
    const query = { status: 'active' };
    if (typeFilter && typeFilter !== 'all') {
      query.type = { $in: [typeFilter, 'both'] };
    }
    return await Party.find(query).sort({ updatedAt: -1 });
  } else {
    const data = readLocalData();
    let parties = data.parties.filter((p) => p.status !== 'inactive');
    if (typeFilter && typeFilter !== 'all') {
      parties = parties.filter((p) => p.type === typeFilter || p.type === 'both');
    }
    return parties;
  }
};

export const getPartyById = async (id) => {
  const status = getDbStatus();
  if (status.connected) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    return await Party.findById(id);
  } else {
    const data = readLocalData();
    return data.parties.find((p) => String(p._id) === String(id)) || null;
  }
};

export const createParty = async (partyData) => {
  const status = getDbStatus();
  const opening = Number(partyData.openingBalance || 0);

  if (status.connected) {
    const party = await Party.create({
      ...partyData,
      openingBalance: opening,
      currentBalance: opening,
    });
    return party;
  } else {
    const data = readLocalData();
    const newParty = {
      _id: 'p_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      name: partyData.name,
      companyName: partyData.companyName || '',
      type: partyData.type || 'party',
      phone: partyData.phone || '',
      email: partyData.email || '',
      address: partyData.address || '',
      gstin: partyData.gstin || '',
      openingBalance: opening,
      currentBalance: opening,
      notes: partyData.notes || '',
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.parties.unshift(newParty);
    writeLocalData(data);
    return newParty;
  }
};

export const updateParty = async (id, partyData) => {
  const status = getDbStatus();
  if (status.connected) {
    if (!mongoose.Types.ObjectId.isValid(id)) return null;
    const updated = await Party.findByIdAndUpdate(id, partyData, { new: true });
    await calculatePartyBalance(id);
    return updated;
  } else {
    const data = readLocalData();
    const index = data.parties.findIndex((p) => String(p._id) === String(id));
    if (index === -1) return null;
    data.parties[index] = {
      ...data.parties[index],
      ...partyData,
      updatedAt: new Date().toISOString(),
    };
    writeLocalData(data);
    await calculatePartyBalance(id);
    return data.parties[index];
  }
};

export const deleteParty = async (id) => {
  const status = getDbStatus();
  if (status.connected) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    await Party.findByIdAndDelete(id);
    await Transaction.deleteMany({ party: id });
    await PaymentSplit.deleteMany({
      $or: [{ sourceParty: id }, { 'distributions.recipientParty': id }],
    });
    return true;
  } else {
    const data = readLocalData();
    data.parties = data.parties.filter((p) => String(p._id) !== String(id));
    data.transactions = data.transactions.filter((t) => String(t.party) !== String(id));
    data.splits = data.splits.filter(
      (s) =>
        String(s.sourceParty) !== String(id) &&
        !s.distributions?.some((d) => String(d.recipientParty) === String(id))
    );
    writeLocalData(data);
    return true;
  }
};

export const getTransactions = async (filters = {}) => {
  const status = getDbStatus();
  if (status.connected) {
    const query = {};
    if (filters.partyId) {
      if (!mongoose.Types.ObjectId.isValid(filters.partyId)) return [];
      query.party = filters.partyId;
    }
    if (filters.type) query.type = filters.type;
    return await Transaction.find(query)
      .populate('party', 'name companyName type phone')
      .populate('paymentSplitRef')
      .sort({ date: -1, createdAt: -1 });
  } else {
    const data = readLocalData();
    let txns = [...data.transactions];
    if (filters.partyId) {
      txns = txns.filter((t) => String(t.party) === String(filters.partyId));
    }
    if (filters.type) {
      txns = txns.filter((t) => t.type === filters.type);
    }
    const populated = txns.map((t) => {
      const party = data.parties.find((p) => String(p._id) === String(t.party));
      const split = t.paymentSplitRef
        ? data.splits.find((s) => String(s._id) === String(t.paymentSplitRef))
        : null;
      return {
        ...t,
        party: party ? { _id: party._id, name: party.name, companyName: party.companyName, type: party.type, phone: party.phone } : null,
        paymentSplitRef: split,
      };
    });
    return populated.sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

export const createTransaction = async (txnData) => {
  const status = getDbStatus();
  let createdTxn;

  if (status.connected) {
    createdTxn = await Transaction.create(txnData);
    await calculatePartyBalance(txnData.party);
    return await Transaction.findById(createdTxn._id).populate('party', 'name companyName type phone');
  } else {
    const data = readLocalData();
    createdTxn = {
      _id: 't_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
      party: txnData.party,
      type: txnData.type,
      amount: Number(txnData.amount),
      date: txnData.date ? new Date(txnData.date).toISOString() : new Date().toISOString(),
      paymentMode: txnData.paymentMode || 'Cash',
      referenceNumber: txnData.referenceNumber || '',
      description: txnData.description || '',
      billNumber: txnData.billNumber || '',
      items: txnData.items || [],
      isRouted: Boolean(txnData.isRouted),
      paymentSplitRef: txnData.paymentSplitRef || null,
      routeRole: txnData.routeRole || 'none',
      routeNote: txnData.routeNote || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.transactions.unshift(createdTxn);
    writeLocalData(data);
    await calculatePartyBalance(txnData.party);

    const party = data.parties.find((p) => String(p._id) === String(createdTxn.party));
    return {
      ...createdTxn,
      party: party ? { _id: party._id, name: party.name, companyName: party.companyName, type: party.type, phone: party.phone } : null,
    };
  }
};

export const deleteTransaction = async (id) => {
  const status = getDbStatus();
  if (status.connected) {
    if (!mongoose.Types.ObjectId.isValid(id)) return false;
    const txn = await Transaction.findById(id);
    if (!txn) return false;
    const partyId = txn.party;
    await Transaction.findByIdAndDelete(id);
    await calculatePartyBalance(partyId);
    return true;
  } else {
    const data = readLocalData();
    const idx = data.transactions.findIndex((t) => String(t._id) === String(id));
    if (idx === -1) return false;
    const partyId = data.transactions[idx].party;
    data.transactions.splice(idx, 1);
    writeLocalData(data);
    await calculatePartyBalance(partyId);
    return true;
  }
};

export const createPaymentSplit = async ({
  sourcePartyId,
  totalAmount,
  paymentMode,
  referenceNumber,
  date,
  description,
  distributions,
}) => {
  const status = getDbStatus();
  const parsedTotal = Number(totalAmount);
  const txDate = date ? new Date(date) : new Date();

  const allocatedSum = distributions.reduce((sum, d) => sum + Number(d.amount), 0);
  const retainedAmount = Math.max(0, parsedTotal - allocatedSum);

  if (status.connected) {
    if (!mongoose.Types.ObjectId.isValid(sourcePartyId)) {
      throw new Error(`Invalid source party ID: ${sourcePartyId}`);
    }
    for (const d of distributions) {
      if (!mongoose.Types.ObjectId.isValid(d.recipientPartyId)) {
        throw new Error(`Invalid recipient party ID: ${d.recipientPartyId}`);
      }
    }

    const sourceParty = await Party.findById(sourcePartyId);
    if (!sourceParty) throw new Error('Source party not found');

    const recipientParties = await Party.find({
      _id: { $in: distributions.map((d) => d.recipientPartyId) },
    });

    const distSummaries = distributions.map((d) => {
      const p = recipientParties.find((rp) => String(rp._id) === String(d.recipientPartyId));
      return `₹${d.amount} to ${p ? p.name : 'Supplier'}`;
    }).join(', ');

    const sourceNote = `Received ₹${parsedTotal} from ${sourceParty.name}. Routed: ${distSummaries}${retainedAmount > 0 ? ` (₹${retainedAmount} kept as cash/bank)` : ''}. ${description || ''}`.trim();

    const sourceTxn = await Transaction.create({
      party: sourcePartyId,
      type: 'YOU_GOT',
      amount: parsedTotal,
      date: txDate,
      paymentMode: paymentMode || 'Cash',
      referenceNumber: referenceNumber || '',
      description: sourceNote,
      isRouted: true,
      routeRole: 'source_received',
      routeNote: `Routed to: ${distSummaries}`,
    });

    const createdDists = [];
    for (const dist of distributions) {
      const targetNote = `Paid ₹${dist.amount} via incoming payment from ${sourceParty.name}. ${dist.note || ''}`.trim();

      const outTxn = await Transaction.create({
        party: dist.recipientPartyId,
        type: 'YOU_GAVE',
        amount: Number(dist.amount),
        date: txDate,
        paymentMode: paymentMode || 'Cash',
        referenceNumber: referenceNumber || '',
        description: targetNote,
        isRouted: true,
        routeRole: 'target_distributed',
        routeNote: `Funded from: ${sourceParty.name} (Total Received: ₹${parsedTotal})`,
      });

      createdDists.push({
        recipientParty: dist.recipientPartyId,
        amount: Number(dist.amount),
        transactionRef: outTxn._id,
        note: dist.note || '',
      });

      await calculatePartyBalance(dist.recipientPartyId);
    }

    const splitDoc = await PaymentSplit.create({
      sourceParty: sourcePartyId,
      sourceTransaction: sourceTxn._id,
      totalAmountReceived: parsedTotal,
      paymentMode: paymentMode || 'Cash',
      referenceNumber: referenceNumber || '',
      date: txDate,
      description: description || '',
      distributions: createdDists,
      retainedAmount,
    });

    sourceTxn.paymentSplitRef = splitDoc._id;
    await sourceTxn.save();

    for (const d of createdDists) {
      await Transaction.findByIdAndUpdate(d.transactionRef, { paymentSplitRef: splitDoc._id });
    }

    await calculatePartyBalance(sourcePartyId);

    return await PaymentSplit.findById(splitDoc._id)
      .populate('sourceParty', 'name companyName phone')
      .populate('distributions.recipientParty', 'name companyName phone');
  } else {
    const data = readLocalData();
    const sourceParty = data.parties.find((p) => String(p._id) === String(sourcePartyId));
    if (!sourceParty) throw new Error('Source party not found');

    const splitId = 'split_' + Date.now();
    const sourceTxnId = 't_' + Date.now() + '_src';

    const distSummaries = distributions.map((d) => {
      const p = data.parties.find((rp) => String(rp._id) === String(d.recipientPartyId));
      return `₹${d.amount} to ${p ? p.name : 'Supplier'}`;
    }).join(', ');

    const sourceNote = `Received ₹${parsedTotal} from ${sourceParty.name}. Routed: ${distSummaries}${retainedAmount > 0 ? ` (₹${retainedAmount} kept as cash/bank)` : ''}. ${description || ''}`.trim();

    const sourceTxn = {
      _id: sourceTxnId,
      party: sourcePartyId,
      type: 'YOU_GOT',
      amount: parsedTotal,
      date: txDate.toISOString(),
      paymentMode: paymentMode || 'Cash',
      referenceNumber: referenceNumber || '',
      description: sourceNote,
      isRouted: true,
      paymentSplitRef: splitId,
      routeRole: 'source_received',
      routeNote: `Routed to: ${distSummaries}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.transactions.unshift(sourceTxn);

    const createdDists = [];
    let counter = 1;
    for (const dist of distributions) {
      const targetTxnId = 't_' + Date.now() + '_dist_' + counter++;
      const targetNote = `Paid ₹${dist.amount} via incoming payment from ${sourceParty.name}. ${dist.note || ''}`.trim();

      const outTxn = {
        _id: targetTxnId,
        party: dist.recipientPartyId,
        type: 'YOU_GAVE',
        amount: Number(dist.amount),
        date: txDate.toISOString(),
        paymentMode: paymentMode || 'Cash',
        referenceNumber: referenceNumber || '',
        description: targetNote,
        isRouted: true,
        paymentSplitRef: splitId,
        routeRole: 'target_distributed',
        routeNote: `Funded from: ${sourceParty.name} (Total Received: ₹${parsedTotal})`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      data.transactions.unshift(outTxn);

      createdDists.push({
        recipientParty: dist.recipientPartyId,
        amount: Number(dist.amount),
        transactionRef: targetTxnId,
        note: dist.note || '',
      });
    }

    const splitRecord = {
      _id: splitId,
      sourceParty: sourcePartyId,
      sourceTransaction: sourceTxnId,
      totalAmountReceived: parsedTotal,
      paymentMode: paymentMode || 'Cash',
      referenceNumber: referenceNumber || '',
      date: txDate.toISOString(),
      description: description || '',
      distributions: createdDists,
      retainedAmount,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    data.splits.unshift(splitRecord);

    writeLocalData(data);

    await calculatePartyBalance(sourcePartyId);
    for (const d of distributions) {
      await calculatePartyBalance(d.recipientPartyId);
    }

    return {
      ...splitRecord,
      sourceParty: { _id: sourceParty._id, name: sourceParty.name, companyName: sourceParty.companyName },
      distributions: createdDists.map((d) => {
        const rp = data.parties.find(
          (p) => String(p._id) === String(d.recipientParty || d.recipientPartyId)
        );
        return {
          ...d,
          recipientParty: rp ? { _id: rp._id, name: rp.name, companyName: rp.companyName } : null,
        };
      }),
    };
  }
};

export const getPaymentSplits = async () => {
  const status = getDbStatus();
  if (status.connected) {
    return await PaymentSplit.find()
      .populate('sourceParty', 'name companyName phone')
      .populate('distributions.recipientParty', 'name companyName phone')
      .sort({ date: -1, createdAt: -1 });
  } else {
    const data = readLocalData();
    return data.splits.map((s) => {
      const sp = data.parties.find((p) => String(p._id) === String(s.sourceParty));
      return {
        ...s,
        sourceParty: sp ? { _id: sp._id, name: sp.name, companyName: sp.companyName, phone: sp.phone } : null,
        distributions: s.distributions.map((d) => {
          const rp = data.parties.find((p) => String(p._id) === String(d.recipientParty));
          return {
            ...d,
            recipientParty: rp ? { _id: rp._id, name: rp.name, companyName: rp.companyName, phone: rp.phone } : null,
          };
        }),
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date));
  }
};

export const getDashboardSummary = async () => {
  const parties = await getParties('all');
  const transactions = await getTransactions({});
  const splits = await getPaymentSplits();

  let totalReceivable = 0;
  let totalPayable = 0;
  let customersCount = 0;
  let suppliersCount = 0;

  for (const p of parties) {
    const bal = Number(p.currentBalance || 0);
    if (bal > 0) {
      totalReceivable += bal;
    } else if (bal < 0) {
      totalPayable += Math.abs(bal);
    }
    if (p.type === 'customer' || p.type === 'both') customersCount++;
    if (p.type === 'supplier' || p.type === 'both') suppliersCount++;
  }

  const today = new Date().toISOString().slice(0, 10);
  let todayReceived = 0;
  let todayPaid = 0;

  for (const t of transactions) {
    const tDate = new Date(t.date).toISOString().slice(0, 10);
    if (tDate === today) {
      if (t.type === 'YOU_GOT') todayReceived += Number(t.amount);
      if (t.type === 'YOU_GAVE') todayPaid += Number(t.amount);
    }
  }

  return {
    totalReceivable,
    totalPayable,
    netBalance: totalReceivable - totalPayable,
    partiesCount: parties.length,
    customersCount,
    suppliersCount,
    todayReceived,
    todayPaid,
    totalTransactionsCount: transactions.length,
    totalRoutedSplitsCount: splits.length,
    recentTransactions: transactions.slice(0, 10),
  };
};

export const getSettings = async () => {
  const status = getDbStatus();
  if (status.connected) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(getInitialData().settings);
    }
    return settings;
  } else {
    const data = readLocalData();
    return data.settings;
  }
};

export const updateSettings = async (newSettings) => {
  const status = getDbStatus();
  if (status.connected) {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create(newSettings);
    } else {
      Object.assign(settings, newSettings);
      await settings.save();
    }
    return settings;
  } else {
    const data = readLocalData();
    data.settings = { ...data.settings, ...newSettings };
    writeLocalData(data);
    return data.settings;
  }
};

export const exportFullBackup = async () => {
  const parties = await getParties('all');
  const transactions = await getTransactions({});
  const splits = await getPaymentSplits();
  const settings = await getSettings();

  return {
    version: '1.0',
    exportDate: new Date().toISOString(),
    appName: 'KM Stonex Khata',
    data: {
      parties,
      transactions,
      splits,
      settings,
    },
  };
};

export const restoreFullBackup = async (backupPayload) => {
  if (!backupPayload || !backupPayload.data) {
    throw new Error('Invalid backup file structure');
  }

  const { parties = [], transactions = [], splits = [], settings = {} } = backupPayload.data;
  const status = getDbStatus();

  if (status.connected) {
    await Party.deleteMany({});
    await Transaction.deleteMany({});
    await PaymentSplit.deleteMany({});
    if (parties.length > 0) await Party.insertMany(parties);
    if (transactions.length > 0) await Transaction.insertMany(transactions);
    if (splits.length > 0) await PaymentSplit.insertMany(splits);
    if (settings && Object.keys(settings).length > 0) {
      await Settings.deleteMany({});
      await Settings.create(settings);
    }
  } else {
    const fresh = {
      parties,
      transactions,
      splits,
      settings: settings || getInitialData().settings,
    };
    writeLocalData(fresh);
  }

  return { success: true, partiesCount: parties.length, transactionsCount: transactions.length };
};
