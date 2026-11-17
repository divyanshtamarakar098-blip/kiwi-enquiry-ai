/**
 * API client to interact with FastAPI backend.
 * Uses relative URL /api which Vite proxies to http://127.0.0.1:8000
 */
const BASE_URL = '/api';

const TOKEN_KEY = 'kiwi_admin_token';

export function getToken() {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(TOKEN_KEY);
}

export function isAuthenticated() {
  return !!getToken();
}

/**
 * Protected API request helper: adds Authorization header on every admin request.
 * On 401 response, clears the token and signals the caller to show login screen.
 */
export async function apiRequest(path, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event('auth:unauthorized'));
    throw new Error('UNAUTHORIZED');
  }

  return res;
}

export async function submitEnquiry(payload) {
  const res = await fetch(`${BASE_URL}/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Failed to submit enquiry');
  }
  return res.json();
}

export async function fetchEnquiries(filters = {}) {
  const query = new URLSearchParams();
  if (filters.q) query.append('q', filters.q);
  if (filters.status) query.append('status', filters.status);
  if (filters.category) query.append('category', filters.category);
  if (filters.priority) query.append('priority', filters.priority);

  const res = await apiRequest(`/enquiries?${query.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch enquiries');
  return res.json();
}

export async function fetchStats() {
  const res = await apiRequest('/stats');
  if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
  return res.json();
}

export async function updateEnquiryStatus(id, newStatus) {
  const res = await apiRequest(`/enquiries/${id}/status`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: newStatus }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to update status');
  }
  return res.json();
}

export async function updateEnquiryResponse(id, editedResponse) {
  const res = await apiRequest(`/enquiries/${id}/response`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ edited_response: editedResponse }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save customized response');
  }
  return res.json();
}

export async function reanalyzeEnquiryWithAI(id) {
  const res = await apiRequest(`/enquiries/${id}/reanalyze`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Failed to trigger AI re-analysis');
  return res.json();
}

export async function deleteEnquiry(id) {
  const res = await apiRequest(`/enquiries/${id}`, {
    method: 'DELETE',
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to delete enquiry');
  }
  return res.json();
}

export function getCsvExportUrl(filters = {}) {
  const query = new URLSearchParams();
  if (filters.status) query.append('status', filters.status);
  if (filters.category) query.append('category', filters.category);
  if (filters.priority) query.append('priority', filters.priority);
  const token = getToken();
  const url = `${BASE_URL}/enquiries/export/csv?${query.toString()}`;
  // For CSV download, we need to attach the auth header via a fetch + blob approach
  return { url, token };
}

export async function fetchSettings() {
  const res = await apiRequest('/settings');
  if (!res.ok) throw new Error('Failed to fetch settings');
  return res.json();
}

export async function saveApiKey(apiKey) {
  const res = await apiRequest('/settings/api-key', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ api_key: apiKey }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || 'Failed to save API key');
  }
  return res.json();
}

export async function login(password) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  if (res.status === 429) {
    throw new Error('RATE_LIMITED');
  }
  if (!res.ok) {
    throw new Error('Invalid password');
  }
  const data = await res.json();
  setToken(data.token);
  return data;
}

export async function logout() {
  clearToken();
}
