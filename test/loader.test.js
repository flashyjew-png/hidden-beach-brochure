// Page-shell loading logic: fetch + storage injected, rendered through the renderer's public entry.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadContent, CACHE_KEY } from '../js/loader.js';
import { renderFromCsv } from '../js/renderer.js';
import { csv, settingsCsv } from './helpers.js';

const TODAY = new Date('2026-10-09T12:00:00+07:00');
const renderPage = (tabs) => renderFromCsv(tabs, { lang: 'en', today: TODAY });

const SHEET = {
  settings: settingsCsv({ business_name: 'Hidden Beach', status_banner: 'Live music tonight', about: 'Fresh from the Sheet.' }),
  hours: csv(['day', 'bar', 'kitchen']),
  menu: csv(['menu', 'category', 'name_en', 'price', 'show']),
  specials: csv(['title_en', 'show']),
};
const CACHED = {
  settings: settingsCsv({ business_name: 'Hidden Beach', status_banner: 'Sunset happy hour', about: 'Remembered from last visit.' }),
  hours: csv(['day', 'bar', 'kitchen']),
  menu: csv(['menu', 'category', 'name_en', 'price', 'show']),
  specials: csv(['title_en', 'show']),
};

/** fetch stub serving SHEET by tab (the URL ends in fixtures/<tab>.csv or sheet=<Tab>). */
function sheetFetch(tabs = SHEET) {
  const calls = [];
  const fn = async (url) => {
    calls.push(url);
    const tab = Object.keys(tabs).find((t) => url.includes(`${t}.csv`) || url.toLowerCase().includes(`sheet=${t}`));
    return { ok: true, status: 200, text: async () => tabs[tab] };
  };
  fn.calls = calls;
  return fn;
}
const failingFetch = async () => { throw new TypeError('Failed to fetch'); };
const http500 = async () => ({ ok: false, status: 500, text: async () => '' });
/** Never resolves unless aborted (like a hung island connection). */
const hangingFetch = (url, { signal } = {}) =>
  new Promise((_, reject) => signal?.addEventListener('abort', () => reject(new Error('aborted'))));

function memoryStorage(initial = {}) {
  const data = new Map(Object.entries(initial));
  return {
    getItem: (k) => (data.has(k) ? data.get(k) : null),
    setItem: (k, v) => { data.set(k, String(v)); },
    data,
  };
}
const storageWith = (tabs) => memoryStorage({ [CACHE_KEY]: JSON.stringify({ savedAt: 1, tabs }) });
const throwingStorage = {
  getItem() { throw new DOMException('SecurityError'); },
  setItem() { throw new DOMException('QuotaExceededError'); },
};

/** Run loadContent, collecting every page paint as the rendered HTML. */
async function load(deps) {
  const paints = [];
  const result = await loadContent({
    timeoutMs: 50,
    ...deps,
    onContent: (tabs, info) => paints.push({ source: info.source, html: renderPage(tabs).html }),
  });
  return { result, paints, last: paints.at(-1) };
}

test('fresh Sheet data renders and is cached for next time', async () => {
  const storage = memoryStorage();
  const { result, paints, last } = await load({ fetch: sheetFetch(), storage });
  assert.equal(result.source, 'network');
  assert.equal(paints.length, 1);
  assert.match(last.html, /Fresh from the Sheet/);

  const next = await load({ fetch: failingFetch, storage });
  assert.equal(next.result.source, 'cache');
  assert.match(next.last.html, /Fresh from the Sheet/);
});

test('fetch fails + cache exists → the cached content renders', async () => {
  const { result, paints, last } = await load({ fetch: failingFetch, storage: storageWith(CACHED) });
  assert.equal(result.source, 'cache');
  assert.equal(paints.length, 1);
  assert.match(last.html, /Remembered from last visit/);
  assert.match(last.html, /Sunset happy hour/);
});

test('HTTP error + cache exists → the cached content renders', async () => {
  const { result, last } = await load({ fetch: http500, storage: storageWith(CACHED) });
  assert.equal(result.source, 'cache');
  assert.match(last.html, /Remembered from last visit/);
});

