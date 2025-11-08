const API_BASE = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '') || 'http://localhost:5001';

const buildHeaders = (headers = {}) => ({
  'Content-Type': 'application/json',
  ...headers,
});

const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
};

const fetchOptions = (method = 'GET', body = null, headers = {}) => ({
  method,
  headers: buildHeaders(headers),
  credentials: 'include', // Include cookies in requests
  ...(body && { body: JSON.stringify(body) }),
});

export const apiGet = (path, headers) => 
  fetch(`${API_BASE}${path}`, fetchOptions('GET', null, headers)).then(handleResponse);

export const apiPost = (path, body, headers) =>
  fetch(`${API_BASE}${path}`, fetchOptions('POST', body, headers)).then(handleResponse);

export const apiPatch = (path, body, headers) =>
  fetch(`${API_BASE}${path}`, fetchOptions('PATCH', body, headers)).then(handleResponse);

export const apiDelete = (path, headers) =>
  fetch(`${API_BASE}${path}`, fetchOptions('DELETE', null, headers)).then(handleResponse);
