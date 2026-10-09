// Fetch the Sheet tabs, cache the last good copy, fall back when offline.
// fetch, storage and timers are injected so this runs in Node.

import { TABS, tabUrl } from './config.js';

export const CACHE_KEY = 'hiddenbeach:tabs:v1';

/** Used when the Sheet is unreachable and nothing is cached. */
const FALLBACK_TABS = {
  settings: `key,en
business_name,Hidden Beach
status_banner,"Beach bar & restaurant at Hidden Beach Resort, Koh Mak"
maps_url,https://www.google.com/maps/search/?api=1&query=Hidden+Beach+Resort+Koh+Mak
whatsapp_number,+1 907 215 8419
whatsapp_greeting,Hi! I found you via your brochure
`,
};

async function loadTabs(fetchFn, sheetId, signal) {
  const entries = await Promise.all(
    Object.keys(TABS).map(async (tab) => {
      const res = await fetchFn(tabUrl(tab, sheetId), { cache: 'no-store', signal });
      if (!res.ok) throw new Error(`${tab}: HTTP ${res.status}`);
      return [tab, await res.text()];
    }),
  );
  return Object.fromEntries(entries);
}

function readCache(storage) {
  try {
    const tabs = JSON.parse(storage?.getItem(CACHE_KEY) ?? 'null')?.tabs;
    const ok = tabs && typeof tabs.settings === 'string' && Object.values(tabs).every((v) => typeof v === 'string');
    return ok ? tabs : null;
  } catch {
    return null;
  }
}

function writeCache(storage, tabs) {
  try { storage?.setItem(CACHE_KEY, JSON.stringify({ tabs })); } catch { /* no storage: no cache */ }
}

/** A throwing render callback must not stop the fallback chain. */
function safely(fn) {
  try { fn(); } catch (err) { console.error('Brochure render failed', err); }
}

/**
 * onContent(csvByTab, {source}) gets the cache (if any), then fresh network data,
 * or the fallback if the network fails and nothing was shown. Never rejects.
 */
export async function loadContent({
  onContent = () => {},
  fetch: fetchFn = globalThis.fetch,
  storage = null,
  timeoutMs = 8000,
  sheetId,
  setTimeout: setTimer = globalThis.setTimeout,
  clearTimeout: clearTimer = globalThis.clearTimeout,
} = {}) {
  const cached = readCache(storage);
  if (cached) safely(() => onContent(cached, { source: 'cache' }));

  const controller = new AbortController();
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimer(() => {
      controller.abort();
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const tabs = await Promise.race([loadTabs(fetchFn, sheetId, controller.signal), timeout]);
    writeCache(storage, tabs);
    safely(() => onContent(tabs, { source: 'network' }));
    return { source: 'network', tabs };
  } catch (error) {
    if (cached) return { source: 'cache', tabs: cached, error };
    safely(() => onContent(FALLBACK_TABS, { source: 'fallback' }));
    return { source: 'fallback', tabs: FALLBACK_TABS, error };
  } finally {
    clearTimer(timer);
  }
}
