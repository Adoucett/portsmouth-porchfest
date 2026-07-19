import mapboxgl from 'mapbox-gl';
import {
  MAP_DEFAULTS,
  ZONE_COLORS,
  ZONES,
  DEFAULT_MARKER_COLOR,
  INFO_BOOTHS,
  THEME,
} from './constants.js';

const DESKTOP_BREAKPOINT = 768;
const SRC_BANDS = 'bands';
const LYR_BANDS = 'band-points';
const LYR_BAND_HALO = 'band-halo';
const SRC_ZONES = 'zone-fills';
const LYR_ZONE_FILL = 'zone-fill';
const LYR_ZONE_LINE = 'zone-line';
const SATELLITE_STYLE = 'mapbox://styles/mapbox/satellite-streets-v12';
const LOAD_TIMEOUT_MS = 12000;

let basemap = 'map'; // 'map' (custom Studio style) | 'satellite' (hybrid imagery)

let map = null;
let mapReady = false;
let activeZone = 'all';
let searchText = '';
let latestData = emptyFC();
let hover = null; // { source, id }
let tooltip = null;

function emptyFC() {
  return { type: 'FeatureCollection', features: [] };
}

function zoneColorExpression() {
  const expr = ['match', ['get', 'zone']];
  for (const [zone, color] of Object.entries(ZONE_COLORS)) {
    expr.push(zone, color);
  }
  expr.push(DEFAULT_MARKER_COLOR);
  return expr;
}

function zoneLabel(zoneId) {
  const z = ZONES.find((x) => x.id === String(zoneId));
  return z ? `${z.name} · ${z.neighborhood}` : zoneId ? `Zone ${zoneId}` : '';
}

function showMapMessage(container, title, body) {
  container.innerHTML = '';
  const el = document.createElement('div');
  el.className = 'map-notice';
  el.innerHTML = `
    <div class="map-notice__card">
      <h3>${title}</h3>
      <p>${body}</p>
    </div>`;
  container.appendChild(el);
}

// ---------------------------------------------------------------- layer setup

function setupLayers() {
  if (!map || mapReady) return;

  addDataLayers();
  // Info booths are DOM markers — they persist across setStyle, so add once.
  addInfoBooths();
  applyMaritimeTint();
  // Layer-id-delegated handlers persist across setStyle, so wire once.
  wireInteractions();
  mapReady = true;
  if (latestData.features.length) fitToData();
  map.resize();
}

// Adds the custom sources + layers. Re-run after every setStyle() (basemap
// switch) because changing the style wipes non-style sources/layers. Idempotent.
function addDataLayers() {
  if (!map.getSource(SRC_ZONES)) {
    map.addSource(SRC_ZONES, { type: 'geojson', data: emptyFC() });
  }
  if (!map.getLayer(LYR_ZONE_FILL)) {
    map.addLayer({
      id: LYR_ZONE_FILL,
      type: 'fill',
      source: SRC_ZONES,
      paint: { 'fill-color': zoneColorExpression(), 'fill-opacity': 0.08 },
    });
  }
  if (!map.getLayer(LYR_ZONE_LINE)) {
    map.addLayer({
      id: LYR_ZONE_LINE,
      type: 'line',
      source: SRC_ZONES,
      paint: {
        'line-color': zoneColorExpression(),
        'line-opacity': 0.4,
        'line-width': 1.5,
        'line-dasharray': [2, 1.5],
      },
    });
  }

  if (!map.getSource(SRC_BANDS)) {
    map.addSource(SRC_BANDS, { type: 'geojson', data: latestData, generateId: true });
  }
  // Dark contrast halo beneath the dots — invisible on the paper map, faded in
  // over satellite imagery so the coloured dots stay readable.
  if (!map.getLayer(LYR_BAND_HALO)) {
    map.addLayer({
      id: LYR_BAND_HALO,
      type: 'circle',
      source: SRC_BANDS,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 9, 16, 18],
        'circle-color': '#14140f',
        'circle-opacity': 0,
        'circle-blur': 0.4,
      },
    });
  }
  // Band performers — coloured by zone, with a hover grow via feature-state.
  if (!map.getLayer(LYR_BANDS)) {
    map.addLayer({
      id: LYR_BANDS,
      type: 'circle',
      source: SRC_BANDS,
      paint: {
        'circle-radius': [
          'interpolate',
          ['linear'],
          ['zoom'],
          12,
          ['case', ['boolean', ['feature-state', 'hover'], false], 8, 6],
          16,
          ['case', ['boolean', ['feature-state', 'hover'], false], 17, 12],
        ],
        'circle-color': zoneColorExpression(),
        'circle-stroke-width': ['case', ['boolean', ['feature-state', 'hover'], false], 3.5, 2.5],
        'circle-stroke-color': '#F5F1E8',
        'circle-opacity': 0.95,
      },
    });
  }

  const src = map.getSource(SRC_BANDS);
  if (src) src.setData(latestData);
  updateZoneFills();
  applyFilter();
  applyBasemapStyling();
}

