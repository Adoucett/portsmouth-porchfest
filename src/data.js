import Papa from 'papaparse';
import { SHEET_CSV_URL } from './constants.js';

// Fetches the published Google Sheet CSV and converts rows with valid
// coordinates into a GeoJSON FeatureCollection for Mapbox. Returns an empty
// collection (never throws) so the caller can decide whether to fall back to
// sample data — the map always renders.
export function fetchBands(url = SHEET_CSV_URL) {
  return new Promise((resolve) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: ({ data }) => resolve(rowsToGeoJSON(data)),
      error: (err) => {
        console.warn('[data] Could not load band sheet:', err);
        resolve(emptyCollection());
      },
    });
  });
}

// Converts an array of plain row objects (from the sheet OR sample data) into a
// GeoJSON FeatureCollection. Rows without usable lat/lng are dropped.
export function rowsToGeoJSON(rows) {
  const features = (rows || [])
    .map((row) => {
      const lng = parseFloat(row.lng);
      const lat = parseFloat(row.lat);
      if (!Number.isFinite(lng) || !Number.isFinite(lat)) return null;
      return {
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [lng, lat] },
        properties: {
          ...row,
          zone: String(row.zone ?? '').trim(),
          name: (row.name ?? '').trim(),
        },
      };
    })
    .filter(Boolean);

  return { type: 'FeatureCollection', features };
}

function emptyCollection() {
  return { type: 'FeatureCollection', features: [] };
}
