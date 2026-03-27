import React from 'react';
import type { FormInstance } from 'antd';
import { Alert, Button, Form, Input, Radio, Select, Space, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import RichTextEditor from '@/components/RichTextEditor';
import type { SiteMessageCategory } from '@/services/auto-healing/platform/messages';
import type { TenantSelectOption } from './usePlatformMessageOptions';

const { Text } = Typography;

export interface PlatformMessageFormValues {
  category: string;
  title: string;
  content: string;
  target_tenant_ids?: string[];
}

function ComposerHeading() {
  return (
    <div style={{ marginBottom: 20 }}>
      <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
        发送新消息
      </Text>
    </div>
  );
}

function SendTargetField({
  form,
  sendTarget,
  setSendTarget,
}: {
  form: FormInstance<PlatformMessageFormValues>;
  sendTarget: 'all' | 'selected';
  setSendTarget: (value: 'all' | 'selected') => void;
}) {
  return (
    <Form.Item label="发送范围">
      <Radio.Group
        value={sendTarget}
        onChange={(event) => {
          setSendTarget(event.target.value);
          if (event.target.value === 'all') {
            form.setFieldValue('target_tenant_ids', undefined);
          }
        }}
      >
        <Radio value="all">全部租户</Radio>
        <Radio value="selected">指定租户</Radio>
      </Radio.Group>
    </Form.Item>
  );
}

function TenantSelectionField({
  visible,
  tenants,
  tenantsLoading,
  tenantsError,
}: {
  visible: boolean;
  tenants: TenantSelectOption[];
  tenantsLoading: boolean;
  tenantsError: string | null;
}) {
  if (!visible) {
    return null;
  }
  return (
    <>
      {tenantsError ? <Alert type="error" showIcon message={tenantsError} style={{ marginBottom: 16 }} /> : null}
      <Form.Item name="target_tenant_ids" label="选择租户" rules={[{ required: true, message: '请选择至少一个租户' }]}>
        <Select mode="multiple" placeholder="请选择目标租户" loading={tenantsLoading} options={tenants} optionFilterProp="label" style={{ maxWidth: 500 }} disabled={Boolean(tenantsError)} />
      </Form.Item>
    </>
  );
}

function MessageBodyFields({
  categories,
  categoriesLoading,
  categoriesError,
}: {
  categories: SiteMessageCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;
}) {
  return (
    <>
      {categoriesError ? <Alert type="error" showIcon message={categoriesError} style={{ marginBottom: 16 }} /> : null}
      <Form.Item name="category" label="消息分类" rules={[{ required: true, message: '请选择消息分类' }]}>
        <Select placeholder="请选择消息分类" loading={categoriesLoading} options={categories.map((item) => ({ label: item.label, value: item.value }))} style={{ width: 240 }} disabled={Boolean(categoriesError)} />
      </Form.Item>
      <Form.Item name="title" label="消息标题" rules={[{ required: true, message: '请输入消息标题' }]}>
        <Input placeholder="请输入消息标题" />
      </Form.Item>
      <Form.Item name="content" label="消息内容" rules={[{ required: true, message: '请输入消息内容' }]}>
        <RichTextEditor placeholder="请输入消息内容，支持富文本格式…" />
      </Form.Item>
    </>
  );
}

function ComposerActions({
  canSend,
  submitting,
  onReset,
  disabled,
}: {
  canSend: boolean;
  submitting: boolean;
  onReset: () => void;
  disabled: boolean;
}) {
  return (
    <Form.Item style={{ marginBottom: 0 }}>
      <Space>
        <Button type="primary" htmlType="submit" icon={<SendOutlined />} loading={submitting} disabled={!canSend || disabled}>
          发送消息
        </Button>
        <Button onClick={onReset}>重置</Button>
        {!canSend ? <Text type="warning" style={{ fontSize: 12 }}>您没有发送站内信的权限</Text> : null}
      </Space>
    </Form.Item>
  );
}

export interface PlatformMessageComposerProps {
  form: FormInstance<PlatformMessageFormValues>;
  canSend: boolean;
  categories: SiteMessageCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  tenants: TenantSelectOption[];
  tenantsLoading: boolean;
  tenantsError: string | null;
  sendTarget: 'all' | 'selected';
  submitting: boolean;
  setSendTarget: (value: 'all' | 'selected') => void;
  onSubmit: (values: PlatformMessageFormValues) => Promise<void>;
  onReset: () => void;
}

export default function PlatformMessageComposer({
  form,
  canSend,
  categories,
  categoriesLoading,
  categoriesError,
  tenants,
  tenantsLoading,
  tenantsError,
  sendTarget,
  submitting,
  setSendTarget,
  onSubmit,
  onReset,
}: PlatformMessageComposerProps) {
  const submitDisabled = Boolean(categoriesError || (sendTarget === 'selected' && tenantsError));

  return (
    <div style={{ padding: '24px', maxWidth: 800 }}>
      <ComposerHeading />
      <Form form={form} layout="vertical" onFinish={onSubmit}>
        <MessageBodyFields categories={categories} categoriesLoading={categoriesLoading} categoriesError={categoriesError} />
        <SendTargetField form={form} sendTarget={sendTarget} setSendTarget={setSendTarget} />
        <TenantSelectionField visible={sendTarget === 'selected'} tenants={tenants} tenantsLoading={tenantsLoading} tenantsError={tenantsError} />
        <ComposerActions canSend={canSend} submitting={submitting} onReset={onReset} disabled={submitDisabled} />
      </Form>
    </div>
  );
}
