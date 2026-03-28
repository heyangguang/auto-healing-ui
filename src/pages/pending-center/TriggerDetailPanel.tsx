import React from 'react';
import { ClockCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Descriptions, Tag, Typography } from 'antd';
import { CATEGORY_LABELS, INCIDENT_HEALING_MAP } from '@/constants/incidentDicts';
import type { PendingTriggerRecord } from './types';
import { formatTriggerTime, getTriggerSeverityTag } from './triggerShared';

const { Text } = Typography;

export interface TriggerDetailPanelProps {
  detail: PendingTriggerRecord;
}

function TriggerStatusBanner({ detail }: TriggerDetailPanelProps) {
  const healingStatus = INCIDENT_HEALING_MAP[detail.healing_status] || { color: '#faad14', text: detail.healing_status || '-' };
  const isDismissed = detail.healing_status === 'dismissed';
  return (
    <div style={{
      padding: '12px 16px',
      marginBottom: 16,
      background: isDismissed ? '#f5f5f5' : '#fffbe6',
      border: isDismissed ? '1px solid #d9d9d9' : '1px solid #ffe58f',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      {isDismissed ? <StopOutlined style={{ color: healingStatus.color }} /> : <ClockCircleOutlined style={{ color: healingStatus.color }} />}
      <Text strong style={{ color: healingStatus.color }}>
        {healingStatus.text}
      </Text>
      <div style={{ marginLeft: 'auto' }}>
        {getTriggerSeverityTag(detail.severity)}
      </div>
    </div>
  );
}

function TriggerBasicSection({ detail }: TriggerDetailPanelProps) {
  const healingStatus = INCIDENT_HEALING_MAP[detail.healing_status] || { color: 'default', text: detail.healing_status || '-' };
  const isDismissed = detail.healing_status === 'dismissed';
  return (
    <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="工单标题" span={2}>
        <Text strong>{detail.title}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="工单ID">
        <Text code>{detail.external_id}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="等级">
        {getTriggerSeverityTag(detail.severity)}
      </Descriptions.Item>
      <Descriptions.Item label="分类">
        <Tag>{CATEGORY_LABELS[detail.category] || detail.category || '-'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="优先级">
        P{detail.priority || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="工单状态">
        <Tag color="blue">{detail.status || '-'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="自愈状态">
        <Tag color={healingStatus.badge || (isDismissed ? 'default' : 'warning')}>
          {healingStatus.text}
        </Tag>
      </Descriptions.Item>
    </Descriptions>
  );
}

function TriggerImpactSection({ detail }: TriggerDetailPanelProps) {
  return (
    <Descriptions title="影响范围" column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="影响CI">
        <Text code>{detail.affected_ci || '-'}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="影响服务">
        {detail.affected_service || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="指派人">
        {detail.assignee || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="报告人">
        {detail.reporter || '-'}
      </Descriptions.Item>
    </Descriptions>
  );
}

function TriggerSourceSection({ detail }: TriggerDetailPanelProps) {
  return (
    <Descriptions title="来源信息" column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="插件来源" span={2}>
        {detail.source_plugin_name || '-'}
      </Descriptions.Item>
      <Descriptions.Item label="创建时间">
        {formatTriggerTime(detail.created_at)}
      </Descriptions.Item>
      <Descriptions.Item label="更新时间">
        {formatTriggerTime(detail.updated_at)}
      </Descriptions.Item>
      {detail.matched_rule_id ? (
        <Descriptions.Item label="匹配规则" span={2}>
          <Text code style={{ fontSize: 11 }}>{detail.matched_rule_id}</Text>
        </Descriptions.Item>
      ) : null}
    </Descriptions>
  );
}

function TriggerDescriptionSection({ description }: { description?: string }) {
  if (!description) {
    return null;
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>描述</Text>
      <div style={{ padding: '8px 12px', marginTop: 4, background: '#fafafa', border: '1px solid #f0f0f0' }}>
        {description}
      </div>
    </div>
  );
}

function TriggerRawDataSection({ rawData }: { rawData?: Record<string, unknown> }) {
  if (!rawData || Object.keys(rawData).length === 0) {
    return null;
  }
  return (
    <div style={{ marginBottom: 16 }}>
      <Text type="secondary" style={{ fontSize: 12 }}>原始数据</Text>
      <pre style={{ padding: '8px 12px', marginTop: 4, background: '#fafafa', border: '1px solid #f0f0f0', fontSize: 12, overflow: 'auto', maxHeight: 200 }}>
        {JSON.stringify(rawData, null, 2)}
      </pre>
    </div>
  );
}

function TriggerFooter({ id }: { id: string }) {
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 4 }}>
      <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
        ID: {id}
      </Text>
    </div>
  );
}

export default function TriggerDetailPanel({ detail }: TriggerDetailPanelProps) {
  return (
    <>
      <TriggerStatusBanner detail={detail} />
      <TriggerBasicSection detail={detail} />
      <TriggerImpactSection detail={detail} />
      <TriggerDescriptionSection description={detail.description} />
      <TriggerSourceSection detail={detail} />
      <TriggerRawDataSection rawData={detail.raw_data as Record<string, unknown> | undefined} />
      <TriggerFooter id={detail.id} />
    </>
  );
}
