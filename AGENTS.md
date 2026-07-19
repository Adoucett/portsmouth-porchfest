## Learned User Preferences

- Communicates bluntly and casually (profanity is normal); wants the agent to act decisively and use its full GitHub credentials to commit/deploy directly rather than deferring to GitHub Desktop.
- NEVER commit or deploy machine-local state or chat logs to the repo or live site (e.g. `.cursor/`, `.vercel/`, hook state files); this has repeatedly broken trust — verify staged files before every commit.
- Never expose secrets (GitHub PAT, Mapbox tokens, `.env` contents) in commits, code, or docs.
- Do not deploy work-in-progress to the public domain; keep production behind the coming-soon page until an explicit launch.
- Strongly dislikes "AI-looking" design; wants polished, design-forward, hand-crafted output and likes reviewing through the lens of "designers who hate AI design."
- Mobile-first is mandatory — the day-of use case is someone walking around Portsmouth, one-thumb navigating to find a band.
- Prefers higher-quality assets for things that matter over aggressively tiny files; be smart about serving desktop vs. mobile (responsive images) rather than shrinking everything.
- Justify any new package/dependency (clear benefit, low maintenance) before adding it.
- When handed a plan file with pre-created to-dos, implement it end-to-end without editing the plan file or recreating the to-dos.
- Prefers free/no-cost solutions and resents being steered toward paid third-party services for things that should be free (e.g. Instagram embeds); find the clever free path instead.

## Learned Workspace Facts

- Portsmouth PorchFest event website — static Vite + vanilla JS/HTML/CSS (no framework), deployed on Vercel.
- Multi-page site (index, map, this-year, get-involved, contact, faq); source in `src/`, build via `vite build` into `dist/`.
- Map is the centerpiece: Mapbox GL JS with a custom style; band data lives in a public Google Sheet published as CSV, fetched client-side with PapaParse and converted to GeoJSON (no backend); data mirrored in `data/porchfest-lineup-2026.csv` with lat/lng columns.
- Map UX: desktop uses a left side panel (~left third) for band info instead of popups with hover micro-interactions; mobile uses bottom-sheet popups and no zone filtering. Multiple bands at one address must render without collision (spread/cluster). Zones are color-coded via GeoJSON overlays. Map also has a satellite/hybrid basemap toggle (keep dot readability on top) and a search that drives a dynamic results list, not just filtering the dots.
- Branching/deploy: `main` is production and only serves the coming-soon page until launch; develop on `dev` and merge into `main` to go live. Pushes can go direct via token; keep local remote-tracking refs synced afterward.
- Site is evergreen with a per-year theme; 2026 is the maritime "Porch Ship" identity. A separate "2026 / This Year" topnav section carries the thematic, parallax-driven content and latest updates, while the landing page stays focused on the map and core CTAs.
- Official brand assets and private organizer data are kept outside the repo in a local `no_commit/`-style location (`~/Documents/Julia/...`); `no_commit/`, `.cursor/`, `.vercel/`, and `.env` are gitignored and must never be committed.
- Google Sheets is the no-code CMS: each tab drives a part of the site via its published CSV URL in `src/constants.js` — `live` tab → map/lineup (`SHEET_CSV_URL`, one row per set; multiple bands per porch = multiple rows; `Lineup TBD` for unannounced porches), `updates` tab → microposts with `date`/`headline`/`body` (`SHEET_ANNOUNCEMENTS_CSV_URL`). The model scales to more tabs without new infrastructure.
- 2026 display font is Adobe `juniper-std` (Typekit kit `tkh3pir`) exposed via `--font-poster`; the groovy wordmark is an image asset, not a font. Mapbox `pk.*` tokens are publishable but GitHub push-protection blocks committing them, so the token stays in env vars.
- Instagram feed is embedded via a free third-party widget iframe (mirror-app.com) whose markup is restyled client-side to strip vendor branding while reusing its data feed — chosen to avoid paid embed services.
