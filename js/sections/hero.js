import { esc } from '../content.js';
import { openToday } from './hours.js';
import { photo } from '../photo.js';

// Hero: logo (image from logo_url, else business name as text) + hero photo + status banner + open-today line.
export function hero(ctx) {
  const name = ctx.setting('business_name');
  const banner = ctx.setting('status_banner');
  const today = openToday(ctx);
  const logoImg = photo(ctx.setting('logo_url'), name || 'Logo', 'logo__img');
  const heroImg = photo(ctx.setting('hero_photo'), name, 'hero__photo');
  if (!name && !banner && !today && !logoImg && !heroImg) return '';

  const parts = [];
  if (logoImg) parts.push(`<h1 class="logo logo--image">${logoImg}</h1>`);
  else if (name) parts.push(`<h1 class="logo logo--text">${esc(name)}</h1>`);
  if (heroImg) parts.push(heroImg);
  if (banner) parts.push(`<p class="banner" role="status">${esc(banner)}</p>`);
  if (today) parts.push(today);
  return `<header class="section hero" id="hero">${parts.join('')}</header>`;
}
