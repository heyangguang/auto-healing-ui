import { useEffect, useState } from 'react';
import { listMyImpersonationRequests } from '@/services/auto-healing/platform/impersonation';
import { extractErrorMsg } from '@/utils/errorMsg';

type PlatformImpersonationStats = {
  total: number | null;
  pending: number | null;
  active: number | null;
};

export default function useImpersonationStats(refreshTrigger: number) {
  const [statsData, setStatsData] = useState<PlatformImpersonationStats>({
    total: null,
    pending: null,
    active: null,
  });
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      listMyImpersonationRequests({ page: 1, page_size: 1 }),
      listMyImpersonationRequests({ page: 1, page_size: 1, status: 'pending' }),
      listMyImpersonationRequests({ page: 1, page_size: 1, status: 'active' }),
    ]).then(([allResponse, pendingResponse, activeResponse]) => {
      if (!active) {
        return;
      }
      setStatsData({
        total: Number(allResponse.total ?? 0),
        pending: Number(pendingResponse.total ?? 0),
        active: Number(activeResponse.total ?? 0),
      });
      setStatsError(null);
    }).catch((error) => {
      if (!active) {
        return;
      }
      setStatsError(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], 'Impersonation 统计加载失败'));
    });
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  return { statsData, statsError };
}
