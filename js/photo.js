import { esc, safeUrl } from './content.js';

// Photo cells: empty or non-http(s) → no image.

const DRIVE_HOST = /^(?:[\w-]+\.)?(?:drive|docs)\.google\.com$/i;
const DRIVE_ID = /^[\w-]{10,}$/;

/** Drive share links → lh3.googleusercontent.com/d/<id>, which <img> can load. */
export function imageUrl(raw) {
  const value = safeUrl(raw);
  let url;
  try { url = new URL(value); } catch { return ''; }
  if (!DRIVE_HOST.test(url.hostname)) return value;
  const id = url.pathname.match(/\/d\/([\w-]+)/)?.[1] ?? url.searchParams.get('id');
  return id && DRIVE_ID.test(id) ? `https://lh3.googleusercontent.com/d/${id}` : value;
}

/** `eager`: above-the-fold images (logo, hero). */
export function photo(raw, alt, className, eager = false) {
  const src = imageUrl(raw);
  if (!src) return '';
  const load = eager ? 'loading="eager" fetchpriority="high"' : 'loading="lazy"';
  return `<img class="${className}" src="${esc(src)}" alt="${esc(alt)}" ${load} decoding="async">`;
}
