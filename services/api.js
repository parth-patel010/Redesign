const BASE = 'https://evegah.cloud/api';

export function last10(phone) {
  return String(phone || '').replace(/\D/g, '').slice(-10);
}

export async function apiGet(path) {
  const response = await fetch(`${BASE}${path}`);
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export async function apiPost(path, body) {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error(`Request failed (${response.status})`);
  return response.json();
}

export function shortDate(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value || '');
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function rupee(amount, credit) {
  const value = Math.abs(Number(amount) || 0).toFixed(2);
  if (credit == null) return `₹${value}`;
  return `${credit ? '+' : '−'}₹${value}`;
}
