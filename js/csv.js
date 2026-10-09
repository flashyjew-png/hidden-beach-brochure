// CSV for the published Sheet tabs (RFC 4180: quoted fields may hold commas, newlines and "").

export function parseCsv(text) {
  const src = String(text ?? '').replace(/^﻿/, '');
  const records = [];
  let record = [];
  let field = '';
  let inQuotes = false;
  const endField = () => { record.push(field); field = ''; };

  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (inQuotes) {
      if (c !== '"') field += c;
      else if (src[i + 1] === '"') { field += '"'; i++; }
      else inQuotes = false;
    } else if (c === '"') inQuotes = true;
    else if (c === ',') endField();
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && src[i + 1] === '\n') i++;
      endField();
      records.push(record);
      record = [];
    } else field += c;
  }
  if (field !== '' || record.length) { endField(); records.push(record); }
  return records;
}

/** Rows keyed by lower-cased header; blank rows dropped. */
function csvToRows(text) {
  const [header = [], ...body] = parseCsv(text);
  const keys = header.map((h) => h.trim().toLowerCase());
  return body
    .filter((cells) => cells.some((c) => c.trim()))
    .map((cells) => Object.fromEntries(keys.map((k, i) => [k, (cells[i] ?? '').trim()])));
}

/** `{tab: csv}` → `{tab: rows}`. */
export function parseTabs(csvByTab) {
  return Object.fromEntries(Object.entries(csvByTab ?? {}).map(([tab, text]) => [tab, csvToRows(text)]));
}
