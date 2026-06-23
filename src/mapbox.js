import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAP_DEFAULTS,
  ZONE_COLORS,
  DEFAULT_MARKER_COLOR,
  INFO_BOOTHS,
} from './constants.js';

const DESKTOP_BREAKPOINT = 768;
const SOURCE_ID = 'bands';
const LAYER_ID = 'band-points';
const LABEL_ID = 'band-labels';

let map = null;
let activeZone = 'all';
let searchText = '';
let latestData = { type: 'FeatureCollection', features: [] };

// Builds a Mapbox "match" expression so each point is colored by its zone.
function zoneColorExpression() {
  const expr = ['match', ['get', 'zone']];
  for (const [zone, color] of Object.entries(ZONE_COLORS)) {
    expr.push(zone, color);
  }
  expr.push(DEFAULT_MARKER_COLOR);
  return expr;
}

// Renders a non-blocking overlay when the Mapbox token is missing/invalid.
function showTokenNotice(container) {
  const el = document.createElement('div');
  el.className = 'map-notice';
  el.innerHTML = `
    <div class="map-notice__card">
      <h3>Map needs a Mapbox token</h3>
      <p>Add your public token to <code>.env</code> as
      <code>VITE_MAPBOX_TOKEN</code>, then restart the dev server.</p>
    </div>`;
  container.appendChild(el);
}

export function initMap({ container, token }) {
  const el = typeof container === 'string'
    ? document.querySelector(container)
    : container;
  if (!el) {
    console.error('[map] container not found:', container);
    return null;
  }
  // Guarantee the container has height before Mapbox measures it.
  // Mapbox silently produces a blank canvas if the element is 0px tall.
  if (!el.offsetHeight) {
    el.style.height = '100svh';
  }

  if (!token || !token.startsWith('pk.') || token.includes('your_public_token')) {
    showTokenNotice(el);
    return null;
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
    });
  } catch (err) {
    console.error('[map] mapboxgl.Map constructor failed:', err);
    showTokenNotice(el);
    return null;
  }

  map.on('error', (e) => console.error('[map] runtime error:', e.error));

  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-right');
  map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), 'top-right');
  map.addControl(new mapboxgl.GeolocateControl({
    positionOptions: { enableHighAccuracy: true },
    trackUserLocation: true,
    showUserHeading: true,
  }), 'top-right');

  map.on('load', () => {
    map.addSource(SOURCE_ID, { type: 'geojson', data: latestData });

    map.addLayer({
      id: LAYER_ID,
      type: 'circle',
      source: SOURCE_ID,
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 12, 6, 16, 11],
        'circle-color': zoneColorExpression(),
        'circle-stroke-width': 2,
        'circle-stroke-color': '#F5F1E8',
      },
    });

    map.addLayer({
      id: LABEL_ID,
      type: 'symbol',
      source: SOURCE_ID,
      minzoom: 14,
      layout: {
        'text-field': ['get', 'name'],
        'text-size': 12,
        'text-offset': [0, 1.2],
        'text-anchor': 'top',
        'text-font': ['DIN Pro Medium', 'DIN Offc Pro Medium', 'Arial Unicode MS Regular'],
      },
      paint: {
        'text-color': '#1a1a18',
        'text-halo-color': '#F5F1E8',
        'text-halo-width': 1.5,
      },
    });

    addInfoBooths();

    map.on('click', LAYER_ID, (e) => openDetails(e.features[0]));
    map.on('mouseenter', LAYER_ID, () => (map.getCanvas().style.cursor = 'pointer'));
    map.on('mouseleave', LAYER_ID, () => (map.getCanvas().style.cursor = ''));

    applyFilter();
    fitToData();
  });

  return map;
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
  if (map && map.getSource(SOURCE_ID)) {
    map.getSource(SOURCE_ID).setData(latestData);
    fitToData();
  }
}

function fitToData() {
  if (!map) return;
  const feats = latestData.features;
  if (!feats.length) return;
  const bounds = new mapboxgl.LngLatBounds();
  feats.forEach((f) => bounds.extend(f.geometry.coordinates));
  map.fitBounds(bounds, { padding: 72, maxZoom: 15.5, duration: 700 });
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
  const filter = clauses.length > 1 ? clauses : null;
  map.setFilter(LAYER_ID, filter);
  map.setFilter(LABEL_ID, filter);
}

// Detail UI: bottom sheet on mobile, anchored popup on desktop.
function openDetails(feature) {
  const html = detailHTML(feature.properties || {}, feature.geometry.coordinates);
  if (window.innerWidth >= DESKTOP_BREAKPOINT) {
    new mapboxgl.Popup({ offset: 14, closeButton: true, maxWidth: '320px' })
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

  const parts = [
    img && `<img class="detail__img" src="${esc(img)}" alt="" loading="lazy" onerror="this.remove()" />`,
    `<div class="detail__body">`,
    p.genre && `<span class="detail__genre">${esc(p.genre)}</span>`,
    `<h3 class="detail__name">${esc(p.name) || 'Performer'}</h3>`,
    time && `<p class="detail__time">${esc(time)}${p.zone ? ` · Zone ${esc(p.zone)}` : ''}</p>`,
    p.address && `<p class="detail__addr">${esc(p.address)}</p>`,
    p.description && `<p class="detail__desc">${esc(p.description)}</p>`,
    `<div class="detail__actions">`,
    directions && `<a class="detail__btn" href="${directions}" target="_blank" rel="noopener">Get directions</a>`,
    p.link && `<a class="detail__btn detail__btn--ghost" href="${esc(p.link)}" target="_blank" rel="noopener">Listen</a>`,
    `</div>`,
    `</div>`,
  ];

  return `<div class="detail">${parts.filter(Boolean).join('')}</div>`;
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
  const sheet = document.querySelector('.bottom-sheet');
  if (sheet) sheet.classList.remove('is-open');
}

// Minimal HTML escaping for sheet-sourced strings.
function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
