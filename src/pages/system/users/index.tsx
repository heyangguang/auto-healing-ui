import React, { useState, useRef } from 'react';
import { useAccess } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
    Button, Tag, Space, Modal, Form, Input, Select, message, Popconfirm,
    Drawer, Descriptions, Transfer, Tooltip, Typography,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, KeyOutlined,
    UserSwitchOutlined, EyeOutlined, UserOutlined,
} from '@ant-design/icons';
import { getUsers, createUser, updateUser, deleteUser, resetUserPassword, assignUserRoles } from '@/services/auto-healing/users';
import { getRoles } from '@/services/auto-healing/roles';
import dayjs from 'dayjs';

const { Text } = Typography;

const UsersPage: React.FC = () => {
    const access = useAccess();
    const actionRef = useRef<ActionType>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [resetPwdModalOpen, setResetPwdModalOpen] = useState(false);
    const [assignRoleOpen, setAssignRoleOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [allRoles, setAllRoles] = useState<AutoHealing.RoleWithStats[]>([]);
    const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();
    const [resetPwdForm] = Form.useForm();

    const loadRoles = async () => {
        try {
            const res = await getRoles();
            setAllRoles(res?.data || []);
        } catch { /* ignore */ }
    };

    const columns: ProColumns<any>[] = [
        {
            title: '用户名',
            dataIndex: 'username',
            width: 120,
            render: (_, record) => (
                <a onClick={() => { setCurrentUser(record); setDetailOpen(true); }}>{record.username}</a>
            ),
        },
        {
            title: '显示名称',
            dataIndex: 'display_name',
            width: 120,
            ellipsis: true,
            hideInSearch: true,
        },
        {
            title: '邮箱',
            dataIndex: 'email',
            width: 180,
            ellipsis: true,
            hideInSearch: true,
        },
        {
            title: '角色',
            dataIndex: 'roles',
            width: 160,
            hideInSearch: true,
            render: (_, record) => {
                const roles = record.roles || [];
                if (roles.length === 0) return <Text type="secondary">无角色</Text>;
                return (
                    <Space size={[0, 4]} wrap>
                        {roles.map((role: any) => (
                            <Tag key={role.id} color={role.is_system ? 'blue' : 'default'}>
                                {role.display_name || role.name}
                            </Tag>
                        ))}
                    </Space>
                );
            },
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 80,
            valueType: 'select',
            valueEnum: {
                active: { text: '启用', status: 'Success' },
                inactive: { text: '禁用', status: 'Default' },
            },
        },
        {
            title: '创建时间',
            dataIndex: 'created_at',
            valueType: 'dateTime',
            width: 160,
            hideInSearch: true,
        },
        {
            title: '操作',
            valueType: 'option',
            width: 140,
            render: (_, record) => (
                <Space size="small">
                    <Tooltip title="编辑">
                        <Button
                            type="link" size="small" icon={<EditOutlined />}
                            disabled={!access.canUpdateUser}
                            onClick={() => {
                                setCurrentUser(record);
                                editForm.setFieldsValue({
                                    display_name: record.display_name,
                                    status: record.status,
                                });
                                setEditModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="分配角色">
                        <Button
                            type="link" size="small" icon={<UserSwitchOutlined />}
                            disabled={!access.canAssignRoles}
                            onClick={async () => {
                                setCurrentUser(record);
                                await loadRoles();
                                const userRoleIds = (record.roles || []).map((r: any) => r.id);
                                setSelectedRoleIds(userRoleIds);
                                setAssignRoleOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Tooltip title="重置密码">
                        <Button
                            type="link" size="small" icon={<KeyOutlined />}
                            disabled={!access.canResetPassword}
                            onClick={() => {
                                setCurrentUser(record);
                                resetPwdForm.resetFields();
                                setResetPwdModalOpen(true);
                            }}
                        />
                    </Tooltip>
                    <Popconfirm title="确定要删除此用户吗？" onConfirm={async () => {
                        try { await deleteUser(record.id); message.success('删除成功'); actionRef.current?.reload(); }
                        catch { message.error('删除失败'); }
                    }}>
                        <Tooltip title="删除">
                            <Button type="link" size="small" danger disabled={!access.canDeleteUser} icon={<DeleteOutlined />} />
                        </Tooltip>
                    </Popconfirm>
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            header={{
                title: <><UserOutlined /> 用户管理 / USERS</>,
                subTitle: '管理系统用户、角色分配和权限',
            }}
        >
            <ProTable<any>
                headerTitle="用户列表"
                actionRef={actionRef}
                rowKey="id"
                search={{ labelWidth: 80, span: 6, defaultCollapsed: true }}
                toolBarRender={() => [
                    <Button
                        key="create"
                        type="primary"
                        icon={<PlusOutlined />}
                        disabled={!access.canCreateUser}
                        onClick={() => { createForm.resetFields(); loadRoles(); setCreateModalOpen(true); }}
                    >
                        新建用户
                    </Button>,
                ]}
                request={async (params) => {
                    const res = await getUsers({
                        page: params.current || 1,
                        page_size: params.pageSize || 20,
                        status: params.status,
                        search: params.username,
                    });
                    const items = res?.data || res?.items || [];
                    const total = res?.pagination?.total ?? res?.total ?? 0;
                    return { data: items, total, success: true };
                }}
                columns={columns}
                pagination={{
                    defaultPageSize: 20,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`,
                }}
            />

            {/* 创建用户弹窗 */}
            <Modal
                title="新建用户"
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                onOk={async () => {
                    const values = await createForm.validateFields();
                    try { await createUser(values); message.success('创建成功'); setCreateModalOpen(false); actionRef.current?.reload(); }
                    catch { message.error('创建失败'); }
                }}
                destroyOnClose
            >
                <Form form={createForm} layout="vertical">
                    <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
                        <Input placeholder="请输入用户名" />
                    </Form.Item>
                    <Form.Item name="email" label="邮箱" rules={[{ required: true, type: 'email', message: '请输入有效邮箱' }]}>
                        <Input placeholder="请输入邮箱" />
                    </Form.Item>
                    <Form.Item name="password" label="密码" rules={[{ required: true, min: 8, message: '密码至少8位' }]}>
                        <Input.Password placeholder="请输入密码（至少8位）" />
                    </Form.Item>
                    <Form.Item name="display_name" label="显示名称">
                        <Input placeholder="请输入显示名称" />
                    </Form.Item>
                    <Form.Item name="role_ids" label="角色">
                        <Select mode="multiple" placeholder="选择角色" options={allRoles.map(r => ({ label: r.display_name || r.name, value: r.id }))} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑用户弹窗 */}
            <Modal
                title={`编辑用户 - ${currentUser?.username}`}
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onOk={async () => {
                    if (!currentUser) return;
                    const values = await editForm.validateFields();
                    try { await updateUser(currentUser.id, values); message.success('更新成功'); setEditModalOpen(false); actionRef.current?.reload(); }
                    catch { message.error('更新失败'); }
                }}
                destroyOnClose
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item name="display_name" label="显示名称">
                        <Input placeholder="请输入显示名称" />
                    </Form.Item>
                    <Form.Item name="status" label="状态">
                        <Select options={[{ label: '启用', value: 'active' }, { label: '禁用', value: 'inactive' }]} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 重置密码弹窗 */}
            <Modal
                title={`重置密码 - ${currentUser?.username}`}
                open={resetPwdModalOpen}
                onCancel={() => setResetPwdModalOpen(false)}
                onOk={async () => {
                    if (!currentUser) return;
                    const values = await resetPwdForm.validateFields();
                    try { await resetUserPassword(currentUser.id, values); message.success('密码重置成功'); setResetPwdModalOpen(false); }
                    catch { message.error('重置失败'); }
                }}
                destroyOnClose
            >
                <Form form={resetPwdForm} layout="vertical">
                    <Form.Item name="new_password" label="新密码" rules={[{ required: true, min: 8, message: '密码至少8位' }]}>
                        <Input.Password placeholder="请输入新密码（至少8位）" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 分配角色抽屉 */}
            <Drawer
                title={`分配角色 - ${currentUser?.username}`}
                open={assignRoleOpen}
                onClose={() => setAssignRoleOpen(false)}
                width={520}
                footer={
                    <Space style={{ float: 'right' }}>
                        <Button onClick={() => setAssignRoleOpen(false)}>取消</Button>
                        <Button type="primary" onClick={async () => {
                            if (!currentUser) return;
                            try { await assignUserRoles(currentUser.id, { role_ids: selectedRoleIds }); message.success('角色分配成功'); setAssignRoleOpen(false); actionRef.current?.reload(); }
                            catch { message.error('分配失败'); }
                        }}>确定</Button>
                    </Space>
                }
            >
                <Transfer
                    dataSource={allRoles.map(r => ({ key: r.id, title: r.display_name || r.name, description: r.description || '' }))}
                    targetKeys={selectedRoleIds}
                    onChange={(targetKeys) => setSelectedRoleIds(targetKeys as string[])}
                    render={(item) => item.title || ''}
                    titles={['可选角色', '已分配角色']}
                    showSearch
                    listStyle={{ width: 220, height: 400 }}
                />
            </Drawer>

            {/* 用户详情抽屉 */}
            <Drawer
                title={`用户详情 - ${currentUser?.username}`}
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                width={560}
            >
                {currentUser && (
                    <Descriptions column={1} bordered size="small" labelStyle={{ whiteSpace: 'nowrap', width: 80 }}>
                        <Descriptions.Item label="用户名">{currentUser.username}</Descriptions.Item>
                        <Descriptions.Item label="显示名称">{currentUser.display_name || '-'}</Descriptions.Item>
                        <Descriptions.Item label="邮箱">{currentUser.email}</Descriptions.Item>
                        <Descriptions.Item label="状态">
                            <Tag color={currentUser.status === 'active' ? 'green' : 'default'}>
                                {currentUser.status === 'active' ? '启用' : '禁用'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="角色">
                            <Space wrap>
                                {(currentUser.roles || []).map((r: any) => (
                                    <Tag key={r.id} color="blue">{r.display_name || r.name}</Tag>
                                ))}
                            </Space>
                        </Descriptions.Item>
                        <Descriptions.Item label="创建时间">
                            {dayjs(currentUser.created_at).format('YYYY-MM-DD HH:mm:ss')}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Drawer>
        </PageContainer>
    );
};

export default UsersPage;