test('cache shows instantly, then fresh data replaces it', async () => {
  const { result, paints } = await load({ fetch: sheetFetch(), storage: storageWith(CACHED) });
  assert.deepEqual(paints.map((p) => p.source), ['cache', 'network']);
  assert.match(paints[0].html, /Remembered from last visit/);
  assert.match(paints[1].html, /Fresh from the Sheet/);
  assert.equal(result.source, 'network');
});

test('cache paints before the network answers', async () => {
  const order = [];
  let release;
  const gate = new Promise((r) => { release = r; });
  const slowFetch = async (url, init) => { await gate; return sheetFetch()(url, init); };
  const done = loadContent({
    fetch: slowFetch,
    storage: storageWith(CACHED),
    timeoutMs: 1000,
    onContent: (_, { source }) => order.push(source),
  });
  await new Promise((r) => setImmediate(r));
  assert.deepEqual(order, ['cache']);
  release();
  await done;
  assert.deepEqual(order, ['cache', 'network']);
});

test('fetch fails + no cache → built-in fallback with name, WhatsApp and Maps', async () => {
  const { result, paints, last } = await load({ fetch: failingFetch, storage: memoryStorage() });
  assert.equal(result.source, 'fallback');
  assert.equal(paints.length, 1);
  assert.match(last.html, /<h1[^>]*>Hidden Beach<\/h1>/);

  // The fallback is plain Settings rows, fed through the normal renderer.
  const settings = result.tabs.settings;
  assert.match(settings, /^whatsapp_number,\+1 907 215 8419/m);
  assert.match(settings, /^whatsapp_greeting,Hi! I found you via your brochure/m);
  assert.match(settings, /^maps_url,https:\/\/www\.google\.com\/maps\//m);
});

test('fallback renders WhatsApp and Maps buttons', async () => {
  const { last } = await load({ fetch: failingFetch, storage: null });
  assert.match(last.html, /href="https:\/\/wa\.me\/19072158419\?text=Hi!?(%21)?%20I%20found%20you%20via%20your%20brochure"/);
  assert.match(last.html, /href="https:\/\/www\.google\.com\/maps\/[^"]+"/);
});

test('fetch hangs + no cache → fallback after the timeout, request aborted', async () => {
  let aborted = false;
  const fetch = (url, init) => {
    init?.signal?.addEventListener('abort', () => { aborted = true; });
    return hangingFetch(url, init);
  };
  const { result, last } = await load({ fetch, storage: memoryStorage(), timeoutMs: 20 });
  assert.equal(result.source, 'fallback');
  assert.match(result.error.message, /Timed out/);
  assert.ok(aborted);
  assert.match(last.html, /Hidden Beach/);
});

test('fetch hangs + cache exists → cached content stays', async () => {
  const { result, paints } = await load({ fetch: hangingFetch, storage: storageWith(CACHED), timeoutMs: 20 });
  assert.equal(result.source, 'cache');
  assert.deepEqual(paints.map((p) => p.source), ['cache']);
});

test('default timeout is ~8s', async () => {
  let delay;
  await loadContent({
    fetch: sheetFetch(),
    setTimeout: (fn, ms) => { delay = ms; return 0; },
    clearTimeout: () => {},
  });
  assert.equal(delay, 8000);
});

test('storage throws → the page still renders from the network', async () => {
  const { result, paints, last } = await load({ fetch: sheetFetch(), storage: throwingStorage });
  assert.equal(result.source, 'network');
  assert.equal(paints.length, 1);
  assert.match(last.html, /Fresh from the Sheet/);
});

test('storage throws + fetch fails → fallback, no crash', async () => {
  const { result, last } = await load({ fetch: failingFetch, storage: throwingStorage });
  assert.equal(result.source, 'fallback');
  assert.match(last.html, /Hidden Beach/);
});

test('corrupt cache is ignored', async () => {
  for (const bad of ['not json', '{"tabs":42}', '{"tabs":{"settings":7}}', 'null']) {
    const { result, paints } = await load({ fetch: failingFetch, storage: memoryStorage({ [CACHE_KEY]: bad }) });
    assert.equal(result.source, 'fallback', bad);
    assert.deepEqual(paints.map((p) => p.source), ['fallback'], bad);
  }
});

test('a failed fetch does not overwrite the last good cache', async () => {
  const storage = storageWith(CACHED);
  await load({ fetch: http500, storage });
  assert.match(JSON.parse(storage.data.get(CACHE_KEY)).tabs.settings, /Remembered from last visit/);
});
