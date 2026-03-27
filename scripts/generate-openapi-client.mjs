import fs from 'node:fs';
import path from 'node:path';
import { generateService } from '@umijs/openapi';

const root = process.cwd();
const schemaPath = path.join(root, 'config', 'openapi.json');
const generatedInputPath = path.join(root, 'config', '.generated-openapi-runtime.json');
const generatedServiceRoot = path.join(root, 'src', 'services', 'generated', 'auto-healing');

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

function rewriteFile(filePath, transform) {
  const source = fs.readFileSync(filePath, 'utf8');
  const nextSource = transform(source);
  if (nextSource !== source) {
    fs.writeFileSync(filePath, nextSource);
  }
}

function patchGeneratedTypings() {
  const typingsPath = path.join(generatedServiceRoot, 'typings.d.ts');
  rewriteFile(typingsPath, (source) => {
    let nextSource = source.replace(/^\s+""\?: any;\n/gm, '');
    nextSource = nextSource.replace(
      /type ExecutionTask = \{[\s\S]*?\n  \};/,
      `type ExecutionTask = {
    id?: string;
    name?: string;
    description?: string;
    playbook_id?: string;
    target_hosts?: string;
    extra_vars?: Record<string, any>;
    executor_type?: "local" | "docker";
    secrets_source_ids?: string[];
    notification_config?: Record<string, any>;
    needs_review?: boolean;
    changed_variables?: Array<string | { name?: string; old?: string; new?: string }>;
    created_at?: string;
    updated_at?: string;
  };`,
    );
    return nextSource;
  });
}

function patchGeneratedAuthentication() {
  const authenticationPath = path.join(generatedServiceRoot, 'authentication.ts');
  rewriteFile(authenticationPath, (source) => source.replace(
    /export async function putAuthProfile\(options\?: \{ \[key: string\]: any \}\) \{\n  return request<any>\("\/api\/v1\/auth\/profile", \{\n    method: "PUT",\n    \.\.\.\(options \|\| \{\}\),\n  \}\);\n\}/,
    `export async function putAuthProfile(
  body: Record<string, any>,
  options?: { [key: string]: any }
) {
  return request<any>("/api/v1/auth/profile", {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    data: body,
    ...(options || {}),
  });
}`,
  ));
}

try {
  await generateService({
    schemaPath: generatedInputPath,
    projectName: 'auto-healing',
    serversPath: path.join(root, 'src', 'services', 'generated'),
    namespace: 'GeneratedAutoHealing',
    requestLibPath: "import { request } from '@umijs/max'",
  });
  patchGeneratedTypings();
  patchGeneratedAuthentication();
} finally {
  if (fs.existsSync(generatedInputPath)) {
    fs.unlinkSync(generatedInputPath);
  }
}

console.log('Generated isolated OpenAPI client at src/services/generated/auto-healing');
