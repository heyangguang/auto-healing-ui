export type SolutionTemplateSearchParams = {
  searchField?: string;
  searchValue?: string;
  filters?: { field: string; value: string }[];
};

export type SolutionTemplateSortField = 'created_at' | 'name' | 'updated_at';
export type SolutionTemplateSortOrder = 'asc' | 'desc';

export type SolutionTemplateFormValues = {
  name?: string;
  description?: string;
  problem_template?: string;
  solution_template?: string;
  verification_template?: string;
  conclusion_template?: string;
  steps_render_mode?: 'summary' | 'detailed';
  steps_max_count?: number;
  step_output_max_length?: number;
  default_close_code?: string;
  default_close_status?: 'resolved' | 'closed';
};

export type SolutionTemplateVariableDefinition = {
  path: string;
  description: string;
};

export type SolutionTemplateVariableGroup = {
  label: string;
  description: string;
  variables: SolutionTemplateVariableDefinition[];
};

export type SolutionTemplateVariableUsage = {
  extraVariables: string[];
  systemVariables: string[];
};

export const SOLUTION_TEMPLATE_BUILT_IN_VARIABLE_GROUPS: SolutionTemplateVariableGroup[] =
  [
    {
      label: '工单',
      description: '来自当前工单，适合写问题背景和影响对象。',
      variables: [
        { path: 'incident.external_id', description: '源工单编号' },
        { path: 'incident.title', description: '工单标题' },
        { path: 'incident.affected_ci', description: '影响资产' },
        { path: 'incident.source_plugin_name', description: '来源系统' },
        { path: 'incident.status', description: '当前状态' },
        { path: 'incident.category', description: '故障分类' },
      ],
    },
    {
      label: '操作人',
      description: '来自关单动作或自动流程的操作者信息。',
      variables: [{ path: 'operator.name', description: '操作人名称' }],
    },
    {
      label: '系统',
      description: '由系统在渲染模板时自动生成。',
      variables: [
        { path: 'system.timestamp', description: '渲染时间' },
        { path: 'system.trigger_source', description: '触发来源' },
      ],
    },
    {
      label: '回写',
      description: '来自当前关单回写参数。',
      variables: [
        { path: 'close_code', description: '关闭码' },
        { path: 'close_status', description: '关闭状态' },
      ],
    },
  ];

export const SOLUTION_TEMPLATE_SYSTEM_VARIABLE_ROOTS = new Set([
  'close_code',
  'close_status',
  'incident',
  'operator',
  'system',
]);

export const SOLUTION_TEMPLATE_CLOSE_STATUS_META = {
  closed: { color: 'default', label: '已关闭' },
  resolved: { color: 'blue', label: '已解决' },
} as const;

export const SOLUTION_TEMPLATE_STEPS_MODE_META = {
  detailed: { color: 'geekblue', label: '详细步骤' },
  summary: { color: 'default', label: '摘要步骤' },
} as const;

export const DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES: SolutionTemplateFormValues =
  {
    conclusion_template: '',
    default_close_code: 'auto_healed',
    default_close_status: 'resolved',
    description: '',
    name: '',
    problem_template: '',
    solution_template: '',
    step_output_max_length: 240,
    steps_max_count: 6,
    steps_render_mode: 'summary',
    verification_template: '',
  };

export function getSolutionTemplateCloseStatusMeta(status?: string) {
  return (
    SOLUTION_TEMPLATE_CLOSE_STATUS_META[
      (status || 'resolved') as keyof typeof SOLUTION_TEMPLATE_CLOSE_STATUS_META
    ] || { color: 'default', label: status || '已解决' }
  );
}

export function getSolutionTemplateStepsModeMeta(mode?: string) {
  return (
    SOLUTION_TEMPLATE_STEPS_MODE_META[
      (mode || 'summary') as keyof typeof SOLUTION_TEMPLATE_STEPS_MODE_META
    ] || { color: 'default', label: mode || '摘要步骤' }
  );
}

export const SOLUTION_TEMPLATE_SEARCH_FIELDS = [
  { key: 'name', label: '模板名称' },
  { key: 'description', label: '模板描述' },
];

export const SOLUTION_TEMPLATE_COLUMNS = [
  {
    columnKey: 'default_close_status',
    columnTitle: '默认状态',
    dataIndex: 'default_close_status',
    headerFilters: [
      { label: '已解决', value: 'resolved' },
      { label: '已关闭', value: 'closed' },
    ],
  },
  {
    columnKey: 'steps_render_mode',
    columnTitle: '步骤模式',
    dataIndex: 'steps_render_mode',
    headerFilters: [
      { label: '摘要', value: 'summary' },
      { label: '详细', value: 'detailed' },
    ],
  },
];

