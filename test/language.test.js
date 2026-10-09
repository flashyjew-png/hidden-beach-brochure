// Ticket #7: Thai/German columns, English fallback, auto-appearing language switcher.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { csv, settingsCsv, view } from './helpers.js';

const TODAY = new Date('2026-10-09T12:00:00+07:00'); // a Friday in Bangkok
const inLang = (lang) => ({ lang, today: TODAY });

const MENU_HEAD = ['menu', 'category', 'name_en', 'name_th', 'name_de', 'desc_en', 'desc_th', 'desc_de', 'price', 'photo', 'tags', 'show'];
const SPECIALS_HEAD = ['title_en', 'title_th', 'title_de', 'detail_en', 'detail_th', 'detail_de', 'when', 'photo', 'show'];
const HOURS = csv(['day', 'bar', 'kitchen'], ['Fri', '10:00–23:00', '11:00–17:00']);

const ENGLISH_ONLY = {
  settings: settingsCsv({ business_name: 'Hidden Beach', about: 'Barefoot beach bar.', heading_about: 'About us' }),
  menu: csv(MENU_HEAD, ['cocktails', 'Signatures', 'Mojito', '', '', 'Rum, mint', '', '', '200', '', '', 'yes']),
  specials: csv(SPECIALS_HEAD, ['Live music', '', '', 'Acoustic', '', '', 'Fri', '', 'yes']),
};

/** Switcher option codes, in order. */
const options = (v) => [...(v.section('language') ?? '').matchAll(/data-lang="([a-z]+)"/g)].map((m) => m[1]);

const read = (tab) => readFileSync(new URL(`../fixtures/${tab}.csv`, import.meta.url), 'utf8');
const FIXTURES = Object.fromEntries(['settings', 'hours', 'menu', 'specials'].map((t) => [t, read(t)]));

test('no th/de content anywhere → no switcher', () => {
  const v = view(ENGLISH_ONLY);
  assert.ok(!v.ids.includes('language'));
  assert.doesNotMatch(v.html, /data-lang=/);
  assert.deepEqual(v.languages, ['en']);
});

test('local fixtures (th/de columns present but empty) → no switcher', () => {
  const v = view(FIXTURES);
  assert.ok(!v.ids.includes('language'));
});

test('whitespace-only th/de cells do not count as content', () => {
  const v = view({ ...ENGLISH_ONLY, settings: settingsCsv({ business_name: { en: 'Hidden Beach', th: '  ', de: ' ' } }) });
  assert.ok(!v.ids.includes('language'));
});

test('one Settings th cell filled → switcher offers EN | TH only', () => {
  const v = view({ ...ENGLISH_ONLY, settings: settingsCsv({ business_name: 'Hidden Beach', about: { en: 'Barefoot beach bar.', th: 'บาร์ริมหาด' } }) });
  assert.deepEqual(options(v), ['en', 'th']);
  assert.match(v.section('language'), />EN<.*>TH</s);
  assert.doesNotMatch(v.section('language'), /DE/);
});

test('one Menu name_th cell filled → switcher offers EN | TH only', () => {
  const v = view({
    ...ENGLISH_ONLY,
    menu: csv(MENU_HEAD, ['cocktails', 'Signatures', 'Mojito', 'โมจิโต้', '', '', '', '', '200', '', '', 'yes']),
  });
  assert.deepEqual(options(v), ['en', 'th']);
});

test('one Specials detail_de cell filled → switcher offers EN | DE only', () => {
  const v = view({
    ...ENGLISH_ONLY,
    specials: csv(SPECIALS_HEAD, ['Live music', '', '', 'Acoustic', '', 'Akustik am Strand', 'Fri', '', 'yes']),
  });
  assert.deepEqual(options(v), ['en', 'de']);
});

test('Thai and German both present → switcher offers EN | TH | DE, current one marked', () => {
  const v = view(
    { ...ENGLISH_ONLY, settings: settingsCsv({ business_name: { en: 'Hidden Beach', th: 'ฮิดเดนบีช', de: 'Versteckter Strand' } }) },
    inLang('de'),
  );
  assert.deepEqual(options(v), ['en', 'th', 'de']);
  assert.match(v.section('language'), /class="lang-switch__option is-current" data-lang="de"[^>]*aria-pressed="true"/);
  assert.match(v.section('language'), /data-lang="en"[^>]*aria-pressed="false"/);
  assert.ok(v.ids.indexOf('language') < v.ids.indexOf('hero'));
});

