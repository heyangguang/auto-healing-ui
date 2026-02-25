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
    const [originalRoleIds, setOriginalRoleIds] = useState<string[]>([]);

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
                const roleIds = (user.roles || []).map((r: any) => r.id);
                setOriginalRoleIds(roleIds);
                form.setFieldsValue({
                    username: user.username,
                    email: user.email,
                    display_name: user.display_name || '',
                    status: user.status,
                    role_ids: roleIds,
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
                const { role_ids, ...userData } = values;
                await updateUser(params.id, { email: userData.email, display_name: userData.display_name, status: userData.status });
                const newRoleIds: string[] = role_ids || [];
                const rolesChanged = newRoleIds.length !== originalRoleIds.length || newRoleIds.some((id: string) => !originalRoleIds.includes(id));
                if (rolesChanged) await assignUserRoles(params.id, { role_ids: newRoleIds });
                message.success('更新成功');
            } else {
                const { confirm_password, ...createData } = values;
                await createUser(createData);
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
                            <Input placeholder="请输入邮箱" />
                        </Form.Item>
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
                        <Form.Item name="role_ids" label="角色">
                            <Select mode="multiple" placeholder="搜索并选择角色" showSearch optionFilterProp="label"
                                options={allRoles.map(r => ({ label: r.display_name || r.name, value: r.id }))} />
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
