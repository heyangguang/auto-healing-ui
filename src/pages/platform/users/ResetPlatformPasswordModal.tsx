import React from 'react';
import { Form, Input, Modal, Space } from 'antd';
import type { FormInstance } from 'antd';
import { LockOutlined } from '@ant-design/icons';
import type { PlatformUserRecord, ResetPasswordValues } from './platformUserManagementTypes';

type ResetPlatformPasswordModalProps = {
  form: FormInstance<ResetPasswordValues>;
  onCancel: () => void;
  onSubmit: () => Promise<void> | void;
  open: boolean;
  submitting: boolean;
  user: PlatformUserRecord | null;
};

const ResetPlatformPasswordModal: React.FC<ResetPlatformPasswordModalProps> = ({
  form,
  onCancel,
  onSubmit,
  open,
  submitting,
  user,
}) => (
  <Modal
    title={<Space><LockOutlined />重置密码 — {user?.display_name || user?.username}</Space>}
    open={open}
    onCancel={onCancel}
    onOk={() => onSubmit()}
    okText="重置"
    confirmLoading={submitting}
    destroyOnHidden
    width={420}
  >
    <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 8 }}>
      <Form.Item
        name="new_password"
        label="新密码"
        rules={[{ required: true, message: '请输入新密码' }, { min: 6, message: '密码至少6位' }]}
      >
        <Input.Password placeholder="至少6位" />
      </Form.Item>
      <Form.Item
        name="confirm_password"
        label="确认新密码"
        dependencies={['new_password']}
        rules={[
          { required: true, message: '请确认新密码' },
          ({ getFieldValue }) => ({
            validator(_, value) {
              if (!value || getFieldValue('new_password') === value) {
                return Promise.resolve();
              }
              return Promise.reject(new Error('两次密码不一致'));
            },
          }),
        ]}
      >
        <Input.Password placeholder="再次输入新密码" />
      </Form.Item>
    </Form>
  </Modal>
);

export default ResetPlatformPasswordModal;
