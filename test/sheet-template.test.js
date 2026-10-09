// The starter Sheet (sheet-template/hidden-beach-brochure.xlsx) must match the renderer's contract:
// same tabs and header columns as fixtures/*.csv, and a Settings row for every key the code reads.
// Reads the xlsx via sheet-template/dump.py (python3 + openpyxl); skipped where those are missing.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { view } from './helpers.js';

/** Tab key → Sheet tab name: the tabs the site fetches (js/config.js). */
const TABS = { settings: 'Settings', hours: 'Hours', menu: 'Menu', specials: 'Specials' };

const root = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));

function dumpTemplate() {
  const res = spawnSync('python3', [root('sheet-template/dump.py')], { encoding: 'utf8' });
  if (res.error || res.status !== 0) return null;
  return JSON.parse(res.stdout);
}
const template = dumpTemplate();
const skip = template ? false : 'python3 with openpyxl not available';

/** Settings keys the code asks for: every setting('…') call under js/. */
function settingKeysInCode() {
  const keys = new Set();
  const walk = (dir) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const p = `${dir}/${entry.name}`;
      if (entry.isDirectory()) walk(p);
      else if (p.endsWith('.js')) for (const m of readFileSync(p, 'utf8').matchAll(/setting\(\s*['"]([a-z_]+)['"]/g)) keys.add(m[1]);
    }
  };
  walk(root('js'));
  return [...keys].sort();
}

/** Fixture CSV → records. Test-local reader: quoted fields may hold commas, newlines and "". */
function fixture(tab) {
  const records = [[]];
  const field = /("(?:[^"]|"")*"|[^,\r\n]*)(,|\r?\n|$)/g;
  const text = readFileSync(root(`fixtures/${tab}.csv`), 'utf8');
  for (let m; (m = field.exec(text)) && m.index < text.length; ) {
    const v = m[1].startsWith('"') ? m[1].slice(1, -1).replace(/""/g, '"') : m[1];
    records.at(-1).push(v);
    if (m[2] && m[2] !== ',') records.push([]);
  }
  return records.filter((r) => r.some((c) => c !== ''));
}

test('the template has exactly the tabs the site fetches', { skip }, () => {
  assert.deepEqual(Object.keys(template), Object.values(TABS));
});

test('every tab header matches the fixtures exactly (including th/de columns)', { skip }, () => {
  for (const [tab, name] of Object.entries(TABS)) {
    assert.deepEqual(template[name].header, fixture(tab)[0], `${name} header`);
  }
});

test('Settings has a row for every key the code reads, and the fixtures use the same keys', { skip }, () => {
  const templateKeys = template.Settings.rows.map((r) => r[0]).sort();
  const fixtureKeys = fixture('settings').slice(1).map((r) => r[0]).filter(Boolean).sort();
  assert.deepEqual(templateKeys, settingKeysInCode());
  assert.deepEqual(fixtureKeys, settingKeysInCode());
});

test('every cell is stored as text, header is bold and frozen', { skip }, () => {
  for (const name of Object.values(TABS)) {
    assert.deepEqual(template[name].nonText, [], `${name} non-text cells`);
    assert.equal(template[name].frozen, 'A2', `${name} frozen`);
    assert.ok(template[name].boldHeader, `${name} bold header`);
  }
});

test('the starter content renders: cocktails shown, food coming soon, no specials, WhatsApp and hours', { skip }, () => {
  const toCsv = (name) =>
    [template[name].header, ...template[name].rows]
      .map((r) => r.map((c) => (/[",\r\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c)).join(','))
      .join('\r\n');
  const v = view(Object.fromEntries(Object.entries(TABS).map(([tab, name]) => [tab, toCsv(name)])));
  assert.match(v.section('cocktails'), /Mojito/);
  assert.match(v.section('food'), /New menu coming soon/);
  assert.equal(v.section('specials'), undefined);
  assert.match(v.section('whatsapp'), /wa\.me\/19072158419\?text=Hi!%20I%20found%20you%20via%20your%20brochure/);
  assert.match(v.section('find-us'), /4\.8★ from 192 Google reviews/);
  assert.match(v.section('find-us'), /11:00–17:00/);
  assert.deepEqual(v.languages, ['en']);
});
