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
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json().catch(() => null) : null;
  if (!payload) throw new Error('The API is unavailable. Start the server and try again.');
  if (!response.ok) throw new Error(payload.error || 'The request could not be completed.');
  return payload;
}
