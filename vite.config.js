import { defineConfig } from 'vite';

// `main` is the production branch and only hosts the coming-soon page until
// launch. When ready to go live, merge `dev` into `main`.
export default defineConfig({
  build: { outDir: 'dist' },
});
