import { initSite } from '../site.js';
import {
  THEME,
  ANNOUNCEMENTS,
  SHEET_ANNOUNCEMENTS_CSV_URL,
  ZONE_COLORS,
  DEFAULT_MARKER_COLOR,
  ZONES,
} from '../constants.js';
import { fetchBands, fetchAnnouncements } from '../data.js';
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

renderUpdates();
renderLineup();
initParallax();
initReveal();

// --- Latest updates (live "updates" sheet tab first, static fallback) ---
async function renderUpdates() {
  const host = document.getElementById('ty-updates');
  if (!host) return;
  let items = [];
  try {
    items = await fetchAnnouncements(SHEET_ANNOUNCEMENTS_CSV_URL);
  } catch {
    items = [];
  }
  if (!items.length) items = ANNOUNCEMENTS;
  host.innerHTML = items.map(updateHTML).join('');
}

function updateHTML(a) {
  return `<article class="ty-update">
    ${a.date ? `<p class="ty-update__date">${esc(a.date)}</p>` : ''}
    ${a.headline ? `<p class="ty-update__headline">${esc(a.headline)}</p>` : ''}
    ${a.body ? `<p class="ty-update__text">${esc(a.body)}</p>` : ''}
  </article>`;
}

// --- Lineup teaser (live sheet first, sample fallback) ---
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

// --- Desktop parallax: layers drift at different rates as you scroll ---
function initParallax() {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const shipwrap = document.getElementById('ty-shipwrap');
  const banner = document.getElementById('ty-banner');
  const deets = document.getElementById('ty-deets');
  let ticking = false;

  function frame() {
    const y = window.scrollY || 0;
    const desk = window.innerWidth >= 768;
    if (shipwrap) shipwrap.style.transform = desk ? `translate3d(0, ${y * 0.18}px, 0)` : '';
    if (banner) banner.style.transform = desk ? `translate3d(0, ${y * -0.06}px, 0)` : '';
    if (deets) {
      deets.style.transform = desk ? `translate3d(0, ${y * 0.1}px, 0)` : '';
      deets.style.opacity = desk ? String(Math.max(0, 1 - y / 520)) : '';
    }
    ticking = false;
  }

  function onScroll() {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(frame);
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', onScroll);
  frame();
}

// --- Scroll-reveal sections ---
function initReveal() {
  const els = [...document.querySelectorAll('.ty-reveal')];
  if (!('IntersectionObserver' in window) || matchMedia('(prefers-reduced-motion: reduce)').matches) {
    els.forEach((e) => e.classList.add('is-in'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const en of entries) {
        if (en.isIntersecting) {
          en.target.classList.add('is-in');
          io.unobserve(en.target);
        }
      }
    },
    { rootMargin: '0px 0px -10% 0px', threshold: 0.08 }
  );
  els.forEach((e) => io.observe(e));
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
