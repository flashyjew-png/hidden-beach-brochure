# Hidden Beach brochure

A one-page website for the bar and restaurant at Hidden Beach Resort on Koh Mak. Guests open it by scanning a QR code.

**You edit everything in one Google Sheet on your phone.** The website reads the Sheet each time someone opens it, so you never touch code to change text, prices, hours or photos.

---

## One-time setup

Do this once. It takes about 15 minutes.

### 1. The Google Sheet (done)

Your Sheet **Hidden beach brochure** is already set up with the Settings, Hours, Menu and Specials tabs and starter content, and the website is already pointed at it. (If you ever need to start over, `sheet-template/hidden-beach-brochure.xlsx` is a spare copy you can upload to Drive.)

### 2. Make the photos folder

1. In Google Drive, tap **+** → **Folder** and name it **Brochure Photos**.
2. On the folder, tap **⋮** → **Share** → **General access** → **Anyone with the link** → **Viewer**.

Every photo you put in this folder can now be shown on the site.

### 3. Let the website read the Sheet

You need to do **both** of these steps. If you only do one, the site can't read the Sheet.

1. **File → Share → Publish to web → Entire document → Publish.**
2. **Share → General access → Anyone with the link → Viewer.**

The Google Sheets phone app doesn't have "Publish to web". Open the Sheet in your phone's browser at sheets.google.com and choose **Desktop site** from the browser menu.

### 4. The Sheet ID (done)

The website already knows your Sheet's ID. You only need this if you ever switch to a different Sheet: copy the long code between `/d/` and `/edit` in the new Sheet's address, then on GitHub open `js` → `config.js` → pencil (Edit), paste it between the quotes in `export const SHEET_ID = '…';`, and tap **Commit changes**.

### 5. Put the website online (free)

1. On GitHub: repo **Settings** → **General** → scroll to **Danger Zone** → **Change visibility** → **Public**.
2. **Settings** → **Pages** → **Source: Deploy from a branch** → Branch **main**, folder **/ (root)** → **Save**.
3. After a minute or two the Pages screen shows your website's address. Open it on your phone and check it works.

---

## Editing the Sheet

- **Changes take a few minutes to show up.** Google updates the published copy every few minutes. Wait, then refresh the page.
- Type everything as plain text. Prices like `220`, times like `10:00–23:00` and phone numbers stay exactly as you type them.
- **Starting a cell with `+`, `=` or `-`?** Put an apostrophe first, e.g. `'+66 81 234 5678`, or Google Sheets shows `#ERROR!`. The apostrophe doesn't appear on the site.
- **Don't change the first row (the headers) or the tab names.** The website looks for those exact words.
- A blank row is ignored, so you can leave gaps.

### show: yes / no

The Menu and Specials tabs have a **show** column.

- `yes` → shown on the site.
- `no` (or empty) → hidden. The row stays in the Sheet for later.

Use this for sold-out drinks, seasonal dishes, or specials you want to bring back.

---

## The tabs

### Settings

