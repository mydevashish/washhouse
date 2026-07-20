#!/usr/bin/env node
/**
 * Batch-convert dropped JPG/PNG imports into production WebP assets.
 *
 * Catalog:  public/catalog/_imports/<category>/  -> public/catalog/<category>/  (1200×900 q85)
 * Marketing: public/marketing/_imports/           -> public/marketing/heroes/    (1920×1080 q82)
 *
 * Uses Pillow via Python (same stack as extract-catalog-photos). Safe to re-run.
 */
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const frontendDir = path.join(__dirname, '..');
const pyScript = path.join(__dirname, 'optimize-catalog-imports.py');
const python = process.platform === 'win32' ? 'python' : 'python3';
const args = process.argv.slice(2);

const result = spawnSync(python, [pyScript, ...args], {
  stdio: 'inherit',
  cwd: frontendDir,
});

if (result.error) {
  console.error(`Failed to run ${python}: ${result.error.message}`);
  process.exit(1);
}

process.exit(result.status ?? 1);
