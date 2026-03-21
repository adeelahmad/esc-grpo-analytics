import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, existsSync, statSync } from 'fs';
import type { IncomingMessage, ServerResponse } from 'http';

function serveRolloutsPlugin() {
  const defaultPath = process.env.VITE_ROLLOUTS_PATH;

  return {
    name: 'serve-rollouts-file',
    configureServer(server: {
      middlewares: {
        use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void;
      };
    }) {
      server.middlewares.use('/__rollouts', (req: IncomingMessage, res: ServerResponse) => {
        const url = new URL(req.url || '', 'http://localhost');
        const queryPath = url.searchParams.get('path');
        const filePath = queryPath || defaultPath;

        if (!filePath) {
          res.statusCode = 404;
          res.end('');
          return;
        }

        const resolved = resolve(filePath);
        if (!resolved.endsWith('.jsonl')) {
          res.statusCode = 400;
          res.end('Only .jsonl files are supported');
          return;
        }
        if (!existsSync(resolved) || !statSync(resolved).isFile()) {
          res.statusCode = 404;
          res.end('');
          return;
        }

        try {
          const content = readFileSync(resolved, 'utf-8');
          res.setHeader('Content-Type', 'application/x-ndjson; charset=utf-8');
          res.setHeader('Cache-Control', 'no-store');
          res.end(content);
        } catch {
          res.statusCode = 500;
          res.end('');
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), serveRolloutsPlugin()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
