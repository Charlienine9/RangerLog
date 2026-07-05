# RangerLog — Claude Project Context
*Version: v1.5 (pre-backend batch) — Updated July 2026*

## About This Project
RangerLog is a field management app for UK ranger and conservation teams. Built by Neil Driver (Assistant Countryside Ranger, Torbay Coast & Countryside Trust) using his own on-the-ground experience. Commercial aim: offer it to ranger services and countryside trusts across the UK.

**Live app:** https://rangerlog.neildriver129.workers.dev  
**GitHub repo:** github.com/Charlienine9/RangerLog (private)  
**Hosting:** Cloudflare Pages — auto-deploys ~30 seconds after any GitHub commit  
**Google Sheet ID:** 1eeUoS-hhzcc9M2zziiF40efimom1xw5HORRK6QcB7W0  
**Notion Tracker ID:** 3482f5ca-edfe-8169-b940-d92cc43dd0a1 ← **most up-to-date reference for bugs/features**

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
| Frontend | HTML + Vanilla JavaScript — **single file** (`index.html`) |
| Maps | Leaflet.js 1.9.4 + OpenStreetMap tiles |
| Path data | `export.geojson` (2,689 Torbay footpaths from OSM) |
| Local storage | `localStorage` (entries, tasks, paths, notices, settings) + IndexedDB (photos) |
| Cloud sync | Google Sheets via Google Apps Script webhook (GET only, secret token required) |
| Location | Browser Geolocation API + OS Grid References (client-side, no API) |
| Hosting | Cloudflare Pages (free, no deploy limits) |

**What3Words is fully retired.** The free plan no longer supports the required endpoint. OS Grid References (calculated entirely client-side) are now the location standard throughout the app.

No build process, no npm, no framework. One file deployed directly.

---

## File Structure

```
/rangerlog (GitHub repo)/
├── index.html        ← The entire app (single file)
├── export.geojson    ← All 2,689 Torbay footpaths — MUST sit alongside index.html
└── CLAUDE.md         ← This file
```

The app fetches `export.geojson` with a relative path — it must always be in the same directory as `index.html`.

---

## Data Model

### Field Entries (localStorage + photos in IndexedDB)
`ID | Date | Time | Category | Name | Habitat | Lat | Lon | GridRef | Notes | InfraType | HasPhoto`

Categories: Plant, Tree, Fungi, Insect, Bird, Animal, Reptile, Amphibian, Hazard, Invasive, Infrastructure, Weather

### Tasks (localStorage + syncs to Sheets)
`ID | Name | Location | DueDate | Priority | Notes | Done | CreatedDate | LinkedEntryId`

