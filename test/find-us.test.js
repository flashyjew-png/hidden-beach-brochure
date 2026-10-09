import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { csv, settingsCsv, view } from './helpers.js';

const WEEK = csv(
  ['day', 'bar', 'kitchen'],
  ['Mon', '10:00–23:00', '11:00–17:00'],
  ['Tue', '12:00–22:00', 'closed'],
  ['Wed', 'Closed', 'Closed'],
  ['Thu', '10:00–23:00', '11:00–17:00'],
  ['Fri', '10:00–24:00', '11:00–18:00'],
  ['Sat', '10:00–24:00', '11:00–18:00'],
  ['Sun', '10:00–23:00', '11:00–17:00'],
);
const NAME = { business_name: 'Hidden Beach' };
const at = (iso) => ({ lang: 'en', today: new Date(iso) });
const openLine = (v) => v.section('hero').match(/<p class="open-today[^"]*">.*?<\/p>/)?.[0] ?? '';

test('hours table shows separate bar and kitchen times for each row', () => {
  const v = view({ settings: settingsCsv(NAME), hours: WEEK }, at('2026-10-12T12:00:00+07:00'));
  const html = v.section('find-us');
  assert.match(html, /<table class="hours">/);
  assert.match(html, /<th scope="col">Day<\/th><th scope="col">Bar<\/th><th scope="col">Kitchen<\/th>/);
  assert.match(html, /<th scope="row">Mon<\/th><td class="hours__bar">10:00–23:00<\/td><td class="hours__kitchen">11:00–17:00<\/td>/);
  assert.match(html, /<th scope="row">Tue<\/th><td class="hours__bar">12:00–22:00<\/td><td class="hours__kitchen">Closed<\/td>/);
  assert.equal(html.match(/<tr[ >]/g).length, 8); // header + 7 days
  assert.match(html, /<tr class="is-today" aria-current="date"><th scope="row">Mon</);
});

test('open-today line shows the injected date\'s weekday hours', () => {
  const v = view({ settings: settingsCsv(NAME), hours: WEEK }, at('2026-10-09T12:00:00+07:00')); // Friday
  assert.equal(openLine(v), '<p class="open-today"><span class="open-today__label">Open today:</span> Bar 10:00–24:00 · Kitchen 11:00–18:00</p>');
});

