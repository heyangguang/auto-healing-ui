import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PendingApprovals from './index';
import { Modal } from 'antd';

const pendingApprovalRecord = {
  id: 'approval-1',
  node_name: '人工审批',
  status: 'pending',
};

const historyApprovalRecord = {
  id: 'approval-2',
  node_name: '历史审批',
  status: 'approved',
};

jest.mock('@umijs/max', () => ({
  useAccess: () => ({
    canApprove: true,
  }),
}));

jest.mock('@/services/auto-healing/users', () => ({
  getSimpleUsers: jest.fn(() => new Promise(() => {})),
}));

jest.mock('../TaskApprovalTable', () => ({
  __esModule: true,
  default: (props: {
    activeTab: 'pending' | 'history';
    onRowClick: (record: typeof pendingApprovalRecord) => void;
    onTabChange: (key: string) => void;
  }) => {
    const ReactLocal = require('react');
    const record = props.activeTab === 'history' ? historyApprovalRecord : pendingApprovalRecord;
    return ReactLocal.createElement(
      'div',
      null,
      ReactLocal.createElement(
        'button',
        { type: 'button', onClick: () => props.onRowClick(record) },
        'open-approval-detail',
      ),
      ReactLocal.createElement(
        'button',
        { type: 'button', onClick: () => props.onTabChange(props.activeTab === 'pending' ? 'history' : 'pending') },
        'switch-approval-tab',
      ),
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

  it('closes pending actions for history records', async () => {
    render(React.createElement(PendingApprovals));

    fireEvent.click(screen.getByRole('button', { name: 'switch-approval-tab' }));
    fireEvent.click(screen.getByRole('button', { name: 'open-approval-detail' }));

    expect(screen.getByText('approval-detail:approval-2')).toBeTruthy();
    await waitFor(() => {
      expect(screen.queryByRole('button', { name: /批\s*准/ })).toBeNull();
      expect(screen.queryByRole('button', { name: /拒\s*绝/ })).toBeNull();
    });
  });
});
