import React from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Descriptions, Tag, Typography } from 'antd';
import { CATEGORY_LABELS } from '@/constants/incidentDicts';
import type { PendingApprovalRecord, PendingTriggerRecord } from './types';
import { formatPendingCenterTime, getSeverityTag } from './shared';

const { Text } = Typography;

export interface PendingApprovalDetailPanelProps {
  detail: PendingApprovalRecord;
  resolveApprovers: (record: PendingApprovalRecord) => string;
}

function PendingRecordFooter({ id }: { id: string }) {
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 4 }}>
      <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
        ID: {id}
      </Text>
    </div>
  );
}

function PendingApprovalBanner() {
  return (
    <div style={{ padding: '12px 16px', marginBottom: 16, background: '#fff7e6', border: '1px solid #ffd591', display: 'flex', alignItems: 'center', gap: 8 }}>
      <ClockCircleOutlined style={{ color: '#fa8c16' }} />
      <Text strong style={{ color: '#d46b08' }}>待审批</Text>
    </div>
  );
}

function PendingApprovalSummary({
  detail,
  resolveApprovers,
}: PendingApprovalDetailPanelProps) {
  return (
    <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="节点名称" span={2}>
        <Text strong>{detail.node_name || '审批节点'}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="流程实例" span={2}>
        <Text code>{detail.flow_instance_id || '-'}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="状态">
        <Tag color="orange" icon={<ClockCircleOutlined />}>待审批</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="审批人">{resolveApprovers(detail)}</Descriptions.Item>
      <Descriptions.Item label="创建时间">{formatPendingCenterTime(detail.created_at)}</Descriptions.Item>
      <Descriptions.Item label="更新时间">{formatPendingCenterTime(detail.updated_at)}</Descriptions.Item>
    </Descriptions>
  );
}

export function PendingApprovalDetailPanel({
  detail,
  resolveApprovers,
}: PendingApprovalDetailPanelProps) {
  return (
    <>
      <PendingApprovalBanner />
      <PendingApprovalSummary detail={detail} resolveApprovers={resolveApprovers} />
      <PendingRecordFooter id={detail.id} />
    </>
  );
}

export interface PendingTriggerDetailPanelProps {
  detail: PendingTriggerRecord;
}

function PendingTriggerBanner({ detail }: PendingTriggerDetailPanelProps) {
  return (
    <div style={{ padding: '12px 16px', marginBottom: 16, background: '#fffbe6', border: '1px solid #ffe58f', display: 'flex', alignItems: 'center', gap: 8 }}>
      <ClockCircleOutlined style={{ color: '#faad14' }} />
      <Text strong style={{ color: '#d48806' }}>待触发</Text>
      <div style={{ marginLeft: 'auto' }}>{getSeverityTag(detail.severity)}</div>
    </div>
  );
}

function PendingTriggerBasicInfo({ detail }: PendingTriggerDetailPanelProps) {
  return (
    <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="工单标题" span={2}>
        <Text strong>{detail.title}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="工单ID">
        <Text code>{detail.external_id}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="等级">{getSeverityTag(detail.severity)}</Descriptions.Item>
      <Descriptions.Item label="分类">
        <Tag>{CATEGORY_LABELS[detail.category] || detail.category || '-'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="优先级">P{detail.priority || '-'}</Descriptions.Item>
      <Descriptions.Item label="工单状态">
        <Tag color="blue">{detail.status || '-'}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="自愈状态">
        <Tag color="orange">{detail.healing_status || '-'}</Tag>
      </Descriptions.Item>
    </Descriptions>
  );
}

function PendingTriggerImpactInfo({ detail }: PendingTriggerDetailPanelProps) {
  return (
    <Descriptions title="影响范围" column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="影响CI">
        <Text code>{detail.affected_ci || '-'}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="影响服务">{detail.affected_service || '-'}</Descriptions.Item>
      <Descriptions.Item label="指派人">{detail.assignee || '-'}</Descriptions.Item>
      <Descriptions.Item label="报告人">{detail.reporter || '-'}</Descriptions.Item>
    </Descriptions>
  );
}

function PendingTriggerDescription({ description }: { description?: string }) {
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

function PendingTriggerSourceInfo({ detail }: PendingTriggerDetailPanelProps) {
  return (
    <Descriptions title="来源信息" column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="插件来源" span={2}>{detail.source_plugin_name || '-'}</Descriptions.Item>
      <Descriptions.Item label="创建时间">{formatPendingCenterTime(detail.created_at)}</Descriptions.Item>
      <Descriptions.Item label="更新时间">{formatPendingCenterTime(detail.updated_at)}</Descriptions.Item>
      {detail.matched_rule_id ? (
        <Descriptions.Item label="匹配规则" span={2}>
          <Text code style={{ fontSize: 11 }}>{detail.matched_rule_id}</Text>
        </Descriptions.Item>
      ) : null}
    </Descriptions>
  );
}

function PendingTriggerRawData({ rawData }: { rawData?: PendingTriggerRecord['raw_data'] }) {
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

export function PendingTriggerDetailPanel({ detail }: PendingTriggerDetailPanelProps) {
  return (
    <>
      <PendingTriggerBanner detail={detail} />
      <PendingTriggerBasicInfo detail={detail} />
      <PendingTriggerImpactInfo detail={detail} />
      <PendingTriggerDescription description={detail.description} />
      <PendingTriggerSourceInfo detail={detail} />
      <PendingTriggerRawData rawData={detail.raw_data} />
      <PendingRecordFooter id={detail.id} />
    </>
  );
}
