const API_BASE = '/api';

export async function request(endpoint, options = {}) {
  const token = localStorage.getItem('qr_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || data.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = data;
    throw err;
  }

  return data;
}

export const api = {
  // Auth
  login: (email, password) => request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  }),
  register: (name, email, password) => request('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ name, email, password })
  }),
  getMe: () => request('/auth/me'),

  // QR Codes
  getQRCodes: (params = {}) => {
    const query = new URLSearchParams();
    if (params.search) query.append('search', params.search);
    if (params.category && params.category !== 'All') query.append('category', params.category);
    if (params.sortBy) query.append('sortBy', params.sortBy);
    if (params.sortOrder) query.append('sortOrder', params.sortOrder);
    const qs = query.toString();
    return request(`/qrcodes${qs ? `?${qs}` : ''}`);
  },
  getQRCode: (id) => request(`/qrcodes/${id}`),
  createQRCode: (data) => request('/qrcodes', {
    method: 'POST',
    body: JSON.stringify(data)
  }),
  updateQRCode: (id, data) => request(`/qrcodes/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data)
  }),
  deleteQRCode: (id) => request(`/qrcodes/${id}`, {
    method: 'DELETE'
  }),
  duplicateQRCode: (id) => request(`/qrcodes/${id}/duplicate`, {
    method: 'POST'
  }),
  getStats: () => request('/qrcodes/stats'),
  getPublicQR: (id) => request(`/qrcodes/public/${id}`)
};
