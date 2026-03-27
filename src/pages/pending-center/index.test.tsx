import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import PendingCenter from './index';

const triggerRecord = {
  id: 'trigger-1',
  external_id: 'INC-1',
};

jest.mock('@umijs/max', () => ({
  useAccess: () => ({
    canTriggerHealing: true,
    canApprove: true,
  }),
}));

jest.mock('@/services/auto-healing/healing', () => ({
  approveTask: jest.fn(),
  dismissIncident: jest.fn(),
  rejectTask: jest.fn(),
  triggerHealing: jest.fn(),
}));

jest.mock('@/services/auto-healing/users', () => ({
  getSimpleUsers: jest.fn(() => new Promise(() => {})),
}));

jest.mock('./PendingTriggerTable', () => ({
  __esModule: true,
  default: (props: { onRowClick: (record: typeof triggerRecord) => void; onTabChange: (key: string) => void }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement(
      'div',
      null,
      ReactLocal.createElement(
        'button',
        { type: 'button', onClick: () => props.onRowClick(triggerRecord) },
        'open-trigger-detail',
      ),
      ReactLocal.createElement(
        'button',
        { type: 'button', onClick: () => props.onTabChange('approvals') },
        'switch-to-approvals',
      ),
    );
  },
}));

jest.mock('./PendingApprovalTable', () => ({
  __esModule: true,
  default: (props: { onTabChange: (key: string) => void }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement(
      'button',
      { type: 'button', onClick: () => props.onTabChange('triggers') },
      'switch-to-triggers',
    );
  },
}));

jest.mock('./PendingCenterDetailPanels', () => ({
  PendingApprovalDetailPanel: ({ detail }: { detail: { id: string } }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, `approval-detail:${detail.id}`);
  },
  PendingTriggerDetailPanel: ({ detail }: { detail: { id: string } }) => {
    const ReactLocal = require('react');
    return ReactLocal.createElement('div', null, `trigger-detail:${detail.id}`);
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
    },
  };
});

describe('PendingCenter', () => {
  it('closes the trigger drawer when switching to approvals', async () => {
    render(React.createElement(PendingCenter));

    fireEvent.click(screen.getByRole('button', { name: 'open-trigger-detail' }));
    expect(screen.getByText('trigger-detail:trigger-1')).toBeTruthy();
    expect(screen.getByRole('button', { name: /启动自愈/ })).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'switch-to-approvals' }));

    await waitFor(() => {
      expect(screen.queryByText('trigger-detail:trigger-1')).toBeNull();
      expect(screen.queryByRole('button', { name: '批准' })).toBeNull();
      expect(screen.queryByRole('button', { name: '拒绝' })).toBeNull();
    });
  });
});
