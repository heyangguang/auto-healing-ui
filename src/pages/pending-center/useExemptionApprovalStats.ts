import { useEffect, useState } from 'react';
import { getBlacklistExemptions, getPendingExemptions } from '@/services/auto-healing/blacklistExemption';
import { extractErrorMsg } from '@/utils/errorMsg';

type ExemptionApprovalStats = {
  total: number | null;
  pending: number | null;
};

export default function useExemptionApprovalStats(refreshTrigger: number) {
  const [statsData, setStatsData] = useState<ExemptionApprovalStats>({ total: null, pending: null });
  const [statsError, setStatsError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void Promise.all([
      getBlacklistExemptions({ page: 1, page_size: 1 }),
      getPendingExemptions({ page: 1, page_size: 1 }),
    ]).then(([historyResponse, pendingResponse]) => {
      if (!active) {
        return;
      }
      setStatsData({
        total: Number(historyResponse.total ?? historyResponse.data?.length ?? 0),
        pending: Number(pendingResponse.total ?? pendingResponse.data?.length ?? 0),
      });
      setStatsError(null);
    }).catch((error) => {
      if (!active) {
        return;
      }
      setStatsError(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '豁免审批统计加载失败'));
    });
    return () => {
      active = false;
    };
  }, [refreshTrigger]);

  return { statsData, statsError };
}
