import fs from 'node:fs';
import path from 'node:path';
import { generateService } from '@umijs/openapi';
import { splitNamespaceTypingsFile } from './namespaceTypingsSplit.mjs';

const root = process.cwd();
const schemaPath = path.join(root, 'config', 'openapi.json');
const generatedInputPath = path.join(root, 'config', '.generated-openapi-runtime.json');
const generatedServiceRoot = path.join(root, 'src', 'services', 'generated', 'auto-healing');
const generatedTypingsPath = path.join(generatedServiceRoot, 'typings.d.ts');
const generatedTypingsDir = path.join(generatedServiceRoot, 'typings');
const GENERATED_MODULES = {
  approvals: {
    routePrefixes: ['/tenant/healing/approvals'],
    aliases: {
      getTenantHealingApprovalsId: 'getTenantHealingApprovalsById',
      postTenantHealingApprovalsIdApprove: 'postTenantHealingApprovalsByIdApprove',
      postTenantHealingApprovalsIdReject: 'postTenantHealingApprovalsByIdReject',
    },
  },
  authentication: {
    routePrefixes: ['/auth'],
    aliases: {},
  },
  cmdb: {
    routePrefixes: ['/tenant/cmdb'],
    aliases: {},
  },
  dashboard: {
    routePrefixes: ['/tenant/dashboard/overview'],
    aliases: {},
  },
  execution: {
    routePrefixes: ['/tenant/execution-tasks'],
    aliases: {
      getTenantExecutionTasksId: 'getTenantExecutionTasksById',
      putTenantExecutionTasksId: 'putTenantExecutionTasksById',
      deleteTenantExecutionTasksId: 'deleteTenantExecutionTasksById',
      postTenantExecutionTasksIdConfirmReview: 'postTenantExecutionTasksByIdConfirmReview',
      postTenantExecutionTasksIdExecute: 'postTenantExecutionTasksByIdExecute',
      getTenantExecutionTasksIdRuns: 'getTenantExecutionTasksByIdRuns',
    },
  },
  flowInstances: {
    routePrefixes: ['/tenant/healing/instances'],
    aliases: {
      getTenantHealingInstancesId: 'getTenantHealingInstancesById',
    },
  },
  gitRepos: {
    routePrefixes: ['/tenant/git-repos'],
    aliases: {
      getTenantGitReposId: 'getTenantGitReposById',
      putTenantGitReposId: 'putTenantGitReposById',
      deleteTenantGitReposId: 'deleteTenantGitReposById',
      postTenantGitReposIdSync: 'postTenantGitReposByIdSync',
      getTenantGitReposIdCommits: 'getTenantGitReposByIdCommits',
      getTenantGitReposIdFiles: 'getTenantGitReposByIdFiles',
      getTenantGitReposIdLogs: 'getTenantGitReposByIdLogs',
      postTenantGitReposIdResetStatus: 'postTenantGitReposByIdResetStatus',
    },
  },
  playbooks: {
    routePrefixes: ['/tenant/playbooks'],
    aliases: {
      postTenantPlaybooksIdScan: 'postTenantPlaybooksByIdScan',
      getTenantPlaybooksId: 'getTenantPlaybooksById',
      putTenantPlaybooksId: 'putTenantPlaybooksById',
      deleteTenantPlaybooksId: 'deleteTenantPlaybooksById',
      getTenantPlaybooksIdFiles: 'getTenantPlaybooksByIdFiles',
      postTenantPlaybooksIdReady: 'postTenantPlaybooksByIdReady',
      postTenantPlaybooksIdOffline: 'postTenantPlaybooksByIdOffline',
      getTenantPlaybooksIdScanLogs: 'getTenantPlaybooksByIdScanLogs',
      putTenantPlaybooksIdVariables: 'putTenantPlaybooksByIdVariables',
    },
  },
  healingFlows: {
    routePrefixes: ['/tenant/healing/flows'],
    aliases: {
      getTenantHealingFlowsId: 'getTenantHealingFlowsById',
      putTenantHealingFlowsId: 'putTenantHealingFlowsById',
      deleteTenantHealingFlowsId: 'deleteTenantHealingFlowsById',
      postTenantHealingFlowsIdDryRun: 'postTenantHealingFlowsByIdDryRun',
      postTenantHealingFlowsIdDryRunStream: 'postTenantHealingFlowsByIdDryRunStream',
    },
  },
  healingRules: {
    routePrefixes: ['/tenant/healing/rules'],
    aliases: {
      getTenantHealingRulesId: 'getTenantHealingRulesById',
      putTenantHealingRulesId: 'putTenantHealingRulesById',
      deleteTenantHealingRulesId: 'deleteTenantHealingRulesById',
      postTenantHealingRulesIdActivate: 'postTenantHealingRulesByIdActivate',
      postTenantHealingRulesIdDeactivate: 'postTenantHealingRulesByIdDeactivate',
    },
  },
  plugins: {
    routePrefixes: ['/tenant/plugins'],
    aliases: {
      getTenantPluginsId: 'getTenantPluginsById',
      putTenantPluginsId: 'putTenantPluginsById',
      deleteTenantPluginsId: 'deleteTenantPluginsById',
      postTenantPluginsIdSync: 'postTenantPluginsByIdSync',
      postTenantPluginsIdActivate: 'postTenantPluginsByIdActivate',
      postTenantPluginsIdDeactivate: 'postTenantPluginsByIdDeactivate',
      postTenantPluginsIdTest: 'postTenantPluginsByIdTest',
      getTenantPluginsIdLogs: 'getTenantPluginsByIdLogs',
    },
  },
  secrets: {
    routePrefixes: ['/tenant/secrets-sources', '/tenant/secrets/query'],
    aliases: {
      getTenantSecretsSourcesId: 'getTenantSecretsSourcesById',
      putTenantSecretsSourcesId: 'putTenantSecretsSourcesById',
      deleteTenantSecretsSourcesId: 'deleteTenantSecretsSourcesById',
      postTenantSecretsSourcesIdEnable: 'postTenantSecretsSourcesByIdEnable',
      postTenantSecretsSourcesIdDisable: 'postTenantSecretsSourcesByIdDisable',
      postTenantSecretsSourcesIdTest: 'postTenantSecretsSourcesByIdTest',
      postTenantSecretsSourcesIdTestQuery: 'postTenantSecretsSourcesByIdTestQuery',
    },
  },
};

