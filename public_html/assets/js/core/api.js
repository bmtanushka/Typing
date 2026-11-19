/**
 * JSON API client: same-origin cookies, CSRF header on POST, friendly errors.
 */
const base = () => document.documentElement.dataset.base || '';
let csrf = document.querySelector('meta[name="csrf-token"]')?.content || null;

const OFFLINE = { ok: false, error: 'network', message: 'We couldn’t reach the server. Check your connection and try again.' };

async function parse(res) {
  try {
    const data = await res.json();
    if (data && typeof data.csrf === 'string') csrf = data.csrf;
    return { status: res.status, ...data };
  } catch {
    return { status: res.status, ok: false, error: 'server', message: 'Something went wrong on our side. Please try again in a moment.' };
  }
}

export async function get(path) {
  try {
    const res = await fetch(base() + path, { headers: { Accept: 'application/json' }, credentials: 'same-origin' });
    return parse(res);
  } catch {
    return { ...OFFLINE };
  }
}

export async function csrfToken(force = false) {
  if (!csrf || force) {
    const r = await get('/api/session');
    csrf = r.csrf || null;
  }
  return csrf;
}

export async function post(path, body = {}, retried = false) {
  try {
    const token = await csrfToken();
    const res = await fetch(base() + path, {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json', 'X-CSRF-Token': token || '' },
      body: JSON.stringify(body),
    });
    const data = await parse(res);
    if (res.status === 403 && res.error === 'csrf' && !retried) {
      await csrfToken(true);
      return post(path, body, true);
    }
    return data;
  } catch {
    return { ...OFFLINE };
  }
}
