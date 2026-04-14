import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import InstanceContextDrawer from './InstanceContextDrawer';

jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  const ReactLocal = require('react');

  return {
    ...actual,
    Drawer: ({ open, children }: { open: boolean; children?: unknown }) => (
      open ? ReactLocal.createElement('div', null, children) : null
    ),
  };
});

jest.mock('../components/JsonPrettyView', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'json-pretty-view');
  },
}));

jest.mock('./InstanceExecutionResultTab', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'execution-result-tab');
  },
}));

jest.mock('./InstanceRecoveryAttemptsCard', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'recovery-attempts-card');
  },
}));

const baseProps = {
  contextData: {
    status: 'completed',
    message: '流程执行完成',
    target_hosts: ['real-host-101', 'real-host-102'],
    incident: {
      id: 'incident-1',
      external_id: 'ITOP-1001',
      title: 'iTop 磁盘审批恢复',
      description: '<p>磁盘使用率连续三次超阈值</p><p>请先确认临时文件占用情况。</p>',
      severity: 'high',
      priority: '2',
      status: 'in_progress',
      category: 'storage',
      affected_ci: 'real-host-101',
      affected_service: 'node-exporter',
      assignee: 'ops-a',
      reporter: 'ops-b',
      source_plugin_name: 'iTop',
      raw_data: {
        threshold: 85,
        current_value: 90,
        reviewers: ['ops-a', 'ops-b'],
        extra_context: {
          env: 'production',
          affected_ci: 'real-host-101',
        },
      },
    },
    execution_result: {
      status: 'success',
      task_id: 'task-001',
      duration_ms: 1200,
      target_hosts: 'real-host-101',
    },
  },
  instance: {
    flow_name: '磁盘恢复流程',
    created_at: '2026-04-14T09:06:09Z',
    completed_at: '2026-04-14T09:51:56Z',
  } as AutoHealing.FlowInstance,
  instanceStatus: 'completed',
  onClose: jest.fn(),
  onRecover: jest.fn(),
  open: true,
  recoverSubmitting: false,
  recoveryAttempts: [],
  recoveryAttemptsLoading: false,
  showRecoverAction: false,
};

describe('InstanceContextDrawer', () => {
  it('uses work order copy and custom field layout in the incident tab', () => {
    const { container } = render(React.createElement(InstanceContextDrawer, baseProps));

    fireEvent.click(screen.getByRole('tab', { name: /关联工单/ }));

    expect(screen.getByRole('tab', { name: /关联工单/ })).toBeTruthy();
    expect(screen.queryByRole('tab', { name: /关联告警/ })).toBeNull();
    expect(screen.getByText('工单标题')).toBeTruthy();
    expect(screen.queryByText('告警标题')).toBeNull();
    expect(screen.getByText('描述')).toBeTruthy();
    expect(screen.getByText(/磁盘使用率连续三次超阈值/)).toBeTruthy();
    expect(container.querySelector('.instance-context-field-label')).toBeTruthy();
    expect(container.querySelector('.ant-descriptions')).toBeNull();
  });

  it('renders raw incident data as structured content instead of preformatted code', () => {
    const { container } = render(React.createElement(InstanceContextDrawer, baseProps));

    fireEvent.click(screen.getByRole('tab', { name: /关联工单/ }));

    expect(screen.getByText('原始数据')).toBeTruthy();
    expect(screen.getByText('json-pretty-view')).toBeTruthy();
    expect(container.querySelector('.instance-context-card')).toBeTruthy();
  });

  it('shows global context summary before the raw context json', () => {
    render(React.createElement(InstanceContextDrawer, baseProps));

    fireEvent.click(screen.getByRole('tab', { name: /全局上下文/ }));

    expect(screen.getAllByText('全局上下文').length).toBeGreaterThan(1);
    expect(screen.getByText('关联工单摘要')).toBeTruthy();
    expect(screen.getByText('执行结果摘要')).toBeTruthy();
    expect(screen.getByText('基础变量')).toBeTruthy();
    expect(screen.getByText('原始上下文')).toBeTruthy();
    expect(screen.getByText('流程执行完成')).toBeTruthy();
    expect(screen.getAllByText('real-host-101').length).toBeGreaterThan(0);
    expect(screen.getByText('json-pretty-view')).toBeTruthy();
  });
});
