import React from 'react';
import { Button, Space, Spin } from 'antd';
import { CrownOutlined, SendOutlined } from '@ant-design/icons';
import { history, useAccess, useParams } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import {
  ChangeTenantMemberRoleModal,
  SetTenantAdminModal,
  TenantInvitationModal,
} from './TenantMemberModals';
import { TenantMembersPanel } from './TenantMembersPanel';
import { useTenantMembersPageState } from './useTenantMembersPageState';
import './TenantMembers.css';

const TenantMembersPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const access = useAccess();
  const state = useTenantMembersPageState(id);

  if (state.loading) {
    return (
      <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="tenant-members-page">
      <SubPageHeader
        title={`${state.tenant?.name || ''} — 成员管理`}
        onBack={() => history.push('/platform/tenants')}
        actions={(
          <Space size={8}>
            <Button
              type="primary"
              icon={<SendOutlined />}
              disabled={!access.canManagePlatformTenants}
              onClick={state.openInviteModal}
            >
              邀请用户
            </Button>
            <Button
              icon={<CrownOutlined />}
              disabled={!access.canManagePlatformTenants}
              onClick={state.openSetAdminModal}
            >
              设置管理员
            </Button>
          </Space>
        )}
      />

      <div className="tenant-members-body">
        <TenantMembersPanel
          access={access}
          activeTab={state.activeTab}
          invitations={state.invitations}
          invLoading={state.invLoading}
          invPage={state.invPage}
          invTotal={state.invTotal}
          members={state.members}
          membersLoadFailed={state.membersLoadFailed}
          membersLoading={state.membersLoading}
          pendingInvCount={state.pendingInvCount}
          tenantRoles={state.tenantRoles}
          onActiveTabChange={state.setActiveTab}
          onCancelInvitation={state.handleCancelInvitation}
          onCopyInvitationLink={state.copyInvitationLink}
          onLoadInvitations={state.loadInvitations}
          onOpenChangeRole={state.openChangeRole}
          onOpenInviteModal={state.openInviteModal}
          onOpenSetAdminModal={state.openSetAdminModal}
          isLastAdminMember={state.isLastAdminMember}
        />
      </div>

      <SetTenantAdminModal
        open={state.setAdminModalOpen}
        tenantName={state.tenant?.name}
        form={state.setAdminForm}
        availableUsers={state.availableUsersForAdmin}
        simpleUsersLoadFailed={state.simpleUsersLoadFailed}
        submitting={state.submitting}
        onCancel={state.closeSetAdminModal}
        onSubmit={state.handleSetTenantAdmin}
      />
      <TenantInvitationModal
        open={state.inviteModalOpen}
        tenantName={state.tenant?.name}
        form={state.inviteForm}
        inviteResult={state.inviteResult}
        tenantRoles={state.tenantRoles}
        tenantRolesLoadFailed={state.tenantRolesLoadFailed}
        submitting={state.submitting}
        canManagePlatformTenants={access.canManagePlatformTenants}
        onCancel={state.closeInviteModal}
        onSubmit={state.handleInvite}
        onCopyInvitationLink={state.copyInvitationLink}
      />
      <ChangeTenantMemberRoleModal
        open={state.changeRoleModalOpen}
        form={state.changeRoleForm}
        tenantRoles={state.tenantRoles}
        tenantRolesLoadFailed={state.tenantRolesLoadFailed}
        submitting={state.submitting}
        onCancel={state.closeChangeRoleModal}
        onSubmit={state.handleChangeRole}
      />
    </div>
  );
};

export default TenantMembersPage;
