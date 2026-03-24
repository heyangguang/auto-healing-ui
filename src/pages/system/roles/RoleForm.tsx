import React, { useState, useEffect, useMemo } from 'react';
import { history, useParams, useAccess } from '@umijs/max';
import { Form, Input, Button, message, Spin, Checkbox, Tag, Transfer, Modal } from 'antd';
import { SaveOutlined, UserOutlined, AppstoreOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import { createRole, getRole, updateRole, assignRolePermissions } from '@/services/auto-healing/roles';
import { getPermissionTree } from '@/services/auto-healing/permissions';
import { getUsers, getSimpleUsers, assignUserRoles } from '@/services/auto-healing/users';
import { listSystemWorkspaces, getRoleWorkspaces, assignRoleWorkspaces } from '@/services/auto-healing/dashboard';
import './RoleForm.css';

const { TextArea } = Input;

/* 权限模块中文映射 */
import { PERMISSION_MODULE_LABELS as MODULE_LABELS } from '@/constants/permissionDicts';

const RoleFormPage: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [isSystemRole, setIsSystemRole] = useState(false);

    /* 整体加载状态 */
    const [permLoading, setPermLoading] = useState(true);
    const [roleLoading, setRoleLoading] = useState(isEdit);
    const [wsLoading, setWsLoading] = useState(true);
    const [usersLoading, setUsersLoading] = useState(true);
    const pageLoading = permLoading || roleLoading || usersLoading || wsLoading;

    /* 权限树 */
    const [permissionTree, setPermissionTree] = useState<AutoHealing.PermissionTree>({});
    const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

    /* 用户列表 & 分配 */
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [originalUserIds, setOriginalUserIds] = useState<string[]>([]);

    /* 工作区列表 & 分配 */
    const [allWorkspaces, setAllWorkspaces] = useState<any[]>([]);
    const [selectedWsIds, setSelectedWsIds] = useState<string[]>([]);
    const [originalWsIds, setOriginalWsIds] = useState<string[]>([]);

    /* 加载权限树 */
    useEffect(() => {
        (async () => {
            try {
                const res = await getPermissionTree();
                const tree = (res as any)?.data || res || {};
                setPermissionTree(tree);
            } catch { /* ignore */ }
            finally { setPermLoading(false); }
        })();
    }, []);

    /* 加载所有系统工作区 */
    useEffect(() => {
        (async () => {
            try {
                const res = await listSystemWorkspaces();
                const list = (res as any)?.data || [];
                setAllWorkspaces(list);
                // 默认工作区自动勾选
                const defaultIds = list.filter((w: any) => w.is_default).map((w: any) => w.id);
                if (!isEdit) {
                    setSelectedWsIds(defaultIds);
                }
            } catch { /* ignore */ }
            finally { setWsLoading(false); }
        })();
    }, []);

    /* 加载所有用户（轻量接口，不分页） */
    useEffect(() => {
        (async () => {
            try {
                const res = await getSimpleUsers();
                const users = (res as any)?.data || [];
                setAllUsers(users);
            } catch { /* ignore */ }
            finally { setUsersLoading(false); }
        })();
    }, []);

    /* 编辑模式：加载角色数据 */
    useEffect(() => {
        if (!isEdit || !params.id) { setRoleLoading(false); return; }
        (async () => {
            try {
                const res = await getRole(params.id!);
                const role = (res as any)?.data || res;
                form.setFieldsValue({
                    name: role.name,
                    display_name: role.display_name,
                    description: role.description || '',
                });
                setIsSystemRole(!!role.is_system);
                const permIds = (role.permissions || []).map((p: any) => p.id);
                setCheckedKeys(permIds);
            } catch {
                /* global error handler */
            } finally {
                setRoleLoading(false);
            }
        })();
    }, [isEdit, params.id]);

    /* 编辑模式：从用户列表中找出已分配该角色的用户 */
    useEffect(() => {
        if (!isEdit || !params.id) return;
        // 通过后端 role_id 筛选获取已分配该角色的用户
        (async () => {
            try {
                const users: any[] = [];
                let page = 1;
                const pageSize = 200;
                while (true) {
                    const res = await getUsers({ role_id: params.id, page, page_size: pageSize });
                    const batch = (res as any)?.data || [];
                    users.push(...batch);
                    const total = (res as any)?.pagination?.total ?? (res as any)?.total ?? batch.length;
                    if (users.length >= total || batch.length === 0) break;
                    page += 1;
                }
                const assigned = users.map((u: any) => u.id);
                setSelectedUserIds(assigned);
                setOriginalUserIds(assigned);
            } catch { /* ignore */ }
        })();
    }, [isEdit, params.id]);

    /* 编辑模式：加载角色已分配的工作区 */
    useEffect(() => {
        if (!isEdit || !params.id) return;
        (async () => {
            try {
                const res = await getRoleWorkspaces(params.id!);
                const data = (res as any)?.data || res;
                const ids = (data?.workspace_ids || []).map((id: string) => id);
                setSelectedWsIds(ids);
                setOriginalWsIds(ids);
            } catch { /* ignore */ }
        })();
    }, [isEdit, params.id]);

    /* 所有权限 ID */
    const allPermissionIds = useMemo(() => {
        const ids: string[] = [];
        Object.values(permissionTree).forEach(perms => {
            perms.forEach(p => ids.push(p.id));
        });
        return ids;
    }, [permissionTree]);

    /* Transfer 数据源 */
    const transferDataSource = useMemo(() => {
        return allUsers.map(u => ({
            key: u.id,
            title: u.display_name || u.username,
            description: u.username,
            disabled: false,
        }));
    }, [allUsers]);

    /* 模块级全选/取消 */
    const handleModuleToggle = (module: string, checked: boolean) => {
        const modulePerms = permissionTree[module] || [];
        const moduleIds = modulePerms.map(p => p.id);
        if (checked) {
            setCheckedKeys(prev => [...new Set([...prev, ...moduleIds])]);
        } else {
            setCheckedKeys(prev => prev.filter(id => !moduleIds.includes(id)));
        }
    };

    /* 单个权限勾选 */
    const handlePermToggle = (permId: string, checked: boolean) => {
        if (checked) {
            setCheckedKeys(prev => [...new Set([...prev, permId])]);
        } else {
            setCheckedKeys(prev => prev.filter(id => id !== permId));
        }
    };

    /* 更新用户角色分配（按需获取每个变更用户的当前角色） */
    const updateUserAssignments = async (roleId: string) => {
        const added = selectedUserIds.filter(id => !originalUserIds.includes(id));
        const failures: Array<{ userId: string; op: 'assign' | 'remove' }> = [];

        for (const userId of added) {
            try {
                // 租户用户为单角色模型：赋予该角色会替换用户原有角色
                await assignUserRoles(userId, { role_ids: [roleId] });
            } catch {
                failures.push({ userId, op: 'assign' });
            }
        }

        return { added, removed: [], failures };
    };

    /* 工作区勾选 */
    const handleWsToggle = (wsId: string, checked: boolean) => {
        if (checked) {
            setSelectedWsIds(prev => [...new Set([...prev, wsId])]);
        } else {
            setSelectedWsIds(prev => prev.filter(id => id !== wsId));
        }
    };

    /* 提交 */
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            if (isEdit && params.id) {
                if (!isSystemRole) {
                    await updateRole(params.id, {
                        display_name: values.display_name,
                        description: values.description,
                    });
                    await assignRolePermissions(params.id, { permission_ids: checkedKeys });
                }
                const { failures } = await updateUserAssignments(params.id);
                // 保存工作区分配（排除默认工作区，默认工作区自动包含）
                const nonDefaultIds = selectedWsIds.filter(
                    id => !allWorkspaces.find((w: any) => w.id === id && w.is_default)
                );
                await assignRoleWorkspaces(params.id, nonDefaultIds);
                if (failures.length > 0) {
                    const byId = new Map(allUsers.map(u => [u.id, u]));
                    const preview = failures.slice(0, 10).map(f => {
                        const u = byId.get(f.userId);
                        const name = u?.display_name || u?.username || f.userId;
                        const op = f.op === 'assign' ? '赋予角色失败' : '取消分配失败';
                        return `${name}（${op}）`;
                    });
                    Modal.warning({
                        title: '角色已保存，但部分用户分配失败',
                        content: (
                            <div>
                                <div style={{ marginBottom: 8 }}>
                                    共 {failures.length} 人分配操作失败，请重试或稍后刷新页面确认。
                                </div>
                                {preview.length > 0 && (
                                    <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                        {preview.join('\n')}
                                        {failures.length > preview.length ? '\n…' : ''}
                                    </div>
                                )}
                            </div>
                        ),
                    });
                    return;
                }
                message.success('更新成功');
            } else {
                const res = await createRole(values);
                const newRole = (res as any)?.data || res;
                const newRoleId = newRole?.id;
                if (newRoleId) {
                    if (checkedKeys.length > 0) {
                        await assignRolePermissions(newRoleId, { permission_ids: checkedKeys });
                    }
                    if (selectedUserIds.length > 0) {
                        const { failures } = await updateUserAssignments(newRoleId);
                        if (failures.length > 0) {
                            const byId = new Map(allUsers.map(u => [u.id, u]));
                            const preview = failures.slice(0, 10).map(f => {
                                const u = byId.get(f.userId);
                                const name = u?.display_name || u?.username || f.userId;
                                const op = f.op === 'assign' ? '赋予角色失败' : '取消分配失败';
                                return `${name}（${op}）`;
                            });
                            Modal.warning({
                                title: '角色已创建，但部分用户分配失败',
                                content: (
                                    <div>
                                        <div style={{ marginBottom: 8 }}>
                                            共 {failures.length} 人分配操作失败。可进入编辑页重试分配。
                                        </div>
                                        {preview.length > 0 && (
                                            <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
                                                {preview.join('\n')}
                                                {failures.length > preview.length ? '\n…' : ''}
                                            </div>
                                        )}
                                    </div>
                                ),
                                onOk: () => history.push(`/system/roles/${newRoleId}/edit`),
                            });
                            return;
                        }
                    }
                    // 保存工作区分配
                    const nonDefaultIds = selectedWsIds.filter(
                        id => !allWorkspaces.find((w: any) => w.id === id && w.is_default)
                    );
                    if (nonDefaultIds.length > 0) {
                        await assignRoleWorkspaces(newRoleId, nonDefaultIds);
                    }
                }
                message.success('创建成功');
            }
            history.push('/system/roles');
        } catch (err: any) {
            if (err?.errorFields) return;
            message.error(isEdit ? '更新失败' : '创建失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="role-form-page">
            <SubPageHeader
                title={isSystemRole ? '分配用户与工作区' : isEdit ? '编辑角色' : '创建角色'}
                onBack={() => history.back()}
            />

            <div className="role-form-card">
                <Spin spinning={pageLoading}>
                    {!pageLoading && (
                        <Form form={form} layout="vertical" onFinish={handleSubmit}>
                            <Form.Item
                                name="name"
                                label="角色标识"
                                rules={[
                                    { required: true, message: '请输入角色标识' },
                                    { pattern: /^[a-z_]+$/, message: '仅支持小写字母和下划线' },
                                ]}
                            >
                                <Input placeholder="如：operations_manager" disabled={isEdit} />
                            </Form.Item>
                            <Form.Item
                                name="display_name"
                                label="角色名称"
                                rules={[{ required: !isSystemRole, message: '请输入角色名称' }]}
                            >
                                <Input placeholder="如：运维管理员" disabled={isSystemRole} />
                            </Form.Item>
                            <Form.Item name="description" label="描述">
                                <TextArea rows={3} placeholder="请输入角色描述（可选）" disabled={isSystemRole} />
                            </Form.Item>

                            {/* 分配用户 — Transfer 穿梭框 */}
                            <div className="role-form-divider" />
                            <div className="role-form-section-title">
                                <UserOutlined style={{ marginRight: 6 }} />
                                分配用户
                                <span className="role-form-section-count">
                                    已选择 {selectedUserIds.length} / {allUsers.length} 个用户
                                </span>
                            </div>
                            <div style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 12 }}>
                                当前租户用户为单角色模型。这里仅支持把用户赋予到当前角色；如需移出，请到用户编辑页改成其他角色。
                            </div>
                            <div className="role-form-transfer-wrap">
                                <Transfer
                                    dataSource={transferDataSource}
                                    targetKeys={selectedUserIds}
                                    onChange={(targetKeys) => setSelectedUserIds(targetKeys as string[])}
                                    oneWay
                                    showSearch
                                    showSelectAll
                                    filterOption={(input, item) => {
                                        const q = input.toLowerCase();
                                        return (
                                            (item.title || '').toLowerCase().includes(q) ||
                                            (item.description || '').toLowerCase().includes(q)
                                        );
                                    }}
                                    titles={['可选用户', '将赋予当前角色']}
                                    locale={{
                                        itemUnit: '人',
                                        itemsUnit: '人',
                                        searchPlaceholder: '搜索用户名或姓名',
                                    }}
                                    listStyle={{ width: 320, height: 320 }}
                                    render={(item) => (
                                        <span className="role-form-transfer-item">
                                            <span className="role-form-transfer-name">{item.title}</span>
                                            <span className="role-form-transfer-username">{item.description}</span>
                                        </span>
                                    )}
                                />
                            </div>

                            {/* 分配工作区 — Checkbox 列表 */}
                            <div className="role-form-divider" />
                            <div className="role-form-section-title">
                                <AppstoreOutlined style={{ marginRight: 6 }} />
                                分配工作区
                                <span className="role-form-section-count">
                                    已选择 {selectedWsIds.length} / {allWorkspaces.length} 个工作区
                                </span>
                            </div>
                            <div className="role-form-ws-container">
                                {allWorkspaces.length === 0 && (
                                    <div style={{ color: '#bfbfbf', textAlign: 'center', padding: 40 }}>
                                        暂无系统工作区
                                    </div>
                                )}
                                {allWorkspaces.map((ws: any) => {
                                    const isDefault = ws.is_default;
                                    const isChecked = selectedWsIds.includes(ws.id);
                                    return (
                                        <div key={ws.id} className="role-form-ws-item">
                                            <Checkbox
                                                checked={isChecked || isDefault}
                                                disabled={isDefault}
                                                onChange={(e) => handleWsToggle(ws.id, e.target.checked)}
                                            >
                                                <span className="role-form-ws-name">{ws.name}</span>
                                                {isDefault && (
                                                    <Tag className="role-form-ws-default-tag">默认</Tag>
                                                )}
                                            </Checkbox>
                                            {ws.description && (
                                                <span className="role-form-ws-desc">{ws.description}</span>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* 权限分配 — 仅非系统角色 */}
                            {!isSystemRole && (
                                <>
                                    <div className="role-form-divider" />
                                    <div className="role-form-section-title">
                                        权限分配
                                        <span className="role-form-section-count">
                                            已选择 {checkedKeys.length} / {allPermissionIds.length} 个权限
                                        </span>
                                    </div>

                                    <div className="role-form-perm-actions">
                                        <a onClick={() => setCheckedKeys([...allPermissionIds])}>全选</a>
                                        <a onClick={() => setCheckedKeys([])}>清空</a>
                                    </div>

                                    <div className="role-form-perm-container">
                                        {Object.entries(permissionTree).map(([module, perms]) => {
                                            const moduleIds = perms.map(p => p.id);
                                            const checkedCount = moduleIds.filter(id => checkedKeys.includes(id)).length;
                                            const allChecked = checkedCount === moduleIds.length;
                                            const indeterminate = checkedCount > 0 && checkedCount < moduleIds.length;

                                            return (
                                                <div key={module} className="role-form-perm-module">
                                                    <div className="role-form-perm-module-header">
                                                        <Checkbox
                                                            checked={allChecked}
                                                            indeterminate={indeterminate}
                                                            onChange={(e) => handleModuleToggle(module, e.target.checked)}
                                                        >
                                                            <span className="role-form-perm-module-name">
                                                                {MODULE_LABELS[module] || module}
                                                            </span>
                                                        </Checkbox>
                                                        <Tag className="role-form-perm-module-tag">{module}</Tag>
                                                    </div>
                                                    <div className="role-form-perm-items">
                                                        {perms.map(p => (
                                                            <Checkbox
                                                                key={p.id}
                                                                checked={checkedKeys.includes(p.id)}
                                                                onChange={(e) => handlePermToggle(p.id, e.target.checked)}
                                                                className="role-form-perm-checkbox"
                                                            >
                                                                <span className="role-form-perm-label">
                                                                    {p.name}
                                                                    <span className="role-form-perm-code">({p.code})</span>
                                                                </span>
                                                            </Checkbox>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {Object.keys(permissionTree).length === 0 && (
                                            <div style={{ color: '#bfbfbf', textAlign: 'center', padding: 40 }}>
                                                暂无权限数据
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            <div className="role-form-divider" />
                            <div className="role-form-actions">
                                <Button type="primary" icon={<SaveOutlined />} loading={submitting} disabled={isEdit ? !access.canUpdateRole : !access.canCreateRole} onClick={handleSubmit}>
                                    {isSystemRole ? '保存分配' : isEdit ? '保存修改' : '创建角色'}
                                </Button>
                                <Button onClick={() => history.push('/system/roles')}>取消</Button>
                            </div>
                        </Form>
                    )}
                </Spin>
            </div>
        </div >
    );
};

export default RoleFormPage;
