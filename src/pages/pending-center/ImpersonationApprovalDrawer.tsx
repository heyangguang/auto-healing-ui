import React from 'react';
import { Button, Drawer, Space } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import type { ImpersonationRequest } from '@/services/auto-healing/platform/impersonation';
import ImpersonationApprovalDetailPanel from './ImpersonationApprovalDetailPanel';

export interface ImpersonationApprovalDrawerProps {
  open: boolean;
  detail: ImpersonationRequest | null;
  canApproveImpersonation: boolean;
  onClose: () => void;
  onApprove: (record: ImpersonationRequest) => void;
  onReject: (record: ImpersonationRequest) => void;
}

export default function ImpersonationApprovalDrawer({
  open,
  detail,
  canApproveImpersonation,
  onClose,
  onApprove,
  onReject,
}: ImpersonationApprovalDrawerProps) {
  return (
    <Drawer
      title="访问请求详情"
      open={open}
      onClose={onClose}
      size={520}
      extra={detail?.status === 'pending' && canApproveImpersonation ? (
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
      {detail ? <ImpersonationApprovalDetailPanel detail={detail} /> : null}
    </Drawer>
  );
}
