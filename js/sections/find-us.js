import { esc } from '../content.js';
import { hoursTable } from './hours.js';

/** Only http(s) links are allowed into href attributes. */
function safeUrl(value) {
  const url = String(value ?? '').trim();
  return /^https?:\/\//i.test(url) ? url : '';
}

// Find us: Google Maps button + rating badge + hours table. Omitted when all three are empty.
export function findUs(ctx) {
  const parts = [];

  const mapsUrl = safeUrl(ctx.setting('maps_url'));
  if (mapsUrl) {
    const label = ctx.setting('label_maps_button', 'Open in Google Maps');
    parts.push(
      `<a class="button button--maps" href="${esc(mapsUrl)}" target="_blank" rel="noopener">${esc(label)}</a>`,
    );
  }

  const rating = ctx.setting('rating');
  if (rating) parts.push(`<p class="rating-badge">${esc(rating)}</p>`);

  const table = hoursTable(ctx);
  if (table) parts.push(table);

  if (!parts.length) return '';
  const heading = ctx.setting('heading_find_us', 'Find us');
  return `<section class="section find-us" id="find-us"><h2>${esc(heading)}</h2>${parts.join('')}</section>`;
}
