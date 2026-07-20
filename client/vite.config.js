import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // Treat markdown as a static asset so `import md from './post.md?raw'`
  // works without a custom plugin. Posts live in client/src/blog/posts/
  // and are loaded eagerly via import.meta.glob in lib/parsePosts.js.
  assetsInclude: ['**/*.md'],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
