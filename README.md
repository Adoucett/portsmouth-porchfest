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

## Band data (no code needed)

Julia manages the performer list in Google Sheets. The map auto-updates on page load — no deployment needed.

**Sheet:** https://docs.google.com/spreadsheets/d/1weSzOU4g6wzhw9vO72wQoymLMF034t_XekOLCwDYck4

Required columns: `name`, `address`, `lat`, `lng`, `zone` (1/2/3), `time_start`, `time_end`, `genre`, `description`, `image` (URL, optional), `link` (optional)

To get lat/lng for an address: Google Maps → right-click the location → click the coordinates.

The sheet must be published: **File → Share → Publish to web → select sheet → CSV → Publish.**

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
