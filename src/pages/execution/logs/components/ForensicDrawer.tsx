import { ExpandOutlined, ReloadOutlined } from '@ant-design/icons';
import { Alert, Button, Drawer, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import LogConsole, {
  type LogEntry,
  toLogEntries,
  toLogEntry,
} from '@/components/execution/LogConsole';
import { getRunStatusConfig } from '@/constants/executionDicts';
import {
  createLogStream,
  getExecutionLogs,
  getExecutionRun,
} from '@/services/auto-healing/execution';
import { createRequestSequence } from '@/utils/requestSequence';
import { mergeLogEntries, sortLogEntries } from '../logStreamHelpers';

const { Text } = Typography;
const RECENT_STREAM_WINDOW_MS = 30_000;
const LOG_REFRESH_INTERVAL_MS = 2_000;

const shouldKeepLiveStream = (runData?: AutoHealing.ExecutionRun) => {
  const isRecent =
    !!runData?.created_at &&
    Date.now() - new Date(runData.created_at).getTime() <
      RECENT_STREAM_WINDOW_MS;
  return (
    !!runData?.status &&
    (runData.status === 'running' || runData.status === 'pending' || isRecent)
  );
};

interface ForensicDrawerProps {
  runId?: string;
  open: boolean;
  onClose: () => void;
}

const ForensicDrawer: React.FC<ForensicDrawerProps> = ({
  runId,
  open,
  onClose,
}) => {
  const [run, setRun] = useState<AutoHealing.ExecutionRun>();
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [loadError, setLoadError] = useState<string>();
  const closeStreamRef = useRef<(() => void) | null>(null);
  const pollTimerRef = useRef<number | null>(null);
  const requestSequenceRef = useRef(createRequestSequence());
  const streamingRef = useRef(false);
  const currentStreamRunIdRef = useRef<string | undefined>(undefined);

  const markStreamClosed = useCallback(() => {
    streamingRef.current = false;
    currentStreamRunIdRef.current = undefined;
    closeStreamRef.current = null;
    setStreaming(false);
  }, []);

  const closeCurrentStream = useCallback(() => {
    const closeStream = closeStreamRef.current;
    markStreamClosed();
    closeStream?.();
  }, [markStreamClosed]);

  const closePolling = useCallback(() => {
    if (pollTimerRef.current !== null) {
      window.clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  const refreshSnapshot = useCallback(
    async (
      currentRunId: string,
      token = requestSequenceRef.current.current(),
    ) => {
      try {
        const [runRes, logsRes] = await Promise.all([
          getExecutionRun(currentRunId),
          getExecutionLogs(currentRunId),
        ]);
        if (!requestSequenceRef.current.isCurrent(token)) return undefined;
        setLoadError(undefined);
        setRun(runRes.data);
        setLogs((prev) =>
          mergeLogEntries(
            prev,
            sortLogEntries(toLogEntries(logsRes.data || [])),
          ),
        );
        return runRes.data;
      } catch (e) {
        if (!requestSequenceRef.current.isCurrent(token)) return undefined;
        console.error(e);
        setLoadError('执行详情加载失败，请刷新重试');
        return undefined;
      }
    },
    [],
  );

  const startStream = useCallback(
    (id: string, token: number) => {
      if (streamingRef.current && currentStreamRunIdRef.current === id) {
        return;
      }
      closeCurrentStream();
      streamingRef.current = true;
      currentStreamRunIdRef.current = id;
      setStreaming(true);
      const close = createLogStream(
        id,
        (log) => {
          if (!requestSequenceRef.current.isCurrent(token)) return;
          setLogs((prev) => mergeLogEntries(prev, [toLogEntry(log)]));
        },
        (res) => {
          if (!requestSequenceRef.current.isCurrent(token)) return;
          markStreamClosed();
          setRun((prev) =>
            prev
              ? {
                  ...prev,
                  status: res.status as AutoHealing.ExecutionRun['status'],
                }
              : prev,
          );
          void refreshSnapshot(id, token);
        },
        () => {
          if (!requestSequenceRef.current.isCurrent(token)) return;
          markStreamClosed();
          void refreshSnapshot(id, token).then((runData) => {
            if (!requestSequenceRef.current.isCurrent(token)) return;
            const shouldStream =
              runData?.status === 'running' || runData?.status === 'pending';
            if (shouldStream) {
              startStream(id, token);
            }
          });
        },
      );
      closeStreamRef.current = close;
    },
    [closeCurrentStream, markStreamClosed, refreshSnapshot],
  );

  const startPolling = useCallback(
    (currentRunId: string, token: number) => {
      if (pollTimerRef.current !== null) {
        return;
      }

      pollTimerRef.current = window.setInterval(() => {
        void refreshSnapshot(currentRunId, token).then((runData) => {
          if (!requestSequenceRef.current.isCurrent(token)) {
            return;
          }
          const shouldStream = shouldKeepLiveStream(runData);
          if (shouldStream && !streamingRef.current) {
            startStream(currentRunId, token);
          }
          if (!shouldStream) {
            closePolling();
            if (currentStreamRunIdRef.current === currentRunId) {
              closeCurrentStream();
            }
          }
        });
      }, LOG_REFRESH_INTERVAL_MS);
    },
    [closeCurrentStream, closePolling, refreshSnapshot, startStream],
  );

  const loadData = useCallback(
    async (currentRunId: string) => {
      const token = requestSequenceRef.current.next();
      const isSameRun = run?.id === currentRunId;
      if (!isSameRun) {
        closeCurrentStream();
        closePolling();
        setLogs([]);
        setRun(undefined);
        setLoadError(undefined);
      }
      setLoading(true);
      try {
        const runRes = await getExecutionRun(currentRunId);
        if (!requestSequenceRef.current.isCurrent(token)) return;
        setLoadError(undefined);
        setRun(runRes.data);

        const shouldStream = shouldKeepLiveStream(runRes.data);
        if (shouldStream) {
          startStream(currentRunId, token);
          startPolling(currentRunId, token);
        } else if (currentStreamRunIdRef.current === currentRunId) {
          closeCurrentStream();
          closePolling();
        }

        const logsRes = await getExecutionLogs(currentRunId);
        if (!requestSequenceRef.current.isCurrent(token)) return;
        setLogs((prev) =>
          mergeLogEntries(
            prev,
            sortLogEntries(toLogEntries(logsRes.data || [])),
          ),
        );
      } catch (e) {
        if (!requestSequenceRef.current.isCurrent(token)) return;
        console.error(e);
        setLoadError('执行详情加载失败，请刷新重试');
      } finally {
        if (requestSequenceRef.current.isCurrent(token)) {
          setLoading(false);
        }
      }
    },
    [closeCurrentStream, closePolling, run?.id, startPolling, startStream],
  );

  const handleRefresh = useCallback(async () => {
    if (!runId) {
      return;
    }
    const token = requestSequenceRef.current.current();
    setLoading(true);
    try {
      const runData = await refreshSnapshot(runId, token);
      if (!requestSequenceRef.current.isCurrent(token)) return;
      const shouldStream = shouldKeepLiveStream(runData);
      if (shouldStream && !streamingRef.current) {
        startStream(runId, token);
        startPolling(runId, token);
      }
      if (!shouldStream && currentStreamRunIdRef.current === runId) {
        closeCurrentStream();
        closePolling();
      }
    } finally {
      if (requestSequenceRef.current.isCurrent(token)) {
        setLoading(false);
      }
    }
  }, [
    closeCurrentStream,
    closePolling,
    refreshSnapshot,
    runId,
    startPolling,
    startStream,
  ]);

  useEffect(() => {
    if (open && runId) {
      void loadData(runId);
    } else {
      requestSequenceRef.current.invalidate();
      closeCurrentStream();
      closePolling();
      setLogs([]);
      setRun(undefined);
      setLoadError(undefined);
    }
  }, [closeCurrentStream, closePolling, loadData, open, runId]);

  useEffect(() => {
    return () => {
      requestSequenceRef.current.invalidate();
      closeCurrentStream();
      closePolling();
    };
  }, [closeCurrentStream, closePolling]);

  const activeRun = run?.id === runId ? run : undefined;
  const activeLogs = activeRun ? logs : [];
  const activeRunStatus = getRunStatusConfig(activeRun?.status);

  const Title = (
    <Space size={16}>
      <Text style={{ fontFamily: 'Fira Code' }}>#{runId?.slice(0, 8)}</Text>
      {activeRun && (
        <Tag color={activeRunStatus.tagColor || activeRunStatus.color}>
          {activeRunStatus.label}
        </Tag>
      )}
      <Text type="secondary" style={{ fontSize: 13 }}>
        {activeRun?.started_at
          ? dayjs(activeRun.started_at).format('YYYY-MM-DD HH:mm:ss')
          : ''}
      </Text>
    </Space>
  );

  return (
    <Drawer
      title={Title}
      width={1000}
      open={open}
      onClose={onClose}
      styles={{
        body: { padding: 0, display: 'flex', flexDirection: 'column' },
        header: { padding: '16px 24px' },
      }}
      destroyOnHidden
      extra={
        <Space>
          <Button
            icon={<ReloadOutlined />}
            size="small"
            onClick={() => void handleRefresh()}
          >
            刷新
          </Button>
          <Button
            icon={<ExpandOutlined />}
            size="small"
            type="primary"
            onClick={() => window.open(`/execution/runs/${runId}`, '_blank')}
          >
            完整视图
          </Button>
        </Space>
      }
    >
      <div
        style={{
          flex: 1,
          background: '#1e1e1e',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {loadError && (
          <Alert
            type="error"
            showIcon
            message={loadError}
            style={{ margin: 16 }}
          />
        )}
        <LogConsole
          logs={activeLogs}
          loading={loading && activeLogs.length === 0}
          streaming={streaming}
          height="100%"
          theme="dark"
        />
      </div>
    </Drawer>
  );
};

export default ForensicDrawer;
