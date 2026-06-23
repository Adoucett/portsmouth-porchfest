import { defineConfig } from 'vite';

// Static site build. Vercel runs `vite build` and serves the `dist/` folder.
// The Mapbox token is injected at build time via import.meta.env.VITE_MAPBOX_TOKEN
// (set locally in .env, and in Vercel project settings for Preview + Production).
export default defineConfig({
  build: {
    outDir: 'dist',
    target: 'es2020',
    // Mapbox GL is a large single library (~500 KB gzip); the warning is noise.
    chunkSizeWarningLimit: 2000,
  },
});
