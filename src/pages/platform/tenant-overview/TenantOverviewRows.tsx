import React from 'react';
import {
  AlertOutlined,
  AppstoreOutlined,
  BankOutlined,
  BarChartOutlined,
  BellOutlined,
  BookOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  FileProtectOutlined,
  FundProjectionScreenOutlined,
  LockOutlined,
  NodeIndexOutlined,
  ReloadOutlined,
  SafetyCertificateOutlined,
  ScheduleOutlined,
  TeamOutlined,
  ThunderboltOutlined,
  ApiOutlined,
} from '@ant-design/icons';
import { Button, Card, Col, Empty, Row, Space, Spin, Tag, Tooltip, Typography } from 'antd';
import dayjs from 'dayjs';
import type { PlatformTenantStatsItem, PlatformTenantStatsSummary } from '@/services/auto-healing/platform/tenants';
import { getSafePercent, getTenantResourceScore, toSafeCount } from './tenantOverviewMetrics';
import { ListRow, ResourceBar } from './TenantOverviewPrimitives';

const { Text } = Typography;

type TenantStatsItem = PlatformTenantStatsItem;
type TenantStatsSummary = PlatformTenantStatsSummary;

const sumCount = (tenants: TenantStatsItem[], key: keyof TenantStatsItem) =>
  tenants.reduce((sum, tenant) => sum + toSafeCount(tenant[key] as number | undefined), 0);

export const TenantOverviewHeaderCard: React.FC<{
  summary: TenantStatsSummary;
  onRefresh: () => void;
}> = ({ summary, onRefresh }) => (
  <div className="ov-header-card">
    <svg className="ov-header-decoration-svg" viewBox="0 0 420 120" preserveAspectRatio="none">
      <g stroke="rgba(22,119,255,0.15)" strokeWidth="1" fill="none">
        <line x1="30" y1="80" x2="110" y2="40" />
        <line x1="110" y1="40" x2="200" y2="70" />
        <line x1="200" y1="70" x2="300" y2="30" />
        <line x1="300" y1="30" x2="390" y2="60" />
        <line x1="200" y1="70" x2="260" y2="100" />
      </g>
      <g fill="rgba(22,119,255,0.3)">
        {[['30', '80', '2'], ['110', '40', '3'], ['200', '70', '2.5'], ['300', '30', '1.5'], ['390', '60', '2'], ['260', '100', '1.5']].map(([x, y, r]) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </g>
      <g stroke="rgba(22,119,255,0.15)" strokeWidth="1">
        <path d="M110 34 v12 M104 40 h12" />
        <path d="M200 65 v10 M195 70 h10" />
      </g>
    </svg>
    <div className="ov-header-card-left">
      <DashboardOutlined className="ov-header-card-icon" />
      <div>
        <div className="ov-header-card-title">租户运营总览</div>
        <div className="ov-header-card-desc">多租户运营监控 · 资源水位 · 自动化覆盖 · 安全合规</div>
      </div>
    </div>
    <div className="ov-header-card-right">
      <div className="ov-header-card-pills">
        <span className="ov-pill">{summary.total_tenants} 租户</span>
        <span className="ov-pill">{summary.total_users} 用户</span>
        <span className="ov-pill">{summary.total_rules} 规则</span>
      </div>
      <div className="ov-header-card-actions">
        <Text type="secondary" style={{ fontSize: 11 }}>{dayjs().format('HH:mm:ss')}</Text>
        <Tooltip title="刷新数据">
          <button className="ov-refresh-btn" onClick={onRefresh}>
            <ReloadOutlined />
          </button>
        </Tooltip>
      </div>
    </div>
  </div>
);

export const TenantOverviewEmptyState: React.FC<{ loading: boolean; onRefresh: () => void }> = ({ loading, onRefresh }) => (
  <Spin spinning={loading}>
    <Card variant="borderless">
      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="租户运营总览加载失败，请刷新重试" style={{ padding: '56px 0' }}>
        <Button type="primary" icon={<ReloadOutlined />} onClick={onRefresh}>重新加载</Button>
      </Empty>
    </Card>
  </Spin>
);

export const TenantOverviewCoreStatsRow: React.FC<{
  summary: TenantStatsSummary;
  totalAudit: number;
}> = ({ summary, totalAudit }) => {
  const stats = [
    { icon: <BankOutlined />, title: '租户总数', value: summary.total_tenants, sub: `活跃 ${summary.active_tenants} · 停用 ${summary.disabled_tenants}`, color: '#1677ff', bg: '#f0f5ff' },
    { icon: <TeamOutlined />, title: '平台用户', value: summary.total_users, sub: `${summary.total_tenants} 个租户`, color: '#52c41a', bg: '#f6ffed' },
    { icon: <ThunderboltOutlined />, title: '自愈规则', value: summary.total_rules, sub: `模板 ${summary.total_templates}`, color: '#fa8c16', bg: '#fff7e6' },
    { icon: <SafetyCertificateOutlined />, title: '审计事件', value: totalAudit, sub: `${summary.total_tenants} 个租户`, color: '#722ed1', bg: '#f9f0ff' },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 20 }}>
      {stats.map((item) => (
        <Col key={item.title} sm={12} md={6}>
          <Card variant="borderless" className="ov-stat-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div className="ov-stat-icon" style={{ background: item.bg, color: item.color }}>{item.icon}</div>
              <div>
                <Text type="secondary" style={{ fontSize: 12 }}>{item.title}</Text>
                <div className="ov-stat-number">{item.value}</div>
                <Text type="secondary" style={{ fontSize: 11 }}>{item.sub}</Text>
              </div>
            </div>
          </Card>
        </Col>
      ))}
    </Row>
  );
};

