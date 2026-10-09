import { paragraphs, section } from '../content.js';

// Activities teaser ("Make a day of it").
export function activities(ctx) {
  const text = ctx.setting('activities');
  return text ? section('activities', ctx.setting('heading_activities', 'Make a day of it'), paragraphs(text)) : '';
}