// Boost dot contrast over satellite imagery; revert to the paper styling on map.
function applyBasemapStyling() {
  if (!map || !map.getLayer(LYR_BANDS)) return;
  const sat = basemap === 'satellite';
  if (map.getLayer(LYR_BAND_HALO)) {
    map.setPaintProperty(LYR_BAND_HALO, 'circle-opacity', sat ? 0.5 : 0);
  }
  map.setPaintProperty(LYR_BANDS, 'circle-stroke-color', sat ? '#ffffff' : '#F5F1E8');
  map.setPaintProperty(LYR_BANDS, 'circle-stroke-width', [
    'case',
    ['boolean', ['feature-state', 'hover'], false],
    sat ? 4.5 : 3.5,
    sat ? 3 : 2.5,
  ]);
}

export function getBasemap() {
  return basemap;
}

export function toggleBasemap() {
  return setBasemap(basemap === 'satellite' ? 'map' : 'satellite');
}

// Swap the basemap. setStyle() wipes our custom layers, so we re-add them on the
// new style's load. Returns the active basemap.
export function setBasemap(mode) {
  if (!map || mode === basemap) return basemap;
  const url = mode === 'satellite' ? SATELLITE_STYLE : MAP_DEFAULTS.style;
  if (!url) return basemap;
  basemap = mode;
  map.setStyle(url);
  map.once('style.load', () => {
    addDataLayers();
    if (mode === 'map') applyMaritimeTint();
  });
  return basemap;
}

// Light maritime nudge: tint the base style's water layers toward harbor blue.
// Proof-of-concept for the 2026 nautical direction — guarded so it no-ops if the
// active style has no matching water layers. Swap for a real Studio style later.
function applyMaritimeTint() {
  const tint = THEME.mapWaterTint;
  if (!tint || !map) return;
  try {
    for (const layer of map.getStyle().layers || []) {
      if (layer.type === 'fill' && /water/i.test(layer.id) && !/label/i.test(layer.id)) {
        map.setPaintProperty(layer.id, 'fill-color', tint);
      }
    }
  } catch {
    /* style has no tintable water layers — leave it as-is */
  }
}

// Info booths as DOM "i" markers. Always drawn as their own icon — even when a
// band shares the address — nudged NE in screen space so they never sit under
// a band circle.
const INFO_BOOTH_OFFSET = [16, -16]; // px [x, y]; positive x = right, negative y = up

function addInfoBooths() {
  for (const booth of INFO_BOOTHS) {
    const node = document.createElement('button');
    node.type = 'button';
    node.className = 'info-booth-marker';
    node.title = `${booth.name} — ${booth.note}`;
    node.setAttribute('aria-label', `${booth.name}. ${booth.note}`);
    node.textContent = 'i';
    node.addEventListener('click', (ev) => {
      ev.stopPropagation();
      const boothItem = {
        kind: 'booth',
        props: { name: booth.name, note: booth.note },
        coords: booth.coords,
      };
      // include any bands playing at this same address
      openDetails([...bandsAtCoord(booth.coords), boothItem]);
    });
    new mapboxgl.Marker({
      element: node,
      anchor: 'center',
      offset: INFO_BOOTH_OFFSET,
    })
      .setLngLat(booth.coords)
      .addTo(map);
  }
}

// ------------------------------------------------------------- interactions

