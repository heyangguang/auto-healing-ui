import React from 'react';
import { render, screen } from '@testing-library/react';
import TaskApprovalTable from './TaskApprovalTable';

jest.mock('@/components/StandardTable', () => ({
  __esModule: true,
  default: (props: { title: string; tabs?: { key: string; label: string }[]; activeTab?: string }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement(
      'div',
      null,
      ReactLocal.createElement('div', null, props.title),
      ReactLocal.createElement('div', null, props.activeTab),
      ...(props.tabs || []).map((tab) => ReactLocal.createElement('span', { key: tab.key }, tab.label)),
    );
  },
}));

jest.mock('@/services/auto-healing/healing', () => ({
  getApprovalHistory: jest.fn(),
  getPendingApprovals: jest.fn(),
}));

describe('TaskApprovalTable', () => {
  it('renders the task approval tabs without module load errors', () => {
    const ReactLocal = require('react');
    render(
      ReactLocal.createElement(TaskApprovalTable, {
        activeTab: 'pending',
        canApprove: true,
        refreshTrigger: 0,
        resolveActor: () => '-',
        resolveApprovers: () => '-',
        onApprove: jest.fn(),
        onReject: jest.fn(),
        onRowClick: jest.fn(),
        onTabChange: jest.fn(),
      }),
    );

    expect(screen.getByText('任务审批')).toBeTruthy();
    expect(screen.getByText('待审批任务')).toBeTruthy();
    expect(screen.getByText('审批记录')).toBeTruthy();
  });
});
