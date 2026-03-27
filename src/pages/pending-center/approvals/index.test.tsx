import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PendingApprovals from './index';
import { Modal } from 'antd';

const approvalRecord = {
  id: 'approval-1',
  node_name: '人工审批',
};

jest.mock('@umijs/max', () => ({
  useAccess: () => ({
    canApprove: true,
  }),
}));

jest.mock('@/services/auto-healing/users', () => ({
  getSimpleUsers: jest.fn(() => new Promise(() => {})),
}));

jest.mock('../PendingApprovalTable', () => ({
  __esModule: true,
  default: (props: { onRowClick: (record: typeof approvalRecord) => void }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement(
      'button',
      { type: 'button', onClick: () => props.onRowClick(approvalRecord) },
      'open-approval-detail',
    );
  },
}));

jest.mock('../PendingCenterDetailPanels', () => ({
  PendingApprovalDetailPanel: ({ detail }: { detail: { id: string } }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, `approval-detail:${detail.id}`);
  },
}));

jest.mock('antd', () => {
  const actual = jest.requireActual('antd');
  const ReactLocal = require('react');
  return {
    ...actual,
    Drawer: ({ open, extra, children }: { open: boolean; extra?: unknown; children?: unknown }) => (
      open ? ReactLocal.createElement('div', null, extra, children) : null
    ),
    Modal: {
      confirm: jest.fn(),
    },
    message: {
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});

describe('PendingApprovals', () => {
  it('opens the approval decision modal from drawer actions', () => {
    render(React.createElement(PendingApprovals));

    fireEvent.click(screen.getByRole('button', { name: 'open-approval-detail' }));
    expect(screen.getByText('approval-detail:approval-1')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /批\s*准/ }));
    expect(Modal.confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: '批准任务: 人工审批',
      okText: '批准',
    }));

    fireEvent.click(screen.getByRole('button', { name: 'open-approval-detail' }));
    fireEvent.click(screen.getByRole('button', { name: /拒\s*绝/ }));
    expect(Modal.confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: '拒绝任务: 人工审批',
      okText: '拒绝',
    }));
  });
});
