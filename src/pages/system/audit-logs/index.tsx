import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAccess } from '@umijs/max';
import { Button, Tooltip, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import {
  getAuditLogDetail,
  getAuditLogs,
  getAuditStats,
  getAuditTrend,
} from '@/services/auto-healing/auditLogs';
import AuditDetailDrawer from './AuditDetailDrawer';
import AuditExportModal from './AuditExportModal';
import AuditStatsBar from './AuditStatsBar';
import {
  createAuditLogColumns,
} from './auditLogTableConfig';
import {
  loginAdvancedSearchFields,
  loginSearchFields,
  operationAdvancedSearchFields,
  operationSearchFields,
} from './auditLogSearchConfig';
import { buildAuditListParams } from './helpers';
import type {
  AuditCategory,
  AuditLogRecord,
  AuditRequestParams,
  AuditStatsSummary,
  TrendPoint,
} from './types';
import './index.css';

const headerIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M16 16h16M16 24h16M16 32h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="36" cy="36" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M34 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const { loginColumns, operationColumns } = createAuditLogColumns();

const AuditLogsPage: React.FC = () => {
  const access = useAccess();
  const [activeTab, setActiveTab] = useState<AuditCategory>('operation');
  const [stats, setStats] = useState<AuditStatsSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [statsLoadFailed, setStatsLoadFailed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLoadFailed, setDetailLoadFailed] = useState(false);
  const [detail, setDetail] = useState<AuditLogRecord | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const detailRequestSeqRef = useRef(0);

  useEffect(() => {
    setStatsLoadFailed(false);
    getAuditStats()
      .then(setStats)
      .catch(() => {
        setStatsLoadFailed(true);
        message.error('审计统计加载失败，请刷新页面重试');
      });
    getAuditTrend(7)
      .then((data) => setTrendData(data as TrendPoint[]))
      .catch(() => {
        setStatsLoadFailed(true);
        message.error('审计趋势加载失败，请刷新页面重试');
      });
  }, []);

  const closeDetailDrawer = useCallback(() => {
    detailRequestSeqRef.current += 1;
    setDrawerOpen(false);
    setDetailLoading(false);
    setDetailLoadFailed(false);
    setDetail(null);
  }, []);

  const openDetail = useCallback(async (record: AuditLogRecord) => {
    const requestSeq = detailRequestSeqRef.current + 1;
    detailRequestSeqRef.current = requestSeq;
    setDrawerOpen(true);
    setDetailLoading(true);
    setDetailLoadFailed(false);
    setDetail(null);
    try {
      const nextDetail = await getAuditLogDetail(record.id);
      if (detailRequestSeqRef.current !== requestSeq) {
        return;
      }
      setDetail(nextDetail);
    } catch {
      if (detailRequestSeqRef.current === requestSeq) {
        setDetailLoadFailed(true);
        message.error('审计详情加载失败，请重试');
      }
    } finally {
      if (detailRequestSeqRef.current === requestSeq) {
        setDetailLoading(false);
      }
    }
  }, []);

  const handleRequest = useCallback(
    async (params: AuditRequestParams) => {
      const response = await getAuditLogs(buildAuditListParams(params, activeTab));
      return {
        data: (response.data || []) as AuditLogRecord[],
        total: response.total ?? 0,
      };
    },
    [activeTab],
  );

  const columns = activeTab === 'login' ? loginColumns : operationColumns;
  const searchFields = activeTab === 'login' ? loginSearchFields : operationSearchFields;
  const advancedSearchFields =
    activeTab === 'login' ? loginAdvancedSearchFields : operationAdvancedSearchFields;

  const exportButton = useMemo(
    () => (
      <Tooltip title="导出 CSV">
        <Button
          icon={<DownloadOutlined />}
          onClick={() => setExportModalOpen(true)}
          disabled={!access.canExportAuditLogs}
        >
          导出
        </Button>
      </Tooltip>
    ),
    [access.canExportAuditLogs],
  );

  return (
    <>
      <StandardTable<AuditLogRecord>
        key={activeTab}
        tabs={[
          { key: 'operation', label: '操作日志' },
          { key: 'login', label: '登录日志' },
        ]}
        activeTab={activeTab}
        onTabChange={(key) => setActiveTab(key as AuditCategory)}
        title="审计日志"
        description={
          activeTab === 'login'
            ? '记录所有用户的登录和登出活动，用于安全审计和异常登录排查。'
            : '记录系统中所有用户操作，用于安全审计和合规追溯。支持按操作类型、资源、用户、时间范围等多维筛选。'
        }
        headerIcon={headerIcon}
        headerExtra={statsLoadFailed ? <span style={{ color: '#ff4d4f', fontSize: 12 }}>统计加载失败，请刷新页面重试</span> : <AuditStatsBar stats={stats} trendData={trendData} />}
        searchFields={searchFields}
        advancedSearchFields={advancedSearchFields}
        extraToolbarActions={activeTab === 'operation' ? exportButton : undefined}
        columns={columns}
        rowKey="id"
        onRowClick={openDetail}
        request={handleRequest}
        defaultPageSize={20}
        preferenceKey={`audit_log_${activeTab}`}
      />

      <AuditDetailDrawer
        open={drawerOpen}
        loading={detailLoading}
        loadFailed={detailLoadFailed}
        detail={detail}
        onClose={closeDetailDrawer}
      />
      <AuditExportModal
        open={exportModalOpen}
        category={activeTab}
        onClose={() => setExportModalOpen(false)}
      />
    </>
  );
};

export default AuditLogsPage;
