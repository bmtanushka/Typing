/*
 * Runs synchronously in <head> (classic script) to apply the theme and
 * font size before first paint – avoids a flash of the wrong theme.
 * Must stay tiny and dependency-free. Mirrors settings in core/store.js.
 */
(function () {
  var root = document.documentElement;
  var pref = 'system';
  var size = 'normal';
  try {
    var raw = window.localStorage.getItem('keyquest.v1');
    var s = raw ? JSON.parse(raw).settings : null;
    if (s && /^(light|dark|system)$/.test(s.theme)) pref = s.theme;
    if (s && /^(small|normal|large|xlarge)$/.test(s.fontSize)) size = s.fontSize;
  } catch (e) { /* storage blocked or corrupt – use defaults */ }

  var dark = pref === 'dark' ||
    (pref === 'system' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.setAttribute('data-theme', dark ? 'dark' : 'light');
  root.setAttribute('data-theme-pref', pref);
  if (size !== 'normal') root.setAttribute('data-font-size', size);
})();
