import { esc } from '../content.js';
import { openToday } from './hours.js';

// Hero: text logo (business name) + status banner + open-today line.
// Later tickets add the logo image and hero photo here.
export function hero(ctx) {
  const name = ctx.setting('business_name');
  const banner = ctx.setting('status_banner');
  const today = openToday(ctx);
  if (!name && !banner && !today) return '';

  const parts = [];
  if (name) parts.push(`<h1 class="logo logo--text">${esc(name)}</h1>`);
  if (banner) parts.push(`<p class="banner" role="status">${esc(banner)}</p>`);
  if (today) parts.push(today);
  return `<header class="section hero" id="hero">${parts.join('')}</header>`;
}
