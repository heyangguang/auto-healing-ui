import {
  getScheduleCalendar,
  getWorkbenchActivities,
  getWorkbenchAnnouncements,
  getWorkbenchFavorites,
  getWorkbenchOverview,
  updateWorkbenchFavorites,
} from './workbench';
import { request } from '@umijs/max';

jest.mock('@umijs/max', () => ({
  request: jest.fn(),
}));

describe('auto-healing workbench service', () => {
  it('normalizes workbench common service envelopes', async () => {
    (request as jest.Mock)
      .mockResolvedValueOnce({ data: { system_health: { status: 'healthy' } } })
      .mockResolvedValueOnce({ data: { items: [{ id: 'act-1' }] } })
      .mockResolvedValueOnce({ data: { dates: { '2026-03-25': [{ name: 'job', time: '09:00', schedule_id: 's1' }] } } })
      .mockResolvedValueOnce({ data: { items: [{ id: 'notice-1' }] } })
      .mockResolvedValueOnce({ data: { items: [{ key: 'cmdb' }] } })
      .mockResolvedValueOnce({ success: true });

    await expect(getWorkbenchOverview()).resolves.toEqual({ system_health: { status: 'healthy' } });
    await expect(getWorkbenchActivities()).resolves.toEqual([{ id: 'act-1' }]);
    await expect(getScheduleCalendar(2026, 3)).resolves.toEqual({
      dates: { '2026-03-25': [{ name: 'job', time: '09:00', schedule_id: 's1' }] },
    });
    await expect(getWorkbenchAnnouncements()).resolves.toEqual([{ id: 'notice-1' }]);
    await expect(getWorkbenchFavorites()).resolves.toEqual([{ key: 'cmdb' }]);
    await expect(updateWorkbenchFavorites([{ key: 'cmdb', label: '资产管理', icon: 'DatabaseOutlined', path: '/resources/cmdb' }])).resolves.toEqual({
      message: '收藏已同步',
    });
  });
});
