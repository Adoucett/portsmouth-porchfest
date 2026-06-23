import './style/tokens.css';
import './style/fonts.css';
import './style/base.css';
import './style/layout.css';
import './style/map.css';
import './style/components.css';

import { FESTIVAL, ZONES, FAQ } from './constants.js';
import { initCountdown } from './countdown.js';
import { initMap, setBandData, setZoneFilter } from './map.js';
import { fetchBands } from './data.js';
import { mountIcons } from './icons.js';

// Fill any [data-festival="key"] element with FESTIVAL[key].
function hydrateFestivalText() {
  document.querySelectorAll('[data-festival]').forEach((el) => {
    const key = el.dataset.festival;
    if (FESTIVAL[key] != null) el.textContent = FESTIVAL[key];
  });

  const link = (id, href) => {
    const el = document.getElementById(id);
    if (el) el.href = href;
  };
  link('cta-signup', FESTIVAL.signupForm);
  link('cta-volunteer', FESTIVAL.volunteerForm);
  link('footer-email', `mailto:${FESTIVAL.email}`);
  link('footer-ig', FESTIVAL.instagram);
  link('footer-fb', FESTIVAL.facebook);
}

function renderSchedule() {
  const grid = document.getElementById('zone-grid');
  if (!grid) return;
  grid.innerHTML = ZONES.map(
    (z) => `
    <article class="zone-card">
      <span class="zone-card__swatch" style="background:${z.color}"></span>
      <h3>${z.name}</h3>
      <p>${z.neighborhood}</p>
      <p class="zone-card__time">${z.time}</p>
      <a href="#map" data-zone-jump="${z.id}">See on map →</a>
    </article>`
  ).join('');

  grid.querySelectorAll('[data-zone-jump]').forEach((a) => {
    a.addEventListener('click', () => selectZone(a.dataset.zoneJump));
  });
}

function renderFaq() {
  const list = document.getElementById('faq-list');
  if (!list) return;
  list.innerHTML = FAQ.map(
    (item) => `
    <details class="faq-item">
      <summary>${item.q}</summary>
      <p class="faq-item__answer">${item.a}</p>
    </details>`
  ).join('');
}

function renderFilterBar() {
  const bar = document.getElementById('filter-bar');
  if (!bar) return;
  const pills = [{ id: 'all', name: 'All', color: null }, ...ZONES];
  bar.innerHTML = pills
    .map(
      (z) => `
      <button class="filter-pill" data-zone="${z.id}" aria-pressed="${z.id === 'all'}">
        ${z.color ? `<span class="filter-pill__dot" style="background:${z.color}"></span>` : ''}
        ${z.name}
      </button>`
    )
    .join('');

  bar.querySelectorAll('.filter-pill').forEach((btn) => {
    btn.addEventListener('click', () => selectZone(btn.dataset.zone));
  });
}

function selectZone(zoneId) {
  document.querySelectorAll('.filter-pill').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.zone === zoneId));
  });
  setZoneFilter(zoneId);
}

async function boot() {
  hydrateFestivalText();
  renderSchedule();
  renderFaq();
  renderFilterBar();
  mountIcons();

  const countdownEl = document.getElementById('countdown');
  initCountdown(countdownEl);

  const map = initMap({
    container: '#map-canvas',
    token: import.meta.env.VITE_MAPBOX_TOKEN,
  });

  if (map) {
    const geojson = await fetchBands();
    setBandData(geojson);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', boot);
} else {
  boot();
}
