import { esc } from '../content.js';

// Language switcher: TH/DE appear once any th/de cell has content.

/** Any Settings `lang` cell or Menu/Specials `*_lang` cell filled? */
function hasContent(ctx, lang) {
  const filled = (v) => String(v ?? '').trim();
  return (
    ctx.settingsRows.some((row) => filled(row[lang])) ||
    [...ctx.menu, ...ctx.specials].some((row) =>
      Object.entries(row).some(([col, v]) => col.endsWith(`_${lang}`) && filled(v)),
    )
  );
}

/** 'en' plus each of th/de with content. */
export function availableLanguages(ctx) {
  return ['en', ...['th', 'de'].filter((lang) => hasContent(ctx, lang))];
}

export function languageSwitcher(ctx) {
  const langs = availableLanguages(ctx);
  if (langs.length < 2) return '';
  const label = ctx.setting('label_language', 'Language');
  const button = (lang, current = lang === ctx.lang) =>
    `<button type="button" class="lang-switch__option${current ? ' is-current' : ''}" ` +
    `data-lang="${lang}" lang="${lang}" aria-pressed="${current}">${lang.toUpperCase()}</button>`;
  const buttons = langs.map((lang) => button(lang)).join('');
  return `<nav class="section lang-switch" id="language" aria-label="${esc(label)}">${buttons}</nav>`;
}
