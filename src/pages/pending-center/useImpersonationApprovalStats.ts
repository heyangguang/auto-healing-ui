import { useEffect, useState } from 'react';
import {
  listImpersonationHistory,
  listPendingImpersonation,
} from '@/services/auto-healing/platform/impersonation';
import { extractErrorMsg } from '@/utils/errorMsg';
import { getImpersonationPendingStats } from './impersonationShared';

type ImpersonationApprovalStats = {
  total: number | null;
  pending: number | null;
};

export default function useImpersonationApprovalStats(refreshTrigger: number) {
  const [statsData, setStatsData] = useState<ImpersonationApprovalStats>({ total: null, pending: null });
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      listPendingImpersonation(),
      listImpersonationHistory({ page: 1, page_size: 1 }),
    ]).then(([pendingItems, historyResponse]) => {
      if (!active) {
        return;
      }
      const pendingTotal = getImpersonationPendingStats(pendingItems);
      setStatsData({
        total: Number(historyResponse.total ?? 0) + pendingTotal,
        pending: pendingTotal,
      });
      setStatsError(null);
    }).catch((error) => {
      if (!active) {
        return;
      }
      setStatsError(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '访问审批统计加载失败'));
    });
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  return { statsData, statsError };
}
