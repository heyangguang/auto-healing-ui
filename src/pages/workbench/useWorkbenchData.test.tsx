import { renderHook, waitFor } from '@testing-library/react';
import { useWorkbenchData } from './useWorkbenchData';
import { getAuditLogs } from '@/services/auto-healing/auditLogs';
import { getPendingApprovals, getPendingTriggers } from '@/services/auto-healing/healing';
import {
  getScheduleCalendar,
  getWorkbenchAnnouncements,
  getWorkbenchFavorites,
  getWorkbenchOverview,
} from '@/services/auto-healing/workbench';

jest.mock('@/services/auto-healing/auditLogs', () => ({
  getAuditLogs: jest.fn(),
}));

jest.mock('@/services/auto-healing/healing', () => ({
  getPendingApprovals: jest.fn(),
  getPendingTriggers: jest.fn(),
}));

jest.mock('@/services/auto-healing/workbench', () => ({
  getScheduleCalendar: jest.fn(),
  getWorkbenchAnnouncements: jest.fn(),
  getWorkbenchFavorites: jest.fn(),
  getWorkbenchOverview: jest.fn(),
}));

describe('useWorkbenchData', () => {
  it('skips restricted task/audit requests but still loads announcements', async () => {
    (getWorkbenchOverview as jest.Mock).mockResolvedValue({ system_health: { status: 'healthy' } });
    (getWorkbenchFavorites as jest.Mock).mockResolvedValue([]);
    (getWorkbenchAnnouncements as jest.Mock).mockResolvedValue([{ id: 'notice-1' }]);
    (getPendingApprovals as jest.Mock).mockResolvedValue({ data: [], total: 0 });
    (getPendingTriggers as jest.Mock).mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(() =>
      useWorkbenchData({
        canViewAuditLogs: false,
        canViewApprovals: false,
        canViewPendingTrigger: false,
        canViewTasks: false,
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(getScheduleCalendar).not.toHaveBeenCalled();
    expect(getWorkbenchAnnouncements).toHaveBeenCalled();
    expect(getAuditLogs).not.toHaveBeenCalled();
    expect(result.current.announcements).toEqual([{ id: 'notice-1' }]);
    expect(result.current.auditLogs).toEqual([]);
    expect(result.current.scheduleData).toEqual({});
    expect(result.current.favorites).toEqual([]);
  });

  it('does not silently fall back to default favorites when favorites request fails', async () => {
    (getWorkbenchOverview as jest.Mock).mockResolvedValue({ system_health: { status: 'healthy' } });
    (getWorkbenchAnnouncements as jest.Mock).mockResolvedValue([]);
    (getWorkbenchFavorites as jest.Mock).mockRejectedValue(new Error('boom'));
    (getPendingApprovals as jest.Mock).mockResolvedValue({ data: [], total: 0 });
    (getPendingTriggers as jest.Mock).mockResolvedValue({ data: [], total: 0 });

    const { result } = renderHook(() =>
      useWorkbenchData({
        canViewAuditLogs: false,
        canViewApprovals: false,
        canViewPendingTrigger: false,
        canViewTasks: false,
      }),
    );

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.favorites).toEqual([]);
    expect(result.current.loadErrors).toEqual([
      { section: 'favorites', message: '工作台收藏加载失败' },
    ]);
  });
});
