import { esc } from '../content.js';

// Activities teaser ("Make a day of it"): Settings `activities` text. Blank lines become paragraphs.
export function activities(ctx) {
  const text = ctx.setting('activities');
  if (!text) return '';

  const heading = ctx.setting('heading_activities', 'Make a day of it');
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<section class="section activities" id="activities"><h2>${esc(heading)}</h2>${paragraphs}</section>`;
}
