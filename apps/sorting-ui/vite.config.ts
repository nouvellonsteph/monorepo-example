import { cloudflare } from '@cloudflare/vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [
    tailwindcss(),
    react(),
    cloudflare({
      configPath: './wrangler.jsonc',
      auxiliaryWorkers: [
        { configPath: '../sorting-api/wrangler.jsonc' },
        { configPath: '../routing-engine/wrangler.jsonc' },
        { configPath: '../operations-events/wrangler.jsonc' },
      ],
    }),
  ],
});
