import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { csv, settingsCsv, view } from './helpers.js';

const HEAD = ['title_en', 'title_th', 'title_de', 'detail_en', 'detail_th', 'detail_de', 'when', 'photo', 'show'];
const special = (title, detail, when, show = 'yes') => [title, '', '', detail, '', '', when, '', show];

test('visible specials show title, detail and when, in row order', () => {
  const v = view({
    specials: csv(
      HEAD,
      special('Sunset happy hour', '2-for-1 on signature cocktails', 'Daily 5–7pm'),
      special('Live music', 'Acoustic sets on the sand', 'Fri & Sat from 8pm', 'YES'),
    ),
  });
  const html = v.section('specials');
  assert.ok(html);
  assert.match(html, /<h2>Specials &amp; events<\/h2>/);
  for (const text of ['Sunset happy hour', '2-for-1 on signature cocktails', 'Daily 5–7pm', 'Live music', 'Acoustic sets on the sand', 'Fri &amp; Sat from 8pm']) {
    assert.ok(html.includes(text), `missing ${text}`);
  }
  assert.ok(html.indexOf('Sunset happy hour') < html.indexOf('Live music'));
});

test('specials with show = no (or blank) are hidden', () => {
  const v = view({
    specials: csv(
      HEAD,
      special('Sunset happy hour', 'Cheap drinks', 'Daily'),
      special('Full moon BBQ', 'Seafood', 'Next full moon', 'no'),
      special('Secret party', 'Shh', 'Tonight', ''),
    ),
  });
  const html = v.section('specials');
  assert.match(html, /Sunset happy hour/);
  assert.doesNotMatch(html, /Full moon BBQ|Seafood|Secret party/);
  assert.equal((html.match(/<li/g) ?? []).length, 1);
});

test('zero visible specials → no specials section', () => {
  const v = view({
    settings: settingsCsv({ business_name: 'Hidden Beach' }),
    specials: csv(HEAD, special('Full moon BBQ', 'Seafood', 'Next full moon', 'no')),
  });
  assert.equal(v.section('specials'), undefined);
  assert.doesNotMatch(v.html, /id="specials"/);
  assert.equal(view({ specials: csv(HEAD) }).section('specials'), undefined);
  assert.equal(view({}).section('specials'), undefined);
});

test('special with empty when or detail renders without empty elements', () => {
  const v = view({ specials: csv(HEAD, special('Live music', '', '')) });
  const html = v.section('specials');
  assert.match(html, /Live music/);
  assert.doesNotMatch(html, /special__when|special__detail/);
});

test('specials heading comes from Settings heading_specials', () => {
  const v = view({
    settings: settingsCsv({ heading_specials: "What's on" }),
    specials: csv(HEAD, special('Live music', 'Acoustic', 'Fri')),
  });
  assert.match(v.section('specials'), /<h2>What&#39;s on<\/h2>/);
});

test('specials text is HTML-escaped', () => {
  const v = view({ specials: csv(HEAD, special('<img src=x onerror=a()>', '<script>x()</script>', '"now"')) });
  assert.doesNotMatch(v.html, /<script>|<img/);
  assert.match(v.section('specials'), /&lt;img src=x/);
});

test('specials use translated title/detail, falling back to English', () => {
  const v = view(
    { specials: csv(HEAD, ['Live music', 'ดนตรีสด', '', 'Acoustic sets', '', '', 'Fri', '', 'yes']) },
    { lang: 'th', today: new Date('2026-10-09T12:00:00+07:00') },
  );
  assert.match(v.section('specials'), /ดนตรีสด/);
  assert.match(v.section('specials'), /Acoustic sets/);
});

test('activities teaser shows when set, with default heading', () => {
  const v = view({ settings: settingsCsv({ activities: 'Kayaks and snorkels on our beach.\n\nDive trips nearby.' }) });
  const html = v.section('activities');
  assert.match(html, /<h2>Make a day of it<\/h2>/);
  assert.match(html, /<p>Kayaks and snorkels on our beach\.<\/p><p>Dive trips nearby\.<\/p>/);
});

test('activities heading comes from Settings heading_activities', () => {
  const v = view({ settings: settingsCsv({ activities: 'Kayak!', heading_activities: 'Things to do' }) });
  assert.match(v.section('activities'), /<h2>Things to do<\/h2>/);
});

test('empty activities text → no teaser', () => {
  for (const settings of [settingsCsv({ business_name: 'Hidden Beach', activities: '   ' }), settingsCsv({ business_name: 'Hidden Beach' })]) {
    const v = view({ settings });
    assert.equal(v.section('activities'), undefined);
    assert.doesNotMatch(v.html, /id="activities"/);
  }
});

test('specials then activities, after about', () => {
  const v = view({
    settings: settingsCsv({ business_name: 'Hidden Beach', about: 'Hi', activities: 'Kayak' }),
    specials: csv(HEAD, special('Live music', 'Acoustic', 'Fri')),
  });
  const order = ['about', 'specials', 'activities'].map((id) => v.ids.indexOf(id));
  assert.ok(order.every((i) => i >= 0));
  assert.deepEqual([...order].sort((a, b) => a - b), order);
});

test('local fixtures render specials (hidden rows excluded) and activities', () => {
  const read = (tab) => readFileSync(new URL(`../fixtures/${tab}.csv`, import.meta.url), 'utf8');
  const v = view({ settings: read('settings'), hours: read('hours'), menu: read('menu'), specials: read('specials') });
  assert.match(v.section('specials'), /Sunset happy hour/);
  assert.doesNotMatch(v.section('specials'), /Full moon BBQ/);
  assert.match(v.section('activities'), /Kayaks/);
});
