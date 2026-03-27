import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  addTenantMember,
  cancelTenantInvitation,
  getTenant,
  getTenantInvitations,
  getTenantMembers,
  inviteToTenant,
  updateTenantMemberRole,
  type PlatformTenantMember,
  type TenantInvitation,
} from '@/services/auto-healing/platform/tenants';
import type { PlatformTenant } from '@/services/auto-healing/platform/contracts';
import { getPlatformUsersSimple } from '@/services/auto-healing/platform/users';
import { getSystemTenantRoles } from '@/services/auto-healing/roles';

type SimpleUser = {
  id: string;
  username: string;
  display_name: string;
  status: string;
  is_platform_admin?: boolean;
};

export function useTenantMembersPageState(tenantId?: string) {
  const [tenant, setTenant] = useState<PlatformTenant | null>(null);
  const [loading, setLoading] = useState(true);
  const [members, setMembers] = useState<PlatformTenantMember[]>([]);
  const [membersLoading, setMembersLoading] = useState(false);
  const [membersLoadFailed, setMembersLoadFailed] = useState(false);
  const [activeTab, setActiveTab] = useState('members');
  const [setAdminModalOpen, setSetAdminModalOpen] = useState(false);
  const [setAdminForm] = Form.useForm<{ user_id: string }>();
  const [simpleUsers, setSimpleUsers] = useState<SimpleUser[]>([]);
  const [simpleUsersLoadFailed, setSimpleUsersLoadFailed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [inviteForm] = Form.useForm<{ email: string; role_id: string; send_email: boolean }>();
  const [inviteResult, setInviteResult] = useState<TenantInvitation | null>(null);
  const [invitations, setInvitations] = useState<TenantInvitation[]>([]);
  const [invTotal, setInvTotal] = useState(0);
  const [invLoading, setInvLoading] = useState(false);
  const [invPage, setInvPage] = useState(1);
  const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false);
  const [changeRoleTarget, setChangeRoleTarget] = useState<PlatformTenantMember | null>(null);
  const [changeRoleForm] = Form.useForm<{ role_id: string }>();
  const [tenantRoles, setTenantRoles] = useState<AutoHealing.Role[]>([]);
  const [tenantRolesLoadFailed, setTenantRolesLoadFailed] = useState(false);
  const tenantRequestSeqRef = useRef(0);
  const membersRequestSeqRef = useRef(0);
  const simpleUsersRequestSeqRef = useRef(0);
  const invitationsRequestSeqRef = useRef(0);
  const rolesRequestSeqRef = useRef(0);

  const loadTenant = useCallback(async () => {
    if (!tenantId) return;
    const requestSeq = tenantRequestSeqRef.current + 1;
    tenantRequestSeqRef.current = requestSeq;
    setLoading(true);
    try {
      const nextTenant = await getTenant(tenantId);
      if (tenantRequestSeqRef.current === requestSeq) {
        setTenant(nextTenant);
      }
    } finally {
      if (tenantRequestSeqRef.current === requestSeq) {
        setLoading(false);
      }
    }
  }, [tenantId]);

  const loadMembers = useCallback(async () => {
    if (!tenantId) return;
    const requestSeq = membersRequestSeqRef.current + 1;
    membersRequestSeqRef.current = requestSeq;
    setMembersLoading(true);
    setMembersLoadFailed(false);
    try {
      const nextMembers = await getTenantMembers(tenantId);
      if (membersRequestSeqRef.current === requestSeq) {
        setMembers(nextMembers);
      }
    } catch {
      if (membersRequestSeqRef.current === requestSeq) {
        setMembers([]);
        setMembersLoadFailed(true);
      }
    } finally {
      if (membersRequestSeqRef.current === requestSeq) {
        setMembersLoading(false);
      }
    }
  }, [tenantId]);

  const loadSimpleUsers = useCallback(async () => {
    const requestSeq = simpleUsersRequestSeqRef.current + 1;
    simpleUsersRequestSeqRef.current = requestSeq;
    setSimpleUsersLoadFailed(false);
    try {
      const users = await getPlatformUsersSimple();
      if (simpleUsersRequestSeqRef.current === requestSeq) {
        setSimpleUsers(users);
      }
    } catch {
      if (simpleUsersRequestSeqRef.current === requestSeq) {
        setSimpleUsers([]);
        setSimpleUsersLoadFailed(true);
      }
    }
  }, []);

  const loadInvitations = useCallback(async (page = 1) => {
    if (!tenantId) return;
    const requestSeq = invitationsRequestSeqRef.current + 1;
    invitationsRequestSeqRef.current = requestSeq;
    setInvLoading(true);
    try {
      const response = await getTenantInvitations(tenantId, { page, page_size: 20 });
      if (invitationsRequestSeqRef.current !== requestSeq) return;
      setInvitations(response.data || []);
      setInvTotal(response.total || 0);
      setInvPage(page);
    } finally {
      if (invitationsRequestSeqRef.current === requestSeq) {
        setInvLoading(false);
      }
    }
  }, [tenantId]);

  useEffect(() => {
    loadTenant();
    loadMembers();
    loadSimpleUsers();
    loadInvitations();
    const requestSeq = rolesRequestSeqRef.current + 1;
    rolesRequestSeqRef.current = requestSeq;
    setTenantRolesLoadFailed(false);
    getSystemTenantRoles()
      .then((roles) => {
        if (rolesRequestSeqRef.current === requestSeq) {
          setTenantRoles(roles);
        }
      })
      .catch(() => {
        if (rolesRequestSeqRef.current === requestSeq) {
          setTenantRoles([]);
          setTenantRolesLoadFailed(true);
          message.error('租户角色加载失败，请刷新页面后重试');
        }
      });
  }, [loadInvitations, loadMembers, loadSimpleUsers, loadTenant]);

  const adminMemberIds = useMemo(
    () => members.filter((member) => member.role?.name === 'admin').map((member) => member.user_id),
    [members],
  );
  const adminRoleId = useMemo(
    () => tenantRoles.find((role) => role.name === 'admin')?.id,
    [tenantRoles],
  );
  const memberUserIds = useMemo(() => new Set(members.map((member) => member.user_id)), [members]);
  const availableUsersForAdmin = useMemo(
    () => simpleUsers.filter((user) => user.status === 'active' && !memberUserIds.has(user.id) && !user.is_platform_admin),
    [memberUserIds, simpleUsers],
  );
  const pendingInvCount = useMemo(
    () => invitations.filter((invitation) => invitation.status === 'pending').length,
    [invitations],
  );

  const isLastAdminMember = useCallback(
    (record: PlatformTenantMember) => record.role?.name === 'admin' && adminMemberIds.length <= 1,
    [adminMemberIds],
  );

  const openSetAdminModal = useCallback(() => setSetAdminModalOpen(true), []);
  const closeSetAdminModal = useCallback(() => {
    setSetAdminModalOpen(false);
    setAdminForm.resetFields();
  }, [setAdminForm]);

  const openInviteModal = useCallback(() => {
    setInviteResult(null);
    setInviteModalOpen(true);
  }, []);
  const closeInviteModal = useCallback(() => {
    setInviteModalOpen(false);
    inviteForm.resetFields();
    setInviteResult(null);
  }, [inviteForm]);

  const closeChangeRoleModal = useCallback(() => {
    setChangeRoleModalOpen(false);
    changeRoleForm.resetFields();
  }, [changeRoleForm]);

  const handleSetTenantAdmin = useCallback(async (values: { user_id: string }) => {
    if (!tenantId) return;
    if (!adminRoleId) {
      throw new Error('系统租户 admin 角色缺失，无法设置管理员');
    }
    setSubmitting(true);
    try {
      await addTenantMember(tenantId, {
        user_id: values.user_id,
        role_id: adminRoleId,
      });
      message.success('租户管理员设置成功');
      closeSetAdminModal();
      loadMembers();
      loadSimpleUsers();
    } catch (error) {
      message.error(error instanceof Error ? error.message : '租户管理员设置失败');
      throw error;
    } finally {
      setSubmitting(false);
    }
  }, [adminRoleId, closeSetAdminModal, loadMembers, loadSimpleUsers, tenantId]);

  const handleInvite = useCallback(async (values: { email: string; role_id: string; send_email: boolean }) => {
    if (!tenantId) return;
    setSubmitting(true);
    try {
      setInviteResult(await inviteToTenant(tenantId, values));
      message.success('邀请已创建');
      inviteForm.resetFields();
      loadInvitations();
    } finally {
      setSubmitting(false);
    }
  }, [inviteForm, loadInvitations, tenantId]);

  const handleCancelInvitation = useCallback(async (invitationId: string) => {
    if (!tenantId) return;
    await cancelTenantInvitation(tenantId, invitationId);
    message.success('邀请已取消');
    loadInvitations(invPage);
  }, [invPage, loadInvitations, tenantId]);

  const openChangeRole = useCallback((member: PlatformTenantMember) => {
    setChangeRoleTarget(member);
    changeRoleForm.setFieldValue('role_id', member.role_id);
    setChangeRoleModalOpen(true);
  }, [changeRoleForm]);

  const handleChangeRole = useCallback(async (values: { role_id: string }) => {
    if (!tenantId || !changeRoleTarget) return;
    setSubmitting(true);
    try {
      await updateTenantMemberRole(tenantId, changeRoleTarget.user_id, { role_id: values.role_id });
      message.success('角色已更新');
      closeChangeRoleModal();
      loadMembers();
    } finally {
      setSubmitting(false);
    }
  }, [changeRoleTarget, closeChangeRoleModal, loadMembers, tenantId]);

  const copyInvitationLink = useCallback((url: string) => {
    navigator.clipboard.writeText(url).then(() => {
      message.success('邀请链接已复制到剪贴板');
    }).catch(() => {
      const textarea = document.createElement('textarea');
      textarea.value = url;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      message.success('邀请链接已复制');
    });
  }, []);

  return {
    activeTab,
    availableUsersForAdmin,
    changeRoleForm,
    changeRoleModalOpen,
    closeChangeRoleModal,
    closeInviteModal,
    closeSetAdminModal,
    copyInvitationLink,
    handleCancelInvitation,
    handleChangeRole,
    handleInvite,
    handleSetTenantAdmin,
    invLoading,
    invPage,
    invTotal,
    invitations,
    inviteForm,
    inviteModalOpen,
    inviteResult,
    isLastAdminMember,
    loading,
    loadInvitations,
    members,
    membersLoadFailed,
    membersLoading,
    openChangeRole,
    openInviteModal,
    openSetAdminModal,
    pendingInvCount,
    setActiveTab,
    setAdminForm,
    setAdminModalOpen,
    simpleUsersLoadFailed,
    submitting,
    tenant,
    tenantRoles,
    tenantRolesLoadFailed,
  };
}
