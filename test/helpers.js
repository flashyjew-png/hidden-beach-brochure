// Test helpers: build Sheet-tab CSV text and render it through the renderer's public entry.
import { renderFromCsv } from '../js/renderer.js';

/** Quote a cell the way Google Sheets' CSV export does. */
function cell(v) {
  const s = String(v ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Rows (arrays) → CSV text. */
export function csv(...rows) {
  return rows.map((r) => r.map(cell).join(',')).join('\r\n') + '\r\n';
}

/** Settings tab CSV from `{key: en}` or `{key: {en, th, de}}`. */
export function settingsCsv(map) {
  const rows = Object.entries(map).map(([k, v]) =>
    typeof v === 'object' ? [k, v.en ?? '', v.th ?? '', v.de ?? ''] : [k, v, '', ''],
  );
  return csv(['key', 'en', 'th', 'de'], ...rows);
}

/** Render CSV per tab; returns the model plus convenience lookups. */
export function view(csvByTab, opts = { lang: 'en', today: new Date('2026-10-09T12:00:00+07:00') }) {
  const model = renderFromCsv(csvByTab, opts);
  const section = (id) => model.sections.find((s) => s.id === id)?.html;
  return { ...model, section, ids: model.sections.map((s) => s.id) };
}
