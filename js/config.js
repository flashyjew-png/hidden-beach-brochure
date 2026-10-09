// ============================================================================
//  PASTE THE SHEET ID HERE  (the only setting you ever need to change)
// ============================================================================
// 1. Open the Google Sheet. Its address looks like:
//      https://docs.google.com/spreadsheets/d/1AbCdEf...XyZ/edit#gid=0
// 2. Copy the long code between /d/ and /edit  (here: 1AbCdEf...XyZ).
// 3. Paste it between the quotes below, e.g.  export const SHEET_ID = '1AbCdEf...XyZ';
//
// The Sheet must be BOTH  File → Share → Publish to web  AND
// Share → General access → "Anyone with the link" → Viewer, or the site can't read it.
//
// While this is empty ('') the site shows the sample content in fixtures/*.csv.
// ============================================================================
export const SHEET_ID = '';

/** Tab key → Sheet tab name. */
export const TABS = {
  settings: 'Settings',
  hours: 'Hours',
  menu: 'Menu',
  specials: 'Specials',
};

/**
 * Where to fetch a tab's CSV from. The gviz CSV endpoint needs the Sheet viewable by link
 * (see above). `headers=1` stops gviz guessing the header row count: with all-text columns it
 * can otherwise merge rows into the header.
 */
export function tabUrl(tab, sheetId = SHEET_ID) {
  if (!sheetId) return `fixtures/${tab}.csv`;
  const name = encodeURIComponent(TABS[tab]);
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&headers=1&sheet=${name}`;
}
