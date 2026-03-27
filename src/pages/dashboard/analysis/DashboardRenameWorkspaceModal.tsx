import { Input, Modal } from 'antd';
import React from 'react';

type DashboardRenameWorkspaceModalProps = {
  onCancel: () => void;
  onConfirm: () => void;
  onNameChange: (value: string) => void;
  open: boolean;
  value: string;
};

const DashboardRenameWorkspaceModal: React.FC<DashboardRenameWorkspaceModalProps> = ({
  onCancel,
  onConfirm,
  onNameChange,
  open,
  value,
}) => (
  <Modal title="重命名工作区" open={open} onOk={onConfirm} onCancel={onCancel} width={360}>
    <Input
      value={value}
      onChange={(event) => onNameChange(event.target.value)}
      placeholder="输入新名称"
      maxLength={20}
      onPressEnter={onConfirm}
      autoFocus
      style={{ borderRadius: 0 }}
    />
  </Modal>
);

export default DashboardRenameWorkspaceModal;
