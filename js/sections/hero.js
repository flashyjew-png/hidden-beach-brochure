import { esc } from '../content.js';

// Hero: text logo (business name) + status banner.
// Later tickets add the logo image, hero photo and open-today line here.
export function hero(ctx) {
  const name = ctx.setting('business_name');
  const banner = ctx.setting('status_banner');
  if (!name && !banner) return '';

  const parts = [];
  if (name) parts.push(`<h1 class="logo logo--text">${esc(name)}</h1>`);
  if (banner) parts.push(`<p class="banner" role="status">${esc(banner)}</p>`);
  return `<header class="section hero" id="hero">${parts.join('')}</header>`;
}
