import { esc, isShown, pick } from '../content.js';

// Cocktail and food menus from the Menu tab (spec #1, ticket #3).
// `menu` column picks the section; show = yes rows only; grouped by category in
// first-appearance row order. Photos: ticket #4. Translations come via pick() (#7).

/** Visible rows for one menu ('cocktails' | 'food'), in Sheet row order. */
function visibleItems(ctx, which) {
  return ctx.menu.filter(
    (row) =>
      String(row.menu ?? '').trim().toLowerCase() === which &&
      isShown(row) &&
      pick(row, 'name', ctx.lang),
  );
}

/** Group rows by category, keeping first-appearance order of categories and row order inside each. */
function byCategory(rows) {
  const groups = new Map();
  for (const row of rows) {
    const category = String(row.category ?? '').trim();
    if (!groups.has(category)) groups.set(category, []);
    groups.get(category).push(row);
  }
  return groups;
}

/** "180" → "฿180"; a price already written with ฿ is left as written. */
function price(raw) {
  const p = String(raw ?? '').trim();
  if (!p) return '';
  return p.includes('฿') ? p : `฿${p}`;
}

function tags(raw) {
  const list = String(raw ?? '')
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
  if (!list.length) return '';
  return `<ul class="tags">${list
    .map((t) => `<li class="tag tag--${esc(t.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">${esc(t)}</li>`)
    .join('')}</ul>`;
}

function item(row, lang) {
  const name = pick(row, 'name', lang);
  const desc = pick(row, 'desc', lang);
  const p = price(row.price);
  return (
    `<li class="menu-item">` +
    `<div class="menu-item__head"><h4 class="menu-item__name">${esc(name)}</h4>` +
    (p ? `<span class="price">${esc(p)}</span>` : '') +
    `</div>` +
    (desc ? `<p class="menu-item__desc">${esc(desc)}</p>` : '') +
    tags(row.tags) +
    `</li>`
  );
}

function menuList(rows, lang) {
  return [...byCategory(rows)]
    .map(
      ([category, items]) =>
        `<div class="menu-group">` +
        (category ? `<h3 class="menu-group__title">${esc(category)}</h3>` : '') +
        `<ul class="menu-items">${items.map((r) => item(r, lang)).join('')}</ul></div>`,
    )
    .join('');
}

/** Cocktails: omitted when no rows are visible. */
export function cocktails(ctx) {
  const rows = visibleItems(ctx, 'cocktails');
  if (!rows.length) return '';
  const heading = ctx.setting('heading_cocktails', 'Cocktails');
  return `<section class="section menu menu--cocktails" id="cocktails"><h2>${esc(heading)}</h2>${menuList(rows, ctx.lang)}</section>`;
}

/** Food: shows a "coming soon" teaser while no rows are visible. */
export function food(ctx) {
  const rows = visibleItems(ctx, 'food');
  const heading = ctx.setting('heading_food', 'Food');
  const body = rows.length
    ? menuList(rows, ctx.lang)
    : `<p class="coming-soon">${esc(ctx.setting('food_coming_soon', 'New menu coming soon'))}</p>`;
  return `<section class="section menu menu--food" id="food"><h2>${esc(heading)}</h2>${body}</section>`;
}
