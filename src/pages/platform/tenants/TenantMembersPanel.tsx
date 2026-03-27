import React from 'react';
import { Badge, Button, Empty, Space, Spin, Table, Tabs, Typography } from 'antd';
import { CrownOutlined, MailOutlined, SendOutlined, TeamOutlined } from '@ant-design/icons';
import type { PlatformTenantMember, TenantInvitation } from '@/services/auto-healing/platform/tenants';
import {
  createTenantInvitationColumns,
  createTenantMemberColumns,
  getTenantMemberRowKey,
} from './tenantMemberColumns';

const { Text } = Typography;

type AccessLike = {
  canManagePlatformTenants?: boolean;
};

type TenantMembersPanelProps = {
  access: AccessLike;
  activeTab: string;
  invitations: TenantInvitation[];
  invLoading: boolean;
  invPage: number;
  invTotal: number;
  members: PlatformTenantMember[];
  membersLoadFailed: boolean;
  membersLoading: boolean;
  pendingInvCount: number;
  tenantRoles: AutoHealing.Role[];
  onActiveTabChange: (key: string) => void;
  onCancelInvitation: (invitationId: string) => Promise<void>;
  onCopyInvitationLink: (url: string) => void;
  onLoadInvitations: (page: number) => void;
  onOpenChangeRole: (member: PlatformTenantMember) => void;
  onOpenInviteModal: () => void;
  onOpenSetAdminModal: () => void;
  isLastAdminMember: (record: PlatformTenantMember) => boolean;
};

export function TenantMembersPanel({
  access,
  activeTab,
  invitations,
  invLoading,
  invPage,
  invTotal,
  members,
  membersLoadFailed,
  membersLoading,
  pendingInvCount,
  tenantRoles,
  onActiveTabChange,
  onCancelInvitation,
  onCopyInvitationLink,
  onLoadInvitations,
  onOpenChangeRole,
  onOpenInviteModal,
  onOpenSetAdminModal,
  isLastAdminMember,
}: TenantMembersPanelProps) {
  const memberColumns = createTenantMemberColumns({ access, isLastAdminMember, onOpenChangeRole });
  const invitationColumns = createTenantInvitationColumns({
    access,
    onCancelInvitation,
    onCopyInvitationLink,
  });

  return (
    <div className="tenant-members-card">
      <Tabs
        activeKey={activeTab}
        onChange={(key) => {
          onActiveTabChange(key);
          if (key === 'invitations') {
            onLoadInvitations(1);
          }
        }}
        size="small"
        items={[
          {
            key: 'members',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <TeamOutlined />
                全部成员
                <span style={{ fontSize: 11, color: '#8c8c8c', background: '#f5f5f5', padding: '1px 8px', borderRadius: 10, fontVariantNumeric: 'tabular-nums' }}>
                  {membersLoadFailed ? '!' : members.length}
                </span>
              </span>
            ),
            children: (
              <Spin spinning={membersLoading}>
                {membersLoadFailed && !membersLoading ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="成员加载失败，请刷新页面重试" style={{ padding: '40px 0' }} />
                ) : members.length === 0 && !membersLoading ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="该租户暂无成员" style={{ padding: '40px 0' }}>
                    <Space>
                      <Button type="primary" icon={<SendOutlined />} onClick={onOpenInviteModal}>邀请用户</Button>
                      <Button icon={<CrownOutlined />} onClick={onOpenSetAdminModal}>设置管理员</Button>
                    </Space>
                  </Empty>
                ) : (
                  <Table
                    dataSource={members}
                    columns={memberColumns}
                    rowKey={getTenantMemberRowKey}
                    pagination={false}
                    size="small"
                    className="tenant-members-table"
                  />
                )}
              </Spin>
            ),
          },
          {
            key: 'invitations',
            label: (
              <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <MailOutlined />
                邀请记录
                {pendingInvCount > 0 && <Badge count={pendingInvCount} size="small" style={{ boxShadow: 'none' }} />}
              </span>
            ),
            children: (
              <Spin spinning={invLoading}>
                {invitations.length === 0 && !invLoading ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无邀请记录" style={{ padding: '40px 0' }} />
                ) : (
                  <Table
                    dataSource={invitations}
                    columns={invitationColumns}
                    rowKey="id"
                    size="small"
                    className="tenant-members-table"
                    pagination={invTotal > 20 ? {
                      current: invPage,
                      total: invTotal,
                      pageSize: 20,
                      size: 'small',
                      showTotal: (currentTotal) => `共 ${currentTotal} 条`,
                      onChange: (nextPage) => onLoadInvitations(nextPage),
                    } : false}
                  />
                )}
              </Spin>
            ),
          },
        ]}
      />

      <div style={{ marginTop: 20, padding: '10px 14px', background: '#f6f8fa', border: '1px solid #e8e8e8', borderRadius: 2, fontSize: 12, color: '#8c8c8c', lineHeight: 1.8 }}>
        <b style={{ color: '#595959' }}>角色说明：</b>
        {tenantRoles.map((role, index) => (
          <span key={role.id}>
            <b style={{ color: '#262626' }}>{role.display_name}</b> {role.description || role.name}
            {index < tenantRoles.length - 1 && ' · '}
          </span>
        ))}
        {tenantRoles.length === 0 && <Text type="secondary">暂无角色说明</Text>}
      </div>
    </div>
  );
}
