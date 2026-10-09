import { esc } from '../content.js';

// "Today" is ctx.today's weekday in Asia/Bangkok, whatever the phone's time zone.

const WEEKDAY = new Intl.DateTimeFormat('en-US', { weekday: 'short', timeZone: 'Asia/Bangkok' });
const dayKey = (day) => String(day ?? '').trim().toLowerCase().slice(0, 3);
const isClosed = (cell) => /closed/i.test(cell ?? '');

/** Rows naming a day ("Mon", "Monday"…). */
function hourRows(ctx) {
  return { rows: ctx.hours.filter((row) => dayKey(row.day)), todayKey: dayKey(WEEKDAY.format(ctx.today)) };
}

function labels(ctx) {
  return { bar: esc(ctx.setting('label_bar', 'Bar')), kitchen: esc(ctx.setting('label_kitchen', 'Kitchen')) };
}

/** Escaped cell text as written; "closed" → localized label. */
function cellText(ctx, cell) {
  return esc(isClosed(cell) ? ctx.setting('label_closed', 'Closed') : (cell ?? '').trim());
}

/** The hero's "Open today" line, or '' when today has no Hours row. */
export function openToday(ctx) {
  const { rows, todayKey } = hourRows(ctx);
  const row = rows.find((r) => dayKey(r.day) === todayKey);
  const bar = (row?.bar ?? '').trim();
  const kitchen = (row?.kitchen ?? '').trim();
  if (!bar && !kitchen) return '';
  if ([bar, kitchen].every((c) => !c || isClosed(c))) {
    return `<p class="open-today open-today--closed">${esc(ctx.setting('label_closed_today', 'Closed today'))}</p>`;
  }
  const l = labels(ctx);
  const parts = [bar && `${l.bar} ${cellText(ctx, bar)}`, kitchen && `${l.kitchen} ${cellText(ctx, kitchen)}`];
  const label = esc(ctx.setting('label_open_today', 'Open today'));
  return `<p class="open-today"><span class="open-today__label">${label}:</span> ${parts.filter(Boolean).join(' · ')}</p>`;
}

export function hoursTable(ctx) {
  const { rows, todayKey } = hourRows(ctx);
  if (!rows.length) return '';
  const l = labels(ctx);
  const head = `<tr><th scope="col">${esc(ctx.setting('label_day', 'Day'))}</th><th scope="col">${l.bar}</th><th scope="col">${l.kitchen}</th></tr>`;
  const tr = (row) =>
    `<tr${dayKey(row.day) === todayKey ? ' class="is-today" aria-current="date"' : ''}>` +
    `<th scope="row">${esc(row.day.trim())}</th>` +
    `<td class="hours__bar">${cellText(ctx, row.bar)}</td>` +
    `<td class="hours__kitchen">${cellText(ctx, row.kitchen)}</td></tr>`;
  const body = rows.map(tr).join('');
  const caption = esc(ctx.setting('heading_hours', 'Opening hours'));
  return `<table class="hours"><caption>${caption}</caption><thead>${head}</thead><tbody>${body}</tbody></table>`;
}