function wireInteractions() {
  map.on('mousemove', LYR_BANDS, (e) => {
    map.getCanvas().style.cursor = 'pointer';
    const f = e.features && e.features[0];
    if (!f) return;
    if (!hover || hover.id !== f.id) {
      clearHover();
      hover = { source: SRC_BANDS, id: f.id };
      map.setFeatureState(hover, { hover: true });
    }
    showTooltip(f);
  });
  map.on('mouseleave', LYR_BANDS, () => {
    map.getCanvas().style.cursor = '';
    clearHover();
    hideTooltip();
  });

  map.on('click', (e) => {
    const feats = map.queryRenderedFeatures(e.point, { layers: [LYR_BANDS] });
    if (!feats.length) {
      closePanel();
      return;
    }
    // Expand to every act at this porch (coincident markers stack into one dot).
    const first = feats[0];
    openDetails(dedupe(bandsAtCoord(first.geometry.coordinates)));
  });

  document.getElementById('map-panel-close')?.addEventListener('click', closePanel);
}

function clearHover() {
  if (hover) {
    map.setFeatureState(hover, { hover: false });
    hover = null;
  }
}

function toItem(feature) {
  const props = feature.properties || {};
  return {
    kind: props.kind === 'booth' ? 'booth' : 'band',
    props,
    coords: feature.geometry.coordinates,
  };
}

