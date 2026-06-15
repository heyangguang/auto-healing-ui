import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { getIncidentSolutionTemplates } from '@/services/auto-healing/incidentSolutionTemplates';
import {
  buildCloseModalTemplateValues,
  IncidentCloseModal,
} from './IncidentCloseModal';

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
}));

jest.mock('@/services/auto-healing/incidentSolutionTemplates', () => ({
  getIncidentSolutionTemplates: jest.fn(),
}));

describe('IncidentCloseModal', () => {
  beforeEach(() => {
    (getIncidentSolutionTemplates as jest.Mock).mockResolvedValue([
      {
        id: 'template-1',
        name: '自动修复模板',
        default_close_code: 'auto_healed',
        default_close_status: 'resolved',
      },
    ]);
  });

  it('parses template vars json before submit', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(
      React.createElement(IncidentCloseModal, {
        loading: false,
        open: true,
        onCancel: jest.fn(),
        onSubmit,
      }),
    );

    await waitFor(() => {
      expect(getIncidentSolutionTemplates).toHaveBeenCalled();
    });

    fireEvent.change(screen.getByLabelText('解决说明'), {
      target: { value: '已恢复' },
    });
    fireEvent.change(screen.getByLabelText('模板变量（JSON）'), {
      target: { value: '{"execution":{"run_id":"run-1"}}' },
    });
    fireEvent.click(screen.getByRole('button', { name: '关闭并回写' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          resolution: '已恢复',
          template_vars: {
            execution: { run_id: 'run-1' },
          },
        }),
      );
    });
  });

  it('builds editable close fields from the selected solution template', () => {
    const values = buildCloseModalTemplateValues(
      {
        id: 'template-1',
        name: '自动修复模板',
        default_close_code: 'auto_healed',
        default_close_status: 'resolved',
        problem_template:
          '工单 {{ incident.external_id }} 触发 {{ incident.title }}',
        solution_template: '执行 {{ incident.category }} 自动化处理',
        verification_template: '确认 {{ incident.affected_ci }} 已恢复',
        conclusion_template: '业务已恢复正常',
      },
      {
        id: 'incident-1',
        external_id: 'R-000040',
        title: '日志目录快速膨胀',
        affected_ci: 'e2e-target-01',
        category: 'clean_logs',
      } as AutoHealing.Incident,
    );

    expect(values.close_code).toBe('auto_healed');
    expect(values.close_status).toBe('resolved');
    expect(values.work_notes).toContain('工单 R-000040 触发 日志目录快速膨胀');
    expect(values.resolution).toContain('【解决方案】');
    expect(values.resolution).toContain('执行 clean_logs 自动化处理');
    expect(values.resolution).toContain('【验证结果】');
    expect(values.resolution).toContain('确认 e2e-target-01 已恢复');
    expect(values.resolution).toContain('【最终结论】');
    expect(values.resolution).toContain('业务已恢复正常');
  });
});
