import { esc } from './content.js';

// Photo cells (Settings hero_photo / logo_url, Menu photo, Specials photo) — ticket #4.
// Empty cell → '' (no element, no placeholder). Drive share links → embeddable URL.

const DRIVE_HOST = /^(?:[\w-]+\.)?(?:drive|docs)\.google\.com$/i;
const DRIVE_ID = /^[\w-]{10,}$/;

/**
 * Turn a photo cell into an <img>-ready URL. Google Drive share links
 * (/file/d/<id>/view, open?id=<id>, uc?id=<id>) become https://lh3.googleusercontent.com/d/<id>,
 * which serves the image itself (uc?export=view is unreliable in <img>). Anything else passes through.
 */
export function imageUrl(raw) {
  const value = String(raw ?? '').trim();
  if (!value) return '';
  let url;
  try {
    url = new URL(value);
  } catch {
    return value;
  }
  if (!DRIVE_HOST.test(url.hostname)) return value;
  const id = url.pathname.match(/\/d\/([\w-]+)/)?.[1] ?? url.searchParams.get('id');
  return id && DRIVE_ID.test(id) ? `https://lh3.googleusercontent.com/d/${id}` : value;
}

/**
 * <img> for a photo cell, or '' when the cell is empty.
 * @param {string} raw cell value
 * @param {string} alt alt text (item or business name)
 * @param {string} [className]
 */
export function photo(raw, alt, className = 'photo') {
  const src = imageUrl(raw);
  if (!src) return '';
  return `<img class="${esc(className)}" src="${esc(src)}" alt="${esc(alt)}" loading="lazy" decoding="async">`;
}