function dedupe(items) {
  const seen = new Set();
  // Booths first, then bands, so an info booth leads a shared-address list.
  return items
    .sort((a, b) => (a.kind === 'booth' ? -1 : 0) - (b.kind === 'booth' ? -1 : 0))
    .filter((it) => {
      const key = `${it.kind}|${it.props.name || ''}|${(it.coords || []).join(',')}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

// ------------------------------------------------------------------- tooltip

// Hover: stacked list of every act at this porch (name + set time), ordered by
// set time. Single-act porches render as one row.
function showTooltip(f) {
  const items = bandsAtCoord(f.geometry.coordinates)
    .filter((it) => it.kind !== 'booth')
    .sort(
      (a, b) => timeToMinutes(a.props.time_start) - timeToMinutes(b.props.time_start)
    );

  const rows = (items.length ? items : [toItem(f)]).map((it) => {
    const p = it.props || {};
    const name = p.name || 'Performer';
    const time = [p.time_start, p.time_end].filter(Boolean).join('–');
    return `<div class="band-tooltip__row">
      <strong>${esc(name)}</strong>
      ${time ? `<span>${esc(time)}</span>` : ''}
    </div>`;
  });

  if (!tooltip) {
    tooltip = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      className: 'band-tooltip',
    });
  }
  tooltip
    .setLngLat(f.geometry.coordinates)
    .setHTML(rows.join(''))
    .addTo(map);
}

function hideTooltip() {
  if (tooltip) tooltip.remove();
}

// --------------------------------------------------------------- detail views

// Decide between the desktop side panel and the mobile bottom sheet.
function openDetails(items) {
  hideTooltip();
  if (window.innerWidth >= DESKTOP_BREAKPOINT) openPanel(items);
  else openSheet(items);
}

// One act → its detail. Multiple acts at a venue → a stacked venue view: the
// address, then each performer's card ordered by set time (info booth last).
function renderContent(container, items) {
  if (items.length === 1) {
    container.innerHTML = detailHTML(items[0]);
    return;
  }
  const sorted = [...items].sort((a, b) => {
    if (a.kind === 'booth') return 1;
    if (b.kind === 'booth') return -1;
    return timeToMinutes(a.props.time_start) - timeToMinutes(b.props.time_start);
  });
  const address = sorted.find((it) => it.props && it.props.address)?.props.address || '';
  const setCount = sorted.filter((it) => it.kind !== 'booth').length;
  container.innerHTML = `
    <div class="venue">
      <div class="venue__head">
        <span class="detail__genre">${setCount} ${setCount === 1 ? 'set' : 'sets'} at this porch</span>
        ${address ? `<h3 class="venue__addr">${esc(address)}</h3>` : ''}
      </div>
      <div class="venue__list">
        ${sorted.map((it) => detailHTML(it, { hideAddress: true })).join('')}
      </div>
    </div>`;
}

function detailHTML(item, opts = {}) {
  const p = item.props || {};

  if (item.kind === 'booth') {
    return `<div class="detail">
      <div class="detail__body">
        <span class="detail__genre">Information</span>
        <h3 class="detail__name">${esc(p.name) || 'Info booth'}</h3>
        ${p.note ? `<p class="detail__time">${esc(p.note)}</p>` : ''}
        <p class="detail__desc">Stop by for printed schedules, maps, and a friendly volunteer.</p>
      </div>
    </div>`;
  }

  const [lng, lat] = item.coords || [];
  const time = [p.time_start, p.time_end].filter(Boolean).join(' – ');
  const directions =
    Number.isFinite(lat) && Number.isFinite(lng)
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=walking`
      : null;
  return `<div class="detail">
    ${mediaHTML(collectImages(p))}
    <div class="detail__body">
      ${p.genre ? `<span class="detail__genre">${esc(p.genre)}</span>` : ''}
      <h3 class="detail__name">${esc(p.name) || 'Performer'}</h3>
      ${time ? `<p class="detail__time">${esc(time)}${p.zone ? ` · ${esc(zoneLabel(p.zone))}` : ''}</p>` : ''}
      ${p.address && !opts.hideAddress ? `<p class="detail__addr">${esc(p.address)}</p>` : ''}
      ${p.description ? `<p class="detail__desc">${esc(p.description)}</p>` : ''}
      <div class="detail__actions">
        ${directions ? `<a class="detail__btn" href="${directions}" target="_blank" rel="noopener">Walking directions</a>` : ''}
        ${p.link ? `<a class="detail__btn detail__btn--ghost" href="${esc(p.link)}" target="_blank" rel="noopener">Band page ↗</a>` : ''}
      </div>
    </div>
  </div>`;
}

// Gather a band's photos from image, image_2…image_6, and an optional comma/
// pipe/newline-separated `images` column. Deduped, in order.
function collectImages(p) {
  const out = [];
  const push = (v) => {
    const s = String(v ?? '').trim();
    if (s) out.push(s);
  };
  push(p.image || p.photo);
  for (let n = 2; n <= 6; n++) push(p['image_' + n]);
  if (p.images) String(p.images).split(/[|,\n]/).forEach(push);
  return [...new Set(out)];
}

// 0 → nothing, 1 → single image, 2+ → a carousel (wired up by initCarousels).
function mediaHTML(imgs) {
  if (!imgs.length) return '';
  if (imgs.length === 1) {
    return `<div class="detail__media"><img class="detail__img" src="${esc(
      imgs[0]
    )}" alt="" loading="lazy" onerror="this.closest('.detail__media')?.remove()" /></div>`;
  }
  return `<div class="carousel" data-carousel>
    <div class="carousel__track">
      ${imgs
        .map(
          (u) =>
            `<img class="carousel__img" src="${esc(u)}" alt="" loading="lazy" onerror="this.style.visibility='hidden'" />`
        )
        .join('')}
    </div>
    <button class="carousel__btn carousel__btn--prev" type="button" aria-label="Previous photo">‹</button>
    <button class="carousel__btn carousel__btn--next" type="button" aria-label="Next photo">›</button>
    <div class="carousel__dots">
      ${imgs
        .map(
          (_, i) =>
            `<button class="carousel__dot${i === 0 ? ' is-active' : ''}" type="button" data-i="${i}" aria-label="Photo ${i + 1}"></button>`
        )
        .join('')}
    </div>
  </div>`;
}

// Wire any carousels inside a freshly-rendered container (arrows, dots, swipe).
function initCarousels(root) {
  root.querySelectorAll('[data-carousel]').forEach((c) => {
    if (c.dataset.init) return;
    c.dataset.init = '1';
    const track = c.querySelector('.carousel__track');
    const dots = [...c.querySelectorAll('.carousel__dot')];
    const n = track.children.length;
    let i = 0;
    const go = (to) => {
      i = (to + n) % n;
      track.style.transform = `translateX(-${i * 100}%)`;
      dots.forEach((d, di) => d.classList.toggle('is-active', di === i));
    };
    c.querySelector('.carousel__btn--prev').addEventListener('click', (e) => {
      e.stopPropagation();
      go(i - 1);
    });
    c.querySelector('.carousel__btn--next').addEventListener('click', (e) => {
      e.stopPropagation();
      go(i + 1);
    });
    dots.forEach((d) =>
      d.addEventListener('click', (e) => {
        e.stopPropagation();
        go(Number(d.dataset.i));
      })
    );
    let x0 = null;
    track.addEventListener('touchstart', (e) => { x0 = e.touches[0].clientX; }, { passive: true });
    track.addEventListener('touchend', (e) => {
      if (x0 == null) return;
      const dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 40) go(i + (dx < 0 ? 1 : -1));
      x0 = null;
    });
    go(0);
  });
}

// Desktop: left-side panel overlay.
function openPanel(items) {
  const panel = document.getElementById('map-panel');
  const body = document.getElementById('map-panel-body');
  if (!panel || !body) return;
  renderContent(body, items);
  initCarousels(body);
  body.scrollTop = 0;
  panel.classList.add('is-open');
}

function closePanel() {
  document.getElementById('map-panel')?.classList.remove('is-open');
}

// Mobile: bottom sheet that slides up.
function openSheet(items) {
  let sheet = document.querySelector('.bottom-sheet');
  if (!sheet) {
    sheet = document.createElement('div');
    sheet.className = 'bottom-sheet';
    sheet.innerHTML = `
      <div class="bottom-sheet__panel" role="dialog" aria-modal="true">
        <div class="bottom-sheet__handle" aria-hidden="true"></div>
        <button class="bottom-sheet__close" aria-label="Close">×</button>
        <div class="bottom-sheet__body"></div>
      </div>`;
    document.body.appendChild(sheet);
    sheet.querySelector('.bottom-sheet__close').addEventListener('click', closeSheet);
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) closeSheet();
    });
  }
  const body = sheet.querySelector('.bottom-sheet__body');
  renderContent(body, items);
  initCarousels(body);
  requestAnimationFrame(() => sheet.classList.add('is-open'));
}

