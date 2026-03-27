import React from 'react';
import { Input, Modal, Typography } from 'antd';
import type { ExemptionRecord } from '@/services/auto-healing/blacklistExemption';

const { Text } = Typography;

export interface ExemptionRejectModalProps {
  open: boolean;
  target: ExemptionRecord | null;
  reason: string;
  confirmLoading: boolean;
  onCancel: () => void;
  onChangeReason: (value: string) => void;
  onConfirm: () => void;
}

export default function ExemptionRejectModal({
  open,
  target,
  reason,
  confirmLoading,
  onCancel,
  onChangeReason,
  onConfirm,
}: ExemptionRejectModalProps) {
  return (
    <Modal
      title="拒绝豁免申请"
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
        <Text>
          确定拒绝 <Text strong>{target?.requester_name}</Text> 对 <Text code>{target?.rule_name}</Text> 的豁免申请？
        </Text>
      </div>
      <Input.TextArea
        rows={3}
        placeholder="拒绝原因（必填）"
        value={reason}
        onChange={(event) => onChangeReason(event.target.value)}
      />
    </Modal>
  );
}
