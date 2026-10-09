import { esc, isShown, pick } from '../content.js';
import { photo } from '../photo.js';

// Specials & events: Specials tab rows with show = yes, in row order.
// Title/detail are per-language (pick() falls back to en); `when` is shared.
// Photos are added by the photo ticket (#4).
export function specials(ctx) {
  const items = ctx.specials
    .filter(isShown)
    .map((row) => ({
      title: pick(row, 'title', ctx.lang),
      detail: pick(row, 'detail', ctx.lang),
      when: (row.when ?? '').trim(),
      photo: row.photo,
    }))
    .filter((s) => s.title || s.detail || s.when);
  if (!items.length) return '';

  const heading = ctx.setting('heading_specials', 'Specials & events');
  const list = items
    .map((s) => {
      const parts = [photo(s.photo, s.title, 'special__photo')];
      if (s.title) parts.push(`<h3 class="special__title">${esc(s.title)}</h3>`);
      if (s.when) parts.push(`<p class="special__when">${esc(s.when)}</p>`);
      if (s.detail) parts.push(`<p class="special__detail">${esc(s.detail)}</p>`);
      return `<li class="special">${parts.join('')}</li>`;
    })
    .join('');
  return `<section class="section specials" id="specials"><h2>${esc(heading)}</h2><ul class="specials__list">${list}</ul></section>`;
}
