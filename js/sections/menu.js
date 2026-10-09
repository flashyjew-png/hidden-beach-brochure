import { esc, isShown, pick, section } from '../content.js';
import { photo } from '../photo.js';

// Menus: `menu` column picks the section; grouped by category in sheet order.

function visibleItems(ctx, which) {
  return ctx.menu.filter(
    (row) => String(row.menu ?? '').trim().toLowerCase() === which && isShown(row) && pick(row, 'name', ctx.lang),
  );
}

/** "180" → "฿180"; prices already with ฿ unchanged. */
function price(raw) {
  const p = String(raw ?? '').trim();
  return !p || p.includes('฿') ? p : `฿${p}`;
}

function tags(raw) {
  const list = String(raw ?? '').split(',').map((t) => t.trim()).filter(Boolean);
  if (!list.length) return '';
  const tag = (t) => `<li class="tag tag--${esc(t.toLowerCase().replace(/[^a-z0-9]+/g, '-'))}">${esc(t)}</li>`;
  return `<ul class="tags">${list.map(tag).join('')}</ul>`;
}

function item(row, lang) {
  const name = pick(row, 'name', lang);
  const desc = pick(row, 'desc', lang);
  const p = price(row.price);
  return (
    `<li class="menu-item">${photo(row.photo, name, 'menu-item__photo')}` +
    `<div class="menu-item__head"><h4 class="menu-item__name">${esc(name)}</h4>` +
    (p ? `<span class="price">${esc(p)}</span>` : '') +
    `</div>` +
    (desc ? `<p class="menu-item__desc">${esc(desc)}</p>` : '') +
    `${tags(row.tags)}</li>`
  );
}

function menuList(rows, lang) {
  const groups = new Map();
  for (const row of rows) {
    const category = String(row.category ?? '').trim();
    groups.set(category, [...(groups.get(category) ?? []), row]);
  }
  return [...groups]
    .map(
      ([category, items]) =>
        `<div class="menu-group">` +
        (category ? `<h3 class="menu-group__title">${esc(category)}</h3>` : '') +
        `<ul class="menu-items">${items.map((r) => item(r, lang)).join('')}</ul></div>`,
    )
    .join('');
}

/** Omitted when empty. */
export function cocktails(ctx) {
  const rows = visibleItems(ctx, 'cocktails');
  if (!rows.length) return '';
  return section('cocktails', ctx.setting('heading_cocktails', 'Cocktails'), menuList(rows, ctx.lang), 'menu menu--cocktails');
}

/** "Coming soon" teaser when empty. */
export function food(ctx) {
  const rows = visibleItems(ctx, 'food');
  const body = rows.length
    ? menuList(rows, ctx.lang)
    : `<p class="coming-soon">${esc(ctx.setting('food_coming_soon', 'New menu coming soon'))}</p>`;
  return section('food', ctx.setting('heading_food', 'Food'), body, 'menu menu--food');
}
