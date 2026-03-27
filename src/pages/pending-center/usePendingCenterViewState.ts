import { useCallback, useState } from 'react';
import type { PendingApprovalRecord, PendingTriggerRecord } from './types';

export type PendingCenterTab = 'triggers' | 'approvals';
export type PendingCenterDetail = PendingTriggerRecord | PendingApprovalRecord | null;

export default function usePendingCenterViewState() {
  const [activeTab, setActiveTab] = useState<PendingCenterTab>('triggers');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<PendingCenterDetail>(null);

  const openDetail = useCallback((record: PendingTriggerRecord | PendingApprovalRecord) => {
    setDetail(record);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDetail(null);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as PendingCenterTab);
    closeDrawer();
  }, [closeDrawer]);

  return { activeTab, drawerOpen, detail, openDetail, closeDrawer, handleTabChange };
}
