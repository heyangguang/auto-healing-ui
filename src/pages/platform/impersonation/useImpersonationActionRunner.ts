import { useCallback, useState } from 'react';

export default function useImpersonationActionRunner() {
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const runAction = useCallback(async (requestId: string, operation: () => Promise<void>) => {
    setActionLoading(requestId);
    try {
      await operation();
    } finally {
      setActionLoading(null);
    }
  }, []);

  return { actionLoading, runAction };
}
