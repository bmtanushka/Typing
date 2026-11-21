/**
 * Friendly page-level error when a page's data cannot load (offline, server hiccup).
 */
export function showPageError(message = 'Sorry – this page couldn’t load. Check your connection and try again.') {
  if (document.querySelector('[data-page-error]')) return;
  const box = document.createElement('div');
  box.className = 'container page-error';
  box.dataset.pageError = '';
  box.setAttribute('role', 'alert');
  const p = document.createElement('p');
  p.textContent = message;
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'btn btn--primary btn--sm';
  btn.textContent = 'Try again';
  btn.addEventListener('click', () => location.reload());
  box.append(p, btn);
  document.querySelector('main')?.prepend(box);
}

/** fetch() JSON or throw – used by pages that cannot work without their data. */
export async function fetchJsonOrThrow(url) {
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error(`${url} → ${res.status}`);
  return res.json();
}
