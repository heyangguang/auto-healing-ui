import React from 'react';
import { render, screen } from '@testing-library/react';
import NodeDetailDrawer from './NodeDetailDrawer';

jest.mock('@/components/execution/LogConsole', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'log-console');
  },
}));

jest.mock('./NodeConfigContextCards', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'config-context');
  },
}));

jest.mock('./NodeDetailDrawerHeader', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'drawer-header');
  },
}));

jest.mock('./NodeDeveloperTab', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'developer-tab');
  },
}));

jest.mock('./NodePrimaryCards', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'primary-cards');
  },
}));

jest.mock('./ExecutionLogTab', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'execution-log');
  },
}));

jest.mock('./ApprovalQuickActionsBar', () => ({
  __esModule: true,
  default: () => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, 'approval-quick-actions');
  },
}));

describe('NodeDetailDrawer smoke', () => {
  it('renders approval detail content without module load errors', () => {
    const ReactLocal = require('react');
    render(
      ReactLocal.createElement(NodeDetailDrawer, {
        canApprove: true,
        flowInstanceId: 'flow-1',
        nodeLogs: {},
        onClose: jest.fn(),
        onApprovalActionSuccess: jest.fn(),
        open: true,
        resolvedNames: {},
        resolutionErrors: {},
        selectedNodeData: {
          id: 'approval-node',
          name: '人工审批',
          type: 'approval',
          status: 'waiting_approval',
          config: {},
          state: { status: 'waiting_approval', title: '人工审批' },
          logs: [],
        },
      }),
    );

    expect(screen.getByText('drawer-header')).toBeTruthy();
    expect(screen.getByText('approval-quick-actions')).toBeTruthy();
    expect(screen.getByText('primary-cards')).toBeTruthy();
  });

  it('shows the execution log tab as soon as the execution node starts running', () => {
    const ReactLocal = require('react');
    render(
      ReactLocal.createElement(NodeDetailDrawer, {
        canApprove: false,
        flowInstanceId: 'flow-1',
        nodeLogs: {},
        onClose: jest.fn(),
        onApprovalActionSuccess: jest.fn(),
        open: true,
        resolvedNames: {},
        resolutionErrors: {},
        selectedNodeData: {
          id: 'execution-node',
          name: '执行修复',
          type: 'execution',
          status: 'running',
          config: {},
          state: {
            status: 'running',
            started_at: '2026-04-14T17:04:51+08:00',
          },
          logs: [],
        },
      }),
    );

    expect(screen.getByText('执行日志')).toBeTruthy();
  });
});
