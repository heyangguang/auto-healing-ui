import { useCallback, useState } from 'react';
import type { PendingTriggerRecord } from './types';

export type TriggerPageTab = 'pending' | 'dismissed';

export default function useTriggerPageViewState() {
  const [activeTab, setActiveTab] = useState<TriggerPageTab>('pending');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<PendingTriggerRecord | null>(null);

  const openDetail = useCallback((record: PendingTriggerRecord) => {
    setDetail(record);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDetail(null);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as TriggerPageTab);
    closeDrawer();
  }, [closeDrawer]);

  return { activeTab, drawerOpen, detail, openDetail, closeDrawer, handleTabChange };
}
