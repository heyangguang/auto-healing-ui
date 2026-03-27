import fs from 'node:fs';
import path from 'node:path';

const DEFAULT_MAX_LINES = 260;
const DECLARATION_START = /^\s{2,}(type|interface) [A-Za-z0-9_$]+/;

function trimTrailingEmptyLines(lines) {
  const nextLines = [...lines];
  while (nextLines.length > 0 && nextLines[nextLines.length - 1].trim() === '') {
    nextLines.pop();
  }
  return nextLines;
}

function chunkDeclarationBlocks(blocks, maxLines) {
  const chunks = [];
  let currentChunk = [];
  let currentLineCount = 2;

  for (const block of blocks) {
    const blockLines = trimTrailingEmptyLines(block);
    const nextLineCount = currentLineCount + blockLines.length + 1;
    if (currentChunk.length > 0 && nextLineCount > maxLines) {
      chunks.push(currentChunk);
      currentChunk = [];
      currentLineCount = 2;
    }
    currentChunk.push(blockLines);
    currentLineCount += blockLines.length + 1;
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk);
  }

  return chunks;
}

function collectDeclarationBlocks(bodyLines) {
  const blocks = [];
  let currentBlock = [];

  for (const line of bodyLines) {
    if (DECLARATION_START.test(line) && currentBlock.some((currentLine) => currentLine.trim() !== '')) {
      blocks.push(trimTrailingEmptyLines(currentBlock));
      currentBlock = [line];
      continue;
    }
    currentBlock.push(line);
  }

  if (currentBlock.some((currentLine) => currentLine.trim() !== '')) {
    blocks.push(trimTrailingEmptyLines(currentBlock));
  }

  return blocks;
}

function parseNamespaceSource(source, namespaceName) {
  const lines = source.split('\n');
  const namespaceLineIndex = lines.findIndex((line) => line.trim() === `declare namespace ${namespaceName} {`);
  if (namespaceLineIndex < 0) {
    throw new Error(`Failed to locate namespace declaration for ${namespaceName}`);
  }

  const preambleLines = trimTrailingEmptyLines(lines.slice(0, namespaceLineIndex));
  const innerLines = trimTrailingEmptyLines(lines.slice(namespaceLineIndex + 1));
  if (innerLines.length === 0) {
    throw new Error(`Namespace ${namespaceName} does not contain any declarations`);
  }

  const trailingLine = innerLines[innerLines.length - 1]?.trim();
  if (trailingLine !== '}') {
    throw new Error(`Namespace ${namespaceName} is not closed with a standalone brace`);
  }

  return {
    bodyLines: innerLines.slice(0, -1),
    preambleLines,
  };
}

function renderNamespaceChunk(namespaceName, declarationBlocks) {
  const body = declarationBlocks.map((block) => block.join('\n')).join('\n\n');
  return `declare namespace ${namespaceName} {\n${body}\n}\n`;
}

export function splitNamespaceTypingsFile(options) {
  const {
    filePath,
    namespaceName,
    chunkDirName = 'typings',
    filePrefix = 'chunk',
    maxLines = DEFAULT_MAX_LINES,
  } = options;

  const absoluteFilePath = path.resolve(filePath);
  const source = fs.readFileSync(absoluteFilePath, 'utf8');
  if (
    !source.includes(`declare namespace ${namespaceName} {`)
    && source.includes(`/// <reference path="./${chunkDirName}/`)
  ) {
    return;
  }
  const { preambleLines, bodyLines } = parseNamespaceSource(source, namespaceName);
  const declarationBlocks = collectDeclarationBlocks(bodyLines);
  const chunkGroups = chunkDeclarationBlocks(declarationBlocks, maxLines);
  const chunkDirPath = path.join(path.dirname(absoluteFilePath), chunkDirName);

  fs.mkdirSync(chunkDirPath, { recursive: true });
  for (const entry of fs.readdirSync(chunkDirPath, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith('.d.ts')) {
      fs.unlinkSync(path.join(chunkDirPath, entry.name));
    }
  }

  const referenceLines = [];
  chunkGroups.forEach((chunkGroup, index) => {
    const chunkFileName = `${String(index + 1).padStart(2, '0')}.${filePrefix}.d.ts`;
    fs.writeFileSync(
      path.join(chunkDirPath, chunkFileName),
      renderNamespaceChunk(namespaceName, chunkGroup),
      'utf8',
    );
    referenceLines.push(`/// <reference path="./${chunkDirName}/${chunkFileName}" />`);
  });

  const preamble = preambleLines.length > 0 ? `${preambleLines.join('\n')}\n\n` : '';
  fs.writeFileSync(absoluteFilePath, `${preamble}${referenceLines.join('\n')}\n`, 'utf8');
}

const isDirectExecution = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);

if (isDirectExecution) {
  const [filePath, namespaceName, chunkDirName, filePrefix, maxLinesArg] = process.argv.slice(2);
  if (!filePath || !namespaceName) {
    throw new Error('Usage: node scripts/namespaceTypingsSplit.mjs <filePath> <namespaceName> [chunkDirName] [filePrefix] [maxLines]');
  }
  splitNamespaceTypingsFile({
    filePath,
    namespaceName,
    chunkDirName,
    filePrefix,
    maxLines: maxLinesArg ? Number(maxLinesArg) : DEFAULT_MAX_LINES,
  });
}
