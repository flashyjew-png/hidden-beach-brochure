import { esc } from '../content.js';
import { openToday } from './hours.js';
import { photo } from '../photo.js';

// Hero: logo image (else name as text), photo, banner, open-today line.
export function hero(ctx) {
  const name = ctx.setting('business_name');
  const banner = ctx.setting('status_banner');
  const logoImg = photo(ctx.setting('logo_url'), name || 'Logo', 'logo__img', true);
  const html =
    (logoImg ? `<h1 class="logo logo--image">${logoImg}</h1>` : name ? `<h1 class="logo logo--text">${esc(name)}</h1>` : '') +
    photo(ctx.setting('hero_photo'), name, 'hero__photo', true) +
    (banner ? `<p class="banner" role="status">${esc(banner)}</p>` : '') +
    openToday(ctx);
  return html ? `<header class="section hero" id="hero">${html}</header>` : '';
}
