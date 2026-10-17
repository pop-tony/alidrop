export async function api(path, options = {}) {
  const token = localStorage.getItem('meridian-token');
  const response = await fetch(path.startsWith('/api/') ? path : `/api/${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
}
