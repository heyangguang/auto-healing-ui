import React, { useCallback, useEffect, useRef, useState } from 'react';
import { message } from 'antd';
import StandardTable from '@/components/StandardTable';
import {
  getPlatformAuditLogDetail,
  getPlatformAuditLogs,
  getPlatformAuditStats,
  getPlatformAuditTrend,
} from '@/services/auto-healing/platform/auditLogs';
import { buildAuditListParams } from '@/pages/system/audit-logs/helpers';
import type {
  AuditCategory,
  AuditLogRecord,
  AuditRequestParams,
  AuditStatsSummary,
  TrendPoint,
} from '@/pages/system/audit-logs/types';
import PlatformAuditDetailDrawer from './PlatformAuditDetailDrawer';
import PlatformAuditStatsBar from './PlatformAuditStatsBar';
import {
  createPlatformAuditLogColumns,
} from './platformAuditLogTableConfig';
import {
  loginAdvancedSearchFields,
  loginSearchFields,
  operationAdvancedSearchFields,
  operationSearchFields,
} from './platformAuditLogSearchConfig';
import '../../system/audit-logs/index.css';

const headerIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M16 16h16M16 24h16M16 32h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <circle cx="36" cy="36" r="7" stroke="currentColor" strokeWidth="2" fill="none" />
    <path d="M33 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const { loginColumns, operationColumns } = createPlatformAuditLogColumns();

const PlatformAuditLogsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AuditCategory>('operation');
  const [stats, setStats] = useState<AuditStatsSummary | null>(null);
  const [trendData, setTrendData] = useState<TrendPoint[]>([]);
  const [statsLoadFailed, setStatsLoadFailed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailLoadFailed, setDetailLoadFailed] = useState(false);
  const [detail, setDetail] = useState<AuditLogRecord | null>(null);
  const detailRequestSeqRef = useRef(0);

  useEffect(() => {
    setStatsLoadFailed(false);
    getPlatformAuditStats()
      .then(setStats)
      .catch(() => {
        setStatsLoadFailed(true);
        message.error('平台审计统计加载失败，请刷新页面重试');
      });
    getPlatformAuditTrend(7)
      .then((data) => setTrendData(data as TrendPoint[]))
      .catch(() => {
        setStatsLoadFailed(true);
        message.error('平台审计趋势加载失败，请刷新页面重试');
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
      const nextDetail = await getPlatformAuditLogDetail(record.id);
      if (detailRequestSeqRef.current !== requestSeq) {
        return;
      }
      setDetail(nextDetail);
    } catch {
      if (detailRequestSeqRef.current === requestSeq) {
        setDetailLoadFailed(true);
        message.error('平台审计详情加载失败，请重试');
      }
    } finally {
      if (detailRequestSeqRef.current === requestSeq) {
        setDetailLoading(false);
      }
    }
  }, []);

  const handleRequest = useCallback(
    async (params: AuditRequestParams) => {
      const response = await getPlatformAuditLogs(buildAuditListParams(params, activeTab));
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
        title="平台审计日志"
        description={
          activeTab === 'login'
            ? '记录平台管理员的所有登录和登出活动，用于安全审计和异常登录排查。'
            : '记录平台管理员的所有操作（用户管理、角色管理、租户管理等），用于平台级安全审计。'
        }
        headerIcon={headerIcon}
        headerExtra={statsLoadFailed ? <span style={{ color: '#ff4d4f', fontSize: 12 }}>平台审计统计加载失败，请刷新页面重试</span> : <PlatformAuditStatsBar stats={stats} trendData={trendData} />}
        searchFields={searchFields}
        advancedSearchFields={advancedSearchFields}
        columns={columns}
        rowKey="id"
        onRowClick={openDetail}
        request={handleRequest}
        defaultPageSize={20}
        preferenceKey={`platform_audit_log_${activeTab}`}
      />

      <PlatformAuditDetailDrawer
        open={drawerOpen}
        loading={detailLoading}
        loadFailed={detailLoadFailed}
        detail={detail}
        onClose={closeDetailDrawer}
      />
    </>
  );
};

export default PlatformAuditLogsPage;
