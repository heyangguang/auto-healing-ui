import React, { useState, useRef } from 'react';
import { useAccess } from '@umijs/max';
import { PageContainer } from '@ant-design/pro-components';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import {
    Button, Tag, Space, Modal, Form, Input, message, Popconfirm,
    Drawer, Descriptions, Transfer, Badge, Tooltip, Typography, Tree,
} from 'antd';
import {
    PlusOutlined, EditOutlined, DeleteOutlined, SafetyOutlined,
    AppstoreOutlined, EyeOutlined,
} from '@ant-design/icons';
import { getRoles, createRole, updateRole, deleteRole, assignRolePermissions } from '@/services/auto-healing/roles';
import { getPermissionTree } from '@/services/auto-healing/permissions';
import { listSystemWorkspaces, getRoleWorkspaces, assignRoleWorkspaces } from '@/services/auto-healing/dashboard';
import dayjs from 'dayjs';

const { Text } = Typography;

// 模块中文名映射
const moduleLabels: Record<string, string> = {
    user: '用户管理',
    role: '角色管理',
    plugin: '插件管理',
    execution: '执行管理',
    notification: '通知管理',
    healing: '自愈引擎',
    workflow: '工作流',
    system: '系统管理',
    dashboard: '仪表板',
};

const RolesPage: React.FC = () => {
    const access = useAccess();
    const actionRef = useRef<ActionType>(null);
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [assignPermOpen, setAssignPermOpen] = useState(false);
    const [assignWsOpen, setAssignWsOpen] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentRole, setCurrentRole] = useState<AutoHealing.RoleWithStats | null>(null);
    // 权限树 (按模块分组)
    const [permTreeData, setPermTreeData] = useState<any[]>([]);
    const [checkedPermIds, setCheckedPermIds] = useState<string[]>([]);
    const [allPermIds, setAllPermIds] = useState<string[]>([]);
    // 工作区
    const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
    const [selectedWsIds, setSelectedWsIds] = useState<string[]>([]);
    const [createForm] = Form.useForm();
    const [editForm] = Form.useForm();

    // 加载权限树并转换为 Tree 组件格式
    const loadPermTree = async () => {
        try {
            const res = await getPermissionTree();
            const tree = res?.data || {};
            const allIds: string[] = [];
            const treeData = Object.entries(tree).map(([module, perms]: [string, any[]]) => {
                const children = perms.map((p: any) => {
                    allIds.push(p.id);
                    return {
                        key: p.id,
                        title: `${p.name} (${p.code})`,
                    };
                });
                return {
                    key: `module-${module}`,
                    title: `${moduleLabels[module] || module} (${perms.length})`,
                    children,
                };
            });
            setPermTreeData(treeData);
            setAllPermIds(allIds);
        } catch { /* ignore */ }
    };

    const columns: ProColumns<AutoHealing.RoleWithStats>[] = [
        {
            title: '角色名称',
            dataIndex: 'display_name',
            width: 180,
            render: (_, record) => (
                <Space>
                    <a onClick={() => { setCurrentRole(record); setDetailOpen(true); }}>
                        {record.display_name || record.name}
                    </a>
                    {record.is_system && <Tag color="blue">系统</Tag>}
                </Space>
            ),
        },
        {
            title: '标识',
            dataIndex: 'name',
            width: 140,
            hideInSearch: true,
            render: (text) => <code>{text as string}</code>,
        },
        {
            title: '类型',
            dataIndex: 'is_system',
            width: 80,
            hideInTable: true,
            valueType: 'select',
            valueEnum: {
                all: { text: '全部' },
                true: { text: '系统角色' },
                false: { text: '自定义角色' },
            },
        },
        {
            title: '描述',
            dataIndex: 'description',
            ellipsis: true,
            hideInSearch: true,
        },
        {
            title: '用户数',
            dataIndex: 'user_count',
            width: 80,
            hideInSearch: true,
            render: (_, record) => (
                <Badge count={record.user_count} showZero
                    style={{ backgroundColor: record.user_count > 0 ? '#1890ff' : '#d9d9d9' }}
                />
            ),
        },
        {
            title: '权限数',
            dataIndex: 'permission_count',
            width: 80,
            hideInSearch: true,
            render: (_, record) => {
                const count = record.permission_count || (record.permissions?.length ?? 0);
                return <Badge count={count} showZero style={{ backgroundColor: count > 0 ? '#52c41a' : '#d9d9d9' }} />;
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
                    {/* 系统角色只能查看和分配工作区 */}
                    <Tooltip title="详情">
                        <Button type="link" size="small" icon={<EyeOutlined />}
                            onClick={() => { setCurrentRole(record); setDetailOpen(true); }}
                        />
                    </Tooltip>
                    {!record.is_system && (
                        <>
                            <Tooltip title="编辑">
                                <Button type="link" size="small" icon={<EditOutlined />}
                                    disabled={!access.canUpdateRole}
                                    onClick={() => {
                                        setCurrentRole(record);
                                        editForm.setFieldsValue({ display_name: record.display_name, description: record.description });
                                        setEditModalOpen(true);
                                    }}
                                />
                            </Tooltip>
                            <Tooltip title="分配权限">
                                <Button type="link" size="small" icon={<SafetyOutlined />}
                                    disabled={!access.canAssignPermissions}
                                    onClick={async () => {
                                        setCurrentRole(record);
                                        await loadPermTree();
                                        const permIds = (record.permissions || []).map((p) => p.id);
                                        setCheckedPermIds(permIds);
                                        setAssignPermOpen(true);
                                    }}
                                />
                            </Tooltip>
                        </>
                    )}
                    <Tooltip title="分配工作区">
                        <Button type="link" size="small" icon={<AppstoreOutlined />}
                            disabled={!access.canManageWorkspace}
                            onClick={async () => {
                                setCurrentRole(record);
                                try {
                                    const [wsRes, roleWsRes] = await Promise.all([
                                        listSystemWorkspaces(),
                                        getRoleWorkspaces(record.id),
                                    ]);
                                    const workspaces = wsRes?.data || [];
                                    setAllWorkspaces(workspaces);
                                    const roleWsData = roleWsRes?.data;
                                    const assignedIds: string[] = Array.isArray(roleWsData)
                                        ? roleWsData.map((w: any) => w.id)
                                        : (roleWsData?.workspace_ids || []);
                                    const defaultIds = workspaces.filter((ws: any) => ws.is_default).map((ws: any) => ws.id);
                                    setSelectedWsIds(Array.from(new Set([...assignedIds, ...defaultIds])));
                                } catch { /* ignore */ }
                                setAssignWsOpen(true);
                            }}
                        />
                    </Tooltip>
                    {!record.is_system && (
                        <Popconfirm title="确定要删除此角色吗？" onConfirm={async () => {
                            try { await deleteRole(record.id); message.success('删除成功'); actionRef.current?.reload(); }
                            catch (e: any) { message.error(e?.message || '删除失败'); }
                        }}>
                            <Tooltip title="删除">
                                <Button type="link" size="small" danger disabled={!access.canDeleteRole} icon={<DeleteOutlined />} />
                            </Tooltip>
                        </Popconfirm>
                    )}
                </Space>
            ),
        },
    ];

    return (
        <PageContainer
            header={{
                title: <><SafetyOutlined /> 角色管理 / ROLES</>,
                subTitle: '管理系统角色、权限分配和工作区',
            }}
        >
            <ProTable<AutoHealing.RoleWithStats>
                headerTitle="角色列表"
                actionRef={actionRef}
                rowKey="id"
                search={{ labelWidth: 80, span: 6, defaultCollapsed: true }}
                toolBarRender={() => [
                    <Button key="create" type="primary" icon={<PlusOutlined />}
                        disabled={!access.canCreateRole}
                        onClick={() => { createForm.resetFields(); setCreateModalOpen(true); }}
                    >
                        新建角色
                    </Button>,
                ]}
                request={async (params) => {
                    const res = await getRoles();
                    let data = res?.data || [];
                    // 前端搜索过滤（后端不支持搜索参数）
                    if (params.display_name) {
                        const kw = params.display_name.toLowerCase();
                        data = data.filter(r =>
                            (r.display_name || '').toLowerCase().includes(kw) ||
                            (r.name || '').toLowerCase().includes(kw)
                        );
                    }
                    if (params.is_system && params.is_system !== 'all') {
                        const isSystem = params.is_system === 'true';
                        data = data.filter(r => r.is_system === isSystem);
                    }
                    return { data, success: true };
                }}
                columns={columns}
                pagination={false}
            />

            {/* 创建角色弹窗 */}
            <Modal
                title="新建角色"
                open={createModalOpen}
                onCancel={() => setCreateModalOpen(false)}
                onOk={async () => {
                    const values = await createForm.validateFields();
                    try { await createRole(values); message.success('创建成功'); setCreateModalOpen(false); actionRef.current?.reload(); }
                    catch { message.error('创建失败'); }
                }}
                destroyOnClose
            >
                <Form form={createForm} layout="vertical">
                    <Form.Item name="name" label="角色标识" rules={[{ required: true, pattern: /^[a-z_]+$/, message: '仅支持小写字母和下划线' }]}>
                        <Input placeholder="如 team_leader" />
                    </Form.Item>
                    <Form.Item name="display_name" label="显示名称" rules={[{ required: true, message: '请输入显示名称' }]}>
                        <Input placeholder="如 团队负责人" />
                    </Form.Item>
                    <Form.Item name="description" label="描述">
                        <Input.TextArea placeholder="角色描述" rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 编辑角色弹窗（仅非系统角色可用）*/}
            <Modal
                title={`编辑角色 - ${currentRole?.display_name}`}
                open={editModalOpen}
                onCancel={() => setEditModalOpen(false)}
                onOk={async () => {
                    if (!currentRole) return;
                    const values = await editForm.validateFields();
                    try { await updateRole(currentRole.id, values); message.success('更新成功'); setEditModalOpen(false); actionRef.current?.reload(); }
                    catch { message.error('更新失败'); }
                }}
                destroyOnClose
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item name="display_name" label="显示名称">
                        <Input placeholder="请输入显示名称" />
                    </Form.Item>
                    <Form.Item name="description" label="描述">
                        <Input.TextArea placeholder="角色描述" rows={3} />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 分配权限抽屉 - 使用 Tree 按模块分组 (仅非系统角色可用) */}
            <Drawer
                title={`分配权限 - ${currentRole?.display_name}`}
                open={assignPermOpen}
                onClose={() => setAssignPermOpen(false)}
                width={500}
                footer={
                    <Space style={{ float: 'right' }}>
                        <Button onClick={() => setAssignPermOpen(false)}>取消</Button>
                        <Button
                            onClick={() => setCheckedPermIds(allPermIds)}
                        >
                            全选
                        </Button>
                        <Button
                            onClick={() => setCheckedPermIds([])}
                        >
                            清空
                        </Button>
                        <Button type="primary" onClick={async () => {
                            if (!currentRole) return;
                            try {
                                await assignRolePermissions(currentRole.id, { permission_ids: checkedPermIds });
                                message.success('权限分配成功');
                                setAssignPermOpen(false);
                                actionRef.current?.reload();
                            } catch { message.error('分配失败'); }
                        }}>确定</Button>
                    </Space>
                }
            >
                <div style={{ marginBottom: 12 }}>
                    <Text type="secondary">已选 {checkedPermIds.length} / {allPermIds.length} 项权限</Text>
                </div>
                <Tree
                    checkable
                    defaultExpandAll
                    checkedKeys={checkedPermIds}
                    onCheck={(checked) => {
                        // checked 可能是数组或 { checked, halfChecked } 对象
                        const keys = Array.isArray(checked) ? checked : checked.checked;
                        // 过滤掉模块级别的 key（module-xxx）
                        setCheckedPermIds(keys.filter((k: any) => !String(k).startsWith('module-')) as string[]);
                    }}
                    treeData={permTreeData}
                />
            </Drawer>

            {/* 分配工作区抽屉 */}
            <Drawer
                title={`分配工作区 - ${currentRole?.display_name}`}
                open={assignWsOpen}
                onClose={() => setAssignWsOpen(false)}
                width={600}
                footer={
                    <Space style={{ float: 'right' }}>
                        <Button onClick={() => setAssignWsOpen(false)}>取消</Button>
                        <Button type="primary" onClick={async () => {
                            if (!currentRole) return;
                            try { await assignRoleWorkspaces(currentRole.id, selectedWsIds); message.success('工作区分配成功'); setAssignWsOpen(false); }
                            catch { message.error('分配失败'); }
                        }}>确定</Button>
                    </Space>
                }
            >
                <Transfer
                    dataSource={allWorkspaces.map(ws => ({
                        key: ws.id,
                        title: ws.name,
                        description: ws.description || '',
                        disabled: ws.is_default === true,
                    }))}
                    targetKeys={selectedWsIds}
                    onChange={(targetKeys) => {
                        const defaultIds = allWorkspaces.filter(ws => ws.is_default).map(ws => ws.id);
                        const merged = Array.from(new Set([...targetKeys as string[], ...defaultIds]));
                        setSelectedWsIds(merged);
                    }}
                    render={(item) => (
                        <span>
                            {item.title}
                            {(item as any).disabled && <Tag color="gold" style={{ marginLeft: 4, fontSize: 10 }}>默认</Tag>}
                        </span>
                    )}
                    titles={['可选工作区', '已分配工作区']}
                    showSearch
                    listStyle={{ width: 250, height: 400 }}
                />
            </Drawer>

            {/* 角色详情抽屉 */}
            <Drawer
                title={`角色详情 - ${currentRole?.display_name}`}
                open={detailOpen}
                onClose={() => setDetailOpen(false)}
                width={560}
            >
                {currentRole && (
                    <>
                        <Descriptions column={1} bordered size="small" labelStyle={{ whiteSpace: 'nowrap', width: 80 }}>
                            <Descriptions.Item label="角色标识"><code>{currentRole.name}</code></Descriptions.Item>
                            <Descriptions.Item label="显示名称">{currentRole.display_name}</Descriptions.Item>
                            <Descriptions.Item label="描述">{currentRole.description || '-'}</Descriptions.Item>
                            <Descriptions.Item label="系统角色">
                                {currentRole.is_system ? <Tag color="blue">系统角色（不可编辑）</Tag> : <Tag>自定义角色</Tag>}
                            </Descriptions.Item>
                            <Descriptions.Item label="用户数">{currentRole.user_count}</Descriptions.Item>
                            <Descriptions.Item label="权限数">{currentRole.permission_count || currentRole.permissions?.length}</Descriptions.Item>
                            <Descriptions.Item label="创建时间">{dayjs(currentRole.created_at).format('YYYY-MM-DD HH:mm:ss')}</Descriptions.Item>
                        </Descriptions>
                        {currentRole.permissions && currentRole.permissions.length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <Text strong style={{ fontSize: 14 }}>已分配权限 ({currentRole.permissions.length})</Text>
                                <div style={{ marginTop: 12 }}>
                                    {(() => {
                                        // 按模块分组
                                        const grouped: Record<string, typeof currentRole.permissions> = {};
                                        currentRole.permissions.forEach(p => {
                                            const mod = p.module || p.code?.split(':')[0] || '其他';
                                            if (!grouped[mod]) grouped[mod] = [];
                                            grouped[mod].push(p);
                                        });
                                        return Object.entries(grouped).map(([mod, perms]) => (
                                            <div key={mod} style={{
                                                marginBottom: 12,
                                                padding: '8px 12px',
                                                background: '#fafafa',
                                                borderRadius: 6,
                                                border: '1px solid #f0f0f0',
                                            }}>
                                                <Text strong style={{ fontSize: 12, color: '#666', display: 'block', marginBottom: 6 }}>
                                                    {moduleLabels[mod] || mod}
                                                </Text>
                                                <Space size={[4, 4]} wrap>
                                                    {perms.map(p => (
                                                        <Tag key={p.id} color="blue" style={{ margin: 0 }}>{p.name}</Tag>
                                                    ))}
                                                </Space>
                                            </div>
                                        ));
                                    })()}
                                </div>
                            </div>
                        )}
                    </>
                )}
            </Drawer>
        </PageContainer>
    );
};

export default RolesPage;
