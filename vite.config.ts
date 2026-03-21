import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve, dirname } from 'path';
import { readFileSync, existsSync, statSync, createReadStream, unlinkSync } from 'fs';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';
import { randomUUID } from 'crypto';
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

function renderVideoPlugin() {
  let bundleLocationCache: string | null = null;

  return {
    name: 'render-video',
    configureServer(server: {
      middlewares: {
        use: (path: string, handler: (req: IncomingMessage, res: ServerResponse) => void) => void;
      };
    }) {
      server.middlewares.use('/__render-video', (req: IncomingMessage, res: ServerResponse) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        let body = '';
        req.on('data', (chunk: Buffer) => {
          body += chunk.toString();
        });
        req.on('end', () => {
          handleRenderRequest(body, res).catch((err) => {
            console.error('Video render error:', err);
            if (!res.headersSent) {
              res.statusCode = 500;
              res.end(String(err?.message || err));
            }
          });
        });
      });
    },
  };

  async function handleRenderRequest(body: string, res: ServerResponse) {
    const { bundle } = await import('@remotion/bundler');
    const { renderMedia, selectComposition } = await import('@remotion/renderer');

    const payload = JSON.parse(body);
    const { compositionId, inputProps, resolution, durationInFrames } = payload;

    const resolutions: Record<string, { width: number; height: number }> = {
      '720p': { width: 1280, height: 720 },
      '1080p': { width: 1920, height: 1080 },
    };
    const res_ = resolutions[resolution] || resolutions['1080p'];

    // Bundle once and cache
    if (!bundleLocationCache) {
      console.log('[render-video] Bundling Remotion compositions...');
      const entryPoint = resolve(
        dirname(fileURLToPath(import.meta.url)),
        'src',
        'remotion',
        'index.ts',
      );
      bundleLocationCache = await bundle({
        entryPoint,
        webpackOverride: (config) => config,
      });
      console.log('[render-video] Bundle ready.');
    }

    const composition = await selectComposition({
      serveUrl: bundleLocationCache,
      id: compositionId,
      inputProps,
    });

    const outputPath = resolve(tmpdir(), `remotion-render-${randomUUID()}.mp4`);

    console.log(
      `[render-video] Rendering ${compositionId} at ${resolution} (${res_.width}x${res_.height}), ${durationInFrames} frames...`,
    );

    await renderMedia({
      composition: {
        ...composition,
        width: res_.width,
        height: res_.height,
        durationInFrames: durationInFrames || composition.durationInFrames,
      },
      serveUrl: bundleLocationCache,
      codec: 'h264',
      outputLocation: outputPath,
      inputProps,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        process.stdout.write(`\r[render-video] Rendering: ${pct}%`);
      },
    });

    console.log('\n[render-video] Render complete, sending file...');

    const stat = statSync(outputPath);
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Length', stat.size);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="rollout_${compositionId}_${resolution}.mp4"`,
    );

    const stream = createReadStream(outputPath);
    stream.pipe(res);
    stream.on('end', () => {
      try {
        unlinkSync(outputPath);
      } catch {
        // ignore cleanup errors
      }
    });
  }
}

export default defineConfig({
  plugins: [react(), serveRolloutsPlugin(), renderVideoPlugin()],
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
