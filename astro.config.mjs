import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';

// The site's public address (for link previews and canonical links).
// Set SITE_URL when building, e.g. SITE_URL=https://zend.ng npm run build
export default defineConfig({
  site: process.env.SITE_URL || 'https://zendpay.io',
  vite: {
    plugins: [tailwindcss()],
  },
});
