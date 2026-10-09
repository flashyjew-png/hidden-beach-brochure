// Page shell: fetch each tab's CSV, run the renderer, write the result into the DOM.
// Keep this thin — content rules belong in the renderer.

import { renderFromCsv } from './renderer.js';
import { loadContent } from './loader.js';

// loadTabs moved to loader.js (with caching + offline fallback); re-exported for existing callers.
export { loadTabs } from './loader.js';

/** Write a rendered model into the page. */
export function paint(doc, model) {
  doc.documentElement.lang = model.lang;
  doc.title = model.title;
  doc.getElementById('app').innerHTML = model.html;
}

/** localStorage, or null where the browser blocks it (the getter itself can throw). */
function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

async function main() {
  const lang = 'en';
  // Cached content paints instantly, fresh Sheet data repaints when it arrives; with neither,
  // the built-in fallback (name, Maps, WhatsApp) paints instead of a blank page.
  const result = await loadContent({
    storage: browserStorage(),
    // `today` is the current instant; the renderer reads its weekday in Asia/Bangkok.
    onContent: (csv) => paint(document, renderFromCsv(csv, { lang, today: new Date() })),
  });
  if (result.error) console.error(`Brochure content failed to load; showing ${result.source}`, result.error);
}

if (typeof document !== 'undefined') main();
