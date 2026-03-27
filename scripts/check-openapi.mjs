import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'config', 'config.ts');
const openapiYamlPath = path.join(root, 'config', 'openapi.yaml');
const openapiJsonPath = path.join(root, 'config', 'openapi.json');
const openapiScriptPath = path.join(root, 'scripts', 'generate-openapi-client.mjs');

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
if (!openapiYamlSource.includes('openapi: 3.') || !openapiYamlSource.includes('Auto-Healing Platform API')) {
  throw new Error('config/openapi.yaml does not look like the expected business OpenAPI spec');
}

console.log('OpenAPI check passed');
