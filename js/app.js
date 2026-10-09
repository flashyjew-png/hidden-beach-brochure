// Page shell: fetch each tab's CSV, run the renderer, write the result into the DOM.
// Keep this thin — content rules belong in the renderer.

import { TABS, tabUrl } from './config.js';
import { renderFromCsv } from './renderer.js';

/**
 * Fetch every tab's CSV text. Throws if any tab fails.
 * @param {{fetch?: typeof fetch, sheetId?: string}} [deps]
 * @returns {Promise<Record<string,string>>} `{settings: csv, hours: csv, ...}`
 */
export async function loadTabs({ fetch: fetchFn = globalThis.fetch, sheetId } = {}) {
  const entries = await Promise.all(
    Object.keys(TABS).map(async (tab) => {
      const res = await fetchFn(sheetId === undefined ? tabUrl(tab) : tabUrl(tab, sheetId), { cache: 'no-store' });
      if (!res.ok) throw new Error(`${tab}: HTTP ${res.status}`);
      return [tab, await res.text()];
    }),
  );
  return Object.fromEntries(entries);
}

/** Write a rendered model into the page. */
export function paint(doc, model) {
  doc.documentElement.lang = model.lang;
  doc.title = model.title;
  doc.getElementById('app').innerHTML = model.html;
}

async function main() {
  const lang = 'en';
  try {
    const csv = await loadTabs();
    // `today` is the current instant; the renderer reads its weekday in Asia/Bangkok.
    paint(document, renderFromCsv(csv, { lang, today: new Date() }));
  } catch (err) {
    console.error('Brochure content failed to load', err);
    // Offline cache / built-in fallback: added by a later ticket. Static fallback in index.html stays.
  }
}

if (typeof document !== 'undefined') main();
