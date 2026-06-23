import 'mapbox-gl/dist/mapbox-gl.css';
import {
  initMap,
  setBandData,
  setZoneFilter,
  setSearchFilter,
} from '../mapbox.js';
import { initSite } from '../site.js';
import { ZONES } from '../constants.js';
import { fetchBands, rowsToGeoJSON } from '../data.js';
import { SAMPLE_BANDS } from '../sample-data.js';

initSite();

// Lock this page to the viewport (no vertical scroll) so visitors land directly
// on the map. Scoped to the map route only via this body class.
document.body.classList.add('map-route');

function renderScheduleStrip() {
  const strip = document.getElementById('schedule-strip');
  if (!strip) return;
  strip.innerHTML = ZONES.map(
    (z) => `
    <div class="sched-chip">
      <span class="sched-chip__dot" style="background:${z.color}"></span>
      <span class="sched-chip__name">${z.name}</span>
      <span class="sched-chip__time">${z.time}</span>
    </div>`
  ).join('');
}

function renderFilterBar() {
  const bar = document.getElementById('zone-pills');
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
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-pill').forEach((b) => {
        b.setAttribute('aria-pressed', String(b.dataset.zone === btn.dataset.zone));
      });
      setZoneFilter(btn.dataset.zone);
    });
  });
}

function wireSearch() {
  const input = document.getElementById('band-search');
  if (!input) return;
  input.addEventListener('input', () => setSearchFilter(input.value));
}

function setLoading(on) {
  const el = document.getElementById('map-loading');
  if (el) el.hidden = !on;
}

function showFatalError(msg) {
  setLoading(false);
  const canvas = document.getElementById('map-canvas');
  if (!canvas) return;
  canvas.innerHTML = `
    <div class="map-notice">
      <div class="map-notice__card">
        <h3>Map failed to load</h3>
        <p>${msg}</p>
      </div>
    </div>`;
}

async function boot() {
  renderScheduleStrip();
  renderFilterBar();
  wireSearch();
  setLoading(true);

  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  try {
    const map = await initMap({ container: '#map-canvas', token });
    setLoading(false);

    if (!map) return;

    // Load band data — live sheet first, sample fallback.
    let geojson = await fetchBands();
    if (!geojson.features.length) {
      geojson = rowsToGeoJSON(SAMPLE_BANDS);
    }
    setBandData(geojson);
    // Final resize after layout has fully settled with data/controls in place.
    requestAnimationFrame(() => map.resize());
  } catch (err) {
    console.error('[map page]', err);
    showFatalError(err.message || 'Unknown error — check browser console.');
  }
}

boot();
