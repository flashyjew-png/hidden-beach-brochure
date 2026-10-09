// Page-shell loading logic: fetch the Sheet tabs, cache the last good copy, fall back when offline.
// No DOM here: fetch, storage and timers are injected so this runs (and is tested) in Node.
//
// loadContent() hands raw CSV-per-tab to `onContent` up to twice:
//   1. instantly from the cache, if one exists (source 'cache');
//   2. when fresh data arrives (source 'network') — and it is then cached.
// If the network fails or times out and nothing was shown yet, it hands over the built-in
// fallback (source 'fallback') so the visitor never gets a blank page.

import { TABS, tabUrl } from './config.js';

export const CACHE_KEY = 'hiddenbeach:tabs:v1';
export const TIMEOUT_MS = 8000;

/**
 * Minimal built-in content (Settings rows only) used when the Sheet is unreachable and nothing
 * is cached. Rendered through the normal renderer, so it gets the same hero / Maps / WhatsApp markup.
 */
export const FALLBACK_TABS = {
  settings:
    'key,en,th,de\r\n' +
    'business_name,Hidden Beach,,\r\n' +
    'status_banner,"Beach bar & restaurant at Hidden Beach Resort, Koh Mak",,\r\n' +
    'maps_url,https://www.google.com/maps/search/?api=1&query=Hidden+Beach+Resort+Koh+Mak,,\r\n' +
    'whatsapp_number,+1 907 215 8419,,\r\n' +
    'whatsapp_greeting,Hi! I found you via your brochure,,\r\n',
};

/**
 * Fetch every tab's CSV text. Throws if any tab fails.
 * @param {{fetch?: typeof fetch, sheetId?: string, signal?: AbortSignal}} [deps]
 * @returns {Promise<Record<string,string>>} `{settings: csv, hours: csv, ...}`
 */
export async function loadTabs({ fetch: fetchFn = globalThis.fetch, sheetId, signal } = {}) {
  const entries = await Promise.all(
    Object.keys(TABS).map(async (tab) => {
      const url = sheetId === undefined ? tabUrl(tab) : tabUrl(tab, sheetId);
      const res = await fetchFn(url, { cache: 'no-store', signal });
      if (!res.ok) throw new Error(`${tab}: HTTP ${res.status}`);
      return [tab, await res.text()];
    }),
  );
  return Object.fromEntries(entries);
}

/** Cached tabs, or null if absent, unreadable or malformed. Never throws. */
function readCache(storage) {
  try {
    const saved = JSON.parse(storage?.getItem(CACHE_KEY) ?? 'null');
    const tabs = saved?.tabs;
    if (!tabs || typeof tabs !== 'object') return null;
    if (!Object.values(tabs).every((v) => typeof v === 'string')) return null;
    return typeof tabs.settings === 'string' ? tabs : null;
  } catch {
    return null;
  }
}

/** Best-effort cache write (quota, private mode and disabled storage are all ignored). */
function writeCache(storage, tabs, now) {
  try {
    storage?.setItem(CACHE_KEY, JSON.stringify({ savedAt: now, tabs }));
  } catch {
    /* storage unavailable: carry on without a cache */
  }
}

/**
 * Load the brochure content with cache-first display and an offline fallback.
 * @param {{
 *   onContent: (csvByTab: Record<string,string>, info: {source: 'cache'|'network'|'fallback'}) => void,
 *   fetch?: typeof fetch,
 *   storage?: {getItem(k:string):string|null, setItem(k:string,v:string):void} | null,
 *   timeoutMs?: number,
 *   sheetId?: string,
 *   setTimeout?: typeof setTimeout,
 *   clearTimeout?: typeof clearTimeout,
 *   now?: () => number,
 * }} deps
 * @returns {Promise<{source: 'cache'|'network'|'fallback', tabs: Record<string,string>, error?: Error}>}
 *   what the visitor ends up seeing. Never rejects.
 */
export async function loadContent({
  onContent = () => {},
  fetch: fetchFn = globalThis.fetch,
  storage = null,
  timeoutMs = TIMEOUT_MS,
  sheetId,
  setTimeout: setTimer = globalThis.setTimeout,
  clearTimeout: clearTimer = globalThis.clearTimeout,
  now = Date.now,
} = {}) {
  const cached = readCache(storage);
  if (cached) safely(() => onContent(cached, { source: 'cache' }));

  const controller = typeof AbortController === 'function' ? new AbortController() : null;
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimer(() => {
      controller?.abort();
      reject(new Error(`Timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    const fetchFnSafe = typeof fetchFn === 'function' ? fetchFn : () => Promise.reject(new Error('fetch unavailable'));
    const tabs = await Promise.race([loadTabs({ fetch: fetchFnSafe, sheetId, signal: controller?.signal }), timeout]);
    writeCache(storage, tabs, now());
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

/** A throwing render callback must not stop the fallback chain. */
function safely(fn) {
  try {
    fn();
  } catch (err) {
    globalThis.console?.error('Brochure render failed', err);
  }
}
