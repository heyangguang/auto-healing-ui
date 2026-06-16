import {
  buildSolutionTemplatePreview,
  buildTemplateEditorValues,
  buildTemplatePayload,
  classifySolutionTemplateVariables,
  DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES,
  filterSolutionTemplates,
  getSolutionTemplateCloseStatusMeta,
  getSolutionTemplateStepsModeMeta,
  solutionTemplateSummary,
  sortSolutionTemplates,
} from './solutionTemplateHelpers';

describe('solution template helpers', () => {
  const templates = [
    {
      id: 'template-a',
      name: '服务恢复模板',
      description: '用于服务故障自动恢复',
      default_close_status: 'resolved',
      steps_render_mode: 'summary',
      updated_at: '2026-04-15T02:20:00Z',
    },
    {
      id: 'template-b',
      name: '磁盘恢复模板',
      description: '用于磁盘故障自动恢复',
      default_close_status: 'closed',
      steps_render_mode: 'detailed',
      updated_at: '2026-04-15T01:20:00Z',
    },
  ] as AutoHealing.IncidentSolutionTemplate[];

  it('filters by search and enum filters', () => {
    expect(
      filterSolutionTemplates(templates, {
        searchField: 'name',
        searchText: '服务',
        closeStatus: 'resolved',
        stepsMode: 'summary',
      }),
    ).toHaveLength(1);
  });

  it('sorts templates by name asc', () => {
    const sorted = sortSolutionTemplates(templates, 'name', 'asc');
    expect(sorted.map((item) => item.name)).toEqual([
      '磁盘恢复模板',
      '服务恢复模板',
    ]);
  });

  it('builds structured preview sections', () => {
    const preview = buildSolutionTemplatePreview({
      conclusion_template: 'AHS 已完成自动修复',
      problem_template: '问题：{{ incident.title }}',
      solution_template: '方案：{{ flow.name }}',
      steps_max_count: 6,
      steps_render_mode: 'summary',
      verification_template: '验证：{{ execution.status }}',
    });

    expect(preview.sections.map((item) => item.title)).toEqual([
      '问题说明',
      '解决方案',
      '执行步骤',
      '验证结果',
      '最终结论',
    ]);
    expect(preview.sections[2].content).toContain('1. 提取工单主机');
  });

  it('summarizes template segments', () => {
    expect(
      solutionTemplateSummary({
        id: 'template-a',
        name: '服务恢复模板',
        problem_template: '问题',
        solution_template: '方案',
        verification_template: '验证',
        conclusion_template: '结论',
      } as AutoHealing.IncidentSolutionTemplate),
    ).toBe('问题说明 / 解决方案 / 验证结果 / 最终结论');
  });

  it('formats backend enum values for display', () => {
    expect(getSolutionTemplateCloseStatusMeta('resolved').label).toBe('已解决');
    expect(getSolutionTemplateStepsModeMeta('detailed').label).toBe('详细步骤');
  });

  it('builds structured payload', () => {
    expect(
      buildTemplatePayload({
        conclusion_template: '  已完成  ',
        name: '  模板  ',
        solution_template: '  已处理  ',
      }),
    ).toEqual(
      expect.objectContaining({
        conclusion_template: '已完成',
        default_close_code: 'auto_healed',
        default_close_status: 'resolved',
        name: '模板',
        solution_template: '已处理',
        steps_render_mode: 'summary',
      }),
    );
  });

  it('includes template name when building editor values', () => {
    expect(
      buildTemplateEditorValues({
        id: 'template-a',
        name: '服务恢复模板',
        solution_template: '方案',
        conclusion_template: '结论',
      } as AutoHealing.IncidentSolutionTemplate),
    ).toEqual(
      expect.objectContaining({
        name: '服务恢复模板',
        solution_template: '方案',
        conclusion_template: '结论',
      }),
    );
  });

  it('clears template name in default form values for create mode', () => {
    expect(DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES.name).toBe('');
  });

  it('classifies built-in and supplemental template variables', () => {
    expect(
      classifySolutionTemplateVariables({
        problem_template:
          '工单 {{ incident.external_id }} 来自 {{ incident.source_plugin_name }}',
        solution_template:
          '执行 {{ execution.run_id }}，流程 {{ flow.instance_id }}',
        verification_template:
          '复核 {{ operator.name }} / {{ system.timestamp }} / {{ close_code }}',
      }),
    ).toEqual({
      extraVariables: ['execution.run_id', 'flow.instance_id'],
      systemVariables: [
        'incident.external_id',
        'incident.source_plugin_name',
        'operator.name',
        'system.timestamp',
        'close_code',
      ],
    });
  });
});
