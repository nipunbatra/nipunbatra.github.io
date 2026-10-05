/* Mockup appearance: a palette (review only) and a light/dark switch that defaults to the system setting. */
(function () {
  var root = document.documentElement, KEY_T = 'mock-theme', KEY_P = 'mock-palette';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  var mq = window.matchMedia ? matchMedia('(prefers-color-scheme: dark)') : { matches: false, addEventListener: function () {} };
  function applyTheme() {
    var t = get(KEY_T);
    if (t === 'light' || t === 'dark') root.setAttribute('data-theme', t); else root.removeAttribute('data-theme');
    var dark = t ? t === 'dark' : mq.matches;
    document.querySelectorAll('.mode').forEach(function (b) { b.setAttribute('aria-checked', String(dark)); });
    document.querySelectorAll('.appearance .cap').forEach(function (c) { c.textContent = t ? (dark ? 'Dark' : 'Light') : 'Following system'; });
    document.querySelectorAll('.appearance .reset').forEach(function (r) { r.hidden = !t; });
  }
  function applyPalette() {
    var p = 'red';
    root.setAttribute('data-palette', p);
    document.querySelectorAll('.swatch').forEach(function (s) { s.setAttribute('aria-pressed', String(s.dataset.p === p)); });
  }
  applyPalette(); applyTheme();
  document.addEventListener('DOMContentLoaded', function () {
    applyPalette(); applyTheme();
    document.querySelectorAll('.mode').forEach(function (b) {
      b.addEventListener('click', function () { set(KEY_T, b.getAttribute('aria-checked') === 'true' ? 'light' : 'dark'); applyTheme(); });
    });
    document.querySelectorAll('.appearance .reset').forEach(function (r) { r.addEventListener('click', function () { set(KEY_T, null); applyTheme(); }); });
    document.querySelectorAll('.swatch').forEach(function (s) { s.addEventListener('click', function () { set(KEY_P, s.dataset.p); applyPalette(); }); });
  });
  if (mq.addEventListener) mq.addEventListener('change', applyTheme);
})();
