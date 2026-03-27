import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const defaultBackendSpec = '/root/auto-healing/docs/openapi.yaml';
const backendSpec = process.env.AUTO_HEALING_BACKEND_OPENAPI || defaultBackendSpec;
const targetYamlSpec = path.join(root, 'config', 'openapi.yaml');
const targetJsonSpec = path.join(root, 'config', 'openapi.json');

if (!fs.existsSync(backendSpec)) {
  throw new Error(`Backend OpenAPI spec not found: ${backendSpec}`);
}

fs.mkdirSync(path.dirname(targetYamlSpec), { recursive: true });
fs.copyFileSync(backendSpec, targetYamlSpec);

const python = spawnSync('python3', ['-c', `
import json
import pathlib
import yaml

source = pathlib.Path(r"${targetYamlSpec}")
target = pathlib.Path(r"${targetJsonSpec}")
with source.open('r', encoding='utf-8') as fh:
    data = yaml.safe_load(fh)
with target.open('w', encoding='utf-8') as fh:
    json.dump(data, fh, ensure_ascii=False, indent=2)
    fh.write("\\n")
`], { stdio: 'inherit' });

if (python.status !== 0) {
  throw new Error('Failed to convert canonical OpenAPI YAML to JSON');
}

console.log(`Synced OpenAPI spec from ${backendSpec} -> ${targetYamlSpec} and ${targetJsonSpec}`);
