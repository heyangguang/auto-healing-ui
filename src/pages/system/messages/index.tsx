import React from 'react';
import { Alert } from 'antd';
import useSiteMessageCategories from './useSiteMessageCategories';
import useSystemMessagePageState from './useSystemMessagePageState';
import SystemMessageDrawer from './SystemMessageDrawer';
import SystemMessagesTable from './SystemMessagesTable';
import './index.css';

export default function SystemMessages() {
  const { categoryMap, advancedSearchFields, categoriesError } = useSiteMessageCategories();
  const {
    selectedRowKeys,
    setSelectedRowKeys,
    detailOpen,
    currentMessage,
    refreshTrigger,
    markMessageAsRead,
    openDetail,
    closeDetail,
    handleBatchMarkRead,
    handleMarkAllRead,
  } = useSystemMessagePageState();

  return (
    <>
      {categoriesError ? <Alert type="error" showIcon message={categoriesError} style={{ marginBottom: 16 }} /> : null}
      <SystemMessagesTable
        categoryMap={categoryMap}
        advancedSearchFields={advancedSearchFields}
        selectedRowKeys={selectedRowKeys}
        refreshTrigger={refreshTrigger}
        onOpenDetail={openDetail}
        onMarkAsRead={markMessageAsRead}
        onBatchMarkRead={handleBatchMarkRead}
        onMarkAllRead={handleMarkAllRead}
        onSelectionChange={setSelectedRowKeys}
      />

      <SystemMessageDrawer open={detailOpen} currentMessage={currentMessage} categoryMap={categoryMap} onClose={closeDetail} />
    </>
  );
}
