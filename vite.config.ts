import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { readFileSync, existsSync } from 'fs';
import type { ServerResponse } from 'http';

function serveRolloutsPlugin() {
  const filePath = process.env.VITE_ROLLOUTS_PATH;

  return {
    name: 'serve-rollouts-file',
    configureServer(server: {
      middlewares: {
        use: (path: string, handler: (req: unknown, res: ServerResponse) => void) => void;
      };
    }) {
      server.middlewares.use('/__rollouts', (_req: unknown, res: ServerResponse) => {
        if (!filePath || !existsSync(filePath)) {
          res.statusCode = 404;
          res.end('');
          return;
        }
        try {
          const content = readFileSync(filePath, 'utf-8');
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