function closeSheet() {
  document.querySelector('.bottom-sheet')?.classList.remove('is-open');
}

// ------------------------------------------------------------------- data/zone

export function setBandData(geojson) {
  latestData = geojson || latestData;
  if (!map || !mapReady) return;
  const src = map.getSource(SRC_BANDS);
  if (src) {
    // One dot per venue: bands sharing an address stack into a single marker and
    // are shown together (time-ordered) in the panel — no fan-out.
    src.setData(latestData);
    updateZoneFills();
    applyFilter();
    fitToData();
  }
}

function coordKey(c) {
  return `${(+c[0]).toFixed(6)},${(+c[1]).toFixed(6)}`;
}

// All band features at a given coordinate (for a venue's stacked list).
function bandsAtCoord(coords) {
  const key = coordKey(coords);
  return latestData.features
    .filter((f) => coordKey(f.geometry.coordinates) === key)
    .map(toItem);
}

function timeToMinutes(t) {
  const m = /(\d{1,2}):(\d{2})\s*(AM|PM)?/i.exec(t || '');
  if (!m) return 99999;
  let h = +m[1] % 12;
  if (/pm/i.test(m[3] || '')) h += 12;
  return h * 60 + +m[2];
}

function fitToData() {
  if (!map) return;
  const feats = latestData.features;
  if (!feats.length) return;
  const bounds = new mapboxgl.LngLatBounds();
  feats.forEach((f) => bounds.extend(f.geometry.coordinates));
  map.fitBounds(bounds, {
    padding: { top: 80, bottom: 80, left: 40, right: 40 },
    maxZoom: 15.5,
    duration: 700,
  });
}

// Build a soft neighborhood blob per zone. We buffer each dot into an octagon
// and hull the union, so even zones whose houses fall in a straight line get a
// proper rounded area instead of a thin sliver. Proof-of-concept overlay — swap
// for hand-drawn zone GeoJSON later.
const ZONE_BUFFER = 0.0009; // ~100m of breathing room around the dots

function updateZoneFills() {
  const src = map.getSource(SRC_ZONES);
  if (!src) return;
  const byZone = {};
  for (const f of latestData.features) {
    const z = String(f.properties?.zone ?? '').trim();
    if (!z) continue;
    (byZone[z] ||= []).push(f.geometry.coordinates);
  }
  const features = [];
  for (const [zone, pts] of Object.entries(byZone)) {
    if (!pts.length) continue;
    const padded = pts.flatMap((p) => bufferRing(p, ZONE_BUFFER));
    let hull = convexHull(padded);
    if (hull.length < 3) continue;
    hull.push(hull[0]);
    features.push({
      type: 'Feature',
      properties: { zone },
      geometry: { type: 'Polygon', coordinates: [hull] },
    });
  }
  src.setData({ type: 'FeatureCollection', features });
}

// 8 points around a coordinate (corrected for longitude shrink at this latitude).
function bufferRing(pt, r) {
  const [lng, lat] = pt;
  const kx = Math.cos((lat * Math.PI) / 180) || 1;
  const ring = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i;
    ring.push([lng + (r / kx) * Math.cos(a), lat + r * Math.sin(a)]);
  }
  return ring;
}

