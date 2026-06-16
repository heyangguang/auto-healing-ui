import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import {
  getIncidentSolutionTemplate,
  getIncidentSolutionTemplates,
} from '@/services/auto-healing/incidentSolutionTemplates';
import {
  buildCloseModalTemplateValues,
  IncidentCloseModal,
} from './IncidentCloseModal';

jest.mock('@umijs/max', () => ({
  history: { push: jest.fn() },
}));

jest.mock('@/services/auto-healing/incidentSolutionTemplates', () => ({
  getIncidentSolutionTemplate: jest.fn(),
  getIncidentSolutionTemplates: jest.fn(),
}));

async function selectTemplateOption(label: string) {
  const selector = document.querySelector('.ant-select');
  expect(selector).toBeTruthy();
  fireEvent.mouseDown(selector as Element);
  await waitFor(() => {
    expect(document.querySelector('.ant-select-dropdown')).toBeTruthy();
  });
  const optionContent = Array.from(
    document.querySelectorAll('.ant-select-item-option-content'),
  ).find((item) => item.textContent === label);
  expect(optionContent).toBeTruthy();
  const option = optionContent?.closest('.ant-select-item-option');
  expect(option).toBeTruthy();
  fireEvent.mouseDown(option as Element);
  fireEvent.click(option as Element);
}

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
    (getIncidentSolutionTemplate as jest.Mock).mockResolvedValue({
      id: 'template-1',
      name: '自动修复模板',
      default_close_code: 'auto_healed',
      default_close_status: 'resolved',
      problem_template:
        '工单 {{ incident.external_id }} 触发 {{ incident.title }}',
      solution_template: '执行 {{ incident.category }} 自动化处理',
      verification_template: '确认 {{ incident.affected_ci }} 已恢复',
      conclusion_template: '业务已恢复正常',
    });
  });

  it('submits detected supplemental template variables as template vars', async () => {
    (getIncidentSolutionTemplate as jest.Mock).mockResolvedValue({
      id: 'template-1',
      name: '自动修复模板',
      default_close_code: 'auto_healed',
      default_close_status: 'resolved',
      solution_template:
        '工单 {{ incident.external_id }} 执行编号 {{ execution.run_id }}',
      verification_template: '执行结果 {{ input.execution.message }}',
    });
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

    await selectTemplateOption('自动修复模板');

    await waitFor(() => {
      expect(getIncidentSolutionTemplate).toHaveBeenCalledWith('template-1');
    });

    await waitFor(() => {
      expect(screen.getByLabelText('execution.run_id')).toBeTruthy();
      expect(screen.getByLabelText('execution.message')).toBeTruthy();
    });
    expect(screen.getByText('系统内置变量')).toBeTruthy();
    expect(screen.getByText('incident.external_id')).toBeTruthy();
    expect(screen.getByText('operator.name')).toBeTruthy();
    expect(screen.queryByLabelText('incident.external_id')).toBeNull();

    fireEvent.change(screen.getByLabelText('execution.run_id'), {
      target: { value: 'run-1' },
    });
    fireEvent.change(screen.getByLabelText('execution.message'), {
      target: { value: '人工确认恢复正常' },
    });
    fireEvent.click(screen.getByRole('button', { name: '关闭并回写' }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          template_vars: {
            execution: {
              message: '人工确认恢复正常',
              run_id: 'run-1',
            },
          },
        }),
      );
    });
  });

  it('loads template detail and fills editable fields when selected template has only summary fields', async () => {
    render(
      React.createElement(IncidentCloseModal, {
        incident: {
          id: 'incident-1',
          external_id: 'R-000040',
          title: '日志目录快速膨胀',
          affected_ci: 'e2e-target-01',
          category: 'clean_logs',
        } as AutoHealing.Incident,
        loading: false,
        open: true,
        onCancel: jest.fn(),
        onSubmit: jest.fn(),
      }),
    );

    await waitFor(() => {
      expect(getIncidentSolutionTemplates).toHaveBeenCalled();
    });

    await selectTemplateOption('自动修复模板');

    await waitFor(() => {
      expect(getIncidentSolutionTemplate).toHaveBeenCalledWith('template-1');
      expect(screen.getByLabelText('解决说明')).toHaveProperty(
        'value',
        expect.stringContaining('执行 clean_logs 自动化处理'),
      );
    });
    expect(screen.getByLabelText('处理备注')).toHaveProperty(
      'value',
      expect.stringContaining('工单 R-000040 触发 日志目录快速膨胀'),
    );
    expect(screen.getByLabelText('处理备注')).toHaveProperty(
      'value',
      expect.stringContaining('执行 clean_logs 自动化处理'),
    );
  });

  it('refreshes generated notes when switching templates before manual edits', async () => {
    (getIncidentSolutionTemplates as jest.Mock).mockResolvedValue([
      {
        id: 'template-1',
        name: '进程处置模板',
        default_close_code: 'auto_healed',
        default_close_status: 'resolved',
      },
      {
        id: 'template-2',
        name: '黑名单拦截模板',
        default_close_code: 'auto_healed',
        default_close_status: 'resolved',
      },
    ]);
    (getIncidentSolutionTemplate as jest.Mock).mockImplementation(
      async (id: string) => ({
        id,
        name: id === 'template-1' ? '进程处置模板' : '黑名单拦截模板',
        default_close_code: 'auto_healed',
        default_close_status: 'resolved',
        problem_template:
          '工单 {{ incident.external_id }} 触发 {{ incident.title }}',
        solution_template:
          id === 'template-1'
            ? '终止异常进程并确认进程数量为 0'
            : '拦截命中的黑名单命令，阻断危险操作',
        verification_template:
          id === 'template-1'
            ? '确认异常进程已关闭'
            : '确认风险操作未在目标机执行',
        conclusion_template: '业务风险已消除',
      }),
    );

    render(
      React.createElement(IncidentCloseModal, {
        incident: {
          id: 'incident-1',
          external_id: 'R-000041',
          title: '日志目录快速膨胀',
        } as AutoHealing.Incident,
        loading: false,
        open: true,
        onCancel: jest.fn(),
        onSubmit: jest.fn(),
      }),
    );

    await waitFor(() => {
      expect(getIncidentSolutionTemplates).toHaveBeenCalled();
    });

    await selectTemplateOption('进程处置模板');

    await waitFor(() => {
      expect(screen.getByLabelText('处理备注')).toHaveProperty(
        'value',
        expect.stringContaining('终止异常进程并确认进程数量为 0'),
      );
    });

    await selectTemplateOption('黑名单拦截模板');

    await waitFor(() => {
      expect(screen.getByLabelText('处理备注')).toHaveProperty(
        'value',
        expect.stringContaining('拦截命中的黑名单命令，阻断危险操作'),
      );
    });
    expect(screen.getByLabelText('处理备注')).not.toHaveProperty(
      'value',
      expect.stringContaining('终止异常进程并确认进程数量为 0'),
    );
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
    expect(values.work_notes).toContain('【处理动作】');
    expect(values.work_notes).toContain('执行 clean_logs 自动化处理');
    expect(values.work_notes).toContain('【验证结果】');
    expect(values.work_notes).toContain('确认 e2e-target-01 已恢复');
    expect(values.resolution).toContain('【解决方案】');
    expect(values.resolution).toContain('执行 clean_logs 自动化处理');
    expect(values.resolution).toContain('【验证结果】');
    expect(values.resolution).toContain('确认 e2e-target-01 已恢复');
    expect(values.resolution).toContain('【最终结论】');
    expect(values.resolution).toContain('业务已恢复正常');
  });

  it('uses supplemental template variables when rendering close fields', () => {
    const values = buildCloseModalTemplateValues(
      {
        id: 'template-1',
        name: '自动修复模板',
        default_close_code: 'auto_healed',
        default_close_status: 'resolved',
        problem_template: '执行编号 {{ execution.run_id }}',
        solution_template: '执行结果 {{ input.execution.message }}',
      },
      {
        id: 'incident-1',
      } as AutoHealing.Incident,
      {
        execution: {
          message: '人工确认恢复正常',
          run_id: 'run-1',
        },
      },
    );

    expect(values.work_notes).toContain('执行编号 run-1');
    expect(values.work_notes).toContain('执行结果 人工确认恢复正常');
    expect(values.resolution).toContain('执行结果 人工确认恢复正常');
  });
});
