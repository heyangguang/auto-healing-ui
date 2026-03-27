import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const biomeEntry = path.join(root, 'node_modules', '@biomejs', 'biome', 'bin', 'biome');
const linuxMuslBinary = path.join(
  root,
  'node_modules',
  '@biomejs',
  'cli-linux-x64-musl',
  'biome',
);

const args = process.argv.slice(2);

function resolveBiomeCommand() {
  if (process.env.BIOME_BINARY) {
    return process.env.BIOME_BINARY;
  }

  if (process.platform === 'linux' && process.arch === 'x64' && fs.existsSync(linuxMuslBinary)) {
    console.log(`[biome] using musl binary: ${path.relative(root, linuxMuslBinary)}`);
    return linuxMuslBinary;
  }

  return biomeEntry;
}

const result = spawnSync(resolveBiomeCommand(), args, {
  cwd: root,
  env: process.env,
  stdio: 'inherit',
});

if (result.error) {
  throw result.error;
}

process.exit(result.status ?? 1);
