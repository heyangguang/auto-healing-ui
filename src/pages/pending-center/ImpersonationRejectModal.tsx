import React from 'react';
import { Input, Modal, Typography } from 'antd';
import type { ImpersonationRequest } from '@/services/auto-healing/platform/impersonation';

const { Text } = Typography;

export interface ImpersonationRejectModalProps {
  open: boolean;
  target: ImpersonationRequest | null;
  reason: string;
  confirmLoading: boolean;
  onCancel: () => void;
  onChangeReason: (value: string) => void;
  onConfirm: () => void;
}

export default function ImpersonationRejectModal({
  open,
  target,
  reason,
  confirmLoading,
  onCancel,
  onChangeReason,
  onConfirm,
}: ImpersonationRejectModalProps) {
  return (
    <Modal
      title="拒绝访问请求"
      open={open}
      onCancel={onCancel}
      onOk={onConfirm}
      confirmLoading={confirmLoading}
      okText="确认拒绝"
      okButtonProps={{ danger: true }}
      cancelText="取消"
      width={420}
      destroyOnHidden
    >
      <div style={{ marginBottom: 12 }}>
        <Text>确定拒绝 <Text strong>{target?.requester_name}</Text> 的访问请求？</Text>
      </div>
      <Input.TextArea
        rows={3}
        placeholder="拒绝原因（可选）"
        value={reason}
        onChange={(event) => onChangeReason(event.target.value)}
      />
    </Modal>
  );
}
