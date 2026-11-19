/** One-time installer button. */
const btn = document.querySelector('[data-install]');
btn?.addEventListener('click', async () => {
  btn.disabled = true;
  const res = await fetch(`${document.documentElement.dataset.base || ''}/setup`, {
    method: 'POST', credentials: 'same-origin',
    headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': btn.dataset.csrf },
    body: '{}',
  }).then((r) => r.json()).catch(() => ({ ok: false, message: 'Network error – please try again.' }));
  const out = document.querySelector('[data-install-result]');
  out.className = `alert ${res.ok ? 'alert--success' : 'alert--danger'}`;
  out.textContent = res.message;
  out.hidden = false;
  btn.hidden = !!res.ok;
  btn.disabled = false;
});
