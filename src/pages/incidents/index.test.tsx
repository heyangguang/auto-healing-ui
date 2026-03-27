import React from 'react';
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { Modal, message } from 'antd';
import IncidentList from './index';
import { useAccess } from '@umijs/max';
import {
  batchResetIncidentScan,
  getIncident,
  getIncidentStats,
  getIncidents,
  resetIncidentScan,
} from '@/services/auto-healing/incidents';

jest.mock('@umijs/max', () => ({
  useAccess: jest.fn(),
}));

jest.mock('@/services/auto-healing/incidents', () => ({
  batchResetIncidentScan: jest.fn(),
  getIncident: jest.fn(),
  getIncidentStats: jest.fn(),
  getIncidents: jest.fn(),
  resetIncidentScan: jest.fn(),
}));

jest.mock('@/components/StandardTable', () => {
  const React = require('react');

  return function MockStandardTable(props: any) {
    const [rows, setRows] = React.useState([] as AutoHealing.Incident[]);

    React.useEffect(() => {
      let active = true;
      props.request?.({ page: 1, pageSize: 20 }).then((result: { data?: AutoHealing.Incident[] }) => {
        if (active) {
          setRows(result.data || []);
        }
      });
      return () => {
        active = false;
      };
    }, [props.request, props.refreshTrigger]);

    return (
      <div>
        <div data-testid="header-extra">{props.headerExtra}</div>
        <div data-testid="batch-toolbar">{props.extraToolbarActions}</div>
        {rows.map((row: AutoHealing.Incident) => (
          <div key={row.id}>
            <button type="button" onClick={() => props.onRowClick?.(row)}>
              打开-{row.id}
            </button>
            <button
              type="button"
              onClick={() => props.rowSelection?.onChange?.([row.id], [row])}
            >
              选择-{row.id}
            </button>
          </div>
        ))}
      </div>
    );
  };
});

jest.mock('./IncidentDetailDrawer', () => {
  const React = require('react');

  return {
    IncidentDetailDrawer: ({
      canResetScan,
      incident,
      onResetScan,
      open,
    }: any) => (open && incident ? React.createElement(
      'div',
      { 'data-testid': 'incident-detail-drawer' },
      React.createElement('span', { 'data-testid': 'detail-title' }, incident.title),
      React.createElement(
        'button',
        { type: 'button', disabled: !canResetScan, onClick: () => onResetScan(incident) },
        '抽屉重置扫描',
      ),
    ) : null),
  };
});

jest.mock('./IncidentStatsBar', () => ({
  IncidentStatsBar: ({ stats }: any) => {
    const React = require('react');
    return React.createElement(
      'div',
      { 'data-testid': 'incident-stats-bar' },
      stats ? `${stats.total}/${stats.scanned}/${stats.unscanned}/${stats.healed}` : 'empty',
    );
  },
}));

describe('IncidentList integration', () => {
  const incident = {
    id: 'incident-1',
    title: '磁盘空间不足告警',
    external_id: 'INC-1001',
    scanned: false,
    severity: 'critical',
    status: 'open',
    healing_status: 'pending',
  } as AutoHealing.Incident;

  beforeEach(() => {
    jest.spyOn(message, 'success').mockImplementation(jest.fn());
    jest.spyOn(message, 'error').mockImplementation(jest.fn());
    jest.spyOn(Modal, 'confirm').mockImplementation(({ onOk }: { onOk?: () => void | Promise<void> }) => {
      void onOk?.();
      return { destroy: jest.fn(), update: jest.fn() } as never;
    });

    (useAccess as jest.Mock).mockReturnValue({
      canSyncPlugin: true,
    });
    (getIncidents as jest.Mock).mockResolvedValue({
      data: [incident],
      total: 1,
    });
    (getIncidentStats as jest.Mock)
      .mockResolvedValueOnce({ total: 10, scanned: 4, unscanned: 6, healed: 1, failed: 0 })
      .mockResolvedValueOnce({ total: 9, scanned: 5, unscanned: 4, healed: 2, failed: 0 })
      .mockResolvedValueOnce({ total: 8, scanned: 6, unscanned: 2, healed: 3, failed: 0 });
    (getIncident as jest.Mock)
      .mockResolvedValueOnce(incident)
      .mockResolvedValueOnce({ ...incident, scanned: true, healing_status: 'matched' })
      .mockResolvedValueOnce({ ...incident, scanned: true, healing_status: 'triggered' });
    (resetIncidentScan as jest.Mock).mockResolvedValue({});
    (batchResetIncidentScan as jest.Mock).mockResolvedValue({ affected_count: 1 });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('reloads stats and current detail after single and batch reset-scan actions', async () => {
    render(React.createElement(IncidentList));

    await waitFor(() => {
      expect(getIncidentStats).toHaveBeenCalledTimes(1);
    });
    await waitFor(() => {
      expect(screen.getByTestId('incident-stats-bar').textContent).toBe('10/4/6/1');
    });

    fireEvent.click(await screen.findByRole('button', { name: '打开-incident-1' }));

    await waitFor(() => {
      expect(getIncident).toHaveBeenCalledTimes(1);
    });
    expect(screen.getByTestId('detail-title').textContent).toBe('磁盘空间不足告警');

    fireEvent.click(screen.getByRole('button', { name: '抽屉重置扫描' }));

    await waitFor(() => {
      expect(resetIncidentScan).toHaveBeenCalledWith('incident-1');
      expect(getIncidentStats).toHaveBeenCalledTimes(2);
      expect(getIncident).toHaveBeenCalledTimes(2);
    });
    await waitFor(() => {
      expect(screen.getByTestId('incident-stats-bar').textContent).toBe('9/5/4/2');
    });

    fireEvent.click(screen.getByRole('button', { name: '选择-incident-1' }));

    await waitFor(() => {
      expect(within(screen.getByTestId('batch-toolbar')).getByText('已选 1 项')).toBeTruthy();
    });

    await act(async () => {
      fireEvent.click(within(screen.getByTestId('batch-toolbar')).getByRole('button', { name: /重置扫描/ }));
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(batchResetIncidentScan).toHaveBeenCalledWith({ ids: ['incident-1'] });
      expect(getIncidentStats).toHaveBeenCalledTimes(3);
      expect(getIncident).toHaveBeenCalledTimes(3);
    });
    await waitFor(() => {
      expect(screen.getByTestId('incident-stats-bar').textContent).toBe('8/6/2/3');
    });
  });

  it('gates reset-scan actions on plugin sync permission', async () => {
    (useAccess as jest.Mock).mockReturnValue({
      canSyncPlugin: false,
      canTriggerHealing: true,
    });

    render(React.createElement(IncidentList));

    fireEvent.click(await screen.findByRole('button', { name: '打开-incident-1' }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: '抽屉重置扫描' }).hasAttribute('disabled')).toBe(true);
    });
  });
});
