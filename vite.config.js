import { defineConfig } from 'vite';
import { resolve } from 'node:path';

const root = process.cwd();

// Dev-only: lets extensionless URLs (/map, /faq) resolve to their .html files,
// matching Vercel's `cleanUrls` behavior in production so links work the same
// in both environments.
function cleanUrlsDev() {
  return {
    name: 'clean-urls-dev',
    configureServer(server) {
      server.middlewares.use((req, _res, next) => {
        if (req.url) {
          const [path, query] = req.url.split('?');
          if (path !== '/' && !path.includes('.')) {
            req.url = path.replace(/\/$/, '') + '.html' + (query ? `?${query}` : '');
          }
        }
        next();
      });
    },
  };
}

export default defineConfig({
  appType: 'mpa',
  plugins: [cleanUrlsDev()],
  build: {
    outDir: 'dist',
    target: 'es2020',
    // Mapbox GL is a large single library (~500 KB gzip); the warning is noise.
    chunkSizeWarningLimit: 2000,
    rollupOptions: {
      input: {
        main: resolve(root, 'index.html'),
        map: resolve(root, 'map.html'),
        getInvolved: resolve(root, 'get-involved.html'),
        faq: resolve(root, 'faq.html'),
        contact: resolve(root, 'contact.html'),
      },
    },
  },
});
