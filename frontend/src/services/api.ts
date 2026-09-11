import axios from 'axios';
import { ScheduleEmailPayload } from '../types/email';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authApi = {
  getMe: () => api.get('/auth/me'),
  devLogin: (email?: string, name?: string) => api.post('/auth/dev-login', { email, name }),
  logout: () => api.post('/auth/logout'),
};

export const senderApi = {
  getSenders: () => api.get('/senders'),
  createSender: (name: string, email: string) => api.post('/senders', { name, email }),
};

export const emailApi = {
  scheduleEmails: (payload: ScheduleEmailPayload) => api.post('/emails/schedule', payload),
  getEmails: (status?: string, page = 1, limit = 10) =>
    api.get('/emails', { params: { status, page, limit } }),
  searchEmails: (queryText: string, page = 1, limit = 20) =>
    api.get('/emails/search', { params: { q: queryText, page, limit } }),
};

export const slackApi = {
  disconnect: () => api.post('/slack/disconnect'),
};
