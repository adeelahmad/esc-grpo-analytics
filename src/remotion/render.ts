/**
 * CLI render script for video export using Remotion.
 *
 * Usage:
 *   npx tsx src/remotion/render.ts --input rollouts.jsonl [--composition GroupVideo] [--resolution 1080p] [--speed 40] [--output out.mp4]
 *
 * This script:
 * 1. Reads rollout data from a JSONL file
 * 2. Bundles the Remotion compositions
 * 3. Renders to MP4 using headless Chromium
 */

import path from 'node:path';
import fs from 'node:fs';
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { RESOLUTION, DEFAULT_TOKENS_PER_SEC, type ResolutionKey } from './constants.js';

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--') && i + 1 < args.length) {
      opts[args[i].slice(2)] = args[++i];
    }
  }
  return {
    input: opts.input || '',
    composition: opts.composition || 'GroupVideo',
    resolution: (opts.resolution || '1080p') as ResolutionKey,
    tokPerSec: Number(opts.speed) || DEFAULT_TOKENS_PER_SEC,
    output: opts.output || 'rollout_video.mp4',
  };
}

async function main() {
  const opts = parseArgs();

  if (!opts.input) {
    console.error('Usage: npx tsx src/remotion/render.ts --input <rollouts.jsonl> [options]');
    console.error('Options:');
    console.error('  --composition  RolloutVideo | GroupVideo (default: GroupVideo)');
    console.error('  --resolution   720p | 1080p (default: 1080p)');
    console.error('  --speed        tokens per second (default: 40)');
    console.error('  --output       output file path (default: rollout_video.mp4)');
    process.exit(1);
  }

  // Read rollout data
  const inputPath = path.resolve(opts.input);
  if (!fs.existsSync(inputPath)) {
    console.error(`File not found: ${inputPath}`);
    process.exit(1);
  }

  const lines = fs
    .readFileSync(inputPath, 'utf-8')
    .trim()
    .split('\n')
    .filter(Boolean);
  const rollouts = lines.map((l) => JSON.parse(l));

  console.log(`Loaded ${rollouts.length} rollout(s) from ${opts.input}`);

  const res = RESOLUTION[opts.resolution];
  const inputProps =
    opts.composition === 'RolloutVideo'
      ? { rollout: rollouts[0], tokPerSec: opts.tokPerSec }
      : { rollouts, tokPerSec: opts.tokPerSec };

  // Bundle the Remotion project
  console.log('Bundling Remotion compositions...');
  const bundleLocation = await bundle({
    entryPoint: path.resolve(import.meta.dirname, 'index.ts'),
    webpackOverride: (config) => config,
  });

  // Select composition and calculate duration
  const composition = await selectComposition({
    serveUrl: bundleLocation,
    id: opts.composition,
    inputProps,
  });

  console.log(
    `Rendering ${opts.composition} at ${opts.resolution} (${res.width}x${res.height}), ${composition.durationInFrames} frames...`,
  );

  // Render
  await renderMedia({
    composition: {
      ...composition,
      width: res.width,
      height: res.height,
    },
    serveUrl: bundleLocation,
    codec: 'h264',
    outputLocation: opts.output,
    inputProps,
    onProgress: ({ progress }) => {
      const pct = Math.round(progress * 100);
      process.stdout.write(`\rRendering: ${pct}%`);
    },
  });

  console.log(`\nDone! Video saved to: ${opts.output}`);
}

main().catch((err) => {
  console.error('Render failed:', err);
  process.exit(1);
});
