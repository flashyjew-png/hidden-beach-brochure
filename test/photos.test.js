import { test } from 'node:test';
import assert from 'node:assert/strict';
import { csv, settingsCsv, view } from './helpers.js';

const ID = '1AbC-dEf_GhIjKlMnOpQrStUv';
const EMBED = `https://lh3.googleusercontent.com/d/${ID}`;

const MENU_HEAD = ['menu', 'category', 'name_en', 'name_th', 'name_de', 'desc_en', 'desc_th', 'desc_de', 'price', 'photo', 'tags', 'show'];
const menuRow = (name, photo) => ['cocktails', 'Signatures', name, '', '', 'Rum, lime', '', '', '220', photo, '', 'yes'];
const SPECIALS_HEAD = ['title_en', 'title_th', 'title_de', 'detail_en', 'detail_th', 'detail_de', 'when', 'photo', 'show'];
const specialRow = (title, photo) => [title, '', '', '2-for-1', '', '', 'Daily 5–7pm', photo, 'yes'];

const imgs = (html) => html.match(/<img\b[^>]*>/g) ?? [];
const src = (img) => img.match(/src="([^"]*)"/)?.[1];
const alt = (img) => img.match(/alt="([^"]*)"/)?.[1];

const heroWith = (extra) => view({ settings: settingsCsv({ business_name: 'Hidden Beach', ...extra }) }).section('hero');
const menuWith = (photo) => view({ menu: csv(MENU_HEAD, menuRow('Sunset Mule', photo)) }).section('cocktails');
const specialWith = (photo) => view({ specials: csv(SPECIALS_HEAD, specialRow('Happy hour', photo)) }).section('specials');

// Empty photo cells → no image and no placeholder

test('empty hero_photo → hero has no image', () => {
  const html = heroWith({ hero_photo: '', logo_url: '' });
  assert.deepEqual(imgs(html), []);
  assert.doesNotMatch(html, /photo|placeholder/);
});

test('empty menu item photo → item has no image', () => {
  const html = menuWith('  ');
  assert.match(html, /Sunset Mule/);
  assert.deepEqual(imgs(html), []);
  assert.doesNotMatch(html, /photo|placeholder/);
});

test('empty special photo → special has no image', () => {
  const html = specialWith('');
  assert.match(html, /Happy hour/);
  assert.deepEqual(imgs(html), []);
  assert.doesNotMatch(html, /photo|placeholder/);
});

// Filled photo cells → lazy image with alt text

test('hero photo renders as a lazy image with the business name as alt', () => {
  const [img] = imgs(heroWith({ hero_photo: 'https://example.com/beach.jpg' }));
  assert.equal(src(img), 'https://example.com/beach.jpg');
  assert.equal(alt(img), 'Hidden Beach');
  assert.match(img, /loading="lazy"/);
});

test('menu item photo renders as a lazy image with the item name as alt', () => {
  const [img] = imgs(menuWith('https://example.com/mule.jpg'));
  assert.equal(src(img), 'https://example.com/mule.jpg');
  assert.equal(alt(img), 'Sunset Mule');
  assert.match(img, /loading="lazy"/);
});

test('special photo renders as a lazy image with the special title as alt', () => {
  const [img] = imgs(specialWith('https://example.com/sunset.jpg'));
  assert.equal(src(img), 'https://example.com/sunset.jpg');
  assert.equal(alt(img), 'Happy hour');
  assert.match(img, /loading="lazy"/);
});

// Drive share links → embeddable URL

const DRIVE_LINKS = [
  `https://drive.google.com/file/d/${ID}/view?usp=sharing`,
  `https://drive.google.com/file/d/${ID}/view`,
  `https://drive.google.com/open?id=${ID}`,
  `https://drive.google.com/uc?id=${ID}`,
  `https://drive.google.com/uc?export=view&id=${ID}`,
];