test('rendering in TH with a partly translated menu shows Thai where present and English elsewhere', () => {
  const v = view(
    {
      settings: settingsCsv({ business_name: 'Hidden Beach' }),
      menu: csv(
        MENU_HEAD,
        ['cocktails', 'Signatures', 'Mojito', 'โมจิโต้', '', 'Rum, mint, lime', '', '', '200', '', '', 'yes'],
        ['cocktails', 'Signatures', 'Negroni', '', '', 'Gin, Campari', 'จิน คัมปารี', '', '250', '', '', 'yes'],
        ['food', 'Mains', 'Green curry', '', '', 'Spicy', '', '', '180', '', '', 'yes'],
      ),
    },
    inLang('th'),
  );
  assert.equal(v.lang, 'th');
  const cocktails = v.section('cocktails');
  assert.match(cocktails, />โมจิโต้</);
  assert.doesNotMatch(cocktails, />Mojito</);
  assert.match(cocktails, />Rum, mint, lime</); // untranslated desc → English
  assert.match(cocktails, />Negroni</); // untranslated name → English
  assert.match(cocktails, />จิน คัมปารี</);
  assert.match(v.section('food'), />Green curry</);
  assert.match(v.section('hero'), />Hidden Beach</); // untranslated Settings cell → English
});

test('section headings and button labels follow the language, English where untranslated', () => {
  const settings = settingsCsv({
    business_name: 'Hidden Beach',
    about: { en: 'Barefoot beach bar.', de: 'Barfuß-Strandbar.' },
    heading_about: { en: 'About us', de: 'Über uns' },
    heading_cocktails: { en: 'Cocktails', de: 'Cocktails' },
    heading_food: { en: 'Food', de: 'Essen' },
    food_coming_soon: { en: 'New menu coming soon', de: 'Neue Speisekarte folgt bald' },
    heading_find_us: { en: 'Find us', de: 'So findest du uns' },
    label_maps_button: { en: 'Open in Google Maps', de: 'In Google Maps öffnen' },
    label_whatsapp_button: { en: 'Chat with us on WhatsApp', de: 'Schreib uns auf WhatsApp' },
    label_open_today: { en: 'Open today', de: 'Heute geöffnet' },
    label_bar: 'Bar',
    heading_specials: 'Specials & events', // not yet translated
    maps_url: 'https://maps.example.com/hb',
    whatsapp_number: '+1 907 215 8419',
  });
  const tabs = { ...ENGLISH_ONLY, settings, hours: HOURS };

  const de = view(tabs, inLang('de'));
  assert.match(de.section('about'), /<h2>Über uns<\/h2><p>Barfuß-Strandbar\.<\/p>/);
  assert.match(de.section('food'), /<h2>Essen<\/h2>.*Neue Speisekarte folgt bald/s);
  assert.match(de.section('find-us'), /<h2>So findest du uns<\/h2>/);
  assert.match(de.section('find-us'), />In Google Maps öffnen<\/a>/);
  assert.match(de.section('whatsapp'), />Schreib uns auf WhatsApp<\/a>/);
  assert.match(de.section('hero'), /Heute geöffnet:/);
  assert.match(de.section('specials'), /<h2>Specials &amp; events<\/h2>/);

  const en = view(tabs, inLang('en'));
  assert.match(en.section('about'), /<h2>About us<\/h2>/);
  assert.match(en.section('find-us'), />Open in Google Maps<\/a>/);
  assert.match(en.section('whatsapp'), />Chat with us on WhatsApp<\/a>/);
});

test('a remembered language that has no content (any more) renders English', () => {
  const v = view(ENGLISH_ONLY, inLang('de'));
  assert.equal(v.lang, 'en');
  assert.ok(!v.ids.includes('language'));
  assert.match(v.section('about'), /<h2>About us<\/h2>/);
});

test('an unknown language code renders English', () => {
  const v = view({ ...ENGLISH_ONLY, settings: settingsCsv({ about: { en: 'Bar.', th: 'บาร์' } }) }, inLang('xx'));
  assert.equal(v.lang, 'en');
  assert.deepEqual(options(v), ['en', 'th']);
  assert.match(v.section('language'), /data-lang="en"[^>]*aria-pressed="true"/);
});
