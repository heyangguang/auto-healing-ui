import React from 'react';
import { fireEvent, render, screen } from '@testing-library/react';
import PendingTriggers from './index';

const pendingRecord = {
  id: 'trigger-pending',
  external_id: 'INC-1',
  healing_status: 'pending',
};

const dismissedRecord = {
  id: 'trigger-dismissed',
  external_id: 'INC-2',
  healing_status: 'dismissed',
};

jest.mock('@umijs/max', () => ({
  useAccess: () => ({
    canTriggerHealing: true,
  }),
}));

jest.mock('@/services/auto-healing/healing', () => ({
  dismissIncident: jest.fn(),
  getDismissedTriggers: jest.fn(),
  getPendingTriggers: jest.fn(),
  resetIncidentScan: jest.fn(),
  triggerHealing: jest.fn(),
}));

jest.mock('@/components/StandardTable', () => {
  const ReactLocal = require('react');

  return function MockStandardTable(props: {
    activeTab: 'pending' | 'dismissed';
    onTabChange: (key: string) => void;
    onRowClick: (record: typeof pendingRecord | typeof dismissedRecord) => void;
  }) {
    const currentRecord = props.activeTab === 'pending' ? pendingRecord : dismissedRecord;
    return ReactLocal.createElement(
      'div',
      null,
      ReactLocal.createElement('button', {
        type: 'button',
        onClick: () => props.onRowClick(currentRecord),
      }, 'open-row'),
      ReactLocal.createElement('button', {
        type: 'button',
        onClick: () => props.onTabChange(props.activeTab === 'pending' ? 'dismissed' : 'pending'),
      }, props.activeTab === 'pending' ? 'switch-to-dismissed' : 'switch-to-pending'),
    );
  };
});

jest.mock('../TriggerDetailPanel', () => ({
  __esModule: true,
  default: ({ detail }: { detail: { id: string } }) => {
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

describe('PendingTriggers', () => {
  it('closes the dismissed trigger drawer when switching back to pending', () => {
    render(React.createElement(PendingTriggers));

    fireEvent.click(screen.getByRole('button', { name: 'switch-to-dismissed' }));
    fireEvent.click(screen.getByRole('button', { name: 'open-row' }));

    expect(screen.getByText('trigger-detail:trigger-dismissed')).toBeTruthy();
    expect(screen.queryByRole('button', { name: '启动自愈' })).toBeNull();

    fireEvent.click(screen.getByRole('button', { name: 'switch-to-pending' }));

    expect(screen.queryByText('trigger-detail:trigger-dismissed')).toBeNull();
    expect(screen.queryByRole('button', { name: '启动自愈' })).toBeNull();
    expect(screen.queryByRole('button', { name: '忽略' })).toBeNull();
  });
});
