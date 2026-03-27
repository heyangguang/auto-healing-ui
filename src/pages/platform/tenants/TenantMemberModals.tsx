import React from 'react';
import {
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Switch,
} from 'antd';
import type { FormInstance } from 'antd';
import {
  CheckCircleOutlined,
  CopyOutlined,
  CrownOutlined,
  LinkOutlined,
  MailOutlined,
  SendOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import type { TenantInvitation } from '@/services/auto-healing/platform/tenants';

type TenantRole = AutoHealing.Role;

type SelectableUser = {
  id: string;
  username: string;
  display_name: string;
};

type TenantRoleSelectProps = {
  tenantRoles: TenantRole[];
  tenantRolesLoadFailed: boolean;
};

function TenantRoleSelectOptions({ tenantRoles, tenantRolesLoadFailed }: TenantRoleSelectProps) {
  return (
    <Select
      placeholder="选择角色"
      notFoundContent={tenantRolesLoadFailed ? '角色加载失败，请刷新页面后重试' : '暂无可选角色'}
    >
      {tenantRoles.map((role) => (
        <Select.Option key={role.id} value={role.id}>
          {role.display_name}
          {role.description && (
            <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>— {role.description}</span>
          )}
        </Select.Option>
      ))}
    </Select>
  );
}

type SetTenantAdminModalProps = {
  open: boolean;
  tenantName?: string;
  form: FormInstance<{ user_id: string }>;
  availableUsers: SelectableUser[];
  simpleUsersLoadFailed: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: { user_id: string }) => Promise<void>;
};

export function SetTenantAdminModal({
  open,
  tenantName,
  form,
  availableUsers,
  simpleUsersLoadFailed,
  submitting,
  onCancel,
  onSubmit,
}: SetTenantAdminModalProps) {
  return (
    <Modal
      title={<Space><CrownOutlined style={{ color: '#1677ff' }} />为「{tenantName}」设置管理员</Space>}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="设为管理员"
      confirmLoading={submitting}
      destroyOnHidden
      width={440}
    >
      <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 2, fontSize: 12, color: '#0050b3' }}>
        从全量用户池中选择一个活跃用户，系统会以租户 admin 角色将其加入当前租户。
      </div>
      <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 8 }}>
        <Form.Item name="user_id" label="选择用户" rules={[{ required: true, message: '请选择用户' }]}>
          <Select
            showSearch
            placeholder="搜索用户名或姓名"
            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            options={availableUsers.map((user) => ({
              label: `${user.display_name || user.username} (@${user.username})`,
              value: user.id,
            }))}
            notFoundContent={simpleUsersLoadFailed ? '用户加载失败，请关闭后重试' : '暂无可选用户'}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}

type TenantInvitationModalProps = {
  open: boolean;
  tenantName?: string;
  form: FormInstance<{ email: string; role_id: string; send_email: boolean }>;
  inviteResult: TenantInvitation | null;
  tenantRoles: TenantRole[];
  tenantRolesLoadFailed: boolean;
  submitting: boolean;
  canManagePlatformTenants?: boolean;
  onCancel: () => void;
  onSubmit: (values: { email: string; role_id: string; send_email: boolean }) => Promise<void>;
  onCopyInvitationLink: (url: string) => void;
};

