import React, { useState, useEffect } from 'react';
import { history, useParams, useAccess } from '@umijs/max';
import { Form, Input, Select, Button, message, Spin } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import { USER_STATUS_OPTIONS } from '@/constants/commonDicts';
import { createUser, getUser, updateUser, assignUserRoles } from '@/services/auto-healing/users';
import { getRoles } from '@/services/auto-healing/roles';
import './UserForm.css';

const UserFormPage: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [allRoles, setAllRoles] = useState<AutoHealing.RoleWithStats[]>([]);
    const [originalRoleId, setOriginalRoleId] = useState<string | undefined>(undefined);

    useEffect(() => {
        (async () => {
            try {
                const res = await getRoles();
                setAllRoles(res?.data || []);
            } catch { /* ignore */ }
        })();
    }, []);

    useEffect(() => {
        if (!isEdit || !params.id) return;
        setLoading(true);
        (async () => {
            try {
                const res = await getUser(params.id!);
                const user = (res as any)?.data || res;
                const roleId = (user.roles || [])?.[0]?.id || user.role_id;
                setOriginalRoleId(roleId);
                form.setFieldsValue({
                    username: user.username,
                    email: user.email,
                    display_name: user.display_name || '',
                    status: user.status,
                    role_id: roleId,
                });
            } catch {
                /* global error handler */
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, params.id]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);
            if (isEdit && params.id) {
                const { role_id, ...userData } = values;
                await updateUser(params.id, { display_name: userData.display_name, status: userData.status });
                const newRoleId: string | undefined = role_id || undefined;
                const rolesChanged = newRoleId !== originalRoleId;
                if (rolesChanged) {
                    try {
                        await assignUserRoles(params.id, { role_ids: newRoleId ? [newRoleId] : [] });
                    } catch {
                        message.warning('用户资料已更新，但角色分配失败，请重试');
                        history.push('/system/users');
                        return;
                    }
                }
                message.success('更新成功');
            } else {
                const { confirm_password, role_id, ...createData } = values;
                const created = await createUser(createData as any);
                const createdUser = (created as any)?.data || created;
                if (role_id && createdUser?.id) {
                    try {
                        await assignUserRoles(createdUser.id, { role_ids: [role_id] });
                    } catch {
                        message.warning('用户已创建，但角色分配失败，请进入编辑页重新分配角色');
                        history.push('/system/users');
                        return;
                    }
                }
                message.success('创建成功');
            }
            history.push('/system/users');
        } catch (err: any) {
            if (err?.errorFields) return;
            message.error(isEdit ? '更新失败' : '创建失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="user-form-page">
            {/* 卡片1：标题栏 */}
            <SubPageHeader
                title={isEdit ? '编辑用户' : '创建用户'}
                onBack={() => history.back()}
            />

            {/* 卡片2：表单内容 */}
            <div className="user-form-card">
                <Spin spinning={loading}>
                    <Form form={form} layout="vertical" onFinish={handleSubmit}>
                        <Form.Item name="username" label="用户名"
                            rules={isEdit ? [] : [{ required: true, message: '请输入用户名' }, { min: 3, message: '用户名至少 3 个字符' }]}>
                            <Input placeholder="请输入用户名（至少 3 个字符）" disabled={isEdit} />
                        </Form.Item>
                        <Form.Item name="email" label="邮箱"
                            rules={[{ required: true, message: '请输入邮箱' }, { type: 'email', message: '请输入有效的邮箱地址' }]}>
                            <Input placeholder="请输入邮箱" disabled={isEdit} />
                        </Form.Item>
                        {isEdit && (
                            <div style={{ marginTop: -8, marginBottom: 12, fontSize: 12, color: '#8c8c8c' }}>
                                邮箱当前由后端视为只读字段，如需变更请联系管理员处理。
                            </div>
                        )}
                        {!isEdit && (
                            <>
                                <Form.Item name="password" label="密码"
                                    rules={[{ required: true, message: '请输入密码' }, { min: 8, message: '密码至少 8 个字符' }]}>
                                    <Input.Password placeholder="请输入密码（至少 8 个字符）" />
                                </Form.Item>
                                <Form.Item name="confirm_password" label="确认密码" dependencies={['password']}
                                    rules={[{ required: true, message: '请再次输入密码' }, ({ getFieldValue }) => ({
                                        validator(_, value) {
                                            if (!value || getFieldValue('password') === value) return Promise.resolve();
                                            return Promise.reject(new Error('两次输入的密码不一致'));
                                        },
                                    })]}>
                                    <Input.Password placeholder="请再次输入密码" />
                                </Form.Item>
                            </>
                        )}
                        <Form.Item name="display_name" label="显示名称">
                            <Input placeholder="请输入显示名称（可选）" />
                        </Form.Item>
                        {isEdit && (
                            <Form.Item name="status" label="状态">
                                <Select options={USER_STATUS_OPTIONS} />
                            </Form.Item>
                        )}
                        <Form.Item name="role_id" label="角色" extra="租户用户当前为单角色模型，选择一个角色即可">
                            <Select
                                placeholder="搜索并选择角色"
                                showSearch
                                optionFilterProp="label"
                                allowClear={!isEdit}
                                options={allRoles.map(r => ({ label: r.display_name || r.name, value: r.id }))}
                            />
                        </Form.Item>
                        <div className="user-form-divider" />
                        <div className="user-form-actions">
                            <Button type="primary" icon={<SaveOutlined />} loading={submitting} disabled={isEdit ? !access.canUpdateUser : !access.canCreateUser} onClick={handleSubmit}>
                                {isEdit ? '保存修改' : '创建用户'}
                            </Button>
                            <Button onClick={() => history.push('/system/users')}>取消</Button>
                        </div>
                    </Form>
                </Spin>
            </div>
        </div>
    );
};

export default UserFormPage;
