import { getExecutionTask } from '@/services/auto-healing/execution';
import { getPlaybook } from '@/services/auto-healing/playbooks';
import {
  buildFlowPayload,
  validateExecutionNodes,
} from './flowEditorPersistence';

jest.mock('@/services/auto-healing/execution', () => ({
  getExecutionTask: jest.fn(),
}));

jest.mock('@/services/auto-healing/playbooks', () => ({
  getPlaybook: jest.fn(),
}));

function createExecutionNode(id: string, data?: Record<string, unknown>) {
  return {
    id,
    type: 'execution',
    position: { x: 0, y: 0 },
    data: {
      label: `执行节点-${id}`,
      type: 'execution',
      ...data,
    },
  } as any;
}

describe('validateExecutionNodes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('returns a blocking issue when an execution node has no task template', async () => {
    const result = await validateExecutionNodes([
      createExecutionNode('node-1'),
    ]);

    expect(result).toEqual({
      issue: {
        missingVars: ['task_template_id'],
        node: expect.objectContaining({ id: 'node-1' }),
      },
      unavailableNodeLabels: [],
    });
  });

  it('keeps save validation non-blocking when remote template lookup fails', async () => {
    (getExecutionTask as jest.Mock).mockRejectedValueOnce(
      new Error('network down'),
    );

    const result = await validateExecutionNodes([
      createExecutionNode('node-2', { task_template_id: 'task-2' }),
    ]);

    expect(result.issue).toBeNull();
    expect(result.unavailableNodeLabels).toEqual(['执行节点-node-2']);
  });

  it('returns missing required variables from playbook definitions', async () => {
    (getExecutionTask as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 'task-3',
        extra_vars: {},
        playbook: { id: 'playbook-3' },
      },
    });
    (getPlaybook as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 'playbook-3',
        variables: [{ name: 'host', required: true }],
      },
    });

    const result = await validateExecutionNodes([
      createExecutionNode('node-3', { task_template_id: 'task-3' }),
    ]);

    expect(result.issue).toEqual({
      missingVars: ['host'],
      node: expect.objectContaining({ id: 'node-3' }),
    });
    expect(result.unavailableNodeLabels).toEqual([]);
  });

  it('accepts legacy task_id when validating execution nodes', async () => {
    (getExecutionTask as jest.Mock).mockResolvedValueOnce({
      data: {
        id: 'task-legacy',
        extra_vars: {},
      },
    });

    const result = await validateExecutionNodes([
      createExecutionNode('node-legacy', { task_id: 'task-legacy' }),
    ]);

    expect(result).toEqual({
      issue: null,
      unavailableNodeLabels: [],
    });
    expect(getExecutionTask).toHaveBeenCalledWith('task-legacy');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});

describe('buildFlowPayload', () => {
  it('includes close policy only when auto close is enabled', () => {
    const payload = buildFlowPayload(
      true,
      {
        enabled: true,
        solution_template_id: 'template-1',
        default_close_status: 'resolved',
        default_close_code: 'auto_healed',
      },
      [],
      true,
      '自动关单流程',
      [],
    );

    expect('auto_close_source_incident' in payload).toBe(false);
    expect(payload.close_policy).toEqual({
      enabled: true,
      solution_template_id: 'template-1',
      default_close_status: 'resolved',
      default_close_code: 'auto_healed',
    });
  });
});
