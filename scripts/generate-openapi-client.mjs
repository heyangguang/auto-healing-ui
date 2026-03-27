import fs from 'node:fs';
import path from 'node:path';
import { generateService } from '@umijs/openapi';

const root = process.cwd();
const schemaPath = path.join(root, 'config', 'openapi.json');
const generatedInputPath = path.join(root, 'config', '.generated-openapi-runtime.json');

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const runtimeSchema = {
  ...schema,
  paths: Object.fromEntries(
    Object.entries(schema.paths || {}).map(([routePath, config]) => {
      const normalizedPath = routePath.startsWith('/api/v1/')
        ? routePath
        : `/api/v1${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
      return [normalizedPath, config];
    }),
  ),
};

fs.writeFileSync(generatedInputPath, `${JSON.stringify(runtimeSchema, null, 2)}\n`);

try {
  await generateService({
    schemaPath: generatedInputPath,
    projectName: 'auto-healing',
    serversPath: path.join(root, 'src', 'services', 'generated'),
    namespace: 'GeneratedAutoHealing',
    requestLibPath: "import { request } from '@umijs/max'",
  });
} finally {
  if (fs.existsSync(generatedInputPath)) {
    fs.unlinkSync(generatedInputPath);
  }
}

console.log('Generated isolated OpenAPI client at src/services/generated/auto-healing');