export function TenantInvitationModal({
  open,
  tenantName,
  form,
  inviteResult,
  tenantRoles,
  tenantRolesLoadFailed,
  submitting,
  canManagePlatformTenants,
  onCancel,
  onSubmit,
  onCopyInvitationLink,
}: TenantInvitationModalProps) {
  return (
    <Modal
      title={<Space><SendOutlined style={{ color: '#1677ff' }} />邀请用户加入「{tenantName}」</Space>}
      open={open}
      onCancel={onCancel}
      footer={inviteResult ? <Button onClick={onCancel}>完成</Button> : undefined}
      onOk={inviteResult ? undefined : () => form.submit()}
      okText="发送邀请"
      confirmLoading={submitting}
      destroyOnHidden
      width={520}
    >
      {inviteResult ? (
        <div>
          <div style={{ padding: '14px 16px', background: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 4, marginBottom: 16, textAlign: 'center' }}>
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18, marginRight: 8 }} />
            <span style={{ fontWeight: 600, color: '#135200', fontSize: 14 }}>邀请已创建</span>
            {inviteResult.email_message && (
              <div style={{ fontSize: 12, color: '#389e0d', marginTop: 6 }}>
                {inviteResult.email_message}
              </div>
            )}
          </div>

          <div style={{ marginBottom: 8, fontSize: 12, color: '#595959', fontWeight: 500 }}>
            <LinkOutlined /> 邀请链接（{inviteResult.expires_at ? `有效至 ${dayjs(inviteResult.expires_at).format('YYYY-MM-DD HH:mm')}` : '有效期以系统设置为准'}）：
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: '#fafafa', border: '1px solid #e8e8e8', borderRadius: 4 }}>
            <Input
              value={inviteResult.invitation_url}
              readOnly
              style={{ flex: 1, fontSize: 12, border: 'none', background: 'transparent', padding: 0 }}
            />
            <Button
              type="primary"
              size="small"
              icon={<CopyOutlined />}
              disabled={!canManagePlatformTenants || !inviteResult.invitation_url}
              onClick={() => inviteResult.invitation_url && onCopyInvitationLink(inviteResult.invitation_url)}
            >
              复制
            </Button>
          </div>

          <div style={{ marginTop: 12, fontSize: 11, color: '#8c8c8c', lineHeight: 1.6 }}>
            · 用户通过此链接可注册并自动加入「{tenantName}」<br />
            · 每个邮箱只能有一个待处理邀请
          </div>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 2, fontSize: 12, color: '#0050b3' }}>
            输入邮箱地址邀请新用户，系统会生成邀请链接。用户通过链接注册后自动加入此租户。
          </div>
          <Form
            form={form}
            layout="vertical"
            onFinish={onSubmit}
            initialValues={{ send_email: false }}
            style={{ marginTop: 8 }}
          >
            <Form.Item
              name="email"
              label="邮箱地址"
              rules={[
                { required: true, message: '请输入邮箱' },
                { type: 'email', message: '邮箱格式不正确' },
              ]}
            >
              <Input placeholder="user@example.com" prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} />
            </Form.Item>
            <Form.Item name="role_id" label="分配角色" rules={[{ required: true, message: '请选择角色' }]}>
              <TenantRoleSelectOptions
                tenantRoles={tenantRoles}
                tenantRolesLoadFailed={tenantRolesLoadFailed}
              />
            </Form.Item>
            <Form.Item
              name="send_email"
              label="发送邮件通知"
              valuePropName="checked"
              extra="启用后需在平台设置中配置 SMTP 邮箱服务"
            >
              <Switch checkedChildren="发送" unCheckedChildren="不发送" />
            </Form.Item>
          </Form>
        </>
      )}
    </Modal>
  );
}

type ChangeTenantMemberRoleModalProps = {
  open: boolean;
  form: FormInstance<{ role_id: string }>;
  tenantRoles: TenantRole[];
  tenantRolesLoadFailed: boolean;
  submitting: boolean;
  onCancel: () => void;
  onSubmit: (values: { role_id: string }) => Promise<void>;
};

export function ChangeTenantMemberRoleModal({
  open,
  form,
  tenantRoles,
  tenantRolesLoadFailed,
  submitting,
  onCancel,
  onSubmit,
}: ChangeTenantMemberRoleModalProps) {
  return (
    <Modal
      title={<Space><SettingOutlined />变更租户内角色</Space>}
      open={open}
      onCancel={onCancel}
      onOk={() => form.submit()}
      okText="确认变更"
      confirmLoading={submitting}
      destroyOnHidden
      width={400}
    >
      <Form form={form} layout="vertical" onFinish={onSubmit} style={{ marginTop: 8 }}>
        <Form.Item name="role_id" label="目标角色" rules={[{ required: true, message: '请选择角色' }]}>
          <TenantRoleSelectOptions
            tenantRoles={tenantRoles}
            tenantRolesLoadFailed={tenantRolesLoadFailed}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
