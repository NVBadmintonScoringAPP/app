import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

import https from 'https';

function tournamentScraperPlugin() {
  return {
    name: 'tournament-scraper-proxy',
    configureServer(server: any) {
      server.middlewares.use('/api/tournament-scrape', async (req: any, res: any) => {
        const parsedUrl = new URL(req.url, 'http://localhost:8081');
        const targetUrl = parsedUrl.searchParams.get('url');
        if (!targetUrl) {
          res.statusCode = 400;
          res.end(JSON.stringify({ error: 'Missing url parameter' }));
          return;
        }

        try {
          const u = new URL(targetUrl);
          const opts = {
            hostname: u.hostname,
            path: u.pathname + u.search,
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0',
              'Cookie': 'st=l=1033&c=1&cp=1;',
              'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'bg,en;q=0.9',
            },
          };

          const request = https.request(opts, (resp) => {
            let data = '';
            resp.on('data', (chunk) => (data += chunk));
            resp.on('end', () => {
              res.setHeader('Content-Type', 'text/html; charset=utf-8');
              res.statusCode = 200;
              res.end(data);
            });
          });
          request.on('error', (err) => {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: err.message }));
          });
          request.end();
        } catch (err: any) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), tournamentScraperPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 8081,
  },
});