for (const link of DRIVE_LINKS) {
  test(`Drive link ${link} → embeddable URL in hero, menu and specials`, () => {
    for (const html of [heroWith({ hero_photo: link }), menuWith(link), specialWith(link)]) {
      const found = imgs(html);
      assert.equal(found.length, 1);
      assert.equal(src(found[0]), EMBED);
    }
  });
}

test('Drive link in logo_url → embeddable logo URL', () => {
  const [img] = imgs(heroWith({ logo_url: `https://drive.google.com/open?id=${ID}` }));
  assert.equal(src(img), EMBED);
});

test('plain https image URL passes through unchanged (query string intact, escaped)', () => {
  const url = 'https://images.example.com/p/cocktail.jpg?w=800&q=80';
  const [img] = imgs(menuWith(url));
  assert.equal(src(img), url.replace('&', '&amp;'));
});

// Logo

test('logo_url set → image logo with business name as alt, no text logo', () => {
  const html = heroWith({ logo_url: 'https://example.com/logo.png' });
  const [img] = imgs(html);
  assert.equal(src(img), 'https://example.com/logo.png');
  assert.equal(alt(img), 'Hidden Beach');
  assert.doesNotMatch(html, /logo--text/);
  assert.match(html, /<h1[^>]*><img/);
});

test('logo_url empty → text business name', () => {
  const html = heroWith({ logo_url: '' });
  assert.match(html, /<h1 class="logo logo--text">Hidden Beach<\/h1>/);
  assert.deepEqual(imgs(html), []);
});

test('logo and hero photo together: logo first, then hero photo', () => {
  const found = imgs(heroWith({ logo_url: 'https://example.com/logo.png', hero_photo: 'https://example.com/beach.jpg' }));
  assert.deepEqual(found.map(src), ['https://example.com/logo.png', 'https://example.com/beach.jpg']);
});

test('photo URLs and alt text are HTML-escaped', () => {
  const html = view({ menu: csv(MENU_HEAD, menuRow('"Tiki" <Mule>', 'https://x.com/a.jpg" onerror="alert(1)')) }).section('cocktails');
  assert.doesNotMatch(html, /onerror="/);
  assert.match(html, /alt="&quot;Tiki&quot; &lt;Mule&gt;"/);
});

// Photos × languages (#4 × #7): alt text follows the rendered language, English where untranslated

test('in TH, photo alt text uses the Thai name/title, falling back to English', () => {
  const v = view(
    {
      settings: settingsCsv({
        business_name: { en: 'Hidden Beach', th: 'หิดเดนบีช' },
        logo_url: 'https://example.com/logo.png',
        hero_photo: 'https://example.com/beach.jpg',
      }),
      menu: csv(
        MENU_HEAD,
        ['cocktails', 'Signatures', 'Mojito', 'โมจิโต้', '', 'Rum', '', '', '200', 'https://example.com/m.jpg', '', 'yes'],
        ['cocktails', 'Signatures', 'Negroni', '', '', 'Gin', '', '', '250', 'https://example.com/n.jpg', '', 'yes'],
      ),
      specials: csv(
        SPECIALS_HEAD,
        ['Happy hour', 'แฮปปี้ฮาวร์', '', '2-for-1', '', '', 'Daily', 'https://example.com/h.jpg', 'yes'],
        ['Live music', '', '', 'Acoustic', '', '', 'Fri', 'https://example.com/l.jpg', 'yes'],
      ),
    },
    { lang: 'th', today: new Date('2026-10-09T12:00:00+07:00') },
  );
  assert.equal(v.lang, 'th');
  assert.deepEqual(imgs(v.section('hero')).map(alt), ['หิดเดนบีช', 'หิดเดนบีช']);
  assert.deepEqual(imgs(v.section('cocktails')).map(alt), ['โมจิโต้', 'Negroni']);
  assert.deepEqual(imgs(v.section('specials')).map(alt), ['แฮปปี้ฮาวร์', 'Live music']);
});
