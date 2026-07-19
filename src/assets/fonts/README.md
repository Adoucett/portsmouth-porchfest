# Fonts

Self-hosted font files go here (`.woff2`).

**Right now** the site loads fonts from Google Fonts (the `<link>` in `index.html`),
so this folder can stay empty until you're ready to self-host.

## To self-host (recommended before launch)

1. Download the variable `.woff2` files into this folder:
   - **Fraunces** (display) — https://fonts.google.com/specimen/Fraunces
   - **Inter** (body) — https://fonts.google.com/specimen/Inter
   - A quick way to grab optimized `woff2`: https://gwfh.mranftl.com/fonts
2. In `index.html`, delete the Google Fonts `<link>` tags.
3. In `src/style/fonts.css`, uncomment the `@font-face` blocks and make the
   `url(...)` filenames match what you downloaded.

Vite fingerprints and bundles these automatically — no other config needed.

## Why self-host?

- Faster first paint (no third-party DNS/TLS round-trip)
- No layout shift / flash of unstyled text once cached
- Works offline and survives Google Fonts outages
- One privacy dependency removed
