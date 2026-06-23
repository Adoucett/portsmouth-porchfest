import { initSite } from '../site.js';
import { ZONES } from '../constants.js';
import { fetchBands, rowsToGeoJSON } from '../data.js';
import { SAMPLE_BANDS } from '../sample-data.js';

initSite();

let mapApi = null;

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
    btn.addEventListener('click', () => selectZone(btn.dataset.zone));
  });
}

function selectZone(zoneId) {
  document.querySelectorAll('.filter-pill').forEach((btn) => {
    btn.setAttribute('aria-pressed', String(btn.dataset.zone === zoneId));
  });
  mapApi?.setZoneFilter(zoneId);
}

function wireSearch() {
  const input = document.getElementById('band-search');
  if (!input) return;
  input.addEventListener('input', () => mapApi?.setSearchFilter(input.value));
}

function showSampleNotice() {
  const host = document.getElementById('map-status');
  if (!host) return;
  host.hidden = false;
  host.innerHTML = `
    <strong>Preview data.</strong> These are sample performers. Publish the
    Google Sheet (File → Share → Publish to web → CSV) and the real lineup
    appears here automatically — no code changes needed.`;
}

async function boot() {
  renderScheduleStrip();
  renderFilterBar();

  // Dynamically import Mapbox so its ~500KB only loads on this page.
  mapApi = await import('../mapbox.js');
  const map = mapApi.initMap({
    container: '#map-canvas',
    token: import.meta.env.VITE_MAPBOX_TOKEN,
  });

  wireSearch();

  if (!map) return; // token missing — notice already shown by initMap

  // Live sheet first; fall back to sample data until the sheet is published.
  let geojson = await fetchBands();
  if (!geojson.features.length) {
    geojson = rowsToGeoJSON(SAMPLE_BANDS);
    showSampleNotice();
  }
  mapApi.setBandData(geojson);
}

boot();
