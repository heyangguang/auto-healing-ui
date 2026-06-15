import { mapFlowResponseToGraph } from './flowEditorGraph';

describe('mapFlowResponseToGraph', () => {
  it('normalizes legacy task fields onto execution nodes', () => {
    const mapped = mapFlowResponseToGraph(
      {
        id: 'flow-1',
        name: '旧版任务字段流程',
        is_active: true,
        nodes: [
          {
            id: 'exec-1',
            type: 'execution',
            name: '执行恢复',
            config: {
              task_id: 'task-1',
              task_name: '磁盘恢复模板',
            },
            position: { x: 0, y: 0 },
          },
        ],
        edges: [],
      } as unknown as AutoHealing.HealingFlow,
      jest.fn(),
    );

    expect(mapped.nodes[0]?.data.task_template_id).toBe('task-1');
    expect(mapped.nodes[0]?.data.task_template_name).toBe('磁盘恢复模板');
  });

  it('maps close policy from flow response', () => {
    const mapped = mapFlowResponseToGraph(
      {
        id: 'flow-2',
        name: '自动关单流程',
        is_active: true,
        close_policy: {
          enabled: true,
          solution_template_id: 'template-1',
          default_close_status: 'resolved',
          default_close_code: 'auto_healed',
        },
        nodes: [],
        edges: [],
      } as unknown as AutoHealing.HealingFlow,
      jest.fn(),
    );

    expect(mapped.autoCloseEnabled).toBe(true);
    expect(mapped.closePolicy).toEqual({
      enabled: true,
      solution_template_id: 'template-1',
      default_close_status: 'resolved',
      default_close_code: 'auto_healed',
    });
  });

  it('treats enabled close_policy as auto close', () => {
    const mapped = mapFlowResponseToGraph(
      {
        id: 'flow-3',
        name: '新版自动关单流程',
        is_active: true,
        close_policy: {
          enabled: true,
          solution_template_id: 'template-1',
        },
        nodes: [],
        edges: [],
      } as unknown as AutoHealing.HealingFlow,
      jest.fn(),
    );

    expect(mapped.autoCloseEnabled).toBe(true);
  });
});
