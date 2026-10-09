// CSV parsing for the published Google Sheet tabs.
// RFC 4180: quoted fields may contain commas, line breaks and doubled quotes ("").

/** Parse CSV text into an array of records (arrays of strings). */
export function parseCsv(text) {
  const src = String(text ?? '').replace(/^﻿/, '');
  const records = [];
  let record = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      record.push(field); field = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      record.push(field); field = '';
      records.push(record); record = [];
    } else {
      field += c;
    }
  }
  if (field !== '' || record.length) { record.push(field); records.push(record); }
  return records;
}

/**
 * Parse a tab's CSV into row objects keyed by header (trimmed, lower-cased).
 * Blank rows (every cell empty/whitespace) are dropped. Cell values are trimmed.
 */
export function csvToRows(text) {
  const [header, ...body] = parseCsv(text);
  if (!header) return [];
  const keys = header.map((h) => h.trim().toLowerCase());
  return body
    .filter((cells) => cells.some((c) => c.trim() !== ''))
    .map((cells) => Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? '').trim()])));
}

/** Parse every tab: `{settings: csv, hours: csv, ...}` → `{settings: rows, hours: rows, ...}`. */
export function parseTabs(csvByTab) {
  return Object.fromEntries(
    Object.entries(csvByTab ?? {}).map(([tab, text]) => [tab, csvToRows(text)]),
  );
}