const WRAPPER_MODULES = {
  gitPlaybooks: ['gitRepos', 'playbooks'],
};

function buildGeneratedKeepFiles() {
  const keepFiles = new Set(['typings.d.ts']);
  for (const moduleName of Object.keys(GENERATED_MODULES)) {
    keepFiles.add(`${moduleName}.ts`);
  }
  for (const moduleName of Object.keys(WRAPPER_MODULES)) {
    keepFiles.add(`${moduleName}.ts`);
  }
  return keepFiles;
}

function resolveGeneratedModuleTag(routePath) {
  for (const [moduleName, config] of Object.entries(GENERATED_MODULES)) {
    if (config.routePrefixes.some((prefix) => routePath === prefix || routePath.startsWith(`${prefix}/`))) {
      return moduleName;
    }
  }
  return null;
}

const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
const runtimeSchema = {
  ...schema,
  paths: Object.fromEntries(
    Object.entries(schema.paths || {}).map(([routePath, config]) => {
      const normalizedPath = routePath.startsWith('/api/v1/')
        ? routePath
        : `/api/v1${routePath.startsWith('/') ? routePath : `/${routePath}`}`;
      const generatedTag = resolveGeneratedModuleTag(routePath);
      if (!generatedTag || !config || typeof config !== 'object') {
        return [normalizedPath, config];
      }
      return [normalizedPath, Object.fromEntries(
        Object.entries(config).map(([method, operation]) => {
          if (!operation || typeof operation !== 'object') {
            return [method, operation];
          }
          if (!['get', 'post', 'put', 'patch', 'delete', 'head', 'options', 'trace'].includes(method.toLowerCase())) {
            return [method, operation];
          }
          return [method, { ...operation, tags: [generatedTag] }];
        }),
      )];
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

function replaceFunctionSignature(source, functionName, signature) {
  const functionStart = source.indexOf(`export async function ${functionName}(`);
  if (functionStart === -1) {
    return source;
  }
  const signatureEnd = source.indexOf(') {', functionStart);
  if (signatureEnd === -1) {
    return source;
  }
  const nextSignatureStart = signatureEnd + ') {'.length;
  return `${source.slice(0, functionStart)}${signature}${source.slice(nextSignatureStart)}`;
}

function resolveOpenapiRef(document, ref) {
  if (typeof ref !== 'string' || !ref.startsWith('#/')) {
    return null;
  }
  let current = document;
  for (const segment of ref.slice(2).split('/')) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return null;
    }
    current = current[segment];
  }
  return current;
}

function schemaToTs(schema) {
  if (!schema || typeof schema !== 'object') {
    return 'unknown';
  }
  if (Array.isArray(schema.enum) && schema.enum.length > 0) {
    return schema.enum.map((value) => JSON.stringify(value)).join(' | ');
  }
  if (schema.type === 'array') {
    return `${schemaToTs(schema.items)}[]`;
  }
  if (schema.type === 'integer' || schema.type === 'number') {
    return 'number';
  }
  if (schema.type === 'boolean') {
    return 'boolean';
  }
  if (schema.type === 'string') {
    return 'string';
  }
  if (schema.type === 'object' || schema.additionalProperties) {
    return 'Record<string, unknown>';
  }
  return 'unknown';
}

function buildParamTypeBody(document, operation) {
  const parameters = Array.isArray(operation?.parameters) ? operation.parameters : [];
  const fields = [];
  for (const parameter of parameters) {
    const resolved = parameter?.$ref ? resolveOpenapiRef(document, parameter.$ref) : parameter;
    if (!resolved || typeof resolved !== 'object' || typeof resolved.name !== 'string' || resolved.name.trim().length === 0) {
      continue;
    }
    const schema = resolved.schema || {};
    const tsType = schemaToTs(schema);
    const optional = resolved.required ? '' : '?';
    fields.push(`                '${resolved.name}'${optional}: ${tsType};`);
  }
  if (fields.length === 0) {
    return null;
  }
  return `          {\n${fields.join('\n')}\n          }`;
}

function patchGeneratedTypings() {
  rewriteFile(generatedTypingsPath, (source) => {
    let nextSource = source.replace(/^\s+['"]{2}\?: any;\n/gm, '');
    nextSource = nextSource.replace(/Record<string, any>/g, 'Record<string, unknown>');
    nextSource = nextSource.replace(/\bany\[\]/g, 'unknown[]');
    nextSource = nextSource.replace(/default\?: any;/g, 'default?: unknown;');
    nextSource = nextSource.replace(/value\?: any;/g, 'value?: unknown;');
    const operations = Object.values(runtimeSchema.paths || {}).flatMap((operationGroup) =>
      Object.values(operationGroup || {}).filter((operation) => operation && typeof operation === 'object' && typeof operation.operationId === 'string'),
    );
    for (const operation of operations) {
      const typeBody = buildParamTypeBody(runtimeSchema, operation);
      if (!typeBody) {
        continue;
      }
      const typeName = `${operation.operationId}Params`;
      const pattern = new RegExp(`type ${typeName} = \\{[\\s\\S]*?\\n\\s*\\};`, 'm');
      nextSource = nextSource.replace(pattern, `type ${typeName} = ${typeBody};`);
    }
    return nextSource;
  });
  splitNamespaceTypingsFile({
    filePath: generatedTypingsPath,
    namespaceName: 'GeneratedAutoHealing',
    filePrefix: 'generated-typings',
  });
}

function patchGeneratedAuthentication() {
  const authenticationPath = path.join(generatedServiceRoot, 'authentication.ts');
  if (!fs.existsSync(authenticationPath)) {
    throw new Error('Failed to locate generated auth module');
  }
  rewriteFile(authenticationPath, (source) => source.replace(
    /export async function putAuthProfile\(options\?: \{ \[key: string\]: any \}\) \{\n {2}return request<any>\("\/api\/v1\/auth\/profile", \{\n {4}method: "PUT",\n {4}\.\.\.\(options \|\| \{\}\),\n {2}\}\);\n\}/,
    `export async function putAuthProfile(
  body: GeneratedAutoHealing.UpdateProfileRequest,
  options?: Record<string, unknown>
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

function patchGeneratedPlugins() {
  const pluginsPath = path.join(generatedServiceRoot, 'plugins.ts');
  if (!fs.existsSync(pluginsPath)) {
    throw new Error('Failed to locate generated plugins module');
  }
  rewriteFile(pluginsPath, (source) => {
    let nextSource = replaceFunctionSignature(
      source,
      'postTenantPlugins',
      `export async function postTenantPlugins(
  body: AutoHealing.CreatePluginRequest,
  options?: Record<string, unknown>
) {`,
    );
    nextSource = replaceFunctionSignature(
      nextSource,
      'putTenantPluginsById',
      `export async function putTenantPluginsById(
  // 叠加生成的Param类型 (非body参数swagger默认没有生成对象)
  params: GeneratedAutoHealing.putTenantPluginsByIdParams,
  body: AutoHealing.UpdatePluginRequest,
  options?: Record<string, unknown>
) {`,
    );
    return nextSource;
  });
}

function patchGeneratedServiceFiles() {
  const generatedFiles = fs.readdirSync(generatedServiceRoot).filter(
    (fileName) => fileName.endsWith('.ts') && fileName !== 'typings.d.ts',
  );
  for (const fileName of generatedFiles) {
    const filePath = path.join(generatedServiceRoot, fileName);
    rewriteFile(filePath, (source) => {
      let nextSource = source.replace(/options\?: \{ \[key: string\]: any \}/g, 'options?: Record<string, unknown>');
      nextSource = nextSource.replace(/Record<string, any>/g, 'Record<string, unknown>');
      nextSource = nextSource.replace(/\bany\[\]/g, 'unknown[]');
      nextSource = nextSource.replace(/request<any>\(/g, 'request<unknown>(');
      nextSource = nextSource.replace(/data\?: any([;,)])/g, 'data?: unknown$1');
      nextSource = nextSource.replace(/:\s*any([;,)])/g, ': unknown$1');
      nextSource = nextSource.replace(/\[key: string\]: any;/g, '[key: string]: unknown;');
      return nextSource;
    });
  }
}

function pruneGeneratedServices() {
  const keepFiles = buildGeneratedKeepFiles();
  const generatedFiles = fs.readdirSync(generatedServiceRoot);
  for (const fileName of generatedFiles) {
    const absolutePath = path.join(generatedServiceRoot, fileName);
    if (!fs.statSync(absolutePath).isFile()) {
      continue;
    }
    if (!keepFiles.has(fileName)) {
      fs.unlinkSync(absolutePath);
    }
  }
}

function appendLegacyAliases() {
  for (const [moduleName, config] of Object.entries(GENERATED_MODULES)) {
    const filePath = path.join(generatedServiceRoot, `${moduleName}.ts`);
    if (!fs.existsSync(filePath)) {
      continue;
    }
    const source = fs.readFileSync(filePath, 'utf8');
    const lines = [];
    for (const [legacyName, currentName] of Object.entries(config.aliases)) {
      if (source.includes(`export async function ${currentName}(`)) {
        lines.push(`export { ${currentName} as ${legacyName} };`);
      }
    }
    if (lines.length > 0) {
      fs.appendFileSync(filePath, `\n${lines.join('\n')}\n`, 'utf8');
    }
  }
}

function writeWrapperModules() {
  for (const [moduleName, sources] of Object.entries(WRAPPER_MODULES)) {
    const lines = sources.map((source) => `export * from "./${source}";`);
    fs.writeFileSync(path.join(generatedServiceRoot, `${moduleName}.ts`), `${lines.join('\n')}\n`, 'utf8');
  }
}

try {
  if (fs.existsSync(generatedTypingsPath)) {
    fs.unlinkSync(generatedTypingsPath);
  }
  if (fs.existsSync(generatedTypingsDir)) {
    fs.rmSync(generatedTypingsDir, { recursive: true, force: true });
  }
  await generateService({
    schemaPath: generatedInputPath,
    projectName: 'auto-healing',
    serversPath: path.join(root, 'src', 'services', 'generated'),
    namespace: 'GeneratedAutoHealing',
    requestLibPath: "import { request } from '@umijs/max'",
  });
  patchGeneratedTypings();
  splitNamespaceTypingsFile({
    filePath: path.join(generatedServiceRoot, 'typings.d.ts'),
    namespaceName: 'GeneratedAutoHealing',
    chunkDirName: 'typings',
    filePrefix: 'generated',
  });
  patchGeneratedAuthentication();
  patchGeneratedServiceFiles();
  patchGeneratedPlugins();
  appendLegacyAliases();
  writeWrapperModules();
  pruneGeneratedServices();
} finally {
  if (fs.existsSync(generatedInputPath)) {
    fs.unlinkSync(generatedInputPath);
  }
}

console.log('Generated isolated OpenAPI client at src/services/generated/auto-healing');
