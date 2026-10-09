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

export const LANG_KEY = 'hiddenbeach:lang';

/** The visitor's remembered language, default 'en'. Never throws. */
function readLang(storage) {
  try {
    return storage?.getItem(LANG_KEY) || 'en';
  } catch {
    return 'en';
  }
}

/** Best-effort: remember the visitor's language choice. */
function saveLang(storage, lang) {
  try {
    storage?.setItem(LANG_KEY, lang);
  } catch {
    /* storage unavailable: the choice lasts for this page view only */
  }
}

async function main() {
  const storage = browserStorage();
  let lang = readLang(storage);
  let lastCsv = null;
  // The renderer falls back to 'en' when the chosen language has no content (yet); paint() then
  // sets <html lang> to what was actually rendered.
  const repaint = () => paint(document, renderFromCsv(lastCsv, { lang, today: new Date() }));

  // The switcher is rendered by the renderer; a click re-renders the current content in that language.
  document.getElementById('app').addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-lang]');
    if (!button || !lastCsv) return;
    lang = button.dataset.lang;
    saveLang(storage, lang);
    repaint();
  });

  // Cached content paints instantly, fresh Sheet data repaints when it arrives; with neither,
  // the built-in fallback (name, Maps, WhatsApp) paints instead of a blank page.
  const result = await loadContent({
    storage,
    // `today` is the current instant; the renderer reads its weekday in Asia/Bangkok.
    onContent: (csv) => {
      lastCsv = csv;
      repaint();
    },
  });
  if (result.error) console.error(`Brochure content failed to load; showing ${result.source}`, result.error);
}

if (typeof document !== 'undefined') main();
