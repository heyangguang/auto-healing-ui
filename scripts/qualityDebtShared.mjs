import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';

const FILE_EXTENSIONS = new Set(['.ts', '.tsx']);
const GENERATED_PREFIX = 'src/services/generated/';
const GENERATED_TYPINGS = 'src/services/auto-healing/typings.d.ts';
const GENERATED_TYPINGS_PREFIX = 'src/services/auto-healing/typings/';
const UMI_SEGMENT = `${path.sep}.umi`;
function shouldScanFile(filePath) {
  if (!FILE_EXTENSIONS.has(path.extname(filePath))) {
    return false;
  }
  if (filePath.includes('.test.')) {
    return false;
  }
  if (filePath.includes(UMI_SEGMENT)) {
    return false;
  }
  return true;
}

function collectFiles(dirPath, files = []) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    const absolutePath = path.join(dirPath, entry.name);
    if (entry.isDirectory()) {
      collectFiles(absolutePath, files);
      continue;
    }
    if (shouldScanFile(absolutePath)) {
      files.push(absolutePath);
    }
  }
  return files;
}

function getScriptKind(filePath) {
  return path.extname(filePath) === '.tsx' ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
}

function countAny(text, filePath) {
  const sourceFile = ts.createSourceFile(
    filePath,
    text,
    ts.ScriptTarget.Latest,
    true,
    getScriptKind(filePath),
  );
  let count = 0;

  function visit(node) {
    if (node.kind === ts.SyntaxKind.AnyKeyword) {
      count += 1;
    }
    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return count;
}

function toPosixPath(targetPath) {
  return targetPath.split(path.sep).join('/');
}

function isGeneratedLike(relativePath) {
  return relativePath.startsWith(GENERATED_PREFIX)
    || relativePath === GENERATED_TYPINGS
    || relativePath.startsWith(GENERATED_TYPINGS_PREFIX);
}

export function buildQualityDebtReport() {
  const root = process.cwd();
  const srcRoot = path.join(root, 'src');
  const files = collectFiles(srcRoot);

  const report = {
    manual_any_total: 0,
    manual_large_total: 0,
    generated_any_total: 0,
    generated_large_total: 0,
    manual_any_files: [],
    manual_large_files: [],
    generated_any_files: [],
    generated_large_files: [],
  };

  for (const filePath of files) {
    const relativePath = toPosixPath(path.relative(root, filePath));
    const source = fs.readFileSync(filePath, 'utf8');
    const lineCount = source.split('\n').length;
    const anyCount = countAny(source, relativePath);
    const generated = isGeneratedLike(relativePath);

    if (generated) {
      report.generated_any_total += anyCount;
      if (anyCount > 0) {
        report.generated_any_files.push({ path: relativePath, count: anyCount });
      }
      if (lineCount > 300) {
        report.generated_large_total += 1;
        report.generated_large_files.push({ path: relativePath, lines: lineCount });
      }
      continue;
    }

    report.manual_any_total += anyCount;
    if (anyCount > 0) {
      report.manual_any_files.push({ path: relativePath, count: anyCount });
    }
    if (lineCount > 300) {
      report.manual_large_total += 1;
      report.manual_large_files.push({ path: relativePath, lines: lineCount });
    }
  }

  report.manual_any_files.sort((left, right) => right.count - left.count || left.path.localeCompare(right.path));
  report.manual_large_files.sort((left, right) => right.lines - left.lines || left.path.localeCompare(right.path));
  report.generated_any_files.sort((left, right) => right.count - left.count || left.path.localeCompare(right.path));
  report.generated_large_files.sort((left, right) => right.lines - left.lines || left.path.localeCompare(right.path));

  return report;
}
