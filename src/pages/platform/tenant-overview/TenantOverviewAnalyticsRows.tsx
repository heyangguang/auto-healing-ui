import React from 'react';
import {
  CloudServerOutlined,
  DashboardOutlined,
  LineChartOutlined,
  PieChartOutlined,
  PlayCircleOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  TrophyOutlined,
} from '@ant-design/icons';
import { Card, Col, Empty, Row, Tag, Typography } from 'antd';
import type { PlatformTenantStatsItem, PlatformTenantTrendResponse } from '@/services/auto-healing/platform/tenants';
import { getCoverageSubtext, getSafePercent, getTenantInfraScore, getTenantResourceScore, toSafeCount } from './tenantOverviewMetrics';
import { AreaChart, RankItem, RingGrid } from './TenantOverviewPrimitives';

const { Text } = Typography;

type TenantStatsItem = PlatformTenantStatsItem;
type TrendData = PlatformTenantTrendResponse;

export const TenantOverviewRankingsRow: React.FC<{
  tenants: TenantStatsItem[];
  byResource: TenantStatsItem[];
  onSelectTenant: (tenantId: string) => void;
}> = ({ tenants, byResource, onSelectTenant }) => {
  const byInfra = [...tenants].sort((left, right) => getTenantInfraScore(right) - getTenantInfraScore(left));
  const maxResource = Math.max(...byResource.map(getTenantResourceScore), 1);
  const maxInfra = Math.max(...byInfra.map(getTenantInfraScore), 1);
  const cards = [
    {
      key: 'resource-ranking',
      title: <><TrophyOutlined style={{ color: '#fa8c16', marginRight: 8 }} />资源使用排行 TOP 5</>,
      rows: byResource.slice(0, 5).map((tenant, index) => (
        <RankItem key={tenant.id} rank={index + 1} name={tenant.name} code={tenant.code} status={tenant.status} id={tenant.id} value={getTenantResourceScore(tenant)} maxValue={maxResource} color="#fa8c16" onSelect={onSelectTenant} details={[{ label: '规则', value: toSafeCount(tenant.rule_count), color: '#fa8c16' }, { label: '实例', value: toSafeCount(tenant.instance_count), color: '#13c2c2' }, { label: '模板', value: toSafeCount(tenant.template_count), color: '#eb2f96' }]} />
      )),
    },
    {
      key: 'infra-ranking',
      title: <><CloudServerOutlined style={{ color: '#1677ff', marginRight: 8 }} />基础设施排行 TOP 5</>,
      rows: byInfra.slice(0, 5).map((tenant, index) => (
        <RankItem key={tenant.id} rank={index + 1} name={tenant.name} code={tenant.code} status={tenant.status} id={tenant.id} value={getTenantInfraScore(tenant)} maxValue={maxInfra} color="#1677ff" onSelect={onSelectTenant} details={[{ label: '主机', value: toSafeCount(tenant.cmdb_count), color: '#1677ff' }, { label: '凭据', value: toSafeCount(tenant.secret_count), color: '#fa8c16' }, { label: '插件', value: toSafeCount(tenant.plugin_count), color: '#13c2c2' }]} />
      )),
    },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap' }}>
      {cards.map((card) => (
        <Col key={card.key} md={12} sm={24} style={{ display: 'flex' }}>
          <Card variant="borderless" title={card.title} styles={{ body: { padding: 0 } }} style={{ flex: 1 }}>
            {tenants.length === 0 ? <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} style={{ padding: 40 }} /> : card.rows}
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export const TenantOverviewTrendsRow: React.FC<{ trendData: TrendData }> = ({ trendData }) => {
  const cards = [
    { key: 'operations', title: <><LineChartOutlined style={{ color: '#1677ff', marginRight: 8 }} />操作趋势（近 7 天）</>, values: trendData.operations, color: '#1677ff', tagColor: undefined, total: trendData.operations.reduce((sum, value) => sum + value, 0), suffix: '次' },
    { key: 'audit-trend', title: <><SafetyCertificateOutlined style={{ color: '#722ed1', marginRight: 8 }} />审计趋势（近 7 天）</>, values: trendData.audit_logs, color: '#722ed1', tagColor: 'purple', total: trendData.audit_logs.reduce((sum, value) => sum + value, 0), suffix: '条' },
    { key: 'execution-trend', title: <><PlayCircleOutlined style={{ color: '#13c2c2', marginRight: 8 }} />任务执行（近 7 天）</>, values: trendData.task_executions, color: '#13c2c2', tagColor: 'cyan', total: trendData.task_executions.reduce((sum, value) => sum + value, 0), suffix: '次' },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap' }}>
      {cards.map((card) => (
        <Col key={card.key} md={8} sm={24} style={{ display: 'flex' }}>
          <Card variant="borderless" title={card.title} extra={<Tag color={card.tagColor}>{card.total} {card.suffix}</Tag>} styles={{ body: { padding: '12px 16px' } }} style={{ flex: 1 }}>
            <AreaChart data={card.values} labels={trendData.dates} color={card.color} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};

export const TenantOverviewCoverageRow: React.FC<{ tenants: TenantStatsItem[] }> = ({ tenants }) => {
  const total = tenants.length;
  const cards = [
    {
      key: 'automation-coverage',
      title: <><PieChartOutlined style={{ color: '#722ed1', marginRight: 8 }} />自动化配置率</>,
      items: [
        { label: '规则', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.rule_count) > 0).length, total), color: '#fa8c16', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.rule_count) > 0).length, total, '个租户已配') },
        { label: '模板', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.template_count) > 0).length, total), color: '#eb2f96', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.template_count) > 0).length, total, '个租户已配') },
        { label: '流程', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.flow_count) > 0).length, total), color: '#722ed1', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.flow_count) > 0).length, total, '个租户已配') },
        { label: '定时', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.schedule_count) > 0).length, total), color: '#13c2c2', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.schedule_count) > 0).length, total, '个租户已配') },
      ],
    },
    {
      key: 'notification-coverage',
      title: <><SendOutlined style={{ color: '#2f54eb', marginRight: 8 }} />通知配置率</>,
      items: [
        { label: '通知渠道', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.notification_channel_count) > 0).length, total), color: '#1677ff', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.notification_channel_count) > 0).length, total, '个租户已配') },
        { label: '通知模板', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.notification_template_count) > 0).length, total), color: '#13c2c2', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.notification_template_count) > 0).length, total, '个租户已配') },
        { label: 'CMDB', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.cmdb_count) > 0).length, total), color: '#fa8c16', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.cmdb_count) > 0).length, total, '个租户已配') },
        { label: '插件', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.plugin_count) > 0).length, total), color: '#722ed1', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.plugin_count) > 0).length, total, '个租户已配') },
      ],
    },
    {
      key: 'security-coverage',
      title: <><DashboardOutlined style={{ color: '#fa8c16', marginRight: 8 }} />安全基线达标率</>,
      items: [
        { label: '多成员', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.member_count) >= 2).length, total), color: '#1677ff', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.member_count) >= 2).length, total, '≥2 成员') },
        { label: '有审计', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.audit_log_count) > 0).length, total), color: '#722ed1', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.audit_log_count) > 0).length, total, '有审计记录') },
        { label: '有凭据', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.secret_count) > 0).length, total), color: '#fa8c16', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.secret_count) > 0).length, total, '已配凭据') },
        { label: '有仓库', value: getSafePercent(tenants.filter((tenant) => toSafeCount(tenant.git_count) > 0).length, total), color: '#52c41a', sub: getCoverageSubtext(tenants.filter((tenant) => toSafeCount(tenant.git_count) > 0).length, total, '已配 Git') },
      ],
    },
  ];

  return (
    <Row gutter={16} style={{ marginBottom: 20, display: 'flex', flexWrap: 'wrap' }}>
      {cards.map((card) => (
        <Col key={card.key} md={8} sm={24} style={{ display: 'flex' }}>
          <Card variant="borderless" title={card.title} extra={<Text type="secondary" style={{ fontSize: 12 }}>已具备 / 总租户</Text>} styles={{ body: { padding: '20px' } }} style={{ flex: 1 }}>
            <RingGrid items={card.items} />
          </Card>
        </Col>
      ))}
    </Row>
  );
};
