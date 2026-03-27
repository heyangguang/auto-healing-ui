import React, { useCallback, useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import TriggerRecordDrawer from '../TriggerRecordDrawer';
import TriggerTabsTable from '../TriggerTabsTable';
import usePendingTriggerActions from '../usePendingTriggerActions';
import useResetIncidentScanAction from '../useResetIncidentScanAction';
import useTriggerPageViewState from '../useTriggerPageViewState';

export { buildTriggerApiParams } from '../triggerShared';

export default function PendingTriggers() {
  const access = useAccess();
  const refreshCountRef = useRef(0);
  const [, setRefreshKey] = useState(0);
  const {
    activeTab,
    drawerOpen,
    detail,
    openDetail,
    closeDrawer,
    handleTabChange,
  } = useTriggerPageViewState();

  const triggerRefresh = useCallback(() => {
    refreshCountRef.current += 1;
    setRefreshKey((value) => value + 1);
  }, []);
  const { handleTrigger, handleDismiss } = usePendingTriggerActions(triggerRefresh);
  const handleResetScan = useResetIncidentScanAction(triggerRefresh);
  const isPending = activeTab === 'pending';

  return (
    <>
      <TriggerTabsTable
        activeTab={activeTab}
        refreshCount={refreshCountRef.current}
        canTriggerHealing={access.canTriggerHealing}
        onTabChange={handleTabChange}
        onRowClick={openDetail}
        onTrigger={handleTrigger}
        onDismiss={handleDismiss}
        onResetScan={handleResetScan}
      />

      <TriggerRecordDrawer
        open={drawerOpen}
        detail={detail}
        showActions={isPending}
        canTriggerHealing={access.canTriggerHealing}
        onClose={closeDrawer}
        onTrigger={handleTrigger}
        onDismiss={handleDismiss}
      />
    </>
  );
}
