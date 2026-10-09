// PASTE THE SHEET ID HERE: the code between /d/ and /edit in the Sheet's address.
// The Sheet must be Published to web AND shared "Anyone with the link" (see README).
// While empty, the site shows the sample content in fixtures/*.csv.
export const SHEET_ID = '1-c8cqcceIAhbacIrv8yRPmw3pXaD-NZCIwp1k7mTelc';

/** Tab key → Sheet tab name. */
export const TABS = { settings: 'Settings', hours: 'Hours', menu: 'Menu', specials: 'Specials' };

/** A tab's CSV URL. `headers=1` stops gviz merging rows into the header. */
export function tabUrl(tab, sheetId = SHEET_ID) {
  if (!sheetId) return `fixtures/${tab}.csv`;
  const name = encodeURIComponent(TABS[tab]);
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&headers=1&sheet=${name}`;
}
