import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';

export default defineConfig({
  // Entry point - use current directory as root
  root: '.',
  
  // Build configuration
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: './index.html'
    }
  },
  
  // Development server
  server: {
    port: 5173,
    open: false,
    cors: true
  },
  
  // Asset handling
  publicDir: 'assets',
  
  // Plugins
  plugins: [
    legacy({
      targets: ['defaults', 'not IE 11']
    })
  ],
  
  // TypeScript resolution
  resolve: {
    extensions: ['.ts', '.js', '.json']
  },
  
  // Optimizations
  esbuild: {
    target: 'es2020'
  }
});
