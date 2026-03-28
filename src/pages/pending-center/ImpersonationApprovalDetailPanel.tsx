import React from 'react';
import { CheckCircleOutlined, ClockCircleOutlined, CloseCircleOutlined, EyeOutlined, MinusCircleOutlined, StopOutlined } from '@ant-design/icons';
import { Descriptions, Typography } from 'antd';
import { getImpersonationStatusMeta } from '@/constants/accessDicts';
import type { ImpersonationRequest } from '@/services/auto-healing/platform/impersonation';
import {
  formatImpersonationTime,
  renderImpersonationStatusTag,
} from './impersonationShared';

const { Text } = Typography;

export interface ImpersonationApprovalDetailPanelProps {
  detail: ImpersonationRequest;
}

const STATUS_ICON_REGISTRY = {
  pending: <ClockCircleOutlined />,
  approved: <CheckCircleOutlined />,
  rejected: <CloseCircleOutlined />,
  active: <EyeOutlined />,
  completed: <CheckCircleOutlined />,
  expired: <StopOutlined />,
  cancelled: <MinusCircleOutlined />,
} as const;

function getBannerStyles(status: ImpersonationRequest['status']) {
  return {
    background: status === 'pending' ? '#fff7e6' : status === 'rejected' ? '#fff1f0' : '#f6ffed',
    border: status === 'pending' ? '#ffd591' : status === 'rejected' ? '#ffa39e' : '#b7eb8f',
    color: status === 'pending' ? '#d46b08' : status === 'rejected' ? '#cf1322' : '#389e0d',
  };
}

function ImpersonationApprovalBanner({ detail }: ImpersonationApprovalDetailPanelProps) {
  const meta = getImpersonationStatusMeta(detail.status);
  const styles = getBannerStyles(detail.status);
  return (
    <div style={{ padding: '12px 16px', marginBottom: 16, background: styles.background, border: `1px solid ${styles.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
      {STATUS_ICON_REGISTRY[detail.status]}
      <Text strong style={{ color: styles.color }}>{meta.label}</Text>
    </div>
  );
}

function ImpersonationApprovalSummary({ detail }: ImpersonationApprovalDetailPanelProps) {
  return (
    <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c', width: 90 }} style={{ marginBottom: 16 }}>
      <Descriptions.Item label="申请人">
        <Text strong>{detail.requester_name}</Text>
      </Descriptions.Item>
      <Descriptions.Item label="访问时长">
        {detail.duration_minutes >= 60 ? `${detail.duration_minutes / 60} 小时` : `${detail.duration_minutes} 分钟`}
      </Descriptions.Item>
      <Descriptions.Item label="申请原因" span={2}>
        {detail.reason || <Text type="secondary">未填写原因</Text>}
      </Descriptions.Item>
      <Descriptions.Item label="状态">{renderImpersonationStatusTag(detail.status)}</Descriptions.Item>
      <Descriptions.Item label="审批人">{detail.approver_name || <Text type="secondary">—</Text>}</Descriptions.Item>
      <Descriptions.Item label="申请时间">{formatImpersonationTime(detail.created_at)}</Descriptions.Item>
      <Descriptions.Item label="审批时间">{formatImpersonationTime(detail.approved_at)}</Descriptions.Item>
      {detail.session_started_at ? (
        <Descriptions.Item label="会话开始">{formatImpersonationTime(detail.session_started_at)}</Descriptions.Item>
      ) : null}
      {detail.session_expires_at ? (
        <Descriptions.Item label="会话到期">{formatImpersonationTime(detail.session_expires_at)}</Descriptions.Item>
      ) : null}
      {detail.completed_at ? (
        <Descriptions.Item label="完成时间" span={2}>
          {formatImpersonationTime(detail.completed_at)}
        </Descriptions.Item>
      ) : null}
    </Descriptions>
  );
}

function ImpersonationApprovalFooter({ id }: { id: string }) {
  return (
    <div style={{ padding: '8px 0', borderTop: '1px solid #f0f0f0' }}>
      <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
        ID: {id}
      </Text>
    </div>
  );
}

export default function ImpersonationApprovalDetailPanel({
  detail,
}: ImpersonationApprovalDetailPanelProps) {
  return (
    <>
      <ImpersonationApprovalBanner detail={detail} />
      <ImpersonationApprovalSummary detail={detail} />
      <ImpersonationApprovalFooter id={detail.id} />
    </>
  );
}
