# RangerLog — Claude Project Context

## About This Project
RangerLog is a field management app for UK ranger and conservation teams. Built by Neil Driver (Assistant Countryside Ranger, Torbay Coast & Countryside Trust) using his own on-the-ground experience. Commercial aim: offer it to ranger services and countryside trusts across the UK.

**Live app:** https://rangerlog.neildriver129.workers.dev  
**GitHub repo:** private repo named `rangerlog`  
**Hosting:** Cloudflare Pages — auto-deploys ~30 seconds after any GitHub commit

---

## About Neil (the developer)
- Background: 25+ years scaffolding, then Assistant Countryside Ranger (made redundant October 2025)
- Self-taught developer — learns by doing. Prefers plain English, step-by-step guidance, no jargon
- Communication style: casual, encouraging, patient. Break things into small numbered steps
- Ask before assuming — "what can you see on screen?" beats guessing at errors
- This is a genuine, commercially viable product — treat it seriously

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | HTML + Vanilla JavaScript — **single file** (`index.html`, ~2,000 lines) |
| Maps | Leaflet.js 1.9.4 + OpenStreetMap tiles |
| Path data | `export.geojson` (2,439 Torbay footpaths from OSM, 2.7 MB) |
| Local storage | `localStorage` (entries, tasks, paths, notices, settings) + IndexedDB (photos) |
| Cloud sync | Google Sheets via Google Apps Script webhook |
| Location | Browser Geolocation API + what3words API (key: `Y5CDBOWO`) |
| Hosting | Cloudflare Pages (free, no deploy limits) |

No build process, no npm, no framework. One file deployed directly.

---

## File Structure

```
/Claude RangerLog/
├── index.html               ← The entire app (~2,015 lines)
├── export.geojson           ← All 2,439 Torbay footpaths — MUST sit alongside index.html
├── rangerlog-v1-source.html ← Older reference version (do not deploy)
├── RangerLog_Project_Context.md
└── CLAUDE.md                ← This file
```

The app fetches `export.geojson` with a relative path — it must always be in the same directory as `index.html`.

---

## Data Model

### Field Entries (localStorage + photos in IndexedDB)
`ID | Date | Time | Category | Name | Habitat | Lat | Lon | what3words | Notes | InfraType | HasPhoto`

Categories: Plant, Tree, Fungi, Insect, Bird, Animal, Reptile, Amphibian, Hazard, Invasive, Infrastructure, Weather

### Tasks (localStorage only — not yet synced to Sheets)
`ID | Name | Location | DueDate | Priority | Notes | Done | CreatedDate`

### Managed Paths (localStorage)
`OSM ID | Name | Site | Frequency | Schedule | Notes | CutHistory[]`  
Cut status (green/amber/red) derived from days since last cut vs. required frequency.

### Recorded Paths (localStorage)
`ID | Name | GPSPoints[] | Timestamp` — user-traced routes, can be promoted to managed paths

### Notices (localStorage)
`ID | Type | Text | Author | GPS | GridRef | Date | Time`

### Season Settings (localStorage)
`StartDate | EndDate | DefaultFrequency | ScheduleTerminology`

---

## Google Sheets Integration

**Spreadsheet has two tabs (names must match exactly):**
- `Paths` — Path ID | Path Name | Site | Cuts Required | Alexander Cut Date | Summer Cut 1 Date | Summer Cut 2 Date | Status | Last Updated | Ranger
- `Entries` — ID | Date | Time | Category | Name | Habitat | Latitude | Longitude | what3words | Notes | Infra Type | Has Photo

**Apps Script webhook URL:**
```
https://script.google.com/macros/s/AKfycby04pZmI613SZoZjiUUlXkvYXPM2yWbT8Mj4xJMURkqOD7MtwaVIjxnx3VZa1af0Bty/exec
```

**CRITICAL: Always use GET requests, never POST.**  
CORS blocks POST headers from Google Apps Script. Parameters are passed as URL query string with a `type` parameter (`entry`, `path`, `cut`, `recordedpath`).

After updating Apps Script code, always do **New deployment** — just saving does not push changes live.

---

## Paths Tab — How it Works

The most recently built and most complex feature.

- Leaflet map renders all 2,439 paths from `export.geojson` — all grey/unmanaged by default
- **Two map modes:** "Scroll map" (safe panning) and "Tap paths" (select a path by tapping)
- Tapping a path slides up a bottom panel with inline name field + cut frequency pills
- Saving a path writes a row to the Paths Google Sheet and turns the path green/amber/red
- **Color status:** green = OK, amber = due soon, red = overdue (based on cut history vs. frequency)
- **Dual layer trick:** invisible 22px-wide hit layer over thin visual layer for better touch targets
- Fullscreen toggle button (⛶) in top-right of map
- Checklist view shows managed paths sorted overdue-first
- **Cut frequency options:** 1×, 3×, 4×, 6×, Monthly per season
- **Schedule terminology:** "Alexander cut" (end of March) + summer cuts

---

## Deployment Workflow

1. Edit `index.html` (or `export.geojson`) in GitHub — pencil icon → Ctrl+A → Ctrl+V → Commit
2. Cloudflare Pages auto-deploys within ~30 seconds
3. No CLI, no file uploads, no deploy credit limits

Netlify was retired because manual deploys counted against a monthly credit limit.

---

## OS Grid Reference
Calculated entirely client-side using Ordnance Survey projection mathematics (complex trigonometry). No external API needed.

---

## Storage Strategy
- Photos use **IndexedDB** (not localStorage) to store binary blobs without hitting localStorage size limits
- Everything else uses **localStorage** as JSON
- App is offline-capable — a sync queue retries failed Sheets writes on reconnect
- Google Sheets is backup/export only, not the source of truth

---

## Completed Features (Stages 1–8)
1. Photo capture, GPS & field logging
2. Interactive entries map
3. Full categories, tasks, edit/delete
4. what3words integration
5. Google Sheets two-way sync
6. Team messaging (WhatsApp link + local notice board)
7. Export & reporting (CSV, DBRC format, monthly summaries)
8. Paths management tab

---

## Known Issues / Next Steps
- [ ] Add **Site field** when naming paths (Berry Head, Cockington, etc.) for better Sheets organisation
- [ ] Systematically name all 2,439 Torbay paths using prior footpath research
- [ ] Sync **Tasks tab** to Google Sheets (currently local-only)
- [ ] Tidy remaining rough edges in path panel UX

---

## Key Lessons — Don't Re-Learn These

1. **GET not POST** — Google Apps Script CORS blocks POST headers. Always use GET with URL params.
2. **Sheet tab names must match exactly** — script uses `getSheetByName('Paths')` and `getSheetByName('Entries')`.
3. **export.geojson must be alongside index.html** — fetched with a relative path.
4. **Apps Script: New deployment required** after code changes — not just save.
5. **Netlify retired** — moved to Cloudflare Pages to avoid deploy credit limits.
6. **IndexedDB for photos** — localStorage can't handle binary blobs at scale.
