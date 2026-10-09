import { esc } from '../content.js';

// About: the bar's atmosphere text. Blank lines in the cell become paragraphs.
export function about(ctx) {
  const text = ctx.setting('about');
  if (!text) return '';

  const heading = ctx.setting('heading_about', 'About');
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<section class="section about" id="about"><h2>${esc(heading)}</h2>${paragraphs}</section>`;
}
