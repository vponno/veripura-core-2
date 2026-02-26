import { fileURLToPath, URL } from 'node:url';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { createHtmlPlugin } from 'vite-plugin-html';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      nodePolyfills({
        globals: {
          Buffer: true,
          global: true,
          process: true,
        },
      }),

      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            ...env,
            mode,
            meticulousScript: mode !== 'production' ?
              `<script
                data-recording-token="o3vkkm5V4XbftsJrAmkmVElD9uakAzriITLWTb99"
                data-is-production-environment="false"
                src="https://snippet.meticulous.ai/v1/meticulous.js"
              ></script>` : '',
          },
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('.', import.meta.url)),
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor-react': ['react', 'react-dom', 'react-router-dom'],
            'vendor-charts': ['recharts']
          }
        }
      },
      chunkSizeWarningLimit: 1000
    }
  };
});


