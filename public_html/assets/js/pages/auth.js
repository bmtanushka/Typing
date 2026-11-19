/**
 * Login, register, forgotten/reset password and account settings forms.
 */
import { post } from '../core/api.js';
import { completeSignIn, clearLocalAccount } from '../core/sync.js';

const base = document.documentElement.dataset.base || '';
const ENDPOINTS = {
  login: '/api/auth/login', register: '/api/auth/register', forgot: '/api/auth/forgot', reset: '/api/auth/reset',
  profile: '/api/account/profile', password: '/api/account/password', delete: '/api/account/delete',
};

function setErrors(form, res) {
  const box = form.querySelector('[data-form-error]');
  form.querySelectorAll('[data-field]').forEach((f) => {
    const msg = res?.fields?.[f.dataset.field];
    const err = f.querySelector('[data-error]');
    const input = f.querySelector('input');
    f.classList.toggle('field--error', !!msg);
    err.hidden = !msg;
    err.textContent = msg || '';
    if (msg) input.setAttribute('aria-invalid', 'true');
    else input.removeAttribute('aria-invalid');
  });
  if (box) {
    box.hidden = !res?.message;
    box.textContent = res?.message || '';
  }
  const first = form.querySelector('[aria-invalid="true"]') || (res?.message ? box : null);
  if (first) (first.matches('input') ? first : box).focus?.();
}

function success(form, message) {
  const ok = form.querySelector('[data-form-success]');
  if (ok) {
    ok.textContent = message;
    ok.hidden = false;
  }
}

/** Light client-side checks (the server validates everything again). */
function localCheck(kind, data) {
  const fields = {};
  if ('email' in data && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) fields.email = 'Please enter a valid email address.';
  if (kind !== 'login' && kind !== 'delete' && 'password' in data && data.password.length < 8) fields.password = 'Use at least 8 characters for your password.';
  if ((kind === 'login' || kind === 'delete') && !data.password) fields.password = 'Please enter your password.';
  if ('displayName' in data && !data.displayName.trim()) fields.displayName = 'Please enter your name.';
  return Object.keys(fields).length ? { fields, message: 'Please check the highlighted fields.' } : null;
}

for (const form of document.querySelectorAll('[data-auth-form]')) {
  const kind = form.dataset.authForm;
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (form.dataset.token) data.token = form.dataset.token;
    const problem = localCheck(kind, data);
    if (problem) return setErrors(form, problem);
    setErrors(form, null);
    const btn = form.querySelector('[type="submit"]');
    btn.disabled = true;
    const label = btn.textContent;
    btn.textContent = 'Just a moment…';
    try {
      const res = await post(ENDPOINTS[kind], data);
      if (!res.ok) return setErrors(form, res);
      if (kind === 'login' || kind === 'register' || kind === 'reset') {
        btn.textContent = kind === 'register' ? 'Setting up your account…' : 'Loading your progress…';
        try {
          await completeSignIn(res.user.id);
        } catch {
          /* progress will merge on the next page load */
        }
        location.href = base + (form.dataset.next || '/progress');
        return;
      }
      if (kind === 'forgot') {
        success(form, res.message);
        form.querySelector('input').value = '';
      }
      if (kind === 'profile') {
        success(form, 'Your details are saved.');
        document.querySelectorAll('[data-display-name], .account-chip__name').forEach((n) => (n.textContent = res.user.displayName));
      }
      if (kind === 'password') {
        success(form, 'Your password has been changed.');
        form.reset();
      }
      if (kind === 'delete') {
        clearLocalAccount();
        location.href = `${base}/?account=deleted`;
      }
    } finally {
      btn.disabled = false;
      if (btn.textContent === 'Just a moment…') btn.textContent = label;
    }
  });
}

document.querySelector('[data-logout]')?.addEventListener('click', async (e) => {
  e.currentTarget.disabled = true;
  await post('/api/auth/logout');
  clearLocalAccount();
  location.href = `${base}/`;
});

const del = document.querySelector('[data-delete-dialog]');
document.querySelector('[data-delete-open]')?.addEventListener('click', () => del.showModal());
document.querySelector('[data-delete-cancel]')?.addEventListener('click', () => del.close());
