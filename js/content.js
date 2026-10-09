// Shared helpers for section builders. Pure: no DOM, no fetch.

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

/** Escape Sheet text for HTML text and attribute positions. ALWAYS use on Sheet values. */
export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESCAPES[c]);
}

/** A row is visible only when its `show` cell is "yes" (case-insensitive). */
export function isShown(row) {
  return String(row?.show ?? '').trim().toLowerCase() === 'yes';
}

/**
 * Pick a row's text for the current language: `${base}_${lang}`, falling back to `${base}_en`.
 * Works for Menu (name_en, desc_th…) and Specials (title_en, detail_de…).
 */
export function pick(row, base, lang) {
  return (row?.[`${base}_${lang}`] || row?.[`${base}_en`] || '').trim();
}

/**
 * Build the context every section builder receives.
 * @param {{settings?:object[], hours?:object[], menu?:object[], specials?:object[]}} tabs parsed rows
 * @param {{lang?:string, today?:Date}} opts
 */
export function makeContext(tabs = {}, opts = {}) {
  const lang = opts.lang || 'en';
  const today = opts.today instanceof Date ? opts.today : new Date();
  const settingsByKey = new Map();
  for (const row of tabs.settings ?? []) {
    const key = (row.key ?? '').trim().toLowerCase();
    if (key && !settingsByKey.has(key)) settingsByKey.set(key, row);
  }

  /** Settings text for `key` in the current language (falls back to en, then `fallback`). Unescaped. */
  function setting(key, fallback = '') {
    const row = settingsByKey.get(key.toLowerCase());
    return (row?.[lang] || row?.en || '').trim() || fallback;
  }

  return {
    lang,
    today,
    setting,
    settingsRows: tabs.settings ?? [],
    hours: tabs.hours ?? [],
    menu: tabs.menu ?? [],
    specials: tabs.specials ?? [],
  };
}