export const SOLUTION_TEMPLATE_SORT_OPTIONS = [
  { value: 'updated_at', label: '更新时间' },
  { value: 'created_at', label: '创建时间' },
  { value: 'name', label: '模板名称' },
];

export const buildTemplatePayload = (
  values: SolutionTemplateFormValues,
): AutoHealing.CreateIncidentSolutionTemplateRequest => ({
  conclusion_template: values.conclusion_template?.trim() || '',
  default_close_code:
    values.default_close_code?.trim() ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.default_close_code,
  default_close_status:
    values.default_close_status ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.default_close_status,
  description: values.description?.trim() || '',
  name: values.name?.trim() || '',
  problem_template: values.problem_template?.trim() || '',
  solution_template: values.solution_template?.trim() || '',
  step_output_max_length:
    values.step_output_max_length ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.step_output_max_length,
  steps_max_count:
    values.steps_max_count ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.steps_max_count,
  steps_render_mode:
    values.steps_render_mode ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.steps_render_mode,
  verification_template: values.verification_template?.trim() || '',
});

export const buildTemplateEditorValues = (
  template?: AutoHealing.IncidentSolutionTemplate | null,
): SolutionTemplateFormValues => ({
  ...DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES,
  conclusion_template: template?.conclusion_template || '',
  default_close_code:
    template?.default_close_code ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.default_close_code,
  default_close_status:
    (template?.default_close_status as 'resolved' | 'closed' | undefined) ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.default_close_status,
  description: template?.description || '',
  name: template?.name || '',
  problem_template: template?.problem_template || '',
  solution_template: template?.solution_template || '',
  step_output_max_length:
    template?.step_output_max_length ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.step_output_max_length,
  steps_max_count:
    template?.steps_max_count ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.steps_max_count,
  steps_render_mode:
    (template?.steps_render_mode as 'summary' | 'detailed' | undefined) ||
    DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.steps_render_mode,
  verification_template: template?.verification_template || '',
});

export const parseSolutionTemplateSearchParams = (
  params: SolutionTemplateSearchParams,
) => {
  const filters = params.filters || [];
  const findFilterValue = (field: string) =>
    filters.find((item) => item.field === field)?.value;
  return {
    searchField: params.searchField || 'name',
    searchText: params.searchValue?.trim() || '',
    closeStatus: findFilterValue('__enum__default_close_status') || 'all',
    stepsMode: findFilterValue('__enum__steps_render_mode') || 'all',
  };
};

export const buildSolutionTemplatePreview = (
  values: SolutionTemplateFormValues,
) => {
  const context = buildPreviewVariables();
  const problem = renderTemplate(values.problem_template, context);
  const solution = renderTemplate(values.solution_template, context);
  const verification = renderTemplate(values.verification_template, context);
  const conclusion = renderTemplate(values.conclusion_template, context);
  const steps = buildPreviewSteps(values, context);
  return {
    conclusion,
    sections: [
      { key: 'problem', title: '问题说明', content: problem },
      { key: 'solution', title: '解决方案', content: solution },
      { key: 'steps', title: '执行步骤', content: steps },
      { key: 'verification', title: '验证结果', content: verification },
      { key: 'conclusion', title: '最终结论', content: conclusion },
    ].filter((section) => section.content.trim().length > 0),
  };
};

export function classifySolutionTemplateVariables(
  values?: Partial<SolutionTemplateFormValues> | null,
): SolutionTemplateVariableUsage {
  const systemVariables: string[] = [];
  const extraVariables: string[] = [];
  const seen = new Set<string>();
  const collect = (content?: string) => {
    for (const match of content?.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g) ||
      []) {
      const path = match[1];
      if (!path || seen.has(path)) {
        continue;
      }
      seen.add(path);
      const root = path.split('.')[0];
      if (SOLUTION_TEMPLATE_SYSTEM_VARIABLE_ROOTS.has(root)) {
        systemVariables.push(path);
      } else {
        extraVariables.push(path);
      }
    }
  };
  collect(values?.problem_template);
  collect(values?.solution_template);
  collect(values?.verification_template);
  collect(values?.conclusion_template);
  return { extraVariables, systemVariables };
}

export const sortSolutionTemplates = (
  templates: AutoHealing.IncidentSolutionTemplate[],
  sortBy: SolutionTemplateSortField,
  sortOrder: SolutionTemplateSortOrder,
) =>
  [...templates].sort((left, right) => {
    const leftValue = solutionTemplateSortValue(left, sortBy);
    const rightValue = solutionTemplateSortValue(right, sortBy);
    const result = leftValue.localeCompare(rightValue, 'zh-CN');
    return sortOrder === 'asc' ? result : -result;
  });

