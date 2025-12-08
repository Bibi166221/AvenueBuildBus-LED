// vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  css: {
    // Crucial fix: We point directly to the PostCSS config path
    // and rely on the internal PostCSS setup (which includes tailwindcss)
    postcss: './tailwind.config.js',
  },
});