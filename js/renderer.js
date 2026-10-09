// The content renderer: the single test seam. Pure — no DOM, no fetch, no storage.
//
// render(tabs, opts) takes parsed tab rows and returns the visitor-visible content:
//   { lang, title, sections: [{ id, html }], html }
// A section builder returning '' (no content) is omitted entirely.
//
// To add a section: create js/sections/<name>.js exporting `(ctx) => htmlString`
// and add it to SECTIONS in page order (spec #1 "Section order").

import { parseTabs } from './csv.js';
import { makeContext } from './content.js';
import { hero } from './sections/hero.js';
import { about } from './sections/about.js';
import { cocktails, food } from './sections/menu.js';
import { specials } from './sections/specials.js';
import { activities } from './sections/activities.js';

/** Page order. Each entry: [section id, builder(ctx) → html string ('' = omit)]. */
export const SECTIONS = [
  ['hero', hero],
  ['about', about],
  ['cocktails', cocktails],
  ['food', food],
  ['specials', specials],
  ['activities', activities],
  // find-us, whatsapp — added by later tickets
];

/**
 * @param {{settings?:object[], hours?:object[], menu?:object[], specials?:object[]}} tabs parsed rows per tab
 * @param {{lang?:string, today?:Date}} [opts]
 */
export function render(tabs = {}, opts = {}) {
  const ctx = makeContext(tabs, opts);
  const sections = [];
  for (const [id, build] of SECTIONS) {
    const html = build(ctx);
    if (html) sections.push({ id, html });
  }
  return {
    lang: ctx.lang,
    title: ctx.setting('business_name', 'Hidden Beach'),
    sections,
    html: sections.map((s) => s.html).join('\n'),
  };
}

/** Same as render(), but from raw CSV text per tab: `{settings: '...csv', hours: '...', ...}`. */
export function renderFromCsv(csvByTab = {}, opts = {}) {
  return render(parseTabs(csvByTab), opts);
}
