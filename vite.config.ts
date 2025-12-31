/*
 * @Descripttion: 
 * @Author: ouchao
 * @Email: ouchao@sendpalm.com
 * @version: 1.0
 * @Date: 2025-12-13 16:35:41
 * @LastEditors: ouchao
 * @LastEditTime: 2025-12-27 16:34:52
 */
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      server: {
        port: 3030,
        host: '0.0.0.0',
        proxy: {
          '/fpl-api': {
            target: 'https://fantasy.premierleague.com/api',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/fpl-api/, ''),
          },
          '/api/espn/site': {
            target: 'https://site.api.espn.com/apis/site/v2',
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/api\/espn\/site/, ''),
          },
          '/api/espn/web-site': {
             target: 'https://site.web.api.espn.com/apis/site/v2',
             changeOrigin: true,
             rewrite: (path) => path.replace(/^\/api\/espn\/web-site/, ''),
          },
          '/api/espn/common': {
             target: 'https://site.web.api.espn.com/apis/common/v3',
             changeOrigin: true,
             rewrite: (path) => path.replace(/^\/api\/espn\/common/, ''),
          },
        },
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
