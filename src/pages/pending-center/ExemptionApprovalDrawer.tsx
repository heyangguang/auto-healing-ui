import React from 'react';
import { Button, Drawer, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ExemptionRecord } from '@/services/auto-healing/blacklistExemption';
import ExemptionDetailPanel from './ExemptionDetailPanel';

export interface ExemptionApprovalDrawerProps {
  open: boolean;
  detail: ExemptionRecord | null;
  canApproveExemption: boolean;
  onClose: () => void;
  onApprove: (record: ExemptionRecord) => void;
  onReject: (record: ExemptionRecord) => void;
}

export default function ExemptionApprovalDrawer({
  open,
  detail,
  canApproveExemption,
  onClose,
  onApprove,
  onReject,
}: ExemptionApprovalDrawerProps) {
  return (
    <Drawer
      title="豁免申请详情"
      open={open}
      onClose={onClose}
      size={560}
      extra={detail?.status === 'pending' && canApproveExemption ? (
        <Space>
          <Button type="primary" icon={<CheckCircleOutlined />} onClick={() => onApprove(detail)}>
            批准
          </Button>
          <Button danger icon={<CloseCircleOutlined />} onClick={() => onReject(detail)}>
            拒绝
          </Button>
        </Space>
      ) : undefined}
    >
      {detail ? <ExemptionDetailPanel detail={detail} /> : null}
    </Drawer>
  );
}
