import axios from 'axios';

const rawBaseUrl = import.meta.env.VITE_API_URL || '';
const cleanBaseUrl = rawBaseUrl.endsWith('/') ? rawBaseUrl.slice(0, -1) : rawBaseUrl;

const api = axios.create({
  baseURL: cleanBaseUrl ? `${cleanBaseUrl}/api` : '/api',
});

export const getDashboardData = () => api.get('/dashboard');

export const getParties = (type = 'all') => api.get(`/parties?type=${type}`);
export const getParty = (id) => api.get(`/parties/${id}`);
export const createParty = (data) => api.post('/parties', data);
export const updateParty = (id, data) => api.put(`/parties/${id}`, data);
export const deleteParty = (id) => api.delete(`/parties/${id}`);
export const recalculatePartyBalance = (id) => api.post(`/parties/${id}/recalculate`);

export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

export const getRoutedPayments = () => api.get('/routed-payments');
export const executeRoutePayment = (data) => api.post('/routed-payments', data);

export const exportBackup = () => api.get('/backup/export', { responseType: 'blob' });
export const restoreBackup = (data) => api.post('/backup/restore', data);

export const getSettings = () => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

export const getPendingDuesData = () => api.get('/reports/pending-dues');
export const getPendingDuesPdfUrl = () =>
  cleanBaseUrl ? `${cleanBaseUrl}/api/reports/pending-dues-pdf` : '/api/reports/pending-dues-pdf';
export const sendOwnerWhatsApp = () => api.post('/reports/send-owner-whatsapp');
export const triggerMonthlyWhatsApp = () => api.post('/reports/trigger-whatsapp');
export const sendSingleWhatsApp = (partyId, customMessage) =>
  api.post('/reports/send-single-whatsapp', { partyId, customMessage });
export const getReportStatus = () => api.get('/reports/status');

export default api;
