import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'config', 'config.ts');
const defaultBackendOpenapiYamlPath = '/root/auto-healing/api/openapi.yaml';
const backendOpenapiYamlPath = process.env.AUTO_HEALING_BACKEND_OPENAPI || defaultBackendOpenapiYamlPath;
const openapiYamlPath = path.join(root, 'config', 'openapi.yaml');
const openapiJsonPath = path.join(root, 'config', 'openapi.json');
const openapiScriptPath = path.join(root, 'scripts', 'generate-openapi-client.mjs');
const generatedServiceRoot = path.join(root, 'src', 'services', 'generated', 'auto-healing');
const generatedTypingsPath = path.join(root, 'src', 'services', 'generated', 'auto-healing', 'typings.d.ts');
const generatedTypingsDirPath = path.join(root, 'src', 'services', 'generated', 'auto-healing', 'typings');

if (!fs.existsSync(openapiYamlPath)) {
  throw new Error(`Missing canonical frontend OpenAPI YAML snapshot: ${openapiYamlPath}`);
}

if (!fs.existsSync(openapiJsonPath)) {
  throw new Error(`Missing generated frontend OpenAPI JSON snapshot: ${openapiJsonPath}`);
}

if (!fs.existsSync(openapiScriptPath)) {
  throw new Error(`Missing OpenAPI generation script: ${openapiScriptPath}`);
}

const configSource = fs.readFileSync(configPath, 'utf8');
if (!configSource.includes("schemaPath: join(__dirname, 'openapi.json')")) {
  throw new Error('config/config.ts is not pointing at config/openapi.json');
}

const openapiYamlSource = fs.readFileSync(openapiYamlPath, 'utf8');
if (!openapiYamlSource.includes('openapi: 3.')) {
  throw new Error('config/openapi.yaml does not look like the expected business OpenAPI spec');
}

if (fs.existsSync(backendOpenapiYamlPath)) {
  const backendOpenapiSource = fs.readFileSync(backendOpenapiYamlPath, 'utf8');
  if (backendOpenapiSource !== openapiYamlSource) {
    throw new Error(`config/openapi.yaml is out of sync with ${backendOpenapiYamlPath}`);
  }
}

const openapiDocument = JSON.parse(fs.readFileSync(openapiJsonPath, 'utf8'));
if (typeof openapiDocument.info?.title !== 'string' || openapiDocument.info.title.trim().length === 0) {
  throw new Error('config/openapi.json is missing a non-empty info.title');
}

if (typeof openapiDocument.paths !== 'object' || openapiDocument.paths === null || Object.keys(openapiDocument.paths).length === 0) {
  throw new Error('config/openapi.json does not contain any paths');
}

function collectMissingRefs(document) {
  const missingRefs = new Set();
  const components = document.components || {};

  function walk(value) {
    if (Array.isArray(value)) {
      value.forEach(walk);
      return;
    }
    if (!value || typeof value !== 'object') {
      return;
    }
    if (typeof value.$ref === 'string' && value.$ref.startsWith('#/components/')) {
      const segments = value.$ref.split('/').slice(2);
      let current = components;
      for (const segment of segments) {
        if (!current || typeof current !== 'object' || !(segment in current)) {
          missingRefs.add(value.$ref);
          break;
        }
        current = current[segment];
      }
    }
    Object.values(value).forEach(walk);
  }

  walk(document.paths || {});
  return [...missingRefs].sort();
}

function collectMissingOperationIds(document) {
  const missingOperations = [];
  const HTTP_METHODS = new Set(['get', 'post', 'put', 'patch', 'delete', 'head', 'options']);

  for (const [routePath, operationGroup] of Object.entries(document.paths || {})) {
    if (!operationGroup || typeof operationGroup !== 'object') {
      continue;
    }
    for (const [method, operation] of Object.entries(operationGroup)) {
      if (!HTTP_METHODS.has(method.toLowerCase())) {
        continue;
      }
      if (!operation || typeof operation !== 'object' || typeof operation.operationId !== 'string' || operation.operationId.trim().length === 0) {
        missingOperations.push(`${method.toUpperCase()} ${routePath}`);
      }
    }
  }

  return missingOperations;
}

const missingRefs = collectMissingRefs(openapiDocument);
if (missingRefs.length > 0) {
  throw new Error(`config/openapi.json contains unresolved component refs: ${missingRefs.slice(0, 10).join(', ')}`);
}

const missingOperationIds = collectMissingOperationIds(openapiDocument);
if (missingOperationIds.length > 0) {
  throw new Error(`config/openapi.json contains operations without operationId: ${missingOperationIds.slice(0, 10).join(', ')}`);
}

if (!fs.existsSync(generatedServiceRoot) || !fs.existsSync(generatedTypingsPath)) {
  throw new Error('Generated OpenAPI client files are missing');
}

function readTypingsSource(rootFilePath, fragmentsDirPath) {
  const sources = [fs.readFileSync(rootFilePath, 'utf8')];
  if (fs.existsSync(fragmentsDirPath)) {
    const fragmentFiles = fs.readdirSync(fragmentsDirPath)
      .filter((fileName) => fileName.endsWith('.d.ts'))
      .sort((left, right) => left.localeCompare(right));
    for (const fileName of fragmentFiles) {
      sources.push(fs.readFileSync(path.join(fragmentsDirPath, fileName), 'utf8'));
    }
  }
  return sources.join('\n');
}

function findGeneratedModuleSource(predicate) {
  const generatedFiles = fs.readdirSync(generatedServiceRoot).filter(
    (fileName) => fileName.endsWith('.ts') && fileName !== 'index.ts' && fileName !== 'typings.d.ts',
  );
  for (const fileName of generatedFiles) {
    const filePath = path.join(generatedServiceRoot, fileName);
    const source = fs.readFileSync(filePath, 'utf8');
    if (predicate(source, fileName)) {
      return source;
    }
  }
  return null;
}

const compatibilityModules = [
  'approvals.ts',
  'authentication.ts',
  'execution.ts',
  'flowInstances.ts',
  'gitPlaybooks.ts',
  'healingFlows.ts',
  'healingRules.ts',
  'plugins.ts',
  'secrets.ts',
];

const generatedAuthSource = findGeneratedModuleSource(
  (source) => source.includes('export async function postAuthLogin(')
    && source.includes('export async function putAuthProfile(')
    && source.includes('export async function postAuthRefresh('),
);
if (!generatedAuthSource) {
  throw new Error('Generated auth client module is missing');
}
if (generatedAuthSource.includes('export async function putAuthProfile(options?:')) {
  throw new Error('Generated authentication client still exposes putAuthProfile without a request body');
}

const generatedTypingsSource = readTypingsSource(generatedTypingsPath, generatedTypingsDirPath);
if (/^\s+['"]{2}\?: any;$/m.test(generatedTypingsSource)) {
  throw new Error('Generated typings still contain empty-key params from malformed OpenAPI query definitions');
}
if (!/['"]?playbook_id['"]?\?: string;/.test(generatedTypingsSource)
  || !/['"]?target_hosts['"]?\?: string;/.test(generatedTypingsSource)
  || !/['"]?extra_vars['"]?\?: Record<string, unknown>;/.test(generatedTypingsSource)) {
  throw new Error('Generated ExecutionTask typing is not aligned with the current frontend contract');
}

for (const fileName of compatibilityModules) {
  if (!fs.existsSync(path.join(generatedServiceRoot, fileName))) {
    throw new Error(`Generated compatibility module is missing: ${fileName}`);
  }
}

console.log('OpenAPI check passed');
