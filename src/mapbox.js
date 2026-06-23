import mapboxgl from 'mapbox-gl';
import {
  MAP_DEFAULTS,
  ZONE_COLORS,
  DEFAULT_MARKER_COLOR,
  INFO_BOOTHS,
} from './constants.js';

const DESKTOP_BREAKPOINT = 768;
const SOURCE_ID = 'bands';
const LAYER_ID = 'band-points';
const LOAD_TIMEOUT_MS = 12000;

let map = null;
let mapReady = false;
let activeZone = 'all';
let searchText = '';
let latestData = { type: 'FeatureCollection', features: [] };

function zoneColorExpression() {
  const expr = ['match', ['get', 'zone']];
  for (const [zone, color] of Object.entries(ZONE_COLORS)) {
    expr.push(zone, color);
  }
  expr.push(DEFAULT_MARKER_COLOR);
  return expr;
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

function setupLayers() {
  if (!map || mapReady) return;
  mapReady = true;

  if (!map.getSource(SOURCE_ID)) {
    map.addSource(SOURCE_ID, { type: 'geojson', data: latestData });
  }

  if (!map.getLayer(LAYER_ID)) {
    map.addLayer({
      id: LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 8, 16, 14],
        'circle-color': zoneColorExpression(),
        'circle-stroke-width': 2.5,
        'circle-stroke-color': '#F5F1E8',
      },
    });
  }

  addInfoBooths();

  map.on('click', LAYER_ID, (e) => {
    if (e.features?.[0]) openDetails(e.features[0]);
  });
  map.on('mouseenter', LAYER_ID, () => (map.getCanvas().style.cursor = 'pointer'));
  map.on('mouseleave', LAYER_ID, () => (map.getCanvas().style.cursor = ''));

  applyFilter();
  if (latestData.features.length) fitToData();
  map.resize();
}

// Returns a Promise<map|null> — resolves when style + layers are ready, or on timeout/error.
export function initMap({ container, token }) {
  const el = typeof container === 'string'
    ? document.querySelector(container)
    : container;

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
      // Belt-and-suspenders: the flex layout can settle (fonts, controls) just
      // after init, leaving Mapbox's canvas sized to a stale/zero box and
      // rendering blank. Resize once now and again on the next frame.
      map.resize();
      requestAnimationFrame(() => map?.resize());
      finish(map);
    });

    // Keep the GL canvas locked to its container size for the life of the map.
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

    // Safety net: if 'load' never fires, try anyway after timeout.
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

function addInfoBooths() {
  for (const booth of INFO_BOOTHS) {
    const node = document.createElement('div');
    node.className = 'info-booth-marker';
    node.title = `${booth.name} — ${booth.note}`;
    node.textContent = 'i';
    new mapboxgl.Marker({ element: node, anchor: 'center' })
      .setLngLat(booth.coords)
      .setPopup(
        new mapboxgl.Popup({ offset: 16, closeButton: false }).setHTML(
          `<strong>${esc(booth.name)}</strong><br>${esc(booth.note)}`
        )
      )
      .addTo(map);
  }
}

export function setBandData(geojson) {
  latestData = geojson || latestData;
  if (!map) return;
  if (!mapReady) return; // will apply on setupLayers via latestData
  const src = map.getSource(SOURCE_ID);
  if (src) {
    src.setData(latestData);
    fitToData();
  }
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

export function setZoneFilter(zoneId) {
  activeZone = zoneId || 'all';
  applyFilter();
}

export function setSearchFilter(text) {
  searchText = (text || '').trim().toLowerCase();
  applyFilter();
}

function applyFilter() {
  if (!map || !map.getLayer(LAYER_ID)) return;
  const clauses = ['all'];
  if (activeZone !== 'all') {
    clauses.push(['==', ['get', 'zone'], activeZone]);
  }
  if (searchText) {
    clauses.push(['>=', ['index-of', searchText, ['downcase', ['coalesce', ['get', 'name'], '']]], 0]);
  }
  map.setFilter(LAYER_ID, clauses.length > 1 ? clauses : null);
}

function openDetails(feature) {
  const html = detailHTML(feature.properties || {}, feature.geometry.coordinates);
  if (window.innerWidth >= DESKTOP_BREAKPOINT) {
    new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: '340px', className: 'band-popup' })
      .setLngLat(feature.geometry.coordinates)
      .setHTML(html)
      .addTo(map);
  } else {
    openBottomSheet(html);
  }
}

function detailHTML(p, coords) {
  const [lng, lat] = coords || [];
  const time = [p.time_start, p.time_end].filter(Boolean).join(' – ');
  const directions = Number.isFinite(lat) && Number.isFinite(lng)
    ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
    : null;
  const img = p.image || p.photo;

  return `<div class="detail">
    ${img ? `<div class="detail__media"><img class="detail__img" src="${esc(img)}" alt="" loading="lazy" onerror="this.closest('.detail__media')?.remove()" /></div>` : ''}
    <div class="detail__body">
      ${p.genre ? `<span class="detail__genre">${esc(p.genre)}</span>` : ''}
      <h3 class="detail__name">${esc(p.name) || 'Performer'}</h3>
      ${time ? `<p class="detail__time">${esc(time)}${p.zone ? ` · Zone ${esc(p.zone)}` : ''}</p>` : ''}
      ${p.address ? `<p class="detail__addr">${esc(p.address)}</p>` : ''}
      ${p.description ? `<p class="detail__desc">${esc(p.description)}</p>` : ''}
      <div class="detail__actions">
        ${directions ? `<a class="detail__btn" href="${directions}" target="_blank" rel="noopener">Get directions</a>` : ''}
        ${p.link ? `<a class="detail__btn detail__btn--ghost" href="${esc(p.link)}" target="_blank" rel="noopener">Listen</a>` : ''}
      </div>
    </div>
  </div>`;
}

function openBottomSheet(html) {
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
    sheet.querySelector('.bottom-sheet__close').addEventListener('click', closeBottomSheet);
    sheet.addEventListener('click', (e) => {
      if (e.target === sheet) closeBottomSheet();
    });
  }
  sheet.querySelector('.bottom-sheet__body').innerHTML = html;
  requestAnimationFrame(() => sheet.classList.add('is-open'));
}

function closeBottomSheet() {
  document.querySelector('.bottom-sheet')?.classList.remove('is-open');
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
