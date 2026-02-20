import React, { useEffect, useState, useCallback } from 'react';
import {
    Tag, Button, Space, message, Spin, Avatar, Typography,
    Empty, Table, Form, Select, Modal, Input, Tooltip,
} from 'antd';
import {
    ArrowLeftOutlined, CrownOutlined, PlusOutlined,
    TeamOutlined, UserAddOutlined, SettingOutlined,
} from '@ant-design/icons';
import { history, useParams } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getTenant, getTenantMembers, setTenantAdmin,
    updateTenantMemberRole, createTenantUser,
} from '@/services/auto-healing/platform/tenants';
import { getPlatformUsersSimple } from '@/services/auto-healing/platform/users';
import { getRoles } from '@/services/auto-healing/roles';
import dayjs from 'dayjs';
import './TenantMembers.css';

const { Text } = Typography;

const ROLE_COLOR: Record<string, string> = {
    admin: 'blue',
    operator: 'cyan',
    viewer: 'default',
};

const TenantMembersPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [tenant, setTenant] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<any[]>([]);
    const [membersLoading, setMembersLoading] = useState(false);

    // 设置管理员
    const [setAdminModalOpen, setSetAdminModalOpen] = useState(false);
    const [setAdminForm] = Form.useForm();
    const [simpleUsers, setSimpleUsers] = useState<any[]>([]);
    const [submitting, setSubmitting] = useState(false);

    // 新建用户
    const [createUserModalOpen, setCreateUserModalOpen] = useState(false);
    const [createUserForm] = Form.useForm();

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
            message.error('加载租户信息失败');
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
            message.error('加载成员列表失败');
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

    useEffect(() => {
        loadTenant();
        loadMembers();
        loadSimpleUsers();
        getRoles().then((res: any) => {
            const roles = (res?.data || []).filter((r: any) =>
                ['admin', 'operator', 'viewer'].includes(r.name)
            );
            setTenantRoles(roles);
        }).catch(() => { });
    }, [loadTenant, loadMembers, loadSimpleUsers]);

    // 选人池：排除已有 admin + 排除 platform_admin
    const existingAdminUserIds = new Set(
        members.filter(m => m.role?.name === 'admin').map((m: any) => m.user_id)
    );
    const availableForAdmin = simpleUsers.filter(
        u => !existingAdminUserIds.has(u.id) && !u.is_platform_admin
    );

    // 设置管理员
    const handleSetAdmin = async (values: { user_id: string }) => {
        if (!id) return;
        setSubmitting(true);
        try {
            await setTenantAdmin(id, { user_id: values.user_id });
            message.success('已设置租户管理员');
            setSetAdminModalOpen(false);
            setAdminForm.resetFields();
            loadMembers();
            loadSimpleUsers();
        } catch {
            message.error('设置失败');
        } finally {
            setSubmitting(false);
        }
    };

    // 新建用户
    const handleCreateUser = async (values: any) => {
        if (!id) return;
        setSubmitting(true);
        try {
            await createTenantUser(id, values);
            message.success('用户创建成功，已加入该租户');
            setCreateUserModalOpen(false);
            createUserForm.resetFields();
            loadMembers();
            loadSimpleUsers();
        } catch {
            message.error('创建失败');
        } finally {
            setSubmitting(false);
        }
    };

    // 变更角色
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
            message.error('更新角色失败');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <Spin size="large" />
            </div>
        );
    }

    const columns = [
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
            width: 100,
            render: (_: any, record: any) => (
                <Button
                    type="link" size="small"
                    icon={<SettingOutlined />}
                    onClick={() => openChangeRole(record)}
                    style={{ padding: 0, fontSize: 12 }}
                >
                    变更角色
                </Button>
            ),
        },
    ];

    return (
        <div className="tenant-members-page">
            <SubPageHeader
                title={`${tenant?.name || ''} — 成员管理`}
                onBack={() => history.push('/platform/tenants')}
                actions={
                    <Space size={8}>
                        <Button
                            type="primary"
                            icon={<CrownOutlined />}
                            onClick={() => setSetAdminModalOpen(true)}
                        >
                            设置管理员
                        </Button>
                        <Button
                            icon={<PlusOutlined />}
                            onClick={() => setCreateUserModalOpen(true)}
                        >
                            新建用户
                        </Button>
                    </Space>
                }
            />

            <div className="tenant-members-body">
                <div className="tenant-members-card">
                    {/* 操作提示 */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        marginBottom: 16,
                    }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <TeamOutlined style={{ color: '#1677ff', fontSize: 14 }} />
                            <span style={{ fontSize: 14, fontWeight: 600, color: '#262626' }}>全部成员</span>
                            <span style={{
                                fontSize: 11, color: '#8c8c8c',
                                background: '#f5f5f5', padding: '1px 8px',
                                borderRadius: 10, fontVariantNumeric: 'tabular-nums',
                            }}>{members.length}</span>
                        </div>
                    </div>

                    <Spin spinning={membersLoading}>
                        {members.length === 0 && !membersLoading ? (
                            <Empty
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                                description="该租户暂无成员"
                                style={{ padding: '40px 0' }}
                            >
                                <Space>
                                    <Button type="primary" icon={<CrownOutlined />}
                                        onClick={() => setSetAdminModalOpen(true)}>
                                        设置管理员
                                    </Button>
                                    <Button icon={<PlusOutlined />}
                                        onClick={() => setCreateUserModalOpen(true)}>
                                        新建用户
                                    </Button>
                                </Space>
                            </Empty>
                        ) : (
                            <Table
                                dataSource={members}
                                columns={columns}
                                rowKey="id"
                                pagination={false}
                                size="small"
                                className="tenant-members-table"
                            />
                        )}
                    </Spin>

                    {/* 角色说明 */}
                    <div style={{
                        marginTop: 20, padding: '10px 14px',
                        background: '#f6f8fa', border: '1px solid #e8e8e8',
                        borderRadius: 2, fontSize: 12, color: '#8c8c8c', lineHeight: 1.8,
                    }}>
                        <b style={{ color: '#595959' }}>角色说明：</b>
                        <Tag color="blue" style={{ margin: '0 2px' }}>管理员</Tag> 管理租户内所有资源 ·
                        <Tag color="cyan" style={{ margin: '0 2px' }}>操作员</Tag> 执行操作，无管理权限 ·
                        <Tag color="default" style={{ margin: '0 2px' }}>只读</Tag> 只读用户
                    </div>
                </div>
            </div>

            {/* ===== 设置管理员 Modal ===== */}
            <Modal
                title={<Space><CrownOutlined style={{ color: '#fa8c16' }} />为「{tenant?.name}」设置管理员</Space>}
                open={setAdminModalOpen}
                onCancel={() => { setSetAdminModalOpen(false); setAdminForm.resetFields(); }}
                onOk={() => setAdminForm.submit()}
                okText="确认设置" confirmLoading={submitting} destroyOnHidden width={440}
            >
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#fffbe6', border: '1px solid #ffe58f', borderRadius: 2, fontSize: 12, color: '#7c5c00' }}>
                    从全量用户池中选人，后端将自动为其在该租户赋予 <b>admin</b> 角色。
                </div>
                <Form form={setAdminForm} layout="vertical" onFinish={handleSetAdmin} style={{ marginTop: 8 }}>
                    <Form.Item name="user_id" label="选择用户" rules={[{ required: true, message: '请选择用户' }]}>
                        <Select
                            showSearch
                            placeholder="搜索用户名或姓名"
                            filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            options={availableForAdmin.map(u => ({
                                label: `${u.display_name || u.username} (@${u.username})`,
                                value: u.id,
                            }))}
                            notFoundContent={<div style={{ textAlign: 'center', padding: '12px 0', color: '#8c8c8c' }}>暂无可选用户</div>}
                        />
                    </Form.Item>
                </Form>
            </Modal>

            {/* ===== 新建租户用户 Modal ===== */}
            <Modal
                title={<Space><PlusOutlined style={{ color: '#1677ff' }} />为「{tenant?.name}」新建用户</Space>}
                open={createUserModalOpen}
                onCancel={() => { setCreateUserModalOpen(false); createUserForm.resetFields(); }}
                onOk={() => createUserForm.submit()}
                okText="创建" confirmLoading={submitting} destroyOnHidden width={440}
            >
                <div style={{ marginBottom: 12, padding: '8px 12px', background: '#e6f7ff', border: '1px solid #91d5ff', borderRadius: 2, fontSize: 12, color: '#0050b3' }}>
                    创建的用户将自动加入该租户，角色默认为 <b>viewer</b>（只读）。如需设为管理员，请创建后使用「设置管理员」功能。
                </div>
                <Form form={createUserForm} layout="vertical" onFinish={handleCreateUser} style={{ marginTop: 8 }}>
                    <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }, { pattern: /^[a-zA-Z0-9_]+$/, message: '仅支持字母、数字、下划线' }]}>
                        <Input placeholder="登录用户名" autoComplete="off" />
                    </Form.Item>
                    <Form.Item name="display_name" label="显示名称">
                        <Input placeholder="可选，用于界面展示" />
                    </Form.Item>
                    <Form.Item name="email" label="邮箱" rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '邮箱格式不正确' }]}>
                        <Input placeholder="user@example.com" />
                    </Form.Item>
                    <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }, { min: 8, message: '密码至少 8 位' }]}>
                        <Input.Password placeholder="至少 8 位" autoComplete="new-password" />
                    </Form.Item>
                </Form>
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
                                    <Space size={6}>
                                        <Tag color={ROLE_COLOR[role.name] || 'default'} style={{ margin: 0 }}>{role.display_name}</Tag>
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            {role.name === 'admin' ? '管理租户内所有资源' : role.name === 'operator' ? '执行操作，无管理权限' : '只读用户'}
                                        </Text>
                                    </Space>
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