Each row is one setting. **key** says what it is (don't change it). **en** is the English text. **th** and **de** are Thai and German (optional, see *Languages*).

| key | What it does |
|---|---|
| business_name | Name at the top of the page (until you add a logo) |
| logo_url | Logo image link. Leave empty to show the name as text |
| hero_photo | Big photo at the top |
| status_banner | Short message at the top, e.g. "Live music tonight" or "Closed today – back tomorrow" |
| about | A few sentences about the bar. Press Enter between paragraphs |
| activities | Short teaser about the beach, kayaking and diving |
| rating | Google rating text, e.g. "4.8★ from 192 Google reviews". Update it now and then |
| maps_url | Link for the "Open in Google Maps" button (see below) |
| whatsapp_number | Your WhatsApp number with country code, e.g. `'+1 907 215 8419` (start with an apostrophe because of the +) |
| whatsapp_greeting | Message that's already filled in when a guest taps WhatsApp |
| heading_… | Section titles (About us, Cocktails, Food, …) |
| label_… | Button and table words (Open today, Bar, Kitchen, …) |
| food_coming_soon | Shown in the Food section while no food is set to show = yes |

**Google Maps link:** the template has a search link for now. To use your real listing, open Hidden Beach Resort in Google Maps → **Share** → **Copy link** and paste it into `maps_url`.

### Hours

One row per day: **day** | **bar** | **kitchen**.

- Write times however you like, e.g. `10:00–23:00`.
- Write `Closed` if the bar or kitchen is shut that day.
- The top of the page shows "Open today" with today's hours (Thailand time).

The template has guessed hours (bar 10:00–23:00, kitchen 11:00–17:00). Correct them.

### Menu

One row per drink or dish.

| Column | What to type |
|---|---|
| menu | `cocktails` or `food` |
| category | Group name, e.g. Classics, Signatures, Mains. Type a new name to make a new group |
| name_en | Name of the drink or dish |
| desc_en | Short description (optional) |
| price | Price in baht, e.g. `220`. The site adds ฿ |
| photo | Photo link (optional, see *Adding a photo*) |
| tags | e.g. `spicy`, `vegetarian`, `signature`. Separate several with commas |
| show | `yes` or `no` |
| name_th, name_de, desc_th, desc_de | Thai and German (optional) |

- **Order:** the site shows items in the same order as the rows. Move a row to move it on the site. Groups appear in the order their first item appears.
- **Food "coming soon":** while no food row has show = `yes`, the Food section says "New menu coming soon". Build the food menu with show = `no`. When it's ready, switch the rows to `yes`.
- The template's cocktails are placeholders with no prices. Replace them with your real drinks.

### Specials

One row per offer or event, e.g. happy hour or live music.

| Column | What to type |
|---|---|
| title_en | Name, e.g. Sunset happy hour |
| detail_en | One line of detail |
| when | e.g. `Daily 5–7pm`, `Saturday from 8pm` |
| photo | Photo link (optional) |
| show | `yes` or `no` |
| title_th, title_de, detail_th, detail_de | Thai and German (optional) |

The template's specials are examples set to `no`. Edit them and switch them to `yes` when they're real. If no special is shown, the section is hidden.

---

## Adding a photo

1. In the Google Drive app, open **Brochure Photos** → **+** → **Upload** → pick the photo.
2. On the photo, tap **⋮** → **Share** → **Copy link**.
3. Paste the link into the **photo** cell (Menu or Specials), or into `hero_photo` / `logo_url` in Settings.

To remove a photo, clear the cell. Empty photo cells show nothing, so the page never has a broken image.

### Logo

Upload your logo to **Brochure Photos** the same way and paste its link into `logo_url` in Settings. The logo replaces the text name at the top. Clear the cell to go back to the text name.

---

## Languages (Thai, German)

The site starts in English. To add Thai or German, fill in the **th** / **de** columns in Settings, or the `_th` / `_de` columns in Menu and Specials.

- A **language switcher (EN / TH / DE)** appears by itself as soon as any Thai or German cell has text. It only offers languages that have something filled in.
- You can translate a bit at a time. Any cell you haven't translated yet shows in English.
- The site remembers each guest's choice.

---

## If something goes wrong

- **The site can't reach the Sheet** (bad signal, Google down)? Guests see the last content their phone loaded. On a first visit with no signal, they see a basic page with the name, a Maps button and the WhatsApp button.
- **A change isn't showing?** Wait a few minutes and refresh. Check the row's **show** is `yes`.
- **Nothing from the Sheet shows at all?** Check setup step 3 (both Publish to web **and** Anyone with the link) and that the Sheet ID in `js/config.js` is correct.
- **A photo doesn't show?** Make sure it's inside **Brochure Photos** (shared as Anyone with the link) and that you pasted the share link.

---

## For developers

Static site: HTML, CSS and vanilla ES modules. No build step, no dependencies.

- Run the tests: `node --test` (Node 22+). The Sheet-template test also needs `python3` with `openpyxl`, and is skipped without it.
- Run locally: `python3 -m http.server 8000`, then open http://localhost:8000. While `SHEET_ID` is empty the site reads `fixtures/*.csv`.
- Rebuild the Sheet template: `python3 sheet-template/build.py`.

```
index.html, styles.css    page shell and theme
js/config.js              SHEET_ID and the tab names / CSV URLs
js/loader.js              fetch tabs, cache the last good copy, offline fallback
js/app.js                 wires the loader and renderer into the DOM, language choice
js/renderer.js            content renderer (the test seam): tabs + language → sections
js/sections/*.js          one builder per page section
js/csv.js, content.js, photo.js   CSV parsing, shared helpers, Drive link conversion
fixtures/*.csv            sample tab data (used while SHEET_ID is empty)
sheet-template/           build.py → hidden-beach-brochure.xlsx (starter Sheet); dump.py for tests
test/                     node --test suites, incl. Sheet-template ↔ renderer contract check
```
