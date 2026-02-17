import React, { useState, useEffect, useMemo } from 'react';
import { history, useParams } from '@umijs/max';
import { Form, Input, Button, message, Spin, Checkbox, Tag, Transfer } from 'antd';
import { SaveOutlined, UserOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import { createRole, getRole, updateRole, assignRolePermissions } from '@/services/auto-healing/roles';
import { getPermissionTree } from '@/services/auto-healing/permissions';
import { getUsers, getSimpleUsers, getUser, assignUserRoles } from '@/services/auto-healing/users';
import './RoleForm.css';

const { TextArea } = Input;

/* 权限模块中文映射 */
const MODULE_LABELS: Record<string, string> = {
    system: '系统管理',
    user: '用户管理',
    role: '角色管理',
    plugin: '插件管理',
    execution: '作业中心',
    notification: '通知中心',
    healing: '自愈引擎',
    workflow: '工作流',
    dashboard: '仪表盘',
};

const RoleFormPage: React.FC = () => {
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [isSystemRole, setIsSystemRole] = useState(false);

    /* 整体加载状态 */
    const [permLoading, setPermLoading] = useState(true);
    const [roleLoading, setRoleLoading] = useState(isEdit);
    const [usersLoading, setUsersLoading] = useState(true);
    const pageLoading = permLoading || roleLoading || usersLoading;

    /* 权限树 */
    const [permissionTree, setPermissionTree] = useState<AutoHealing.PermissionTree>({});
    const [checkedKeys, setCheckedKeys] = useState<string[]>([]);

    /* 用户列表 & 分配 */
    const [allUsers, setAllUsers] = useState<any[]>([]);
    const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
    const [originalUserIds, setOriginalUserIds] = useState<string[]>([]);
    const [roleName, setRoleName] = useState('');

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
                setRoleName(role.name);
                setIsSystemRole(!!role.is_system);
                const permIds = (role.permissions || []).map((p: any) => p.id);
                setCheckedKeys(permIds);
            } catch {
                message.error('加载角色数据失败');
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
                const res = await getUsers({ role_id: params.id, page_size: 100 });
                const users = (res as any)?.data || [];
                const assigned = users.map((u: any) => u.id);
                setSelectedUserIds(assigned);
                setOriginalUserIds(assigned);
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
    const updateUserAssignments = async (roleId: string, rName: string) => {
        const added = selectedUserIds.filter(id => !originalUserIds.includes(id));
        const removed = originalUserIds.filter(id => !selectedUserIds.includes(id));

        for (const userId of added) {
            try {
                const userRes = await getUser(userId);
                const user = (userRes as any)?.data || userRes;
                const existingRoleIds = (user?.roles || []).map((r: any) => r.id);
                await assignUserRoles(userId, { role_ids: [...new Set([...existingRoleIds, roleId])] });
            } catch { /* skip failed users */ }
        }

        for (const userId of removed) {
            try {
                const userRes = await getUser(userId);
                const user = (userRes as any)?.data || userRes;
                const newRoleIds = (user?.roles || [])
                    .filter((r: any) => r.name !== rName && r.id !== roleId)
                    .map((r: any) => r.id);
                await assignUserRoles(userId, { role_ids: newRoleIds });
            } catch { /* skip failed users */ }
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
                await updateUserAssignments(params.id, roleName);
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
                        await updateUserAssignments(newRoleId, values.name);
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
                title={isSystemRole ? '分配用户' : isEdit ? '编辑角色' : '创建角色'}
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
                            <div className="role-form-transfer-wrap">
                                <Transfer
                                    dataSource={transferDataSource}
                                    targetKeys={selectedUserIds}
                                    onChange={(targetKeys) => setSelectedUserIds(targetKeys as string[])}
                                    showSearch
                                    showSelectAll
                                    filterOption={(input, item) => {
                                        const q = input.toLowerCase();
                                        return (
                                            (item.title || '').toLowerCase().includes(q) ||
                                            (item.description || '').toLowerCase().includes(q)
                                        );
                                    }}
                                    titles={['可选用户', '已分配']}
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
                                <Button type="primary" icon={<SaveOutlined />} loading={submitting} onClick={handleSubmit}>
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
