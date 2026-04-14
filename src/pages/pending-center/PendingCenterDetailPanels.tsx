import React from 'react';
import { ClockCircleOutlined } from '@ant-design/icons';
import { Descriptions, Tag, Typography } from 'antd';
import { getApprovalStatusConfig } from '@/constants/instanceDicts';
import { CATEGORY_LABELS, INCIDENT_HEALING_MAP } from '@/constants/incidentDicts';
import type { PendingApprovalRecord, PendingTriggerRecord } from './types';
import { formatPendingCenterTime, getSeverityTag } from './shared';

const { Text } = Typography;

export interface PendingApprovalDetailPanelProps {
  detail: PendingApprovalRecord;
  resolveActor?: (actorId?: string | null) => string;
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

function getApprovalBannerStyles(status?: string) {
  if (status === 'approved') {
    return { background: '#f6ffed', border: '#b7eb8f', color: '#389e0d' };
  }
  if (status === 'rejected') {
    return { background: '#fff2f0', border: '#ffccc7', color: '#cf1322' };
  }
  if (status === 'expired') {
    return { background: '#fafafa', border: '#d9d9d9', color: '#595959' };
  }
  return { background: '#fff7e6', border: '#ffd591', color: '#d46b08' };
}

function PendingApprovalBanner({ status: approvalStatus }: { status?: string }) {
  const status = getApprovalStatusConfig(approvalStatus);
  const styles = getApprovalBannerStyles(approvalStatus);
  return (
    <div style={{ padding: '12px 16px', marginBottom: 16, background: styles.background, border: `1px solid ${styles.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
      <ClockCircleOutlined style={{ color: styles.color }} />
      <Text strong style={{ color: styles.color }}>{status.text}</Text>
    </div>
  );
}

function PendingApprovalSummary({
  detail,
  resolveApprovers,
}: PendingApprovalDetailPanelProps) {
  const status = getApprovalStatusConfig(detail.status);
  return (
    <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="节点名称" span={2}>
        <Text strong>{detail.node_name || '审批节点'}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="流程实例" span={2}>
        <Text code>{detail.flow_instance_id || '-'}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="状态">
        <Tag color={status.color} icon={<ClockCircleOutlined />}>{status.text}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="审批人">{resolveApprovers(detail)}</Descriptions.Item>
      <Descriptions.Item label="创建时间">{formatPendingCenterTime(detail.created_at)}</Descriptions.Item>
      <Descriptions.Item label="更新时间">{formatPendingCenterTime(detail.updated_at || detail.decided_at)}</Descriptions.Item>
    </Descriptions>
  );
}

function PendingApprovalContent({ detail }: { detail: PendingApprovalRecord }) {
  if (!detail.title && !detail.timeout_at && !detail.description) {
    return null;
  }

  return (
    <Descriptions column={2} size="small" bordered labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      {detail.title ? <Descriptions.Item label="审批标题">{detail.title}</Descriptions.Item> : null}
      {detail.timeout_at ? <Descriptions.Item label="超时期限">{formatPendingCenterTime(detail.timeout_at)}</Descriptions.Item> : null}
      {detail.description ? <Descriptions.Item label="说明备注" span={2}>{detail.description}</Descriptions.Item> : null}
    </Descriptions>
  );
}

function PendingApprovalDecision({
  detail,
  resolveActor,
}: {
  detail: PendingApprovalRecord;
  resolveActor?: (actorId?: string | null) => string;
}) {
  if (detail.status === 'pending' && !detail.decided_at && !detail.decided_by && !detail.decision_comment) {
    return null;
  }

  return (
    <Descriptions title="审批结果" column={2} size="small" bordered labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="审批状态">
        <Tag color={getApprovalStatusConfig(detail.status).color}>{getApprovalStatusConfig(detail.status).text}</Tag>
      </Descriptions.Item>
      <Descriptions.Item label="审批时间">{formatPendingCenterTime(detail.decided_at)}</Descriptions.Item>
      <Descriptions.Item label="审批人">{resolveActor?.(detail.decided_by) || detail.decided_by || '-'}</Descriptions.Item>
      <Descriptions.Item label="审批意见">{detail.decision_comment || '-'}</Descriptions.Item>
    </Descriptions>
  );
}

export function PendingApprovalDetailPanel({
  detail,
  resolveActor,
  resolveApprovers,
}: PendingApprovalDetailPanelProps) {
  return (
    <>
      <PendingApprovalBanner status={detail.status} />
      <PendingApprovalSummary detail={detail} resolveApprovers={resolveApprovers} />
      <PendingApprovalContent detail={detail} />
      <PendingApprovalDecision detail={detail} resolveActor={resolveActor} />
      <PendingRecordFooter id={detail.id} />
    </>
  );
}

export interface PendingTriggerDetailPanelProps {
  detail: PendingTriggerRecord;
}

function PendingTriggerBanner({ detail }: PendingTriggerDetailPanelProps) {
  const healingStatus = INCIDENT_HEALING_MAP[detail.healing_status] || { color: '#faad14', text: detail.healing_status || '-' };
  return (
    <div style={{ padding: '12px 16px', marginBottom: 16, background: '#fffbe6', border: '1px solid #ffe58f', display: 'flex', alignItems: 'center', gap: 8 }}>
      <ClockCircleOutlined style={{ color: healingStatus.color }} />
      <Text strong style={{ color: healingStatus.color }}>{healingStatus.text}</Text>
      <div style={{ marginLeft: 'auto' }}>{getSeverityTag(detail.severity)}</div>
    </div>
  );
}

function PendingTriggerBasicInfo({ detail }: PendingTriggerDetailPanelProps) {
  const healingStatus = INCIDENT_HEALING_MAP[detail.healing_status] || { badge: 'default' as const, text: detail.healing_status || '-' };
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
        <Tag color={healingStatus.badge}>{healingStatus.text}</Tag>
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