export const filterSolutionTemplates = (
  templates: AutoHealing.IncidentSolutionTemplate[],
  options: {
    searchField: string;
    searchText: string;
    closeStatus: string;
    stepsMode: string;
  },
) =>
  templates.filter((template) => {
    if (
      options.closeStatus !== 'all' &&
      template.default_close_status !== options.closeStatus
    ) {
      return false;
    }
    if (
      options.stepsMode !== 'all' &&
      (template.steps_render_mode || 'summary') !== options.stepsMode
    ) {
      return false;
    }
    if (!options.searchText) {
      return true;
    }
    const normalized = options.searchText.toLowerCase();
    const candidates = solutionTemplateSearchCandidates(
      template,
      options.searchField,
    );
    return candidates.some((candidate) =>
      candidate.toLowerCase().includes(normalized),
    );
  });

export const solutionTemplateSummary = (
  template?: AutoHealing.IncidentSolutionTemplate | null,
) => {
  if (!template) {
    return '';
  }
  const segments = [
    template.problem_template ? '问题说明' : '',
    template.solution_template ? '解决方案' : '',
    template.verification_template ? '验证结果' : '',
    template.conclusion_template ? '最终结论' : '',
  ].filter(Boolean);
  return segments.join(' / ');
};

function solutionTemplateSearchCandidates(
  template: AutoHealing.IncidentSolutionTemplate,
  searchField: string,
) {
  if (searchField === 'description') {
    return [
      template.description || '',
      template.solution_template || '',
      template.problem_template || '',
    ];
  }
  return [
    template.name || '',
    template.description || '',
    template.solution_template || '',
    template.problem_template || '',
    template.conclusion_template || '',
  ];
}

function solutionTemplateSortValue(
  template: AutoHealing.IncidentSolutionTemplate,
  sortBy: SolutionTemplateSortField,
) {
  if (sortBy === 'name') {
    return template.name || '';
  }
  return template[sortBy] || '';
}

function buildPreviewSteps(
  values: SolutionTemplateFormValues,
  context: Record<string, unknown>,
) {
  const rendered = renderTemplate('{{ steps_text }}', {
    ...context,
    steps_text: sampleStepsText(values.steps_render_mode || 'summary'),
  });
  return rendered === '{{ steps_text }}'
    ? sampleStepsText(values.steps_render_mode || 'summary')
    : rendered;
}

function sampleStepsText(mode: string) {
  if (mode === 'detailed') {
    return [
      '1. 提取工单主机：识别 1 台主机（completed）',
      '   输出：real-host-100',
      '2. CMDB 验证：主机存在且状态正常（completed）',
      '   输出：valid=1 invalid=0',
      '3. 执行服务恢复：执行成功（completed）',
      '   输出：run=run-demo-001',
    ].join('\n');
  }
  return [
    '1. 提取工单主机：识别 1 台主机（completed）',
    '2. CMDB 验证：主机存在且状态正常（completed）',
    '3. 执行服务恢复：执行成功（completed）',
  ].join('\n');
}

function buildPreviewVariables() {
  return {
    close_code: 'auto_healed',
    close_status: 'resolved',
    execution: {
      message: '执行成功',
      run_id: 'run-demo-001',
      status: 'completed',
      target_hosts: '192.168.31.100',
    },
    flow: {
      instance_id: 'flow-demo-001',
      name: 'iTop 服务故障自动恢复',
    },
    incident: {
      affected_ci: 'real-host-100',
      affected_service: 'auto-healing-lab-http',
      external_id: 'R-000999',
      title:
        '[high] service_health_check_failed on real-host-100 | demo incident',
    },
    operator: {
      name: 'system:auto-close',
    },
    system: {
      timestamp: '2026-04-15T02:30:00Z',
      trigger_source: 'flow_auto_close',
    },
  };
}

export function renderTemplate(
  template = '',
  context: Record<string, unknown>,
) {
  return template
    .replace(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g, (_match, path) => {
      const resolved = resolvePreviewPath(context, path as string);
      return resolved == null ? `{{ ${path} }}` : String(resolved);
    })
    .trim();
}

function resolvePreviewPath(context: Record<string, unknown>, path: string) {
  let current: unknown = context;
  for (const segment of path.split('.')) {
    if (!current || typeof current !== 'object' || Array.isArray(current)) {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}
