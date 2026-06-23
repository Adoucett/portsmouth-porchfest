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

Organizers edit the site by editing a Google Sheet. Each **tab** drives a different
part of the site; the page re-reads the published CSV on load, so changes appear
with **no code and no deploy**. Each tab must be published once:
**File → Share → Publish to web → select that sheet/tab → CSV → Publish.** Then the
tab's CSV URL goes in [src/constants.js](src/constants.js).

**Sheet:** https://docs.google.com/spreadsheets/d/1weSzOU4g6wzhw9vO72wQoymLMF034t_XekOLCwDYck4

### Tab: `live` → the map + lineup  (`SHEET_CSV_URL`)
One row per **performance/set**. Columns:
`name`, `address`, `lat`, `lng`, `zone` (1/2/3), `time_start`, `time_end`, `genre`, `description`, `image` (URL, optional), `link` (optional)
- Multiple bands at one porch = **multiple rows with the same address** (the map fans them out and the porch's panel lists them in time order).
- A porch with no act yet: set `name` to `Lineup TBD`, leave `zone`/times blank (it shows as a neutral "porch confirmed" pin).
- lat/lng: Google Maps → right-click the spot → click the coordinates.
- Pre-seeded venue list lives in [data/porchfest-lineup-2026.csv](data/porchfest-lineup-2026.csv). When merging it into the sheet, **keep any existing `image` URLs** — don't overwrite curated rows.

### Tab: `updates` → "Latest updates" microposts  (`SHEET_ANNOUNCEMENTS_CSV_URL`)
One row per post (newest first). Columns: `date`, `headline`, `body`.
Until this tab's CSV URL is set in constants, the page falls back to the static `ANNOUNCEMENTS` list.

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
