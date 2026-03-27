import fs from 'node:fs/promises';
import path from 'node:path';
import { buildSummary, collectFiles, toMarkdown } from './report-dist-size.mjs';

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

function parseArgs(argv) {
  const [distDir = 'dist', budgetPath = 'config/bundle-budget.json'] = argv;
  return { distDir, budgetPath };
}

function largestAssetByKind(files, kind) {
  return files
    .filter((file) => file.kind === kind)
    .sort((a, b) => b.bytes - a.bytes)[0];
}

async function main() {
  const { distDir, budgetPath } = parseArgs(process.argv.slice(2));
  const resolvedDist = path.resolve(process.cwd(), distDir);
  const resolvedBudget = path.resolve(process.cwd(), budgetPath);
  const budget = JSON.parse(await fs.readFile(resolvedBudget, 'utf8'));
  const files = await collectFiles(resolvedDist);
  const summary = buildSummary(files);
  const failures = [];

  if (budget.assetCountMax !== undefined && summary.fileCount > budget.assetCountMax) {
    failures.push(`asset count ${summary.fileCount} exceeds ${budget.assetCountMax}`);
  }

  if (budget.totalBytesMax !== undefined && summary.totalBytes > budget.totalBytesMax) {
    failures.push(`total size ${formatBytes(summary.totalBytes)} exceeds ${formatBytes(budget.totalBytesMax)}`);
  }

  for (const [kind, limit] of Object.entries(budget.kindBytesMax || {})) {
    const actual = summary.grouped.find((item) => item.kind === kind)?.bytes || 0;
    if (actual > limit) {
      failures.push(`${kind} size ${formatBytes(actual)} exceeds ${formatBytes(limit)}`);
    }
  }

  for (const [kind, limit] of Object.entries(budget.largestAssetBytesMax || {})) {
    const asset = largestAssetByKind(files, kind);
    if (asset && asset.bytes > limit) {
      failures.push(`largest ${kind} asset ${asset.path} (${formatBytes(asset.bytes)}) exceeds ${formatBytes(limit)}`);
    }
  }

  if (failures.length > 0) {
    console.error('[check-dist-budgets] bundle budget check failed');
    for (const failure of failures) {
      console.error(`- ${failure}`);
    }
    console.error('');
    console.error(toMarkdown(summary, distDir));
    process.exitCode = 1;
    return;
  }

  console.log('[check-dist-budgets] bundle budget check passed');
  console.log(toMarkdown(summary, distDir));
}

main().catch((error) => {
  console.error('[check-dist-budgets] failed:', error);
  process.exitCode = 1;
});
