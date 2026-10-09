import { esc, safeUrl, section } from '../content.js';
import { hoursTable } from './hours.js';

// Find us: Maps button, rating, hours table.
export function findUs(ctx) {
  const mapsUrl = safeUrl(ctx.setting('maps_url'));
  const rating = ctx.setting('rating');
  const body =
    (mapsUrl
      ? `<a class="button button--maps" href="${esc(mapsUrl)}" target="_blank" rel="noopener">${esc(ctx.setting('label_maps_button', 'Open in Google Maps'))}</a>`
      : '') +
    (rating ? `<p class="rating-badge">${esc(rating)}</p>` : '') +
    hoursTable(ctx);
  return body ? section('find-us', ctx.setting('heading_find_us', 'Find us'), body) : '';
}
