#!/usr/bin/env node
/**
 * Thin Node entrypoint — delegates to the Pillow extractor.
 * Requires Python 3 + Pillow (same as generate-brand-assets.py).
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const pyScript = path.join(__dirname, 'extract-catalog-photos.py');

const result = spawnSync(process.platform === 'win32' ? 'python' : 'python3', [pyScript], {
  stdio: 'inherit',
  cwd: path.join(__dirname, '..'),
});

process.exit(result.status ?? 1);
