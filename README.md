# Portsmouth Porchfest 2026

Free grassroots neighborhood music festival · Portsmouth, NH · September 19, 2026

---

## URLs

| Environment | URL | Branch |
|---|---|---|
| **Production** (live site) | https://www.portsmouthporchfest.org | `main` |
| **Staging** (in-progress work) | https://portsmouth-porchfest-git-dev-adoucetts-projects.vercel.app | `dev` |

Staging is search-engine blocked by Vercel automatically. No noindex config needed.

---

## Go live (promote staging → production)

When staging looks ready:

```bash
./scripts/go-live.sh
```

That's it. The script merges `dev` into `main`, pushes, and Vercel deploys to the live domain within ~60 seconds.

---

## Day-to-day development

All work goes on the `dev` branch. Push to `dev` and the staging URL auto-updates.

```bash
git checkout dev
# ... make changes ...
git add . && git commit -m "your message"
git push origin dev    # staging auto-deploys
```

Never commit directly to `main`.

---

## No-code editing — Google Sheets is the CMS

Organizers edit the site by editing one master Google Sheet. Each **tab** drives a
different part of the site; the page re-reads that tab's CSV on load, so changes
appear with **no code and no deploy**.

**Master sheet:** https://docs.google.com/spreadsheets/d/1y9lyzBSTLm2IMGUn0z2x9ZGi900ndmdzkX7X52jogeg

**How it's read:** we pull each tab **by name** via the Google "gviz" CSV endpoint
(`.../gviz/tq?tqx=out:csv&sheet=<tabName>`), wired in [src/constants.js](src/constants.js).
No per-tab "publish to web" step is needed — the doc just has to be link-shared as
**"Anyone with the link: Viewer"** (keep edit access to organizers only). Reading by
name means we always get `live`, never the `draft` working tab.

### Tab: `live` → the map + lineup  (`SHEET_CSV_URL`)
One row per **performance/set**. Columns:
`name`, `address`, `lat`, `lng`, `zone` (1/2/3), `time_start`, `time_end`, `genre`, `description`, `image` (URL, optional), `link` (optional)
- Multiple bands at one porch = **multiple rows with the same address** (the map fans them out and the porch's panel lists them in time order).
- A porch with no act yet: set `name` to `Lineup TBD`, leave `zone`/times blank (it shows as a neutral "porch confirmed" pin).
- lat/lng: Google Maps → right-click the spot → click the coordinates.
- Pre-seeded venue list lives in [data/porchfest-lineup-2026.csv](data/porchfest-lineup-2026.csv). When merging it into the sheet, **keep any existing `image` URLs** — don't overwrite curated rows.
- Keep a `draft` tab for staging edits; only `live` is shown on the site.

### Tab: `updates` → "Latest updates" microposts  (`SHEET_ANNOUNCEMENTS_CSV_URL`)
Add a tab named exactly **`updates`** with column headers `date`, `headline`, `body`
(one row per post, newest first). It populates the "Latest updates" section
automatically. Until the tab exists, the page falls back to the static
`ANNOUNCEMENTS` list in [src/constants.js](src/constants.js).

### Future tabs (same pattern, not built yet)
Editable hero copy / an announcement banner could each be their own tab + CSV URL — the model scales without new infrastructure.

---

## Tech stack

- **Vite** — build tool, injects the Mapbox token securely
- **Mapbox GL JS** — custom map style, live GeoJSON markers
- **PapaParse** — fetches the published Google Sheet CSV on page load
- **Vercel** — hosting, preview deployments, custom domain, auto SSL
- No framework, no CMS, no backend, no database

---

## Environment variables

| Variable | Where | Purpose |
|---|---|---|
| `VITE_MAPBOX_TOKEN` | `.env` (local) + Vercel dashboard | Mapbox public token |

Copy `.env.example` → `.env` and add your token for local dev.
