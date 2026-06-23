import { initSite } from '../site.js';
import { THEME, ANNOUNCEMENTS, ZONE_COLORS, DEFAULT_MARKER_COLOR, ZONES } from '../constants.js';
import { fetchBands } from '../data.js';
import { SAMPLE_BANDS } from '../sample-data.js';

import bannerUrl from '../assets/2026/banner.png';
import shipUrl from '../assets/2026/ship.png';
import posterUrl from '../assets/2026/poster.jpg';
import posterPdf from '../assets/2026/poster.pdf';

initSite();

// --- Hero art + theme copy ---
setSrc('ty-banner', bannerUrl);
setSrc('ty-ship', shipUrl);
setSrc('ty-poster', posterUrl);
setText('ty-tagline', THEME.tagline);

const dl = document.getElementById('ty-poster-dl');
if (dl) dl.href = posterPdf;

const artist = document.getElementById('ty-artist');
if (artist) {
  artist.textContent = `${THEME.artist.name} (${THEME.artist.handle})`;
  artist.href = THEME.artist.instagram;
}

// --- Latest updates ---
const updates = document.getElementById('ty-updates');
if (updates) {
  updates.innerHTML = ANNOUNCEMENTS.map(
    (a) => `
    <article class="ty-update">
      <p class="ty-update__date">${esc(a.date)}</p>
      <p class="ty-update__text">${esc(a.text)}</p>
    </article>`
  ).join('');
}

// --- Lineup teaser (live sheet first, sample fallback) ---
renderLineup();

async function renderLineup() {
  const host = document.getElementById('ty-lineup');
  if (!host) return;
  let rows;
  try {
    const fc = await fetchBands();
    rows = fc.features.length ? fc.features.map((f) => f.properties) : SAMPLE_BANDS;
  } catch {
    rows = SAMPLE_BANDS;
  }
  const featured = rows.filter((r) => r && r.name).slice(0, 6);
  host.innerHTML = featured
    .map((b) => {
      const color = ZONE_COLORS[String(b.zone)] || DEFAULT_MARKER_COLOR;
      const time = [b.time_start, b.time_end].filter(Boolean).join('–');
      const meta = [b.genre, time, zoneLabel(b.zone)].filter(Boolean).join(' · ');
      return `
      <article class="ty-band">
        <span class="ty-band__dot" style="background:${color}"></span>
        <span class="ty-band__name">${esc(b.name)}</span>
        ${meta ? `<span class="ty-band__meta">${esc(meta)}</span>` : ''}
      </article>`;
    })
    .join('');
}

function zoneLabel(zoneId) {
  const z = ZONES.find((x) => x.id === String(zoneId));
  return z ? z.neighborhood : '';
}

function setSrc(id, src) {
  const el = document.getElementById(id);
  if (el) el.src = src;
}

function setText(id, text) {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
