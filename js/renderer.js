// The content renderer and the test seam. Pure: no DOM, fetch or storage.
// Sections are (ctx) => html in page order; '' omits the section.

import { parseTabs } from './csv.js';
import { makeContext } from './content.js';
import { hero } from './sections/hero.js';
import { about } from './sections/about.js';
import { cocktails, food } from './sections/menu.js';
import { specials } from './sections/specials.js';
import { activities } from './sections/activities.js';
import { findUs } from './sections/find-us.js';
import { whatsapp } from './sections/whatsapp.js';
import { languageSwitcher, availableLanguages } from './sections/language.js';

const SECTIONS = {
  language: languageSwitcher, hero, about, cocktails, food, specials, activities, 'find-us': findUs, whatsapp,
};

/** `lang` in the result is what rendered: untranslated th/de → en. */
export function render(tabs = {}, opts = {}) {
  let ctx = makeContext(tabs, opts);
  const languages = availableLanguages(ctx);
  if (!languages.includes(ctx.lang)) ctx = makeContext(tabs, { ...opts, lang: 'en' });
  const sections = Object.entries(SECTIONS)
    .map(([id, build]) => ({ id, html: build(ctx) }))
    .filter((s) => s.html);
  return {
    lang: ctx.lang,
    languages,
    title: ctx.setting('business_name', 'Hidden Beach'),
    sections,
    html: sections.map((s) => s.html).join('\n'),
  };
}

/** render() from raw CSV text per tab. */
export function renderFromCsv(csvByTab = {}, opts = {}) {
  return render(parseTabs(csvByTab), opts);
}
