import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { crx } from '@crxjs/vite-plugin';
import manifest from './manifest.json';

// Extend the manifest to ensure CSP is retained during build
const extendedManifest = {
  ...manifest,
  content_security_policy: {
    extension_pages: "script-src 'self' 'wasm-unsafe-eval'; object-src 'self'"
  }
};

export default defineConfig({
  plugins: [
    react(),
    crx({ manifest: extendedManifest })
  ]
});
