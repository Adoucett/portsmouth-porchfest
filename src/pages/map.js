import 'mapbox-gl/dist/mapbox-gl.css';
import {
  initMap,
  setBandData,
  setZoneFilter,
  setSearchFilter,
  focusBand,
} from '../mapbox.js';
import { initSite } from '../site.js';
import { ZONES, ZONE_COLORS, DEFAULT_MARKER_COLOR, MAPBOX_TOKEN } from '../constants.js';
import { fetchBands, rowsToGeoJSON } from '../data.js';
import { SAMPLE_BANDS } from '../sample-data.js';

initSite();

// Lock this page to the viewport (no vertical scroll) so visitors land directly
// on the map. Scoped to the map route only via this body class.
document.body.classList.add('map-route');

let bands = []; // GeoJSON features, for the search results list
let activeZone = 'all'; // mirrors the zone pills so the list matches the dots

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
      activeZone = btn.dataset.zone;
      setZoneFilter(activeZone);
      // keep an open results list in sync with the chosen zone
      const list = document.getElementById('map-results');
      const input = document.getElementById('band-search');
      if (list && input && !list.hidden) renderResults(input.value.trim().toLowerCase(), list);
    });
  });
}

// ------------------------------------------------------------ search + results

function neighborhoodFor(zone) {
  const z = ZONES.find((x) => x.id === String(zone));
  return z ? z.neighborhood : '';
}

function timeToMinutes(t) {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(t || '');
  if (!m) return 9999;
  let h = +m[1] % 12;
  if (/pm/i.test(m[3] || '')) h += 12;
  return h * 60 + +m[2];
}

function matches(props, q) {
  const hay = [
    props.name,
    props.genre,
    props.address,
    neighborhoodFor(props.zone),
    props.zone ? `zone ${props.zone}` : '',
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return hay.includes(q);
}

function wireSearch() {
  const input = document.getElementById('band-search');
  const list = document.getElementById('map-results');
  if (!input || !list) return;

  const update = () => {
    const q = input.value.trim().toLowerCase();
    setSearchFilter(input.value); // keep the dot filter in sync
    renderResults(q, list);
  };

  input.addEventListener('input', update);
  input.addEventListener('focus', update);

  // Dismiss the list on outside click / Escape (but not when clicking a result).
  document.addEventListener('click', (e) => {
    if (!list.contains(e.target) && e.target !== input) hideResults(list);
  });
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      input.value = '';
      setSearchFilter('');
      hideResults(list);
      input.blur();
    }
  });
}

function hideResults(list) {
  list.hidden = true;
  list.innerHTML = '';
}

function renderResults(q, list) {
  const results = bands
    .map((f) => f.properties && { f, p: f.properties })
    .filter(Boolean)
    .filter(({ p }) => activeZone === 'all' || String(p.zone) === activeZone)
    .filter(({ p }) => (q ? matches(p, q) : true))
    .sort((a, b) => {
      const z = String(a.p.zone || '~').localeCompare(String(b.p.zone || '~'));
      return z !== 0 ? z : timeToMinutes(a.p.time_start) - timeToMinutes(b.p.time_start);
    });

  if (!results.length) {
    list.hidden = false;
    list.innerHTML = `<p class="map-results__empty">${
      q ? 'No performers match that search.' : 'No performers listed yet.'
    }</p>`;
    return;
  }

  list.hidden = false;
  list.innerHTML =
    `<p class="map-results__head">${results.length} ${results.length === 1 ? 'result' : 'results'}</p>` +
    results
      .map(({ p }, i) => {
        const color = ZONE_COLORS[String(p.zone)] || DEFAULT_MARKER_COLOR;
        const time = [p.time_start, p.time_end].filter(Boolean).join('–');
        const meta = [p.genre, time, neighborhoodFor(p.zone)].filter(Boolean).join(' · ');
        return `
        <button class="map-result" type="button" data-idx="${i}">
          <span class="map-result__dot" style="background:${color}"></span>
          <span class="map-result__text">
            <span class="map-result__name">${esc(p.name) || 'Performer'}</span>
            ${meta ? `<span class="map-result__meta">${esc(meta)}</span>` : ''}
            ${p.address ? `<span class="map-result__addr">${esc(p.address)}</span>` : ''}
          </span>
        </button>`;
      })
      .join('');

  list.querySelectorAll('.map-result').forEach((btn) => {
    btn.addEventListener('click', () => {
      const { f } = results[Number(btn.dataset.idx)];
      focusBand(f);
      hideResults(list);
    });
  });
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

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

async function boot() {
  renderScheduleStrip();
  renderFilterBar();
  wireSearch();
  setLoading(true);

  const token = MAPBOX_TOKEN;

  try {
    const map = await initMap({ container: '#map-canvas', token });
    setLoading(false);

    if (!map) return;

    // Load band data — live sheet first, sample fallback.
    let geojson = await fetchBands();
    if (!geojson.features.length) {
      geojson = rowsToGeoJSON(SAMPLE_BANDS);
    }
    bands = geojson.features;
    setBandData(geojson);
    // Final resize after layout has fully settled with data/controls in place.
    requestAnimationFrame(() => map.resize());
  } catch (err) {
    console.error('[map page]', err);
    showFatalError(err.message || 'Unknown error — check browser console.');
  }
}

boot();
