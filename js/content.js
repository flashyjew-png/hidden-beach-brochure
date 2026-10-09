// Shared helpers for section builders. Pure: no DOM, no fetch.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape for HTML text and attributes. Use on every Sheet value. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** http(s) URLs only; javascript:, data: etc. → ''. */
export function safeUrl(value) {
  const url = String(value ?? '').trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

/** Blank-line-separated paragraphs → <p>, other newlines → <br>. */
export function paragraphs(text) {
  return text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** <section> with an <h2> heading. */
export function section(id, heading, body, cls = id) {
  return `<section class="section ${cls}" id="${id}"><h2>${esc(heading)}</h2>${body}</section>`;
}

/** A row is visible only when its `show` cell is "yes". */
export function isShown(row) {
  return String(row?.show ?? '').trim().toLowerCase() === 'yes';
}

/** `${base}_${lang}` cell, falling back to `${base}_en`. */
export function pick(row, base, lang) {
  return (row?.[`${base}_${lang}`] || row?.[`${base}_en`] || '').trim();
}

/** The context every section builder receives. */
export function makeContext(tabs = {}, opts = {}) {
  const lang = opts.lang || 'en';
  const today = opts.today instanceof Date ? opts.today : new Date();
  const settingsByKey = new Map();
  for (const row of tabs.settings ?? []) {
    const key = (row.key ?? '').trim().toLowerCase();
    if (key && !settingsByKey.has(key)) settingsByKey.set(key, row);
  }

  /** Unescaped Settings text: current language, else en, else `fallback`. */
  function setting(key, fallback = '') {
    const row = settingsByKey.get(key.toLowerCase());
    return (row?.[lang] || row?.en || '').trim() || fallback;
  }

  const { settings = [], hours = [], menu = [], specials = [] } = tabs;
  return { lang, today, setting, settingsRows: settings, hours, menu, specials };
}
