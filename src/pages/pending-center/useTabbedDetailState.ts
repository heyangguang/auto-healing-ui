import { useCallback, useState } from 'react';

export default function useTabbedDetailState<TRecord, TTab extends string>(initialTab: TTab) {
  const [activeTab, setActiveTab] = useState<TTab>(initialTab);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detail, setDetail] = useState<TRecord | null>(null);

  const openDetail = useCallback((record: TRecord) => {
    setDetail(record);
    setDrawerOpen(true);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerOpen(false);
    setDetail(null);
  }, []);

  const handleTabChange = useCallback((key: string) => {
    setActiveTab(key as TTab);
    closeDrawer();
  }, [closeDrawer]);

  return { activeTab, drawerOpen, detail, openDetail, closeDrawer, handleTabChange };
}
