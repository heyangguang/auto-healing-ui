import { Input, Modal, Typography } from 'antd';
import React from 'react';

type DashboardSaveSystemWorkspaceModalProps = {
  description: string;
  name: string;
  onCancel: () => void;
  onConfirm: () => void;
  onDescriptionChange: (value: string) => void;
  onNameChange: (value: string) => void;
  open: boolean;
};

const DashboardSaveSystemWorkspaceModal: React.FC<DashboardSaveSystemWorkspaceModalProps> = ({
  description,
  name,
  onCancel,
  onConfirm,
  onDescriptionChange,
  onNameChange,
  open,
}) => (
  <Modal title="保存为系统工作区" open={open} onOk={onConfirm} onCancel={onCancel} width={420} okText="保存">
    <div style={{ marginBottom: 12 }}>
      <Typography.Text strong>名称</Typography.Text>
      <Input value={name} onChange={(event) => onNameChange(event.target.value)} placeholder="输入系统工作区名称" maxLength={50} style={{ borderRadius: 0, marginTop: 4 }} />
    </div>
    <div>
      <Typography.Text strong>描述（可选）</Typography.Text>
      <Input.TextArea value={description} onChange={(event) => onDescriptionChange(event.target.value)} placeholder="输入描述" maxLength={200} rows={2} style={{ borderRadius: 0, marginTop: 4 }} />
    </div>
    <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 8, display: 'block' }}>
      保存后可在角色管理中将此工作区分配给指定角色
    </Typography.Text>
  </Modal>
);

export default DashboardSaveSystemWorkspaceModal;
