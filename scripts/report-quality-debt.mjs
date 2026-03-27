import { buildQualityDebtReport } from './qualityDebtShared.mjs';

const report = buildQualityDebtReport();

function printSection(title, items, valueKey) {
  console.log(`\n${title}`);
  if (items.length === 0) {
    console.log('  none');
    return;
  }
  for (const item of items.slice(0, 20)) {
    console.log(`  ${item[valueKey]}  ${item.path}`);
  }
}

console.log('Quality debt report');
console.log(`manual_any_total=${report.manual_any_total}`);
console.log(`manual_large_total=${report.manual_large_total}`);
console.log(`generated_any_total=${report.generated_any_total}`);
console.log(`generated_large_total=${report.generated_large_total}`);

printSection('Top manual any files', report.manual_any_files, 'count');
printSection('Manual files over 300 lines', report.manual_large_files, 'lines');
printSection('Top generated any files', report.generated_any_files, 'count');
printSection('Generated files over 300 lines', report.generated_large_files, 'lines');
