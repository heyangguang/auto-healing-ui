import React, { useMemo, useState } from 'react';
import { history, useParams, useAccess } from '@umijs/max';
import { Form, Input, Button, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import { createRole, getRole, updateRole, assignRolePermissions } from '@/services/auto-healing/roles';
import { assignUserRoles } from '@/services/auto-healing/users';
import { assignRoleWorkspaces } from '@/services/auto-healing/dashboard';
import './RoleForm.css';
import RoleFormPermissionsSection from './RoleFormPermissionsSection';
import RoleFormUserTransferSection from './RoleFormUserTransferSection';
import RoleFormWorkspaceSection from './RoleFormWorkspaceSection';
import {
    getNonDefaultWorkspaceIds,
    isFormValidationError,
    showUserAssignmentWarning,
} from './roleFormHelpers';
import type {
    RoleFormValues,
    RoleUserAssignmentFailure,
} from './roleFormTypes';
import { useRoleFormData } from './useRoleFormData';

const { TextArea } = Input;

const RoleFormPage: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm<RoleFormValues>();
    const [submitting, setSubmitting] = useState(false);
    const {
        pageLoading,
        isSystemRole,
        permissionTree,
        checkedKeys,
        setCheckedKeys,
        allUsers,
        selectedUserIds,
        setSelectedUserIds,
        originalUserIds,
        allWorkspaces,
        selectedWsIds,
        setSelectedWsIds,
    } = useRoleFormData({ form, isEdit, roleId: params.id });

    const handleGoBack = () => {
        if (window.history.length > 1) history.back();
        else history.push('/system/roles');
    };

    /* 所有权限 ID */
    const allPermissionIds = useMemo(() => {
        const ids: string[] = [];
        Object.values(permissionTree).forEach(perms => {
            perms.forEach(p => ids.push(p.id));
        });
        return ids;
    }, [permissionTree]);

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
        const failures: RoleUserAssignmentFailure[] = [];

        for (const userId of added) {
            try {
                // 租户用户为单角色模型：赋予该角色会替换用户原有角色
                await assignUserRoles(userId, { role_ids: [roleId] });
            } catch {
                failures.push({ userId, op: 'assign' });
            }
        }

        return { failures };
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
                const nonDefaultIds = getNonDefaultWorkspaceIds(selectedWsIds, allWorkspaces);
                await assignRoleWorkspaces(params.id, nonDefaultIds);
                if (failures.length > 0) {
                    showUserAssignmentWarning({
                        title: '角色已保存，但部分用户分配失败',
                        description: `共 ${failures.length} 人分配操作失败，请重试或稍后刷新页面确认。`,
                        failures,
                        users: allUsers,
                    });
                    return;
                }
                message.success('更新成功');
            } else {
                const newRole = await createRole(values);
                const newRoleId = newRole?.id;
                if (newRoleId) {
                    if (checkedKeys.length > 0) {
                        await assignRolePermissions(newRoleId, { permission_ids: checkedKeys });
                    }
                    if (selectedUserIds.length > 0) {
                        const { failures } = await updateUserAssignments(newRoleId);
                        if (failures.length > 0) {
                            showUserAssignmentWarning({
                                title: '角色已创建，但部分用户分配失败',
                                description: `共 ${failures.length} 人分配操作失败。可进入编辑页重试分配。`,
                                failures,
                                users: allUsers,
                                onOk: () => history.push(`/system/roles/${newRoleId}/edit`),
                            });
                            return;
                        }
                    }
                    // 保存工作区分配
                    const nonDefaultIds = getNonDefaultWorkspaceIds(selectedWsIds, allWorkspaces);
                    if (nonDefaultIds.length > 0) {
                        await assignRoleWorkspaces(newRoleId, nonDefaultIds);
                    }
                }
                message.success('创建成功');
            }
            history.push('/system/roles');
        } catch (error: unknown) {
            if (isFormValidationError(error)) return;
            message.error(isEdit ? '更新失败' : '创建失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="role-form-page">
            <SubPageHeader
                title={isSystemRole ? '分配用户与工作区' : isEdit ? '编辑角色' : '创建角色'}
                onBack={handleGoBack}
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
                            <RoleFormUserTransferSection
                                allUsers={allUsers}
                                selectedUserIds={selectedUserIds}
                                onChange={setSelectedUserIds}
                            />
                            <RoleFormWorkspaceSection
                                allWorkspaces={allWorkspaces}
                                selectedWorkspaceIds={selectedWsIds}
                                onToggle={handleWsToggle}
                            />

                            {/* 权限分配 — 仅非系统角色 */}
                            {!isSystemRole && (
                                <RoleFormPermissionsSection
                                    permissionTree={permissionTree}
                                    checkedKeys={checkedKeys}
                                    allPermissionIds={allPermissionIds}
                                    onSelectAll={() => setCheckedKeys([...allPermissionIds])}
                                    onClear={() => setCheckedKeys([])}
                                    onModuleToggle={handleModuleToggle}
                                    onPermissionToggle={handlePermToggle}
                                />
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