const summaryCards = (tenants: TenantStatsItem[], summary: TenantStatsSummary, totalAudit: number) => ([
  {
    key: 'resources',
    title: <><DatabaseOutlined style={{ color: '#1677ff', marginRight: 8 }} />平台资源概览</>,
    rows: [
      { icon: <ApiOutlined />, label: '插件', value: sumCount(tenants, 'plugin_count'), color: '#13c2c2' },
      { icon: <AppstoreOutlined />, label: '自愈流程', value: sumCount(tenants, 'flow_count'), color: '#722ed1' },
      { icon: <BookOutlined />, label: 'Playbook', value: sumCount(tenants, 'playbook_count'), color: '#52c41a' },
      { icon: <BranchesOutlined />, label: 'Git 仓库', value: sumCount(tenants, 'git_count'), color: '#eb2f96' },
      { icon: <LockOutlined />, label: '凭据', value: sumCount(tenants, 'secret_count'), color: '#fa8c16' },
      { icon: <DatabaseOutlined />, label: 'CMDB 主机', value: sumCount(tenants, 'cmdb_count'), color: '#1677ff' },
    ],
  },
  {
    key: 'automation',
    title: <><ThunderboltOutlined style={{ color: '#fa8c16', marginRight: 8 }} />自愈能力概览</>,
    rows: [
      { icon: <ThunderboltOutlined />, label: '自愈规则', value: summary.total_rules, color: '#fa8c16' },
      { icon: <FileProtectOutlined />, label: '任务模板', value: summary.total_templates, color: '#eb2f96' },
      { icon: <ScheduleOutlined />, label: '定时任务', value: sumCount(tenants, 'schedule_count'), color: '#2f54eb' },
      { icon: <NodeIndexOutlined />, label: '自愈流程', value: sumCount(tenants, 'flow_count'), color: '#722ed1' },
      { icon: <AlertOutlined />, label: '工单', value: sumCount(tenants, 'incident_count'), color: '#f5222d' },
    ],
  },
  {
    key: 'monitoring',
    title: <><FundProjectionScreenOutlined style={{ color: '#722ed1', marginRight: 8 }} />通知与监控</>,
    rows: [
      { icon: <BellOutlined />, label: '通知渠道', value: sumCount(tenants, 'notification_channel_count'), color: '#2f54eb' },
      { icon: <FileProtectOutlined />, label: '通知模板', value: sumCount(tenants, 'notification_template_count'), color: '#13c2c2' },
      { icon: <SafetyCertificateOutlined />, label: '审计日志', value: totalAudit, color: '#722ed1' },
      { icon: <TeamOutlined />, label: '平台用户', value: summary.total_users, color: '#1677ff' },
      { icon: <CheckCircleOutlined />, label: '活跃租户', value: summary.active_tenants, color: '#52c41a' },
      { icon: <CloseCircleOutlined />, label: '停用租户', value: summary.disabled_tenants, color: '#ff4d4f' },
    ],
  },
]);

