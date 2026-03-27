import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import {
  markAllAsRead,
  markAsRead,
  type SiteMessage,
} from '@/services/auto-healing/siteMessage';
import useRefreshTrigger from '@/pages/pending-center/useRefreshTrigger';
import { reportSystemMessageActionError } from './actionError';

function useSystemMessageViewState() {
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [currentMessage, setCurrentMessage] = useState<SiteMessage | null>(null);
  const { refreshTrigger, triggerRefresh } = useRefreshTrigger();

  useEffect(() => {
    const handleRefresh = () => triggerRefresh();
    window.addEventListener('site-messages:new', handleRefresh);
    window.addEventListener('site-messages:read', handleRefresh);
    return () => {
      window.removeEventListener('site-messages:new', handleRefresh);
      window.removeEventListener('site-messages:read', handleRefresh);
    };
  }, [triggerRefresh]);

  return {
    selectedRowKeys,
    setSelectedRowKeys,
    detailOpen,
    setDetailOpen,
    currentMessage,
    setCurrentMessage,
    refreshTrigger,
    triggerRefresh,
  };
}

function useSystemMessageDetailActions({
  setSelectedRowKeys,
  setDetailOpen,
  setCurrentMessage,
  triggerRefresh,
}: {
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
  setDetailOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setCurrentMessage: React.Dispatch<React.SetStateAction<SiteMessage | null>>;
  triggerRefresh: () => void;
}) {
  const markMessageAsRead = useCallback(async (record: SiteMessage) => {
    await markAsRead([record.id]);
    message.success('已标记');
    triggerRefresh();
    setSelectedRowKeys((keys) => keys);
    window.dispatchEvent(new Event('site-messages:read'));
  }, [triggerRefresh]);

  const openDetail = useCallback((record: SiteMessage) => {
    setCurrentMessage(record);
    setDetailOpen(true);
    if (!record.is_read) {
      void markMessageAsRead(record).catch((error) => {
        reportSystemMessageActionError('自动标记已读', error);
      });
    }
  }, [markMessageAsRead]);

  const closeDetail = useCallback(() => setDetailOpen(false), [setDetailOpen]);

  return { markMessageAsRead, openDetail, closeDetail };
}

function useSystemMessageBatchActions({
  selectedRowKeys,
  setSelectedRowKeys,
  triggerRefresh,
}: {
  selectedRowKeys: React.Key[];
  setSelectedRowKeys: React.Dispatch<React.SetStateAction<React.Key[]>>;
  triggerRefresh: () => void;
}) {

  const handleBatchMarkRead = useCallback(async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请先选择消息');
      return;
    }
    await markAsRead(selectedRowKeys as string[]);
    message.success('已标记为已读');
    triggerRefresh();
    setSelectedRowKeys([]);
    window.dispatchEvent(new Event('site-messages:read'));
  }, [selectedRowKeys, triggerRefresh]);

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    message.success('全部已读');
    triggerRefresh();
    setSelectedRowKeys([]);
    window.dispatchEvent(new Event('site-messages:read'));
  }, [triggerRefresh]);

  return {
    handleBatchMarkRead,
    handleMarkAllRead,
  };
}

export default function useSystemMessagePageState() {
  const viewState = useSystemMessageViewState();
  const detailActions = useSystemMessageDetailActions(viewState);
  const batchActions = useSystemMessageBatchActions(viewState);

  return {
    ...viewState,
    ...detailActions,
    ...batchActions,
  };
}
