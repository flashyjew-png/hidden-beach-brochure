import { paragraphs, section } from '../content.js';

// About: the bar's atmosphere text.
export function about(ctx) {
  const text = ctx.setting('about');
  return text ? section('about', ctx.setting('heading_about', 'About'), paragraphs(text)) : '';
}
