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

function setLoading(on) {
  const el = document.getElementById('map-loading');
  if (el) el.hidden = !on;
}

async function boot() {
  renderScheduleStrip();
  renderFilterBar();
  wireSearch();
  setLoading(true);

  try {
    mapApi = await import('../mapbox.js');
    const map = await mapApi.initMap({
      container: '#map-canvas',
      token: import.meta.env.VITE_MAPBOX_TOKEN,
    });

    if (!map) {
      setLoading(false);
      return;
    }

    // Map is fully loaded — paint data.
    const liveGeojson = await fetchBands();
    const geojson = liveGeojson.features.length
      ? liveGeojson
      : rowsToGeoJSON(SAMPLE_BANDS);

    mapApi.setBandData(geojson);
    setLoading(false);
  } catch (err) {
    console.error('[map page] boot failed:', err);
    setLoading(false);
    const canvas = document.getElementById('map-canvas');
    if (canvas) {
      canvas.innerHTML = `<div class="map-notice"><div class="map-notice__card"><h3>Map failed to load</h3><p>${err.message}</p></div></div>`;
    }
  }
}

boot();
