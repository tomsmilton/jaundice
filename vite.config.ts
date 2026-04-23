/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 8192,
  },
  test: {
    globals: true,
    environment: 'node',
    css: false,
  },
});
