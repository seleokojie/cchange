import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import { visualizer } from 'rollup-plugin-visualizer';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // Entry point - use current directory as root
  root: '.',

  // Build configuration
  build: {
    outDir: 'dist',
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
    // Enable minification and optimization
    minify: 'esbuild',
    sourcemap: false,
    // Advanced rollup options for code splitting and optimization
    rollupOptions: {
      input: './index.html',
      output: {
        // Manual chunks for better code splitting
        manualChunks: {
          // Vendor chunks - separate large libraries
          'three-vendor': ['three'],
          'three-controls': ['three/examples/jsm/controls/OrbitControls.js'],
          'animation-vendor': ['gsap', 'd3'],
        },
        // Optimize chunk naming
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
        assetFileNames: assetInfo => {
          const info = assetInfo.name?.split('.') ?? [];
          const ext = info[info.length - 1];
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(ext ?? '')) {
            return `assets/images/[name]-[hash].${ext}`;
          }
          return `assets/[ext]/[name]-[hash].${ext}`;
        },
      },
      // External dependencies (if needed for CDN)
      external: [],
    },
    // Asset optimization
    assetsDir: 'assets',
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Optimize dependencies
    commonjsOptions: {
      include: [/node_modules/],
    },
  },

  // Development server
  server: {
    port: 5173,
    open: false,
    cors: true,
  },

  // Asset handling
  publicDir: 'assets',

  // Plugins
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11'],
      // Reduce polyfill size
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    }),
    // Progressive Web App
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['images/*.{png,jpg,jpeg,svg}', '*.json'],
      manifest: {
        name: 'cChange - Climate Visualization',
        short_name: 'cChange',
        description:
          'Interactive 3D visualization of global temperature changes',
        theme_color: '#1a447e',
        background_color: '#000000',
        display: 'standalone',
        icons: [
          {
            src: '/images/cChange_Logo.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,json}'],
        maximumFileSizeToCacheInBytes: 5000000, // 5MB for large textures
        skipWaiting: true, // Force update
        clientsClaim: true, // Take control immediately
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/data\.giss\.nasa\.gov\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'nasa-data-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
              },
            },
          },
        ],
      },
    }),
    // Bundle analyzer (only in build mode)
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  // TypeScript resolution
  resolve: {
    extensions: ['.ts', '.js', '.json'],
    // Tree shaking optimization
    alias: {
      '@': '/src',
    },
  },

  // Optimizations
  esbuild: {
    target: 'es2020',
    // Remove console.log in production
    drop: process.env.NODE_ENV === 'production' ? ['console', 'debugger'] : [],
  },

  // Dependency optimization
  optimizeDeps: {
    include: ['three', 'gsap', 'd3'],
    exclude: ['@types/three', '@types/d3'],
  },
});
