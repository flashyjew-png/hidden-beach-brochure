// The only configuration value: the Google Sheet ID (from its URL:
// https://docs.google.com/spreadsheets/d/<SHEET_ID>/edit). The Sheet must be published to the web.
// While empty, the page reads the local fixtures/*.csv instead.
export const SHEET_ID = '';

/** Tab key → Sheet tab name. */
export const TABS = {
  settings: 'Settings',
  hours: 'Hours',
  menu: 'Menu',
  specials: 'Specials',
};

/** Where to fetch a tab's CSV from. */
export function tabUrl(tab, sheetId = SHEET_ID) {
  if (!sheetId) return `fixtures/${tab}.csv`;
  const name = encodeURIComponent(TABS[tab]);
  return `https://docs.google.com/spreadsheets/d/${encodeURIComponent(sheetId)}/gviz/tq?tqx=out:csv&sheet=${name}`;
}
