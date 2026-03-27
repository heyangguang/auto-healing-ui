import { useCallback, useState } from 'react';

export default function useRefreshTrigger() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const triggerRefresh = useCallback(() => {
    setRefreshTrigger((value) => value + 1);
  }, []);
  return { refreshTrigger, triggerRefresh };
}
