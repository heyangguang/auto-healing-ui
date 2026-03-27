import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'config', 'config.ts');
const backendOpenapiYamlPath = '/root/auto-healing/docs/openapi.yaml';
const openapiYamlPath = path.join(root, 'config', 'openapi.yaml');
const openapiJsonPath = path.join(root, 'config', 'openapi.json');
const openapiScriptPath = path.join(root, 'scripts', 'generate-openapi-client.mjs');
const generatedAuthPath = path.join(root, 'src', 'services', 'generated', 'auto-healing', 'authentication.ts');
const generatedTypingsPath = path.join(root, 'src', 'services', 'generated', 'auto-healing', 'typings.d.ts');

if (!fs.existsSync(openapiYamlPath)) {
  throw new Error(`Missing canonical frontend OpenAPI YAML snapshot: ${openapiYamlPath}`);
}

if (!fs.existsSync(openapiJsonPath)) {
  throw new Error(`Missing generated frontend OpenAPI JSON snapshot: ${openapiJsonPath}`);
}

if (!fs.existsSync(openapiScriptPath)) {
  throw new Error(`Missing OpenAPI generation script: ${openapiScriptPath}`);
}

if (!fs.existsSync(generatedAuthPath) || !fs.existsSync(generatedTypingsPath)) {
  throw new Error('Generated OpenAPI client files are missing');
}

const configSource = fs.readFileSync(configPath, 'utf8');
if (!configSource.includes("schemaPath: join(__dirname, 'openapi.json')")) {
  throw new Error('config/config.ts is not pointing at config/openapi.json');
}

const openapiYamlSource = fs.readFileSync(openapiYamlPath, 'utf8');
if (!openapiYamlSource.includes('openapi: 3.') || !openapiYamlSource.includes('Auto-Healing Platform API')) {
  throw new Error('config/openapi.yaml does not look like the expected business OpenAPI spec');
}

if (fs.existsSync(backendOpenapiYamlPath)) {
  const backendOpenapiSource = fs.readFileSync(backendOpenapiYamlPath, 'utf8');
  if (backendOpenapiSource !== openapiYamlSource) {
    throw new Error('config/openapi.yaml is out of sync with /root/auto-healing/docs/openapi.yaml');
  }
}

const generatedAuthSource = fs.readFileSync(generatedAuthPath, 'utf8');
if (generatedAuthSource.includes('export async function putAuthProfile(options?:')) {
  throw new Error('Generated authentication client still exposes putAuthProfile without a request body');
}

const generatedTypingsSource = fs.readFileSync(generatedTypingsPath, 'utf8');
if (generatedTypingsSource.includes('""?: any;')) {
  throw new Error('Generated typings still contain empty-key params from malformed OpenAPI query definitions');
}
if (!generatedTypingsSource.includes('playbook_id?: string;')
  || !generatedTypingsSource.includes('target_hosts?: string;')
  || !generatedTypingsSource.includes('extra_vars?: Record<string, any>;')) {
  throw new Error('Generated ExecutionTask typing is not aligned with the current frontend contract');
}

console.log('OpenAPI check passed');
