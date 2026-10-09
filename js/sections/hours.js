import { esc } from '../content.js';

// Hours tab (day | bar | kitchen): shared by the hero's open-today line and the find-us table.
// "Today" is the weekday in Asia/Bangkok of the injected `ctx.today` instant, whatever the
// visitor's phone clock zone is.

export const TIME_ZONE = 'Asia/Bangkok';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];

/** 'mon'…'sun' for the given instant, in Asia/Bangkok. */
function weekdayKey(date) {
  const name = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: TIME_ZONE }).format(date);
  return name.slice(0, 3).toLowerCase();
}

/** Hours rows that name a day ("Mon", "Monday", "mon"…). */
function hourRows(ctx) {
  return ctx.hours.filter((row) => (row.day ?? '').trim());
}

function isTodayRow(row, todayKey) {
  return (row.day ?? '').trim().toLowerCase().slice(0, 3) === todayKey;
}

function isClosed(cell) {
  return /closed/i.test(cell ?? '');
}

/** Display text for an hours cell: times as written, "closed" → localized label. */
function cellText(ctx, cell) {
  if (isClosed(cell)) return ctx.setting('label_closed', 'Closed');
  return (cell ?? '').trim();
}

/** The hero's "Open today" line, or '' when today has no Hours row. */
export function openToday(ctx) {
  const todayKey = weekdayKey(ctx.today);
  const row = hourRows(ctx).find((r) => isTodayRow(r, todayKey));
  if (!row) return '';

  const bar = (row.bar ?? '').trim();
  const kitchen = (row.kitchen ?? '').trim();
  if ((isClosed(bar) || !bar) && (isClosed(kitchen) || !kitchen)) {
    if (!bar && !kitchen) return '';
    return `<p class="open-today open-today--closed">${esc(ctx.setting('label_closed_today', 'Closed today'))}</p>`;
  }

  const parts = [];
  if (bar) parts.push(`${esc(ctx.setting('label_bar', 'Bar'))} ${esc(cellText(ctx, bar))}`);
  if (kitchen) parts.push(`${esc(ctx.setting('label_kitchen', 'Kitchen'))} ${esc(cellText(ctx, kitchen))}`);
  const label = esc(ctx.setting('label_open_today', 'Open today'));
  return `<p class="open-today"><span class="open-today__label">${label}:</span> ${parts.join(' · ')}</p>`;
}

/** Hours table with separate bar and kitchen columns; today's row is marked. '' when no rows. */
export function hoursTable(ctx) {
  const rows = hourRows(ctx);
  if (!rows.length) return '';
  const todayKey = weekdayKey(ctx.today);

  const head =
    `<tr><th scope="col">${esc(ctx.setting('label_day', 'Day'))}</th>` +
    `<th scope="col">${esc(ctx.setting('label_bar', 'Bar'))}</th>` +
    `<th scope="col">${esc(ctx.setting('label_kitchen', 'Kitchen'))}</th></tr>`;
  const body = rows
    .map((row) => {
      const today = isTodayRow(row, todayKey);
      return (
        `<tr${today ? ' class="is-today" aria-current="date"' : ''}>` +
        `<th scope="row">${esc(row.day.trim())}</th>` +
        `<td class="hours__bar">${esc(cellText(ctx, row.bar))}</td>` +
        `<td class="hours__kitchen">${esc(cellText(ctx, row.kitchen))}</td></tr>`
      );
    })
    .join('');
  const caption = esc(ctx.setting('heading_hours', 'Opening hours'));
  return `<table class="hours"><caption>${caption}</caption><thead>${head}</thead><tbody>${body}</tbody></table>`;
}
