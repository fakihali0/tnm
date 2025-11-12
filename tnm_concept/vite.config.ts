import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// import { VitePWA } from 'vite-plugin-pwa'; // Keeping package but not using it yet

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(), 
    mode === "development" && componentTagger()
    // VitePWA plugin disabled - we use manual SW registration for better control
  ].filter(Boolean),
  esbuild: {
    // Strip console logs in production
    drop: mode === 'production' ? ['console', 'debugger'] : [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      react: path.resolve(__dirname, "node_modules/react"),
      "react-dom": path.resolve(__dirname, "node_modules/react-dom"),
      "react/jsx-runtime": path.resolve(__dirname, "node_modules/react/jsx-runtime"),
      "react/jsx-dev-runtime": path.resolve(__dirname, "node_modules/react/jsx-dev-runtime"),
    },
    dedupe: ["react", "react-dom"],
  },
  build: {
    // Performance budgets - stricter limits for better performance
    chunkSizeWarningLimit: 250, // Warn if chunks exceed 250KB (optimized for better performance)
    rollupOptions: {
      output: {
        // Optimize chunk splitting for better caching and smaller initial bundle
        manualChunks: {
          // Core dependencies
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          
          // UI - Split by usage frequency
          'ui-core': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-popover',
          ],
          'ui-forms': [
            '@radix-ui/react-checkbox',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-label',
          ],
          'ui-advanced': [
            '@radix-ui/react-accordion',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-navigation-menu',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-hover-card',
            '@radix-ui/react-context-menu',
          ],
          
          // Animations (consider splitting further if needed)
          animations: ['framer-motion'],
          
          // Internationalization
          i18n: ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          
          // Charts (lazy loaded, but separated for better caching)
          charts: ['recharts'],
          
          // Markdown (lazy loaded)
          markdown: ['react-markdown', 'remark-gfm'],
          
          // Utilities
          utils: ['clsx', 'tailwind-merge', 'class-variance-authority'],
          
          // Supabase
          supabase: ['@supabase/supabase-js'],
          
          // Date utilities
          'date-utils': ['date-fns'],
          
          // Form utilities
          'form-utils': ['react-hook-form', '@hookform/resolvers', 'zod'],
        },
        
        // Better chunk naming for analysis
        chunkFileNames: 'assets/[name]-[hash].js',
      }
    },
    // Enable source maps for better debugging
    sourcemap: mode === 'development',
    // Optimize assets
    assetsInlineLimit: 4096, // Inline assets smaller than 4KB
    // Enable CSS code splitting
    cssCodeSplit: true,
    // Report compressed sizes for better visibility
    reportCompressedSize: true
  },
  // Performance optimizations
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'framer-motion',
      'i18next',
      'react-i18next'
    ]
  }
}));
