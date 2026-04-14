import React from 'react';
import { Form, Input, Modal, Select } from 'antd';

type IncidentCloseModalProps = {
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: AutoHealing.CloseIncidentRequest) => Promise<void>;
  open: boolean;
};

const closeStatusOptions = [
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];

export const IncidentCloseModal: React.FC<IncidentCloseModalProps> = ({
  loading,
  onCancel,
  onSubmit,
  open,
}) => {
  const [form] = Form.useForm<AutoHealing.CloseIncidentRequest>();

  return (
    <Modal
      title="关闭工单"
      open={open}
      onCancel={onCancel}
      okText="关闭并回写"
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
      onOk={async () => {
        const values = await form.validateFields();
        await onSubmit(values);
        form.resetFields();
      }}
      afterOpenChange={(visible) => {
        if (visible) {
          form.setFieldsValue({
            close_status: 'resolved',
            close_code: 'auto_healed',
          });
          return;
        }
        form.resetFields();
      }}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="close_status"
          label="关闭状态"
          rules={[{ required: true, message: '请选择关闭状态' }]}
        >
          <Select options={closeStatusOptions} />
        </Form.Item>
        <Form.Item
          name="resolution"
          label="解决说明"
          rules={[{ required: true, message: '请输入解决说明' }]}
        >
          <Input.TextArea rows={3} placeholder="例如：已完成修复并验证恢复正常" />
        </Form.Item>
        <Form.Item name="work_notes" label="处理备注">
          <Input.TextArea rows={3} placeholder="写给源工单系统的处理过程说明" />
        </Form.Item>
        <Form.Item name="close_code" label="关闭码">
          <Input placeholder="例如：auto_healed" />
        </Form.Item>
      </Form>
    </Modal>
  );
};
