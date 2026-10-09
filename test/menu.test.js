import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { csv, settingsCsv, view } from './helpers.js';

const HEAD = ['menu', 'category', 'name_en', 'name_th', 'name_de', 'desc_en', 'desc_th', 'desc_de', 'price', 'photo', 'tags', 'show'];
/** One Menu row from the fields that matter here. */
const row = ({ menu = 'cocktails', category = '', name = '', desc = '', price = '', tags = '', show = 'yes' }) =>
  [menu, category, name, '', '', desc, '', '', price, '', tags, show];
const menuCsv = (...rows) => csv(HEAD, ...rows.map(row));

test('only show = yes rows appear (case-insensitive); show = no or blank are hidden', () => {
  const v = view({
    menu: menuCsv(
      { name: 'Mojito', show: 'yes' },
      { name: 'Negroni', show: 'YES' },
      { name: 'Daiquiri', show: ' Yes ' },
      { name: 'Sold Out Sour', show: 'no' },
      { name: 'Draft Drink', show: '' },
    ),
  });
  const html = v.section('cocktails');
  for (const n of ['Mojito', 'Negroni', 'Daiquiri']) assert.match(html, new RegExp(`>${n}<`));
  assert.doesNotMatch(v.html, /Sold Out Sour|Draft Drink/);
});

test('blank rows are ignored', () => {
  const text = csv(HEAD, row({ name: 'Mojito' })) + ',,,,,,,,,,,\r\n\r\n' + csv(row({ name: 'Negroni' }));
  const v = view({ menu: text });
  assert.equal((v.section('cocktails').match(/class="menu-item"/g) || []).length, 2);
});

test('menu column decides the section: cocktails vs food', () => {
  const v = view({
    menu: menuCsv({ menu: 'cocktails', name: 'Mojito' }, { menu: 'Food', name: 'Green curry' }),
  });
  assert.match(v.section('cocktails'), /Mojito/);
  assert.doesNotMatch(v.section('cocktails'), /Green curry/);
  assert.match(v.section('food'), /Green curry/);
  assert.doesNotMatch(v.section('food'), /Mojito/);
});

test('items group by category in first-appearance order, keeping row order within a category', () => {
  const v = view({
    menu: menuCsv(
      { category: 'Signatures', name: 'A1' },
      { category: 'Classics', name: 'B1' },
      { category: 'Signatures', name: 'A2' },
      { category: 'Brand New Category', name: 'C1' },
      { category: 'Classics', name: 'B2' },
    ),
  });
  const html = v.section('cocktails');
  const order = [...html.matchAll(/<h3[^>]*>([^<]+)<\/h3>|<h4[^>]*>([^<]+)<\/h4>/g)].map((m) => m[1] ?? m[2]);
  assert.deepEqual(order, ['Signatures', 'A1', 'A2', 'Classics', 'B1', 'B2', 'Brand New Category', 'C1']);
});

test('food with zero visible items → coming-soon teaser', () => {
  const v = view({ menu: menuCsv({ menu: 'food', name: 'Green curry', show: 'no' }) });
  assert.ok(v.ids.includes('food'));
  assert.match(v.section('food'), /class="coming-soon"[^>]*>New menu coming soon</);
  assert.doesNotMatch(v.section('food'), /Green curry/);
});

test('food with no Menu tab at all → coming-soon teaser', () => {
  const v = view({});
  assert.match(v.section('food'), /New menu coming soon/);
});

test('food with one visible item → normal menu, no teaser', () => {
  const v = view({
    menu: menuCsv({ menu: 'food', category: 'Mains', name: 'Green curry', show: 'yes' }, { menu: 'food', name: 'Hidden', show: 'no' }),
  });
  assert.match(v.section('food'), />Green curry</);
  assert.doesNotMatch(v.section('food'), /coming soon|coming-soon/i);
});

test('cocktails with zero visible items → no cocktails section', () => {
  const v = view({ menu: menuCsv({ name: 'Mojito', show: 'no' }, { menu: 'food', name: 'Curry' }) });
  assert.ok(!v.ids.includes('cocktails'));
  assert.doesNotMatch(v.html, /id="cocktails"/);
});

test('tags show as badges and a price of "180" shows as ฿180', () => {
  const v = view({ menu: menuCsv({ menu: 'food', name: 'Green curry', price: '180', tags: 'spicy, veg,signature' }) });
  const html = v.section('food');
  assert.match(html, /class="price"[^>]*>฿180</);
  const badges = [...html.matchAll(/<li class="tag[^"]*">([^<]+)<\/li>/g)].map((m) => m[1]);
  assert.deepEqual(badges, ['spicy', 'veg', 'signature']);
});

test('price already written with ฿ is shown as written; empty price/tags/desc render nothing', () => {
  const v = view({ menu: menuCsv({ name: 'Mojito', price: '฿200' }, { name: 'Water' }) });
  const html = v.section('cocktails');
  assert.match(html, />฿200</);
  assert.doesNotMatch(html, /฿฿/);
  const water = html.slice(html.indexOf('Water'));
  assert.doesNotMatch(water, /class="price"|class="tags"|menu-item__desc/);
});

test('description shows under the item', () => {
  const v = view({ menu: menuCsv({ name: 'Sunset', desc: 'Rum, passion fruit, lime' }) });
  assert.match(v.section('cocktails'), /class="menu-item__desc">Rum, passion fruit, lime</);
});

test('headings and teaser text come from Settings, with English defaults', () => {
  const menu = menuCsv({ name: 'Mojito' });
  const defaults = view({ menu });
  assert.match(defaults.section('cocktails'), /<h2>Cocktails<\/h2>/);
  assert.match(defaults.section('food'), /<h2>Food<\/h2>/);

  const custom = view({
    menu,
    settings: settingsCsv({ heading_cocktails: 'Drinks', heading_food: 'Kitchen', food_coming_soon: 'Curry coming soon!' }),
  });
  assert.match(custom.section('cocktails'), /<h2>Drinks<\/h2>/);
  assert.match(custom.section('food'), /<h2>Kitchen<\/h2>[\s\S]*Curry coming soon!/);
});

test('menu text is HTML-escaped', () => {
  const v = view({ menu: menuCsv({ category: '<i>x</i>', name: '<script>a()</script>', tags: '<b>' }) });
  assert.doesNotMatch(v.html, /<script>|<i>|<b>/);
});

test('page order: hero, about, cocktails, food', () => {
  const v = view({
    settings: settingsCsv({ business_name: 'Hidden Beach', about: 'Hi' }),
    menu: menuCsv({ name: 'Mojito' }, { menu: 'food', name: 'Curry' }),
  });
  assert.deepEqual(v.ids.slice(0, 4), ['hero', 'about', 'cocktails', 'food']);
});

test('local fixtures: cocktails shown, food (all show = no) shows teaser', () => {
  const read = (tab) => readFileSync(new URL(`../fixtures/${tab}.csv`, import.meta.url), 'utf8');
  const v = view({ settings: read('settings'), menu: read('menu') });
  assert.match(v.section('cocktails'), /Hidden Beach Sunset/);
  assert.match(v.section('cocktails'), /฿220/);
  assert.match(v.section('food'), /New menu coming soon/);
});
