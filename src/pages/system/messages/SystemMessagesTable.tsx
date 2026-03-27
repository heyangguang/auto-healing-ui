import React, { useMemo } from 'react';
import { CheckCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { Button, Tooltip } from 'antd';
import StandardTable from '@/components/StandardTable';
import { getSiteMessages, type SiteMessage } from '@/services/auto-healing/siteMessage';
import {
  buildSiteMessageRequestParams,
  createSystemMessageColumns,
  systemMessageHeaderIcon,
  systemMessageSearchFields,
  type SiteMessageTableRequestParams,
} from './messagePageShared';
import { reportSystemMessageActionError } from './actionError';

export interface SystemMessagesTableProps {
  categoryMap: Record<string, string>;
  advancedSearchFields: ReturnType<typeof import('./messagePageShared').buildSystemMessageAdvancedSearchFields>;
  selectedRowKeys: React.Key[];
  refreshTrigger: number;
  onOpenDetail: (record: SiteMessage) => void;
  onMarkAsRead: (record: SiteMessage) => Promise<void>;
  onBatchMarkRead: () => Promise<void>;
  onMarkAllRead: () => Promise<void>;
  onSelectionChange: (keys: React.Key[]) => void;
}

function SystemMessageToolbarActions({
  selectedCount,
  onBatchMarkRead,
  onMarkAllRead,
}: {
  selectedCount: number;
  onBatchMarkRead: () => Promise<void>;
  onMarkAllRead: () => Promise<void>;
}) {
  return (
    <>
      <Tooltip title="标记已读">
        <Button icon={<CheckOutlined />} disabled={selectedCount === 0} onClick={() => {
          void onBatchMarkRead().catch((error) => {
            reportSystemMessageActionError('批量标记已读', error);
          });
        }} />
      </Tooltip>
      <Tooltip title="全部已读">
        <Button icon={<CheckCircleOutlined />} onClick={() => {
          void onMarkAllRead().catch((error) => {
            reportSystemMessageActionError('全部标记已读', error);
          });
        }} />
      </Tooltip>
    </>
  );
}

async function handleSystemMessageRequest(params: SiteMessageTableRequestParams) {
  const response = await getSiteMessages(buildSiteMessageRequestParams(params));
  return { data: response.data || [], total: Number(response.total ?? 0) };
}

export default function SystemMessagesTable({
  categoryMap,
  advancedSearchFields,
  selectedRowKeys,
  refreshTrigger,
  onOpenDetail,
  onMarkAsRead,
  onBatchMarkRead,
  onMarkAllRead,
  onSelectionChange,
}: SystemMessagesTableProps) {
  const columns = useMemo(() => createSystemMessageColumns({
    categoryMap,
    onOpenDetail,
    onMarkAsRead,
  }), [categoryMap, onMarkAsRead, onOpenDetail]);

  return (
    <StandardTable<SiteMessage>
      tabs={[{ key: 'list', label: '全部消息' }]}
      title="站内通知"
      description="系统消息与通知管理。查看、管理系统推送的通知消息，支持批量标记已读操作。"
      headerIcon={systemMessageHeaderIcon}
      searchFields={systemMessageSearchFields}
      advancedSearchFields={advancedSearchFields}
      extraToolbarActions={<SystemMessageToolbarActions selectedCount={selectedRowKeys.length} onBatchMarkRead={onBatchMarkRead} onMarkAllRead={onMarkAllRead} />}
      columns={columns}
      rowKey="id"
      onRowClick={onOpenDetail}
      rowSelection={{ selectedRowKeys, onChange: onSelectionChange }}
      request={handleSystemMessageRequest}
      defaultPageSize={20}
      preferenceKey="site_messages"
      refreshTrigger={refreshTrigger}
    />
  );
}