// Andrew's monotone chain convex hull. Points are [lng, lat].
function convexHull(points) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  if (pts.length < 3) return pts;
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lower = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0)
      lower.pop();
    lower.push(p);
  }
  const upper = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0)
      upper.pop();
    upper.push(p);
  }
  upper.pop();
  lower.pop();
  return lower.concat(upper);
}

// ----------------------------------------------------------------- filtering

export function setZoneFilter(zoneId) {
  activeZone = zoneId || 'all';
  applyFilter();
}

export function setSearchFilter(text) {
  searchText = (text || '').trim().toLowerCase();
  applyFilter();
}

// Fly to a band/booth feature and open its detail (side panel on desktop, bottom
// sheet on mobile). Used by the search results list on the map page.
export function focusBand(feature) {
  if (!map || !feature || !feature.geometry) return;
  const coords = feature.geometry.coordinates;
  map.flyTo({ center: coords, zoom: 16, duration: 800, essential: true });
  openDetails(dedupe(bandsAtCoord(coords)));
}

function applyFilter() {
  if (!map || !map.getLayer(LYR_BANDS)) return;
  const clauses = ['all'];
  if (activeZone !== 'all') {
    clauses.push(['==', ['get', 'zone'], activeZone]);
  }
  if (searchText) {
    clauses.push(['>=', ['index-of', searchText, ['downcase', ['coalesce', ['get', 'name'], '']]], 0]);
  }
  map.setFilter(LYR_BANDS, clauses.length > 1 ? clauses : null);
}

// --------------------------------------------------------------------- init

// Returns a Promise<map|null> — resolves when style + layers are ready, or on timeout/error.
export function initMap({ container, token }) {
  const el = typeof container === 'string' ? document.querySelector(container) : container;

  return new Promise((resolve) => {
    let settled = false;
    const finish = (result) => {
      if (settled) return;
      settled = true;
      resolve(result);
    };

    if (!el) {
      console.error('[map] container not found:', container);
      finish(null);
      return;
    }

    if (!token || !token.startsWith('pk.') || token.includes('your_public_token')) {
      showMapMessage(
        el,
        'Mapbox token missing',
        'Set <code>VITE_MAPBOX_TOKEN</code> in Vercel → Settings → Environment Variables (Production + Preview), then redeploy.'
      );
      finish(null);
      return;
    }

    mapboxgl.accessToken = token;

    try {
      map = new mapboxgl.Map({
        container: el,
        style: MAP_DEFAULTS.style,
        center: MAP_DEFAULTS.center,
        zoom: MAP_DEFAULTS.zoom,
        minZoom: MAP_DEFAULTS.minZoom,
        maxZoom: MAP_DEFAULTS.maxZoom,
        maxBounds: MAP_DEFAULTS.maxBounds,
        attributionControl: false,
        touchPitch: false,
      });
    } catch (err) {
      console.error('[map] constructor failed:', err);
      showMapMessage(el, 'Map failed to start', String(err.message || err));
      finish(null);
      return;
    }

    map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
    map.addControl(
      new mapboxgl.GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        trackUserLocation: true,
        showUserHeading: true,
        showAccuracyCircle: true,
      }),
      'top-right'
    );

    map.on('load', () => {
      setupLayers();
      map.resize();
      requestAnimationFrame(() => map?.resize());
      finish(map);
    });

    if ('ResizeObserver' in window) {
      const ro = new ResizeObserver(() => map?.resize());
      ro.observe(el);
    }

    map.on('error', (e) => {
      console.error('[map] error:', e.error);
      const msg = String(e.error?.message || e.error || '');
      if (msg.match(/401|403|Forbidden|Unauthorized/i)) {
        showMapMessage(
          el,
          'Token blocked this domain',
          'Mapbox → Access Tokens → URL restrictions → add <code>https://*.vercel.app</code> and save.'
        );
        finish(null);
      }
    });

    setTimeout(() => {
      if (settled) return;
      console.warn('[map] load timeout — forcing setup');
      if (map?.isStyleLoaded()) {
        setupLayers();
        finish(map);
      } else {
        showMapMessage(
          el,
          'Map timed out',
          'Style failed to load. Check your Mapbox token and URL restrictions, then redeploy.'
        );
        finish(null);
      }
    }, LOAD_TIMEOUT_MS);

    requestAnimationFrame(() => map?.resize());
    window.addEventListener('resize', () => map?.resize());
  });
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
