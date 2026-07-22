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
      // Drop blank spacer rows (valid coords but no name AND no address). These
      // are accidental empty rows in the sheet; keeping them would stack a
      // phantom empty card onto whatever porch shares their coordinates.
      if (!String(row.name ?? '').trim() && !String(row.address ?? '').trim()) return null;
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

// Fetches the published "updates" sheet tab and returns micropost objects
// { date, headline, body }. Resolves to [] on any error so the caller can fall
// back to the static ANNOUNCEMENTS list. Order is preserved (sheet = source of
// truth for ordering — newest first).
export function fetchAnnouncements(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve([]);
      return;
    }
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: ({ data }) => {
        const rows = (data || [])
          .map((r) => ({
            date: (r.date ?? '').trim(),
            headline: (r.headline ?? r.title ?? '').trim(),
            body: (r.body ?? r.text ?? '').trim(),
          }))
          .filter((r) => r.headline || r.body);
        resolve(rows);
      },
      error: (err) => {
        console.warn('[data] Could not load updates sheet:', err);
        resolve([]);
      },
    });
  });
}

// Fetches the "instagram" tab and returns an array of post permalink URLs from a
// `url` column (or the first column). Resolves to [] on any error so the caller
// can fall back. Only valid-looking instagram.com/p|reel links are kept.
export function fetchInstagramPosts(url) {
  return new Promise((resolve) => {
    if (!url) {
      resolve([]);
      return;
    }
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.trim().toLowerCase(),
      complete: ({ data }) => {
        const links = (data || [])
          .map((r) => (r.url || r.link || r.post || Object.values(r)[0] || '').trim())
          .filter((u) => /instagram\.com\/(p|reel)\//.test(u));
        resolve(links);
      },
      error: () => resolve([]),
    });
  });
}
