import fs from 'node:fs';
import path from 'node:path';
import { buildQualityDebtReport } from './qualityDebtShared.mjs';

const baselinePath = path.join(process.cwd(), 'config', 'quality-debt-baseline.json');

if (!fs.existsSync(baselinePath)) {
  throw new Error(`Missing quality debt baseline: ${baselinePath}`);
}

const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8'));
const report = buildQualityDebtReport();
const checks = [
  ['manual_any_total', report.manual_any_total],
  ['manual_large_total', report.manual_large_total],
  ['generated_any_total', report.generated_any_total],
  ['generated_large_total', report.generated_large_total],
];

const failures = checks.filter(([key, current]) => current > Number(baseline[key] ?? 0));

if (failures.length > 0) {
  console.error('Quality debt regression detected');
  for (const [key, current] of failures) {
    console.error(`- ${key}: current=${current} baseline=${baseline[key]}`);
  }
  process.exit(1);
}

console.log('Quality debt check passed');
for (const [key, current] of checks) {
  console.log(`- ${key}: current=${current} baseline=${baseline[key]}`);
}
