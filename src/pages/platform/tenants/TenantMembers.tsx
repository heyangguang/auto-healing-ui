import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
    Tag, Button, Space, message, Spin, Avatar, Typography,
    Empty, Table, Form, Select, Modal, Input, Tooltip, Popconfirm,
    Tabs, Switch, Badge,
} from 'antd';
import {
    ArrowLeftOutlined, CrownOutlined, PlusOutlined,
    TeamOutlined, UserAddOutlined, SettingOutlined,
    DeleteOutlined, MailOutlined, LinkOutlined,
    CopyOutlined, CloseCircleOutlined, SendOutlined,
    StopOutlined, CheckCircleOutlined, ClockCircleOutlined,
} from '@ant-design/icons';
import { history, useParams, useAccess } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getTenant, getTenantMembers,
    updateTenantMemberRole, addTenantMember, removeTenantMember,
    inviteToTenant, getTenantInvitations, cancelTenantInvitation,
} from '@/services/auto-healing/platform/tenants';
import { getPlatformUsersSimple } from '@/services/auto-healing/platform/users';
import { getSystemTenantRoles } from '@/services/auto-healing/roles';
import dayjs from 'dayjs';
import { extractErrorMsg } from '@/utils/errorMsg';
import './TenantMembers.css';

const { Text } = Typography;

const ROLE_COLOR: Record<string, string> = {
    admin: 'blue',
    operator: 'cyan',
    viewer: 'default',
    devops_engineer: 'geekblue',
    healing_engineer: 'green',
    auditor: 'orange',
    monitor_admin: 'purple',
    notification_manager: 'magenta',
};

const INV_STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
    pending: { label: '待接受', color: 'processing', icon: <ClockCircleOutlined /> },
    accepted: { label: '已接受', color: 'success', icon: <CheckCircleOutlined /> },
    expired: { label: '已过期', color: 'default', icon: <StopOutlined /> },
    cancelled: { label: '已取消', color: 'default', icon: <CloseCircleOutlined /> },
};

const TenantMembersPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<any[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('members');

    // 添加成员
    const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);
    const [addMemberForm] = Form.useForm();
    const [simpleUsers, setSimpleUsers] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // 邀请用户
    const [inviteModalOpen, setInviteModalOpen] = useState(false);
    const [inviteForm] = Form.useForm();
    const [inviteResult, setInviteResult] = useState<any>(null); // 邀请结果（含链接）

    // 邀请列表
    const [invitations, setInvitations] = useState<any[]>([]);
    const [invTotal, setInvTotal] = useState(0);
    const [invLoading, setInvLoading] = useState(false);
    const [invPage, setInvPage] = useState(1);

    // 变更角色
    const [changeRoleModalOpen, setChangeRoleModalOpen] = useState(false);
    const [changeRoleTarget, setChangeRoleTarget] = useState<any>(null);
    const [changeRoleForm] = Form.useForm();
    const [tenantRoles, setTenantRoles] = useState<any[]>([]);

    const loadTenant = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        try {
            const res = await getTenant(id);
            setTenant((res as any)?.data || res);
        } catch {
            /* global error handler */
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadMembers = useCallback(async () => {
        if (!id) return;
        setMembersLoading(true);
        try {
            const res = await getTenantMembers(id);
            setMembers((res as any)?.data || []);
        } catch {
            /* global error handler */
        } finally {
            setMembersLoading(false);
        }
    }, [id]);

    const loadSimpleUsers = useCallback(async () => {
        try {
            const res = await getPlatformUsersSimple();
            setSimpleUsers((res as any)?.data || []);
        } catch { }
    }, []);

    const loadInvitations = useCallback(async (page = 1) => {
        if (!id) return;
        setInvLoading(true);
        try {
            const res = await getTenantInvitations(id, { page, page_size: 20 });
            setInvitations((res as any)?.data || []);
            setInvTotal((res as any)?.total || 0);
            setInvPage(page);
        } catch {
            /* global error handler */
        } finally {
            setInvLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadTenant();
        loadMembers();
        loadSimpleUsers();
        loadInvitations();
        getSystemTenantRoles().then((res: any) => {
            setTenantRoles(res?.data || []);
        }).catch(() => { });
    }, [loadTenant, loadMembers, loadSimpleUsers, loadInvitations]);

    // 已是成员的 ID Set
    const memberUserIds = new Set(members.map((m: any) => m.user_id));
    const adminMemberIds = members
        .filter((m: any) => m.role?.name === 'admin')
        .map((m: any) => m.user_id);
    const isLastAdminMember = (record: any) => record.role?.name === 'admin' && adminMemberIds.length <= 1;

    // 选人池：排除已在租户 + 排除已具备平台角色的用户（平台用户不在这里直接纳入租户成员）
    const availableForAdd = simpleUsers.filter(
        u => !memberUserIds.has(u.id) && !u.is_platform_admin
    );

    // ============ 添加成员 ============
    const handleAddMember = async (values: { user_id: string; role_id: string }) => {
        if (!id) return;
        setSubmitting(true);
        try {
            await addTenantMember(id, values);
            message.success('成员添加成功');
            setAddMemberModalOpen(false);
            addMemberForm.resetFields();
            loadMembers();
            loadSimpleUsers();
        } catch {
            /* 全局 errorHandler 已显示错误 */
        } finally {
            setSubmitting(false);
        }
    };

    // ============ 移除成员 ============
    const handleRemoveMember = async (userId: string) => {
        if (!id) return;
        try {
            await removeTenantMember(id, userId);
            message.success('成员已移除');
            loadMembers();
            loadSimpleUsers();
        } catch {
            /* 全局 errorHandler 已显示错误 */
        }
    };

    // ============ 邀请用户 ============
    const handleInvite = async (values: { email: string; role_id: string; send_email: boolean }) => {
        if (!id) return;
        setSubmitting(true);
        try {
            const res = await inviteToTenant(id, values);
            const data = (res as any)?.data || res;
            setInviteResult(data);
            message.success('邀请已创建');
            inviteForm.resetFields();
            loadInvitations();
        } catch {
            /* 全局 errorHandler 已显示错误 */
        } finally {
            setSubmitting(false);
        }
    };

    // ============ 取消邀请 ============
    const handleCancelInvitation = async (invId: string) => {
        if (!id) return;
        try {
            await cancelTenantInvitation(id, invId);
            message.success('邀请已取消');
            loadInvitations(invPage);
        } catch {
            /* 全局 errorHandler 已显示错误 */
        }
    };

    // ============ 变更角色 ============
    const openChangeRole = (member: any) => {
        setChangeRoleTarget(member);
        changeRoleForm.setFieldValue('role_id', member.role_id);
        setChangeRoleModalOpen(true);
    };

    const handleChangeRole = async (values: { role_id: string }) => {
        if (!id || !changeRoleTarget) return;
        setSubmitting(true);
        try {
            await updateTenantMemberRole(id, changeRoleTarget.user_id, { role_id: values.role_id });
            message.success('角色已更新');
            setChangeRoleModalOpen(false);
            changeRoleForm.resetFields();
            loadMembers();
        } catch {
            /* global error handler */
        } finally {
            setSubmitting(false);
        }
    };

    // ============ 复制链接 ============
    const copyInvitationLink = (url: string) => {
        navigator.clipboard.writeText(url).then(() => {
            message.success('邀请链接已复制到剪贴板');
        }).catch(() => {
            // fallback
            const textarea = document.createElement('textarea');
            textarea.value = url;
            document.body.appendChild(textarea);
            textarea.select();
            document.execCommand('copy');
            document.body.removeChild(textarea);
            message.success('邀请链接已复制');
        });
    };

    if (loading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <Spin size="large" />
            </div>
        );
    }

    // ============ 成员表格列 ============
    const memberColumns = [
        {
            title: '成员',
            dataIndex: 'user',
            key: 'user',
            render: (_: any, record: any) => {
                const name = record.user?.display_name || record.user?.username || record.user_id?.substring(0, 8);
                const username = record.user?.username || '';
                const isAdmin = record.role?.name === 'admin';
                const initial = name?.[0]?.toUpperCase() || '?';
                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar
                            size={32}
                            style={{
                                background: isAdmin ? '#fff7e6' : '#e6f4ff',
                                color: isAdmin ? '#fa8c16' : '#1677ff',
                                border: `1px solid ${isAdmin ? '#ffd591' : '#bae0ff'}`,
                                fontSize: 12, fontWeight: 600,
                            }}
                        >
                            {initial}
                        </Avatar>
                        <div style={{ minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.4 }}>
                                {name}
                            </div>
                            {username && username !== name && (
                                <div style={{ fontSize: 11, color: '#a0a0a0', lineHeight: 1.2 }}>@{username}</div>
                            )}
                        </div>
                    </div>
                );
            },
        },
        {
            title: '邮箱',
            key: 'email',
            width: 200,
            render: (_: any, record: any) => (
                <span style={{ fontSize: 12, color: '#595959' }}>
                    {record.user?.email || '-'}
                </span>
            ),
        },
        {
            title: '角色',
            dataIndex: 'role',
            key: 'role',
            width: 110,
            render: (_: any, record: any) => {
                const roleName = record.role?.name;
                const roleDisplay = record.role?.display_name || roleName || '-';
                return <Tag color={ROLE_COLOR[roleName] || 'default'} style={{ margin: 0 }}>{roleDisplay}</Tag>;
            },
        },
        {
            title: '加入时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 150,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: '#8c8c8c', fontVariantNumeric: 'tabular-nums' }}>
                    {v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'}
                </span>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 140,
            render: (_: any, record: any) => {
                const protectLastAdmin = isLastAdminMember(record);
                const disabledReason = protectLastAdmin ? '最后一个租户管理员不能被降级或移除' : '';
                return (
                    <Space size={4}>
                        <Tooltip title={disabledReason || '变更角色'}>
                            <Button
                                type="link" size="small"
                                icon={<SettingOutlined />}
                                disabled={!access.canManagePlatformTenants || protectLastAdmin}
                                onClick={() => openChangeRole(record)}
                                style={{ padding: 0, fontSize: 12 }}
                            >
                                变更角色
                            </Button>
                        </Tooltip>
                        <Popconfirm
                            title="确认移除该成员？"
                            description="移除后该用户将无法访问此租户的资源"
                            onConfirm={() => handleRemoveMember(record.user_id)}
                            okText="确认移除"
                            cancelText="取消"
                            okButtonProps={{ danger: true }}
                            disabled={protectLastAdmin}
                        >
                            <Tooltip title={disabledReason || '移除'}>
                                <Button
                                    type="link" size="small" danger
                                    icon={<DeleteOutlined />}
                                    disabled={!access.canManagePlatformTenants || protectLastAdmin}
                                    style={{ padding: 0, fontSize: 12 }}
                                >
                                    移除
                                </Button>
                            </Tooltip>
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    // ============ 邀请表格列 ============
    const invitationColumns = [
        {
            title: '受邀邮箱',
            dataIndex: 'email',
            key: 'email',
            render: (email: string) => (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MailOutlined style={{ color: '#8c8c8c', fontSize: 12 }} />
                    <span style={{ fontSize: 13, color: '#262626' }}>{email}</span>
                </div>
            ),
        },
        {
            title: '角色',
            key: 'role',
            width: 110,
            render: (_: any, record: any) => {
                const roleName = record.role?.name;
                const roleDisplay = record.role?.display_name || roleName || '-';
                return <Tag color={ROLE_COLOR[roleName] || 'default'} style={{ margin: 0 }}>{roleDisplay}</Tag>;
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            key: 'status',
            width: 100,
            render: (status: string) => {
                const s = INV_STATUS_MAP[status] || { label: status, color: 'default', icon: null };
                return <Tag color={s.color} icon={s.icon} style={{ margin: 0 }}>{s.label}</Tag>;
            },
        },
        {
            title: '邀请人',
            key: 'inviter',
            width: 120,
            render: (_: any, record: any) => (
                <span style={{ fontSize: 12, color: '#595959' }}>
                    {record.inviter?.display_name || record.inviter?.username || '-'}
                </span>
            ),
        },
        {
            title: '过期时间',
            dataIndex: 'expires_at',
            key: 'expires_at',
            width: 150,
            render: (v: string) => (
                <span style={{ fontSize: 12, color: '#8c8c8c', fontVariantNumeric: 'tabular-nums' }}>
                    {v ? dayjs(v).format('YYYY-MM-DD HH:mm') : '-'}
                </span>
            ),
        },
        {
            title: '操作',
            key: 'action',
            width: 120,
            render: (_: any, record: any) => (
                record.status === 'pending' ? (
                    <Space size={0}>
                        {record.invitation_url && (
                            <Tooltip title="复制邀请链接">
                                <Button
                                    type="link" size="small"
                                    icon={<CopyOutlined />}
                                    style={{ padding: '0 4px', fontSize: 12 }}
                                    disabled={!access.canManagePlatformTenants}
                                    onClick={() => copyInvitationLink(record.invitation_url)}
                                >
                                    复制
                                </Button>
                            </Tooltip>
                        )}
                        <Popconfirm
                            title="确认取消此邀请？"
                            onConfirm={() => handleCancelInvitation(record.id)}
                            okText="确认" cancelText="取消"
                        >
                            <Button
                                type="link" size="small" danger
                                icon={<CloseCircleOutlined />}
                                disabled={!access.canManagePlatformTenants}
                                style={{ padding: '0 4px', fontSize: 12 }}
                            >
                                取消
                            </Button>
                        </Popconfirm>
                    </Space>
                ) : <span style={{ color: '#d9d9d9', fontSize: 12 }}>—</span>
            ),
        },
    ];

    // 待处理的邀请数
    const pendingInvCount = invitations.filter(i => i.status === 'pending').length;

    return (
        <div className="tenant-members-page">
            <SubPageHeader
                title={`${tenant?.name || ''} — 成员管理`}
                onBack={() => history.push('/platform/tenants')}
                actions={
                    <Space size={8}>
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            disabled={!access.canManagePlatformTenants}
                            onClick={() => { setInviteResult(null); setInviteModalOpen(true); }}
                        >
                            邀请用户
                        </Button>
                        <Button
                            icon={<UserAddOutlined />}
                            disabled={!access.canManagePlatformTenants}
                            onClick={() => setAddMemberModalOpen(true)}
                        >
                            添加成员
                        </Button>
                    </Space>
                }
            />

            <div className="tenant-members-body">
                <div className="tenant-members-card">
                    <Tabs
                        activeKey={activeTab}
                        onChange={(key) => {
                            setActiveTab(key);
                            if (key === 'invitations') loadInvitations();
                        }}
                        size="small"
                        items={[
                            {
                                key: 'members',
                                label: (
                                    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                        <TeamOutlined />
                                        全部成员
                                        <span style={{
                                            fontSize: 11, color: '#8c8c8c',
                                            background: '#f5f5f5', padding: '1px 8px',
                                            borderRadius: 10, fontVariantNumeric: 'tabular-nums',
                                        }}>{members.length}</span>
                                    </span>
                                ),
                                children: (
                                    <Spin spinning={membersLoading}>
                                        {members.length === 0 && !membersLoading ? (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="该租户暂无成员"
                                                style={{ padding: '40px 0' }}
                                            >
                                                <Space>
                                                    <Button type="primary" icon={<SendOutlined />}
                                                        onClick={() => { setInviteResult(null); setInviteModalOpen(true); }}>
                                                        邀请用户
                                                    </Button>
                                                    <Button icon={<UserAddOutlined />}
                                                        onClick={() => setAddMemberModalOpen(true)}>
                                                        添加成员
                                                    </Button>
                                                </Space>
                                            </Empty>
                                        ) : (
                                            <Table
                                                dataSource={members}
                                                columns={memberColumns}
                                                rowKey="id"
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
                                        {pendingInvCount > 0 && (
                                            <Badge count={pendingInvCount} size="small"
                                                style={{ boxShadow: 'none' }} />
                                        )}
                                    </span>
                                ),
                                children: (
                                    <Spin spinning={invLoading}>
                                        {invitations.length === 0 && !invLoading ? (
                                            <Empty
                                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                description="暂无邀请记录"
                                                style={{ padding: '40px 0' }}
                                            />
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
                                                    showTotal: (t) => `共 ${t} 条`,
                                                    onChange: (p) => loadInvitations(p),
                                                } : false}
                                            />
                                        )}
                                    </Spin>
                                ),
                            },
                        ]}
                    />

                    {/* 角色说明 */}
                    <div style={{
                        marginTop: 20, padding: '10px 14px',
                        background: '#f6f8fa', border: '1px solid #e8e8e8',
                        borderRadius: 2, fontSize: 12, color: '#8c8c8c', lineHeight: 1.8,
                    }}>
                        <b style={{ color: '#595959' }}>角色说明：</b>
                        {tenantRoles.map((role, i) => (
                            <span key={role.id}>
                                <b style={{ color: '#262626' }}>{role.display_name}</b>
                                {' '}{role.description || role.name}
                                {i < tenantRoles.length - 1 && ' · '}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* ===== 添加成员 Modal ===== */}
            <Modal
                title={<Space><UserAddOutlined style={{ color: '#1677ff' }} />为「{tenant?.name}」添加成员</Space>}
                open={addMemberModalOpen}
                onCancel={() => { setAddMemberModalOpen(false); addMemberForm.resetFields(); }}
                onOk={() => addMemberForm.submit()}
                okText="添加" confirmLoading={submitting} destroyOnHidden width={440}
            >
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 2, fontSize: 12, color: '#0050b3' }}>
                    从可加入租户的活跃用户中选择成员添加到该租户，并分配角色。已具备平台角色的用户不会出现在这里。
                </div>
                <Form form={addMemberForm} layout="vertical" onFinish={handleAddMember} style={{ marginTop: 8 }}>
                    <Form.Item name="user_id" label="选择用户" rules={[{ required: true, message: '请选择用户' }]}>
                        <Select
                            showSearch
                            placeholder="搜索用户名或姓名"
                            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            options={availableForAdd.map(u => ({
                                label: `${u.display_name || u.username} (@${u.username})`,
                                value: u.id,
                            }))}
                            notFoundContent={<div style={{ textAlign: 'center', padding: '12px 0', color: '#8c8c8c' }}>暂无可选用户</div>}
                        />
                    </Form.Item>
                    <Form.Item name="role_id" label="分配角色" rules={[{ required: true, message: '请选择角色' }]}>
                        <Select placeholder="选择角色">
                            {tenantRoles.map(role => (
                                <Select.Option key={role.id} value={role.id}>
                                    {role.display_name}
                                    {role.description && (
                                        <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>— {role.description}</span>
                                    )}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>

            {/* ===== 邀请用户 Modal ===== */}
            <Modal
                title={<Space><SendOutlined style={{ color: '#1677ff' }} />邀请用户加入「{tenant?.name}」</Space>}
                open={inviteModalOpen}
                onCancel={() => { setInviteModalOpen(false); inviteForm.resetFields(); setInviteResult(null); }}
                footer={inviteResult ? (
                    <Button onClick={() => { setInviteModalOpen(false); inviteForm.resetFields(); setInviteResult(null); }}>
                        完成
                    </Button>
                ) : undefined}
                onOk={inviteResult ? undefined : () => inviteForm.submit()}
                okText="发送邀请" confirmLoading={submitting} destroyOnHidden width={520}
            >
                {inviteResult ? (
                    /* 邀请结果：展示链接 */
                    <div>
                        <div style={{
                            padding: '14px 16px', background: '#f6ffed', border: '1px solid #b7eb8f',
                            borderRadius: 4, marginBottom: 16, textAlign: 'center',
                        }}>
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
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: 8,
                            padding: '10px 12px', background: '#fafafa', border: '1px solid #e8e8e8',
                            borderRadius: 4,
                        }}>
                            <Input
                                value={inviteResult.invitation_url}
                                readOnly
                                style={{ flex: 1, fontSize: 12, border: 'none', background: 'transparent', padding: 0 }}
                            />
                            <Button
                                type="primary" size="small"
                                icon={<CopyOutlined />}
                                disabled={!access.canManagePlatformTenants}
                                onClick={() => copyInvitationLink(inviteResult.invitation_url)}
                            >
                                复制
                            </Button>
                        </div>

                        <div style={{ marginTop: 12, fontSize: 11, color: '#8c8c8c', lineHeight: 1.6 }}>
                            · 用户通过此链接可注册并自动加入「{tenant?.name}」<br />
                            · 每个邮箱只能有一个待处理邀请
                        </div>
                    </div>
                ) : (
                    /* 邀请表单 */
                    <>
                        <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 2, fontSize: 12, color: '#0050b3' }}>
                            输入邮箱地址邀请新用户，系统会生成邀请链接。用户通过链接注册后自动加入此租户。
                        </div>
                        <Form form={inviteForm} layout="vertical" onFinish={handleInvite}
                            initialValues={{ send_email: false }} style={{ marginTop: 8 }}
                        >
                            <Form.Item name="email" label="邮箱地址" rules={[
                                { required: true, message: '请输入邮箱' },
                                { type: 'email', message: '邮箱格式不正确' },
                            ]}>
                                <Input placeholder="user@example.com" prefix={<MailOutlined style={{ color: '#bfbfbf' }} />} />
                            </Form.Item>
                            <Form.Item name="role_id" label="分配角色" rules={[{ required: true, message: '请选择角色' }]}>
                                <Select placeholder="选择加入后的角色">
                                    {tenantRoles.map(role => (
                                        <Select.Option key={role.id} value={role.id}>
                                            {role.display_name}
                                            {role.description && (
                                                <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>— {role.description}</span>
                                            )}
                                        </Select.Option>
                                    ))}
                                </Select>
                            </Form.Item>
                            <Form.Item name="send_email" label="发送邮件通知" valuePropName="checked"
                                extra="启用后需在平台设置中配置 SMTP 邮箱服务"
                            >
                                <Switch checkedChildren="发送" unCheckedChildren="不发送" />
                            </Form.Item>
                        </Form>
                    </>
                )}
            </Modal>

            {/* ===== 变更角色 Modal ===== */}
            <Modal
                title={<Space><SettingOutlined />变更租户内角色</Space>}
                open={changeRoleModalOpen}
                onCancel={() => { setChangeRoleModalOpen(false); changeRoleForm.resetFields(); }}
                onOk={() => changeRoleForm.submit()}
                okText="确认变更" confirmLoading={submitting} destroyOnHidden width={400}
            >
                <Form form={changeRoleForm} layout="vertical" onFinish={handleChangeRole} style={{ marginTop: 8 }}>
                    <Form.Item name="role_id" label="目标角色" rules={[{ required: true, message: '请选择角色' }]}>
                        <Select>
                            {tenantRoles.map(role => (
                                <Select.Option key={role.id} value={role.id}>
                                    {role.display_name}
                                    {role.description && (
                                        <span style={{ fontSize: 12, color: '#8c8c8c', marginLeft: 8 }}>— {role.description}</span>
                                    )}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
};

export default TenantMembersPage;
