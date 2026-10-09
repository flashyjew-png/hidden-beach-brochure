import { esc, isShown, pick, section } from '../content.js';
import { photo } from '../photo.js';

// Specials & events: show = yes rows; `when` is not translated.
export function specials(ctx) {
  const list = ctx.specials
    .filter(isShown)
    .map((row) => {
      const title = pick(row, 'title', ctx.lang);
      const detail = pick(row, 'detail', ctx.lang);
      const when = (row.when ?? '').trim();
      if (!title && !detail && !when) return '';
      return (
        `<li class="special">${photo(row.photo, title, 'special__photo')}` +
        (title ? `<h3 class="special__title">${esc(title)}</h3>` : '') +
        (when ? `<p class="special__when">${esc(when)}</p>` : '') +
        (detail ? `<p class="special__detail">${esc(detail)}</p>` : '') +
        `</li>`
      );
    })
    .join('');
  if (!list) return '';
  return section('specials', ctx.setting('heading_specials', 'Specials & events'), `<ul class="specials__list">${list}</ul>`);
}
