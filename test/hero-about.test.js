import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { csv, settingsCsv, view } from './helpers.js';

test('settings with name, banner and about render as hero + about', () => {
  const v = view({
    settings: settingsCsv({
      business_name: 'Hidden Beach',
      status_banner: 'Live music tonight',
      about: 'Barefoot beach bar on Koh Mak.',
    }),
  });
  assert.deepEqual(v.ids, ['hero', 'about']);
  assert.match(v.section('hero'), /<h1[^>]*>Hidden Beach<\/h1>/);
  assert.match(v.section('hero'), /class="banner"[^>]*>Live music tonight</);
  assert.match(v.section('about'), /<p>Barefoot beach bar on Koh Mak\.<\/p>/);
  assert.equal(v.title, 'Hidden Beach');
  assert.ok(v.html.indexOf('id="hero"') < v.html.indexOf('id="about"'));
});

test('empty banner cell → no banner element', () => {
  const v = view({ settings: settingsCsv({ business_name: 'Hidden Beach', status_banner: '', about: 'Hi' }) });
  assert.match(v.section('hero'), /Hidden Beach/);
  assert.doesNotMatch(v.html, /banner/);
});

test('empty about cell → no about section', () => {
  const v = view({ settings: settingsCsv({ business_name: 'Hidden Beach', status_banner: 'Open', about: '  ' }) });
  assert.deepEqual(v.ids, ['hero']);
  assert.doesNotMatch(v.html, /id="about"/);
});

test('missing settings → nothing rendered, no crash', () => {
  const v = view({});
  assert.deepEqual(v.ids, []);
  assert.equal(v.html, '');
});

test('quoted commas, quotes and line breaks in cells parse correctly', () => {
  const text =
    'key,en,th,de\r\n' +
    'business_name,"Hidden Beach, Koh Mak",,\r\n' +
    'about,"Cold drinks, warm sand.\n\nSay ""hi"" to the dog.",,\r\n';
  const v = view({ settings: text });
  assert.match(v.section('hero'), />Hidden Beach, Koh Mak</);
  assert.match(v.section('about'), /<p>Cold drinks, warm sand\.<\/p><p>Say &quot;hi&quot; to the dog\.<\/p>/);
});

test('blank rows and LF-only line endings are ignored', () => {
  const text = 'key,en,th,de\n\n,,,\nbusiness_name,Hidden Beach,,\n\nabout,Hello,,';
  const v = view({ settings: text });
  assert.deepEqual(v.ids, ['hero', 'about']);
  assert.match(v.section('about'), /Hello/);
});

test('Sheet text is HTML-escaped', () => {
  const v = view({ settings: settingsCsv({ business_name: '<b>Bar</b> & Grill', about: '<script>x()</script>' }) });
  assert.doesNotMatch(v.html, /<script>|<b>/);
  assert.match(v.section('hero'), /&lt;b&gt;Bar&lt;\/b&gt; &amp; Grill/);
});

test('local fixtures render hero and about', () => {
  const read = (tab) => readFileSync(new URL(`../fixtures/${tab}.csv`, import.meta.url), 'utf8');
  const v = view({ settings: read('settings'), hours: read('hours'), menu: read('menu'), specials: read('specials') });
  assert.deepEqual(v.ids.slice(0, 2), ['hero', 'about']);
  assert.match(v.section('hero'), /Hidden Beach/);
  assert.match(v.section('hero'), /class="banner"/);
});

test('csv helper round-trips (sanity)', () => {
  const v = view({ settings: csv(['key', 'en'], ['business_name', 'A,"B"\nC']) });
  assert.match(v.section('hero'), /A,&quot;B&quot;\nC/);
});
