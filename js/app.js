// Page shell: load the tabs, render, paint. Content rules belong in the renderer.

import { renderFromCsv } from './renderer.js';
import { loadContent } from './loader.js';

const LANG_KEY = 'hiddenbeach:lang';

/** Blocked storage throws even on access. */
function attempt(fn, fallback) {
  try { return fn(); } catch { return fallback; }
}

async function main() {
  const app = document.getElementById('app');
  const storage = attempt(() => globalThis.localStorage, null);
  let lang = attempt(() => storage?.getItem(LANG_KEY), null) || 'en';
  let lastCsv = null;

  // The renderer reads today's weekday in Asia/Bangkok.
  const paint = () => {
    const model = renderFromCsv(lastCsv, { lang, today: new Date() });
    document.documentElement.lang = model.lang;
    document.title = model.title;
    app.innerHTML = model.html;
  };

  // Language switcher clicks re-render the current content.
  app.addEventListener('click', (event) => {
    const button = event.target.closest?.('[data-lang]');
    if (!button || !lastCsv) return;
    lang = button.dataset.lang;
    attempt(() => storage?.setItem(LANG_KEY, lang));
    paint();
  });

  const result = await loadContent({
    storage,
    onContent: (csv) => {
      lastCsv = csv;
      paint();
    },
  });
  if (result.error) console.error(`Brochure content failed to load; showing ${result.source}`, result.error);
}

if (typeof document !== 'undefined') {
  main().catch((err) => console.error('Brochure failed to start', err));
}
