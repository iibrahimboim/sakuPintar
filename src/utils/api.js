// VITE_API_BASE_URL (e.g. https://xxx.up.railway.app/api) — wajib di Vercel kalau tidak pakai fallback di bawah.
const DEFAULT_VERCEL_API = 'https://sakupintar-production.up.railway.app/api';

function getBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_BASE_URL;
  if (fromEnv) return String(fromEnv).replace(/\/$/, '');
  if (import.meta.env.PROD && typeof window !== 'undefined') {
    const h = window.location.hostname;
    if (h === 'vercel.app' || h.endsWith('.vercel.app')) return DEFAULT_VERCEL_API;
  }
  return '/api';
}

const BASE_URL = getBaseUrl();

function getToken() {
  return localStorage.getItem('token');
}

async function request(path, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const url = `${BASE_URL}${path}`;
  let res;
  try {
    res = await fetch(url, { ...options, headers });
  } catch (e) {
    const hint =
      typeof window !== 'undefined' && window.location?.origin
        ? ` Pastikan backend Railway jalan + CORS (set CORS_ALLOW_VERCEL=1 di Railway). URL API: ${url}`
        : '';
    throw new Error(`Gagal konek ke API (${url}).${hint}`);
  }
  let data = null;
  try {
    data = await res.json();
  } catch {
    // Non-JSON response (or empty body)
  }
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data;
}

export const api = {
  // Auth
  register: (body) => request('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),

  // User
  updateProfile: (body) => request('/users/profile', { method: 'PUT', body: JSON.stringify(body) }),

  // Categories
  getCategories: () => request('/categories'),
  createCategory: (body) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  // Transactions
  getTransactions: () => request('/transactions'),
  createTransaction: (body) => request('/transactions', { method: 'POST', body: JSON.stringify(body) }),
  updateTransaction: (id, body) => request(`/transactions/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteTransaction: (id) => request(`/transactions/${id}`, { method: 'DELETE' }),

  // Saving Goals
  getSavingGoals: () => request('/saving-goals'),
  createSavingGoal: (body) => request('/saving-goals', { method: 'POST', body: JSON.stringify(body) }),
  updateSavingGoal: (id, body) => request(`/saving-goals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteSavingGoal: (id) => request(`/saving-goals/${id}`, { method: 'DELETE' }),
  addFundsToGoal: (id, body) => request(`/saving-goals/${id}/add-funds`, { method: 'POST', body: JSON.stringify(body) }),

  // Budgets
  getBudgets: () => request('/budgets'),
  getBudgetStatus: () => request('/budgets/status'),
  createBudget: (body) => request('/budgets', { method: 'POST', body: JSON.stringify(body) }),
  updateBudget: (id, body) => request(`/budgets/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  deleteBudget: (id) => request(`/budgets/${id}`, { method: 'DELETE' }),
};