test('open-today uses the Asia/Bangkok weekday, not UTC', () => {
  // 2026-10-13 18:30 UTC is Wednesday 01:30 in Bangkok (Wed is closed).
  const v = view({ settings: settingsCsv(NAME), hours: WEEK }, at('2026-10-13T18:30:00Z'));
  assert.match(openLine(v), /open-today--closed">Closed today</);
  assert.match(v.section('find-us'), /<tr class="is-today" aria-current="date"><th scope="row">Wed</);
});

test('a day marked closed shows closed', () => {
  const wed = view({ settings: settingsCsv(NAME), hours: WEEK }, at('2026-10-14T12:00:00+07:00'));
  assert.match(openLine(wed), /Closed today/);
  assert.doesNotMatch(openLine(wed), /\d\d:\d\d/);
  // Kitchen-only closure: bar hours shown, kitchen closed.
  const tue = view({ settings: settingsCsv(NAME), hours: WEEK }, at('2026-10-13T12:00:00+07:00'));
  assert.match(openLine(tue), /Bar 12:00–22:00 · Kitchen Closed/);
});

test('full day names and labels from Settings are honoured', () => {
  const hours = csv(['day', 'bar', 'kitchen'], ['Friday', '9–late', '']);
  const v = view(
    { settings: settingsCsv({ ...NAME, label_open_today: 'Today', label_bar: 'Drinks', label_kitchen: 'Food', label_day: 'Tag' }), hours },
    at('2026-10-09T12:00:00+07:00'),
  );
  assert.match(openLine(v), />Today:<\/span> Drinks 9–late</);
  assert.doesNotMatch(openLine(v), /Food/);
  assert.match(v.section('find-us'), /<th scope="col">Tag<\/th><th scope="col">Drinks<\/th><th scope="col">Food<\/th>/);
});

test('no Hours row for today → no open-today line; no Hours rows → no table', () => {
  const v = view({ settings: settingsCsv(NAME), hours: csv(['day', 'bar', 'kitchen'], ['Mon', '10–22', '11–17']) }, at('2026-10-09T12:00:00+07:00'));
  assert.doesNotMatch(v.section('hero'), /open-today/);
  const none = view({ settings: settingsCsv({ ...NAME, rating: '4.8★' }) });
  assert.doesNotMatch(none.section('find-us'), /<table/);
});

test('Maps button links to the Settings URL; empty → no button', () => {
  const url = 'https://maps.app.goo.gl/abc?x=1&y=2';
  const v = view({ settings: settingsCsv({ ...NAME, maps_url: url, label_maps_button: 'Directions' }) });
  assert.match(v.section('find-us'), /<a class="button button--maps" href="https:\/\/maps\.app\.goo\.gl\/abc\?x=1&amp;y=2"[^>]*>Directions<\/a>/);
  const empty = view({ settings: settingsCsv({ ...NAME, maps_url: '', rating: '4.8★' }) });
  assert.doesNotMatch(empty.html, /button--maps/);
  const unsafe = view({ settings: settingsCsv({ ...NAME, maps_url: 'javascript:alert(1)', rating: '4.8★' }) });
  assert.doesNotMatch(unsafe.html, /javascript:|button--maps/);
});

test('rating text set → badge; empty → no badge', () => {
  const v = view({ settings: settingsCsv({ ...NAME, rating: '4.8★ from 192 Google reviews' }) });
  assert.match(v.section('find-us'), /<p class="rating-badge">4\.8★ from 192 Google reviews<\/p>/);
  const empty = view({ settings: settingsCsv({ ...NAME, rating: '', maps_url: 'https://maps.google.com/x' }) });
  assert.doesNotMatch(empty.html, /rating-badge/);
});

test('find-us section omitted when maps, rating and hours are all empty', () => {
  const v = view({ settings: settingsCsv({ ...NAME, maps_url: '', rating: '' }) });
  assert.ok(!v.ids.includes('find-us'));
});

test('WhatsApp link has digits only and an encoded greeting', () => {
  const v = view({
    settings: settingsCsv({ ...NAME, whatsapp_number: '+1 (907) 215-8419', whatsapp_greeting: 'Hi! I found you via your brochure & QR' }),
  });
  const href = v.section('whatsapp').match(/href="([^"]+)"/)[1].replace(/&amp;/g, '&');
  assert.equal(href, 'https://wa.me/19072158419?text=Hi!%20I%20found%20you%20via%20your%20brochure%20%26%20QR');
  assert.match(v.section('whatsapp'), />Chat with us on WhatsApp<\/a>/);
});

test('empty WhatsApp number → no button', () => {
  const v = view({ settings: settingsCsv({ ...NAME, whatsapp_number: ' ', whatsapp_greeting: 'Hi' }) });
  assert.ok(!v.ids.includes('whatsapp'));
  assert.doesNotMatch(v.html, /wa\.me/);
});

test('find-us then WhatsApp come last, in spec order; fixtures render them', () => {
  const read = (tab) => readFileSync(new URL(`../fixtures/${tab}.csv`, import.meta.url), 'utf8');
  const v = view({ settings: read('settings'), hours: read('hours'), menu: read('menu'), specials: read('specials') });
  assert.deepEqual(v.ids.slice(-2), ['find-us', 'whatsapp']);
  assert.match(v.section('hero'), /open-today/);
  assert.match(v.section('whatsapp'), /wa\.me\/19072158419\?text=Hi!%20I%20found%20you%20via%20your%20brochure/);
});
