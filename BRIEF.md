# Portsmouth Porchfest — Project Brief & Setup Spec
> Ground truth for all decisions on this project.

---

## What We're Building

A design-forward, mobile-first static website for **Portsmouth Porchfest 2026** — a free grassroots neighborhood music festival in Portsmouth, NH (Saturday, September 19, 2026, 12pm–6pm). The site's primary job is to serve as a live, interactive map of all performance locations on the day of the festival. Secondary: event info, FAQ, and volunteer/participation links.

**No CMS. No backend. No database. No recurring hosting bill.**

The map data updates automatically from a public Google Sheet — no deployment needed when band locations change.

---

## Stack

- **Registrar/Email:** Porkbun (`.com` + `.org`, free email forwarding → Gmail)
- **Hosting:** Vercel (free Hobby tier), auto-deploy from GitHub
- **Build:** Vite + vanilla JS (no framework)
- **Map:** Mapbox GL JS with a custom style, data from a public Google Sheet CSV
- **Forms:** link out to existing Google Form (no server-side processing)

No backend, no CMS, no database, no server. Total recurring cost after domains: zero.

---

## Staging Strategy

Vercel builds a **separate preview URL** for every non-`main` branch. The custom domain only ever points to `main`.

```bash
# All development work happens on the dev branch
git checkout dev

# Push to dev → Vercel builds it at a preview URL like:
# portsmouth-porchfest-git-dev-yourusername.vercel.app
git push origin dev

# When ready to go live, merge dev into main
git checkout main
git merge dev
git push origin main   # → production deploy to portsmouthporchfest.org
```

`main` shows a "coming soon" placeholder until launch. Real work lives on `dev`.

---

## Packages

- **`mapbox-gl`** — the entire map: vector tiles, custom styling, markers, popups, camera.
- **`papaparse`** — parses the public Google Sheets CSV in the browser. No backend, no API key.
- **`vite`** (dev only) — ES module imports, `import.meta.env` for the token, HMR, minified static build.

That is the entire dependency list. No framework, no component library, no CSS toolkit. All CSS hand-written.

---

## Environment Variables

`.env` (local, gitignored):
```
VITE_MAPBOX_TOKEN=pk.eyJ1IjoieW91cnVzZXJuYW1...
```

In Vercel: Project → Settings → Environment Variables → add `VITE_MAPBOX_TOKEN` (Production + Preview), then redeploy once.

---

## Google Sheets Data Architecture

Organizers add **`lat`** and **`lng`** columns to their sheet. Recommended columns:

| Column | Example | Notes |
|---|---|---|
| `name` | The River Pilots | Band/performer name |
| `address` | 334 Parrott Ave, Portsmouth NH | Human-readable address |
| `lat` | 43.0718 | Decimal degrees (from Google Maps) |
| `lng` | -70.7626 | Decimal degrees |
| `zone` | 1 | 1, 2, or 3 (drives color coding) |
| `time_start` | 12:00 PM | Display string |
| `time_end` | 2:00 PM | Display string |
| `genre` | Folk / Indie | Free text |
| `description` | Short blurb | Optional |
| `link` | https://bandcamp.com/... | Optional, opens in popup |

Get lat/lng: Google Maps → right-click location → click the coordinates to copy.

Publish: File → Share → Publish to web → select the tab → CSV → Publish → copy URL.

Fetch URL pattern:
```
https://docs.google.com/spreadsheets/d/SHEET_ID/gviz/tq?tqx=out:csv&gid=GID
```

---

## Map Architecture

Zones → colors (sync with the Mapbox style):
```js
const ZONE_COLORS = {
  '1': '#C4622D',  // Zone 1: warm terracotta — Richards Ave, 12–2pm
  '2': '#3D6B4F',  // Zone 2: sage green — Wibird St, 2–4pm
  '3': '#2B4A7A',  // Zone 3: deep blue — Goodwin Park, 4–6pm
};
```

Mobile UX: tapping a marker opens a **bottom sheet** (not a cropped popup) with band name, time, zone, genre, description, link. Desktop ≥768px: styled popup / side panel.

---

## Design Direction

Aesthetic: feels like a silk-screened event poster, not a website template. Warm, human, strong typographic opinions. The map is the centerpiece.

Palette:
- `--ink: #1a1a18` — near-black text/UI
- `--paper: #F5F1E8` — warm off-white background (never pure white)
- `--accent: #C4622D` — warm terracotta, used sparingly
- `--muted: #8C8577` — secondary text, labels, dividers

Type: a serif with personality for display (Playfair Display / Libre Baskerville), a clean sans for body (Inter / DM Sans). `font-display: swap`.

Layout: mobile single-column, generous padding; desktop centered ~1100px with map edge-to-edge. No card shadows, no big rounded corners, no gradient backgrounds. The hero countdown numerals are the single most memorable element — go large.

Mobile-first from day one. Primary use case Sept 19: someone on a sidewalk checking where the next band is. Everything one-thumb navigable.

---

## Page Sections (MVP)

1. `<nav>` — wordmark left, minimal links right (Map, Info, FAQ).
2. Hero + Countdown — full-viewport, event name/date/location + live countdown.
3. Map Section — full-width, zone filter pills, marker bottom sheet/popup.
4. About — short, generous whitespace.
5. Schedule — three-zone breakdown (name, neighborhood, time).
6. FAQ — accordion.
7. Volunteer / Get Involved — CTA to signup form.
8. Footer — email, Instagram, Facebook, copyright.

---

## Account Maintenance

| What | How often | Who | Cost |
|---|---|---|---|
| Renew domains | Every 2 years | You / organizers | ~$20/domain |
| Update band data in Google Sheet | Before/during event | Organizers (no dev) | Free |
| Update year/date in `constants.js` | Once a year | Anyone with repo access | Free |
| Mapbox billing check | Rarely | You | Free |
| Vercel | Set and forget | Nobody | Free |

---

## External Links

```
Signup / Volunteer form:
https://docs.google.com/forms/d/e/1FAIpQLSc3m2paZDEtw5PzQr0APthKPxy1xdv5KQzMos1bKLB38Q74-g/viewform

SignUpGenius volunteer:
https://www.signupgenius.com/go/10C0E4EA4AB2BA0FAC52-57534585-porchfest#/

Instagram: https://www.instagram.com/portsmouthporchfest/
Facebook:  https://www.facebook.com/portsmouthporchfest/
Contact:   portsmouthporchfest@gmail.com

Google Sheet (band locations):
https://docs.google.com/spreadsheets/d/1weSzOU4g6wzhw9vO72wQoymLMF034t_XekOLCwDYck4/edit?gid=459018803
Sheet GID: 459018803
```