export const TenantOverviewSummaryRow: React.FC<{
  tenants: TenantStatsItem[];
  summary: TenantStatsSummary;
  totalAudit: number;
}> = ({ tenants, summary, totalAudit }) => (
  <Row gutter={16} style={{ marginBottom: 20 }}>
    {summaryCards(tenants, summary, totalAudit).map((card) => (
      <Col key={card.key} md={8} sm={24}>
        <Card variant="borderless" title={card.title} styles={{ body: { padding: '14px 20px' } }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 20px' }}>
            {card.rows.map((row) => (
              <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: row.color, fontSize: 15 }}>{row.icon}</span>
                <div>
                  <Text type="secondary" style={{ fontSize: 11 }}>{row.label}</Text>
                  <div style={{ fontWeight: 700, fontSize: 17, color: row.value > 0 ? '#262626' : '#d9d9d9', lineHeight: 1.2 }}>{row.value}</div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </Col>
    ))}
  </Row>
);

export const TenantOverviewTopListsRow: React.FC<{
  tenants: TenantStatsItem[];
  summary: TenantStatsSummary;
  byAudit: TenantStatsItem[];
}> = ({ tenants, summary, byAudit }) => {
  const topMembers = [...tenants].sort((left, right) => toSafeCount(right.member_count) - toSafeCount(left.member_count)).slice(0, 5);
  const maxMembers = Math.max(...tenants.map((tenant) => toSafeCount(tenant.member_count)), 1);
  const maxAudit = Math.max(...tenants.map((tenant) => toSafeCount(tenant.audit_log_count)), 1);
  const totalResources = summary.total_rules + summary.total_instances + summary.total_templates;
  const cards = [
    {
      key: 'members',
      title: <><TeamOutlined style={{ color: '#1677ff', marginRight: 8 }} />成员分布 TOP 5</>,
      extra: <Tag>共 {summary.total_users} 人</Tag>,
      content: topMembers.map((tenant) => (
        <ListRow key={tenant.id} name={tenant.name} percent={getSafePercent(toSafeCount(tenant.member_count), maxMembers)} barColor="#1677ff" value={<Text strong style={{ color: '#1677ff' }}>{toSafeCount(tenant.member_count)}</Text>} />
      )),
    },
    {
      key: 'audit',
      title: <><SafetyCertificateOutlined style={{ color: '#722ed1', marginRight: 8 }} />安全与合规 TOP 5</>,
      extra: <Tag color="purple">审计 {tenants.reduce((sum, tenant) => sum + toSafeCount(tenant.audit_log_count), 0)}</Tag>,
      content: byAudit.slice(0, 5).map((tenant) => (
        <ListRow key={tenant.id} name={tenant.name} percent={getSafePercent(toSafeCount(tenant.audit_log_count), maxAudit)} barColor="#722ed1" value={<Text strong style={{ color: '#722ed1' }}>{toSafeCount(tenant.audit_log_count)}</Text>} />
      )),
    },
    {
      key: 'resource-quota',
      title: <><BarChartOutlined style={{ color: '#fa8c16', marginRight: 8 }} />资源配额 TOP 5</>,
      extra: (
        <Space size={4} style={{ fontSize: 10, color: '#8c8c8c' }}>
          {[{ c: '#fa8c16', l: '规则' }, { c: '#13c2c2', l: '实例' }, { c: '#eb2f96', l: '模板' }].map((item) => (
            <span key={item.l} style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
              <span style={{ width: 6, height: 6, borderRadius: 1, background: item.c, display: 'inline-block' }} />
              {item.l}
            </span>
          ))}
        </Space>
      ),
      content: [...tenants].sort((left, right) => getTenantResourceScore(right) - getTenantResourceScore(left)).slice(0, 5).map((tenant) => {
        const percent = getSafePercent(getTenantResourceScore(tenant), totalResources);
        return (
          <ListRow
            key={tenant.id}
            name={tenant.name}
            percent={0}
            barColor="#fa8c16"
            barContent={<ResourceBar items={[{ label: '规则', value: toSafeCount(tenant.rule_count), color: '#fa8c16' }, { label: '实例', value: toSafeCount(tenant.instance_count), color: '#13c2c2' }, { label: '模板', value: toSafeCount(tenant.template_count), color: '#eb2f96' }]} />}
            value={<Text strong style={{ color: percent > 50 ? '#f5222d' : percent > 25 ? '#fa8c16' : '#8c8c8c' }}>{percent}%</Text>}
          />
        );
      }),
    },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap' }}>
      {cards.map((card) => (
        <Col key={card.key} md={8} sm={24} style={{ display: 'flex' }}>
          <Card variant="borderless" title={card.title} extra={card.extra} styles={{ body: { padding: 0 } }} style={{ flex: 1 }}>
            {tenants.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} /> : card.content}
          </Card>
        </Col>
      ))}
    </Row>
  );
};