`LinkedEntryId` is set when a task was created from a Hazard/Infrastructure log entry (it holds that entry's ID). Linked tasks show a 🔗 badge on the task card. Sent to Sheets as the `linkedEntryId` GET parameter → Tasks tab **column K** (Apps Script update required — see below).

### Materials (localStorage — linked to Tasks)
Materials are attached to tasks. Catalogued by type (timber, posts, gates, wire, nails, etc.) with quantities and a Ready / Still Needed status. Syncs to the Tasks tab in Google Sheets.

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

**Spreadsheet tabs (names must match exactly):**
- `Paths` — Path ID | Path Name | Site | Cuts Required | Alexander Cut Date | Summer Cut 1 Date | Summer Cut 2 Date | Status | Last Updated | Ranger
- `Entries` — ID | Date | Time | Category | Name | Habitat | Latitude | Longitude | GridRef | Notes | Infra Type | Has Photo
- `Tasks` — includes materials summary

**Apps Script webhook URL (updated May 2026 — webhook security added):**
```
https://script.google.com/macros/s/AKfycbxbUzGNo570oqZXoeMXDTc7c90-HmP3qe0lKkz0yjBqYqBu0eusp5R5Dwf_-FelpKtS/exec
```

**Webhook security token:** `RLsecret_Torbay2026`  
All sync requests must include `&secret=RLsecret_Torbay2026` as a URL parameter. The Apps Script checks this and returns `'Unauthorised'` for any request missing or mismatching the token.

**CRITICAL: Always use GET requests, never POST.**  
CORS blocks POST headers from Google Apps Script. Parameters are passed as URL query string with a `type` parameter (`entry`, `path`, `cut`, `recordedpath`).

After updating Apps Script code, always do **New deployment** — just saving does not push changes live. The deployment ID changes every time.

---

## Completed Features — v1.4 (Stages 1–11)

1. **Stage 1** — Photo capture, GPS & field logging with categories, habitat selection, notes
2. **Stage 2** — Interactive Leaflet map with colour-coded pins per entry type
3. **Stage 3** — Full 12 categories, tasks/work list with priorities, edit/delete, map filters
4. **Stage 4** — Location references: what3words replaced by OS Grid References (client-side, offline, no API)
5. **Stage 5** — Google Sheets sync via Apps Script webhook, offline queue with auto-sync on reconnect
6. **Stage 6** — Team messaging: WhatsApp group link + local notice board
7. **Stage 7** — Export & reporting: CSV, DBRC format, monthly summary with WhatsApp share, print/PDF
8. **Stage 8** — Paths management tab: full tap-to-manage system, cut schedule, green/amber/red status, Google Sheets sync
9. **Stage 9 area** — GPS path recording: walk an unmapped path to record it, promote to managed path
10. **Stage 10** — GDPR groundwork & Info & Privacy tab (see below)
11. **Stage 11** — Materials tab: linked to Tasks, catalogued materials with quantities and Ready/Still Needed status

## Completed — v1.5 Pre-Backend Batch (July 2026, branch `feature/pre-backend-batch`)

12. **Task-from-entry** — saving a Hazard or Infrastructure entry prompts "Create a task for this?" via a bottom sheet: name prefilled `Resolve: <entry>`, location from the OS grid ref, High/Medium priority pills (High default for hazards, Medium for infrastructure). Task stores `linkedEntryId`, shows a 🔗 badge, syncs the ID to Tasks column K. Prompt also fires when editing a hazard/infra entry that doesn't yet have a linked task; never for other categories.
13. **Live location pin** — pulsing blue pin tracks the ranger's position on the Leaflet map during GPS path recording; map auto-pans when the pin leaves the visible area; pin removed on stop/discard.
14. **GeoJSON export** — Report tab button downloads an RFC 7946 FeatureCollection: entries as Points (WGS84 lon/lat + category, date, time, grid ref, habitat, notes), recorded paths as LineStrings. Entries without GPS are skipped and counted in the toast. Imports directly into QGIS/ArcGIS.

---

## Paths Tab — How it Works

- Leaflet map renders all 2,689 paths from `export.geojson` — all grey/unmanaged by default
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

## Materials Tab (Stage 11)

- Dedicated tab linked to the Tasks system
- Rangers add materials from a categorised catalogue (timber, posts, gates, wire, nails, etc.) directly to any task, with quantities
- Materials marked as **Ready** or **Still Needed**
- Two views: **By Job** (materials per task) and **By Material** (grouped by type across all jobs)
- Stats row: jobs with lists, items still needed, items ready
- Materials summary syncs to the Tasks tab in Google Sheets

---

## Info & Privacy Tab (Stage 10 — GDPR Groundwork)

- The old "About" tab was renamed **Info & Privacy**
- Shows two summary cards: **App Info** (description + all 11 build stages) and **Legal & Privacy** (what's collected, where stored, who can see it, GDPR rights, ICO reference, data controller footer — Neil Driver)
- Full Privacy Notice available from the team lead on request
- Two Word documents exist externally: UK GDPR Privacy Notice (v1.0) and plain-English Staff Information Sheet with acknowledgement block for team members to sign before using the app

---

## Deployment Workflow

1. Edit `index.html` (or `export.geojson`) in GitHub — pencil icon → Ctrl+A → Ctrl+V → Commit
2. Cloudflare Pages auto-deploys within ~30 seconds
3. No CLI, no file uploads, no deploy credit limits

**Local development (since July 2026):** a proper git clone lives at `C:\Users\scrat\Documents\RangerLog` (remote: `Charlienine9/RangerLog`, GitHub credentials saved in Windows Credential Manager). Feature work happens on branches there (e.g. `feature/pre-backend-batch`). The old `Documents\Claude RangerLog` folder holds stale copies — don't edit app files there.

**Service worker gotcha:** `sw.js` caches `index.html` under a versioned cache name (`rangerlog-v1.4`). When testing locally or after deploying, changes may not appear until the service worker/cache is refreshed — bump the cache version in `sw.js` when shipping significant changes.

Netlify was retired because manual deploys counted against a monthly credit limit.

---

## OS Grid Reference
Calculated entirely client-side using Ordnance Survey projection mathematics. No external API needed. Works offline. 5-figure precision (~10m accuracy). This replaced what3words throughout the app.

---

## Storage Strategy
- Photos use **IndexedDB** (not localStorage) to store binary blobs without hitting localStorage size limits (~5MB cap)
- Everything else uses **localStorage** as JSON
- App is offline-capable — a sync queue retries failed Sheets writes on reconnect
- Google Sheets is backup/export only, not the source of truth

---

## Known Issues (see Notion tracker for full detail)
- [ ] **GPS spike bug on Funeral Path** — partial fix applied, not yet field-tested outdoors
- [ ] **Bewhay Lane** not in GeoJSON — plan is to walk and record with GPS path recording feature
- [ ] Location accuracy for wildlife/plant logging — OS Grid Ref is ~10m, not enough for pinpoint species recording. Options: Plus Codes (free, ~3m), lat/lon to 5dp (already stored, ~1m), or what3words paid plan (revisit when revenue allows)
- [ ] Add Site field when naming paths (Berry Head, Cockington, etc.)
- [x] ~~Live location map during path recording~~ — done in v1.5 pre-backend batch
- [ ] **Apps Script needs updating for linkedEntryId** — the app now sends `linkedEntryId` on task syncs; the Apps Script task handler must write it to Tasks column K, then **New deployment** (and update `SHEETS_URL` in index.html if the deployment URL changes)

---

## Key Lessons — Don't Re-Learn These

1. **GET not POST** — Google Apps Script CORS blocks POST headers. Always use GET with URL params.
2. **Secret token required** — all sync requests need `&secret=RLsecret_Torbay2026` in the URL.
3. **Sheet tab names must match exactly** — script uses `getSheetByName('Paths')`, `getSheetByName('Entries')`, `getSheetByName('Tasks')`.
4. **export.geojson must be alongside index.html** — fetched with a relative path.
5. **Apps Script: New deployment required** after code changes — just saving does nothing. Deployment ID changes every time.
6. **Netlify retired** — moved to Cloudflare Pages to avoid deploy credit limits.
7. **IndexedDB for photos** — localStorage can't handle binary blobs at scale.
8. **What3Words is fully retired** — free plan no longer supports the required endpoint. OS Grid References are the standard. Do not attempt to re-add w3w.
9. **GeoJSON has 2,689 paths** (updated from earlier 2,439 figure).
10. **Notion tracker is the living reference** — always check it for current bug status and feature priorities before starting work.
