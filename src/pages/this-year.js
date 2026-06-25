import { initSite } from '../site.js';
import {
  THEME,
  ABOUT,
  FESTIVAL,
  ANNOUNCEMENTS,
  SHEET_ANNOUNCEMENTS_CSV_URL,
  SHEET_INSTAGRAM_CSV_URL,
  ZONE_COLORS,
  DEFAULT_MARKER_COLOR,
  ZONES,
} from '../constants.js';
import { fetchBands, fetchAnnouncements, fetchInstagramPosts } from '../data.js';
import { SAMPLE_BANDS } from '../sample-data.js';

import bannerUrl from '../assets/2026/banner.png';
import bannerMobileUrl from '../assets/2026/banner-1200.png';
import shipUrl from '../assets/2026/ship.png';
import shipMobileUrl from '../assets/2026/ship-900.png';
import posterUrl from '../assets/2026/poster.jpg';
import posterDownloadUrl from '../assets/2026/poster-2026.jpg';

initSite();

// --- Hero art (responsive: phones get the lighter files) + theme copy ---
setImg('ty-banner', bannerUrl, `${bannerMobileUrl} 1200w, ${bannerUrl} 2000w`, '(min-width: 768px) 740px, 100vw');
setImg('ty-ship', shipUrl, `${shipMobileUrl} 900w, ${shipUrl} 1600w`, '(min-width: 768px) 660px, 92vw');
setSrc('ty-poster', posterUrl);

// --- How to PorchFest + mission/vision/goal ---
renderHowTo();
setText('ty-mission', ABOUT.mission);
setText('ty-vision', ABOUT.vision);
setText('ty-goal', THEME.goal);

function renderHowTo() {
  const host = document.getElementById('ty-howto');
  if (!host) return;
  host.innerHTML = (THEME.howTo || []).map((t) => `<li>${esc(t)}</li>`).join('');
}

const dl = document.getElementById('ty-poster-dl');
if (dl) {
  dl.href = posterDownloadUrl;
  dl.setAttribute('download', 'Portsmouth-Porchfest-2026-Poster.jpg');
}

const artist = document.getElementById('ty-artist');
if (artist) {
  artist.textContent = `${THEME.artist.name} (${THEME.artist.handle})`;
  artist.href = THEME.artist.instagram;
}

renderUpdates();
renderLineup();
renderInstagram();
initParallax();
initReveal();

// --- Instagram. Priority: (1) Mirror App auto-feed embed, (2) official IG post
// embeds from the sheet "instagram" tab / THEME.instagramPosts, (3) Follow CTA. ---
async function renderInstagram() {
  const host = document.getElementById('ty-instagram');
  if (!host) return;

  if (THEME.instagramEmbedUrl) {
    renderMirrorFeed(host, THEME.instagramEmbedUrl);
    return;
  }

  let posts = [];
  try {
    posts = await fetchInstagramPosts(SHEET_INSTAGRAM_CSV_URL);
  } catch {
    posts = [];
  }
  if (!posts.length) posts = THEME.instagramPosts || [];
  posts = posts.slice(0, 6);

  if (!posts.length) {
    host.innerHTML = `<div class="ty-ig-cta">
      <p class="ty-update__text">Lineup drops, porch reveals, and day-of updates land on our Instagram first.</p>
      <a class="btn" href="${esc(FESTIVAL.instagram)}" target="_blank" rel="noopener">Follow @portsmouthporchfest</a>
    </div>`;
    return;
  }

  host.classList.add('ty-ig--grid');
  host.innerHTML = posts
    .map(
      (u) =>
        `<blockquote class="instagram-media" data-instgrm-permalink="${esc(u)}" data-instgrm-version="14"></blockquote>`
    )
    .join('');
  loadInstagramEmbeds();
}

let igRequested = false;
function loadInstagramEmbeds() {
  if (window.instgrm?.Embeds) {
    window.instgrm.Embeds.process();
    return;
  }
  if (igRequested) return;
  igRequested = true;
  const s = document.createElement('script');
  s.async = true;
  s.src = 'https://www.instagram.com/embed.js';
  s.onload = () => window.instgrm?.Embeds?.process();
  document.body.appendChild(s);
}

// Mirror App auto-feed: an iframe + their bridge script that posts height back so
// the iframe auto-resizes to fit the feed content.
function renderMirrorFeed(host, url) {
  host.classList.add('ty-ig--mirror');
  const frame = document.createElement('iframe');
  frame.src = url;
  frame.title = 'Instagram feed';
  frame.loading = 'lazy';
  frame.scrolling = 'no';
  frame.style.cssText = 'width:100%;border:none;overflow:hidden;min-height:520px;';
  frame.addEventListener('load', () => window.iFrameSetup?.(frame));
  host.innerHTML = '';
  host.appendChild(frame);

  if (window.iFrameSetup) {
    window.iFrameSetup(frame);
  } else if (!document.getElementById('mirror-bridge')) {
    const s = document.createElement('script');
    s.id = 'mirror-bridge';
    s.src = 'https://cdn.jsdelivr.net/npm/@mirrorapp/iframe-bridge@latest/dist/index.umd.js';
    s.onload = () => window.iFrameSetup?.(frame);
    document.body.appendChild(s);
  }
}

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
  const deets = document.getElementById('ty-deets');
  let ticking = false;

  function frame() {
    const y = window.scrollY || 0;
    const desk = window.innerWidth >= 768;
    // Ship RISES as you scroll (and never sinks over the content below), capped
    // so it doesn't fly off on long pages. Banner is left to its CSS sway.
    if (shipwrap) shipwrap.style.transform = desk ? `translate3d(0, ${Math.max(-160, -y * 0.16)}px, 0)` : '';
    if (deets) {
      deets.style.transform = desk ? `translate3d(0, ${-y * 0.05}px, 0)` : '';
      deets.style.opacity = desk ? String(Math.max(0, 1 - y / 480)) : '';
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

function setImg(id, src, srcset, sizes) {
  const el = document.getElementById(id);
  if (!el) return;
  el.src = src;
  if (srcset) el.srcset = srcset;
  if (sizes) el.sizes = sizes;
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
