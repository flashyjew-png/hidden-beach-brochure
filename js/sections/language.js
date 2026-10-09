import { esc } from '../content.js';

// Language switcher (spec #1, ticket #7). Thai and German switch on by themselves as Jake fills
// the Settings th/de columns or the Menu/Specials *_th / *_de columns. EN is always offered
// alongside; the switcher is omitted while no second language has any content.

export const LANGUAGES = ['en', 'th', 'de'];
const NAMES = { en: 'EN', th: 'TH', de: 'DE' };

function hasText(value) {
  return String(value ?? '').trim() !== '';
}

/** Does any Settings `lang` cell, or any Menu/Specials `*_lang` cell, have content? */
function hasContent(ctx, lang) {
  if (ctx.settingsRows.some((row) => hasText(row[lang]))) return true;
  const suffix = `_${lang}`;
  return [...ctx.menu, ...ctx.specials].some((row) =>
    Object.entries(row).some(([col, value]) => col.trim().toLowerCase().endsWith(suffix) && hasText(value)),
  );
}

/** Languages a visitor can pick: 'en' plus each of th/de with content, in that order. */
export function availableLanguages(ctx) {
  return LANGUAGES.filter((lang) => lang === 'en' || hasContent(ctx, lang));
}

/** EN | TH | DE buttons; '' when English is the only language. */
export function languageSwitcher(ctx) {
  const langs = availableLanguages(ctx);
  if (langs.length < 2) return '';
  const label = ctx.setting('label_language', 'Language');
  const buttons = langs
    .map((lang) => {
      const current = lang === ctx.lang;
      return (
        `<button type="button" class="lang-switch__option${current ? ' is-current' : ''}" ` +
        `data-lang="${lang}" lang="${lang}" aria-pressed="${current}">${NAMES[lang]}</button>`
      );
    })
    .join('');
  return `<nav class="section lang-switch" id="language" aria-label="${esc(label)}">${buttons}</nav>`;
}
