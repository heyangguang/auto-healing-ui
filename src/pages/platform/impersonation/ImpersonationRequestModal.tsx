import React from 'react';
import type { FormInstance } from 'antd';
import { Alert, Form, Input, Modal, Select } from 'antd';

export interface PlatformTenantOption {
  id: string;
  name: string;
}

export interface ImpersonationRequestFormValues {
  tenant_id: string;
  duration_minutes: number;
  reason?: string;
}

const durationOptions = [
  { value: 30, label: '30 分钟' },
  { value: 60, label: '1 小时' },
  { value: 120, label: '2 小时' },
  { value: 240, label: '4 小时' },
];

export interface ImpersonationRequestModalProps {
  open: boolean;
  confirmLoading: boolean;
  form: FormInstance<ImpersonationRequestFormValues>;
  tenants: PlatformTenantOption[];
  tenantLoadError: string | null;
  onCancel: () => void;
  onSubmit: () => void;
}

function TenantField({ tenants }: { tenants: PlatformTenantOption[] }) {
  return (
    <Form.Item name="tenant_id" label="目标租户" rules={[{ required: true, message: '请选择目标租户' }]}>
      <Select
        placeholder="选择要访问的租户"
        showSearch
        optionFilterProp="label"
        options={tenants.map((tenant) => ({ value: tenant.id, label: tenant.name }))}
      />
    </Form.Item>
  );
}

function DurationField() {
  return (
    <Form.Item name="duration_minutes" label="访问时长" rules={[{ required: true, message: '请选择访问时长' }]} initialValue={60}>
      <Select options={durationOptions} />
    </Form.Item>
  );
}

function ReasonField() {
  return (
    <Form.Item name="reason" label="访问原因">
      <Input.TextArea rows={3} placeholder="请说明访问原因（可选）" maxLength={500} showCount />
    </Form.Item>
  );
}

export default function ImpersonationRequestModal({
  open,
  confirmLoading,
  form,
  tenants,
  tenantLoadError,
  onCancel,
  onSubmit,
}: ImpersonationRequestModalProps) {
  return (
    <Modal
      title="申请租户访问"
      open={open}
      onCancel={onCancel}
      onOk={onSubmit}
      confirmLoading={confirmLoading}
      okButtonProps={{ disabled: Boolean(tenantLoadError) || tenants.length === 0 }}
      okText="提交申请"
      cancelText="取消"
      width={480}
      destroyOnHidden
    >
      <div className="imp-modal-hint">
        提交后需等待目标租户管理员审批通过，审批通过后方可进入租户。
      </div>
      {tenantLoadError ? <Alert type="error" showIcon message={tenantLoadError} style={{ marginTop: 16 }} /> : null}
      <Form form={form} layout="vertical" style={{ marginTop: 16 }}>
        <TenantField tenants={tenants} />
        <DurationField />
        <ReasonField />
      </Form>
    </Modal>
  );
}
