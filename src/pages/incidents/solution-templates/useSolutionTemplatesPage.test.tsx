import { act, renderHook, waitFor } from '@testing-library/react';
import { getIncidentSolutionTemplates } from '@/services/auto-healing/incidentSolutionTemplates';
import { useSolutionTemplatesPage } from './useSolutionTemplatesPage';

jest.mock('@/services/auto-healing/incidentSolutionTemplates', () => ({
  createIncidentSolutionTemplate: jest.fn(),
  deleteIncidentSolutionTemplate: jest.fn(),
  getIncidentSolutionTemplates: jest.fn(),
  updateIncidentSolutionTemplate: jest.fn(),
}));

describe('useSolutionTemplatesPage', () => {
  it('refreshes detected variables when switching selected templates', async () => {
    (getIncidentSolutionTemplates as jest.Mock).mockResolvedValue([
      {
        id: 'extra-template',
        name: 'Demo Extra Variables Close Template',
        description: '需要执行信息',
        default_close_status: 'resolved',
        problem_template: '工单 {{ incident.external_id }}',
        solution_template:
          '执行 {{ execution.run_id }} / {{ flow.name }} / {{ flow.instance_id }}',
        verification_template:
          '复核 {{ verification.summary }} / {{ verification.operator }}',
        conclusion_template: '完成 {{ incident.title }}',
        updated_at: '2026-06-16T02:00:00Z',
      },
      {
        id: 'approval-template',
        name: 'Demo Approval Close Template',
        description: '只使用系统可填充变量',
        default_close_status: 'resolved',
        problem_template: '工单 {{ incident.external_id }}',
        solution_template:
          '处理 {{ incident.title }} / {{ incident.affected_ci }} / {{ incident.source_plugin_name }}',
        verification_template: '',
        conclusion_template: '由 {{ operator.name }} 确认',
        updated_at: '2026-06-16T01:00:00Z',
      },
    ]);

    const { result } = renderHook(() => useSolutionTemplatesPage());

    await waitFor(() => {
      expect(result.current.selectedId).toBe('extra-template');
      expect(result.current.variableUsage.extraVariables).toEqual([
        'execution.run_id',
        'flow.name',
        'flow.instance_id',
        'verification.summary',
        'verification.operator',
      ]);
    });

    act(() => {
      result.current.handleSelect('approval-template');
    });

    await waitFor(() => {
      expect(result.current.selectedId).toBe('approval-template');
      expect(result.current.variableUsage.extraVariables).toEqual([]);
      expect(result.current.variableUsage.systemVariables).toEqual([
        'incident.external_id',
        'incident.title',
        'incident.affected_ci',
        'incident.source_plugin_name',
        'operator.name',
      ]);
    });
  });
});
