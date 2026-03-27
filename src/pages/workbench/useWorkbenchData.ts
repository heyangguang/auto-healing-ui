import { useCallback, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import type { Dayjs } from 'dayjs';
import { getAuditLogs } from '@/services/auto-healing/auditLogs';
import { getPendingApprovals, getPendingTriggers } from '@/services/auto-healing/healing';
import {
  getScheduleCalendar,
  getWorkbenchAnnouncements,
  getWorkbenchFavorites,
  getWorkbenchOverview,
  type AnnouncementItem,
  type FavoriteItem,
  type ScheduleTask,
  type WorkbenchOverview,
} from '@/services/auto-healing/workbench';
import type { AuditLogRecord } from '@/pages/system/audit-logs/types';
import type { PendingApprovalRecord, PendingTriggerRecord } from '@/pages/pending-center/types';
import type { PendingWorkbenchItem, PendingWorkbenchState } from './workbenchTypes';

type UseWorkbenchDataOptions = {
  canViewAuditLogs: boolean;
  canViewApprovals: boolean;
  canViewPendingTrigger: boolean;
  canViewTasks: boolean;
};

export const useWorkbenchData = ({
  canViewAuditLogs,
  canViewApprovals,
  canViewPendingTrigger,
  canViewTasks,
}: UseWorkbenchDataOptions) => {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<WorkbenchOverview | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>([]);
  const [pendingApprovals, setPendingApprovals] = useState<PendingWorkbenchState>({ total: 0, items: [] });
  const [scheduleData, setScheduleData] = useState<Record<string, ScheduleTask[]>>({});
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const approvalsRequest = canViewApprovals
        ? getPendingApprovals({ page: 1, page_size: 5 })
        : Promise.resolve({ data: [], total: 0 });
      const triggersRequest = canViewPendingTrigger
        ? getPendingTriggers({ page: 1, page_size: 5 })
        : Promise.resolve({ data: [], total: 0 });
      const calendarRequest = canViewTasks
        ? getScheduleCalendar(dayjs().year(), dayjs().month() + 1)
        : Promise.resolve({ dates: {} });
      const announcementsRequest = getWorkbenchAnnouncements(5);
      const auditRequest = canViewAuditLogs
        ? getAuditLogs({ page: 1, page_size: 10, exclude_action: 'login', sort_by: 'created_at', sort_order: 'desc' })
        : Promise.resolve({ data: [] });

      const [overviewRes, calendarRes, announcementsRes, favoritesRes, auditRes, approvalsRes, triggersRes] =
        await Promise.allSettled([
          getWorkbenchOverview(),
          calendarRequest,
          announcementsRequest,
          getWorkbenchFavorites(),
          auditRequest,
          approvalsRequest,
          triggersRequest,
        ]);

      if (overviewRes.status === 'fulfilled' && overviewRes.value) {
        setOverview(overviewRes.value);
      }
      if (calendarRes.status === 'fulfilled' && calendarRes.value?.dates) {
        setScheduleData(calendarRes.value.dates);
      }
      if (announcementsRes.status === 'fulfilled' && Array.isArray(announcementsRes.value)) {
        setAnnouncements(announcementsRes.value);
      }
      if (favoritesRes.status === 'fulfilled' && Array.isArray(favoritesRes.value)) {
        setFavorites(favoritesRes.value);
      }
      if (auditRes.status === 'fulfilled' && auditRes.value?.data) {
        const logs = Array.isArray(auditRes.value.data) ? auditRes.value.data as AuditLogRecord[] : [];
        setAuditLogs(logs);
      }

      const triggers = triggersRes.status === 'fulfilled' && Array.isArray(triggersRes.value?.data)
        ? triggersRes.value.data as PendingTriggerRecord[]
        : [];
      const approvals = approvalsRes.status === 'fulfilled' && Array.isArray(approvalsRes.value?.data)
        ? approvalsRes.value.data as PendingApprovalRecord[]
        : [];
      const mergedItems: PendingWorkbenchItem[] = [
        ...triggers.map((trigger) => ({ ...trigger, _pendingType: 'trigger' as const })),
        ...approvals.map((approval) => ({ ...approval, _pendingType: 'approval' as const })),
      ].sort((left, right) => new Date(right.created_at || 0).getTime() - new Date(left.created_at || 0).getTime());
      setPendingApprovals({
        total: (triggersRes.status === 'fulfilled' ? triggersRes.value?.total ?? 0 : 0)
          + (approvalsRes.status === 'fulfilled' ? approvalsRes.value?.total ?? 0 : 0),
        items: mergedItems,
      });
    } catch (error) {
      console.error('[Workbench] Load data failed:', error);
    } finally {
      setLoading(false);
    }
  }, [canViewApprovals, canViewPendingTrigger, canViewTasks, canViewAuditLogs]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCalendarMonthChange = useCallback(async (date: Dayjs) => {
    if (!canViewTasks) {
      setScheduleData({});
      return;
    }
    try {
      const response = await getScheduleCalendar(date.year(), date.month() + 1);
      if (response?.dates) {
        setScheduleData(response.dates);
      }
    } catch {
      // keep existing calendar state visible
    }
  }, [canViewTasks]);

  return {
    announcements,
    auditLogs,
    favorites,
    handleCalendarMonthChange,
    loading,
    overview,
    pendingApprovals,
    scheduleData,
  };
};
