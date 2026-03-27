import fs from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const DEFAULT_TOP_COUNT = 20;

function formatBytes(bytes) {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(2)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function classifyAsset(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.js') return 'js';
  if (ext === '.css') return 'css';
  if (['.woff', '.woff2', '.ttf', '.otf', '.eot'].includes(ext)) return 'font';
  if (['.map'].includes(ext)) return 'map';
  if (['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.avif', '.ico'].includes(ext)) return 'image';
  return 'other';
}

export async function collectFiles(dir, rootDir = dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await collectFiles(absPath, rootDir));
      continue;
    }
    const stat = await fs.stat(absPath);
    files.push({
      path: path.relative(rootDir, absPath),
      bytes: stat.size,
      kind: classifyAsset(entry.name),
    });
  }
  return files;
}

export function buildSummary(files) {
  const totals = {};
  let totalBytes = 0;

  for (const file of files) {
    totals[file.kind] = (totals[file.kind] || 0) + file.bytes;
    totalBytes += file.bytes;
  }

  const grouped = Object.entries(totals)
    .sort((a, b) => b[1] - a[1])
    .map(([kind, bytes]) => ({ kind, bytes }));

  const topFiles = [...files]
    .sort((a, b) => b.bytes - a.bytes)
    .slice(0, DEFAULT_TOP_COUNT);

  return {
    totalBytes,
    grouped,
    topFiles,
    fileCount: files.length,
  };
}

export function toMarkdown(summary, distDir) {
  const lines = [];
  lines.push('# Dist Size Report');
  lines.push('');
  lines.push(`- Dist dir: \`${distDir}\``);
  lines.push(`- Asset count: ${summary.fileCount}`);
  lines.push(`- Total size: ${formatBytes(summary.totalBytes)}`);
  lines.push('');
  lines.push('## By Kind');
  lines.push('');
  lines.push('| Kind | Size |');
  lines.push('| --- | ---: |');
  for (const item of summary.grouped) {
    lines.push(`| ${item.kind} | ${formatBytes(item.bytes)} |`);
  }
  lines.push('');
  lines.push(`## Top ${summary.topFiles.length} Assets`);
  lines.push('');
  lines.push('| Asset | Kind | Size |');
  lines.push('| --- | --- | ---: |');
  for (const file of summary.topFiles) {
    lines.push(`| \`${file.path}\` | ${file.kind} | ${formatBytes(file.bytes)} |`);
  }
  lines.push('');
  return lines.join('\n');
}

function parseArgs(argv) {
  const args = [...argv];
  let distDir = 'dist';
  let format = 'markdown';
  let outPath;

  if (args[0] && !args[0].startsWith('--')) {
    distDir = args.shift();
  }

  for (let i = 0; i < args.length; i += 1) {
    const arg = args[i];
    if (arg === '--format') {
      format = args[i + 1] || format;
      i += 1;
      continue;
    }
    if (arg === '--out') {
      outPath = args[i + 1];
      i += 1;
    }
  }

  return { distDir, format, outPath };
}

async function main() {
  const { distDir, format, outPath } = parseArgs(process.argv.slice(2));
  const resolvedDistDir = path.resolve(process.cwd(), distDir);
  const files = await collectFiles(resolvedDistDir);
  const summary = buildSummary(files);
  const rendered = format === 'json'
    ? JSON.stringify(summary, null, 2)
    : toMarkdown(summary, distDir);

  if (outPath) {
    const resolvedOutPath = path.resolve(process.cwd(), outPath);
    await fs.mkdir(path.dirname(resolvedOutPath), { recursive: true });
    await fs.writeFile(resolvedOutPath, rendered);
  }

  process.stdout.write(`${rendered}\n`);
}

const isDirectRun = process.argv[1]
  ? import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href
  : false;

if (isDirectRun) {
  main().catch((error) => {
    console.error('[report-dist-size] failed:', error);
    process.exitCode = 1;
  });
}
