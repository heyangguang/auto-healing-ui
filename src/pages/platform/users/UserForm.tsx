import React, { useEffect, useState, useCallback } from 'react';
import {
    Form, Input, Button, message, Spin, Space, Select,
} from 'antd';
import {
    UserOutlined, CrownOutlined, LockOutlined, MailOutlined, IdcardOutlined,
} from '@ant-design/icons';
import { history, useParams, useAccess } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getPlatformUser, createPlatformUser, updatePlatformUser,
} from '@/services/auto-healing/platform/users';
import { getPlatformRoles } from '@/services/auto-healing/roles';
import './UserForm.css';

/* ===================================================
   平台用户表单（创建 / 编辑）
   - 创建：POST /platform/users（可选择平台角色，不选默认 platform_admin）
   - 编辑：PUT /platform/users/:id（只修改 display_name / email）
   =================================================== */
const UserForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const isEdit = !!id;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [platformRoles, setPlatformRoles] = useState<{ id: string; name: string; display_name: string }[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);

    const handleGoBack = useCallback(() => {
        if (window.history.length > 1) history.back();
        else history.push('/platform/users');
    }, []);

    // 加载平台角色列表
    useEffect(() => {
        setRolesLoading(true);
        getPlatformRoles()
            .then((res: any) => {
                const roles = res?.data || [];
                setPlatformRoles(roles);
            })
            .catch(() => {
                /* global error handler */
            })
            .finally(() => setRolesLoading(false));
    }, []);

    // 编辑模式：加载用户数据
    useEffect(() => {
        if (!isEdit) return;
        setLoading(true);
        getPlatformUser(id!).then((res: any) => {
            const user = res?.data || res;
            form.setFieldsValue({
                username: user.username,
                display_name: user.display_name,
                email: user.email,
                role_id: user.roles?.[0]?.id,
            });
        }).catch(() => {
            /* global error handler */
        }).finally(() => setLoading(false));
    }, [id, isEdit, form]);

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                await updatePlatformUser(id!, {
                    display_name: values.display_name,
                    email: values.email,
                    role_id: values.role_id,
                });
                message.success('用户信息更新成功');
            } else {
                await createPlatformUser({
                    username: values.username,
                    password: values.password,
                    display_name: values.display_name,
                    email: values.email,
                    role_id: values.role_id,
                });
                const roleName = platformRoles.find(r => r.id === values.role_id)?.display_name || '平台管理员';
                message.success(`用户创建成功，已赋予「${roleName}」角色`);
            }
            history.push('/platform/users');
        } catch {
            message.error(isEdit ? '更新失败' : '创建失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="user-form-page">
            <SubPageHeader
                title={isEdit ? '编辑平台用户' : '新建平台用户'}
                onBack={handleGoBack}
                actions={
                    <div className="user-form-actions">
                        <Button onClick={handleGoBack}>取消</Button>
                        <Button
                            type="primary"
                            loading={submitting}
                            disabled={!access.canManagePlatformTenants}
                            onClick={() => form.submit()}
                        >
                            {isEdit ? '保存' : '创建'}
                        </Button>
                    </div>
                }
            />
            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    requiredMark="optional"
                >
                    <div className="user-form-cards">
                        {/* 基本信息 */}
                        <div className="user-form-card">
                            <div className="user-form-section-title">
                                <UserOutlined /> 基本信息
                            </div>
                            <Form.Item
                                name="username"
                                label="用户名"
                                rules={[{ required: true, message: '请输入用户名' }]}
                                extra="用于登录的唯一标识，创建后不可修改"
                            >
                                <Input
                                    prefix={<IdcardOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="登录用户名"
                                    disabled={isEdit}
                                    maxLength={50}
                                />
                            </Form.Item>
                            <Form.Item
                                name="display_name"
                                label="显示名"
                                extra="页面上展示的名称（可选）"
                            >
                                <Input
                                    prefix={<UserOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="姓名"
                                    maxLength={50}
                                />
                            </Form.Item>
                            <Form.Item
                                name="email"
                                label="邮箱"
                                rules={[{ type: 'email', message: '邮箱格式不正确' }]}
                            >
                                <Input
                                    prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="邮箱（可选）"
                                    maxLength={100}
                                />
                            </Form.Item>
                        </div>

                        {/* 密码（仅创建时） */}
                        {!isEdit && (
                            <div className="user-form-card">
                                <div className="user-form-section-title">
                                    <LockOutlined /> 初始密码
                                </div>
                                <Form.Item
                                    name="password"
                                    label="密码"
                                    rules={[
                                        { required: true, message: '请输入密码' },
                                        { min: 6, message: '密码至少6位' },
                                    ]}
                                >
                                    <Input.Password placeholder="至少6位" maxLength={64} />
                                </Form.Item>
                                <Form.Item
                                    name="confirm_password"
                                    label="确认密码"
                                    dependencies={['password']}
                                    rules={[
                                        { required: true, message: '请确认密码' },
                                        ({ getFieldValue }) => ({
                                            validator(_, value) {
                                                if (!value || getFieldValue('password') === value) return Promise.resolve();
                                                return Promise.reject(new Error('两次密码不一致'));
                                            },
                                        }),
                                    ]}
                                >
                                    <Input.Password placeholder="再次输入密码" maxLength={64} />
                                </Form.Item>
                            </div>
                        )}

                        {/* 角色选择 */}
                        <div className="user-form-card">
                            <div className="user-form-section-title">
                                <CrownOutlined /> 平台角色
                            </div>
                            <Form.Item
                                name="role_id"
                                label="选择角色"
                                extra="选择用户在平台级别的角色，不同角色拥有不同权限"
                            >
                                <Select
                                    placeholder="请选择平台角色（不选默认平台管理员）"
                                    loading={rolesLoading}
                                    options={platformRoles.map(r => ({
                                        label: `${r.display_name}（${r.name}）`,
                                        value: r.id,
                                    }))}
                                    style={{ maxWidth: 400 }}
                                    allowClear
                                />
                            </Form.Item>
                            {!isEdit && (
                                <div style={{ padding: '8px 14px', background: '#f5f5f5', borderRadius: 2, fontSize: 12, color: '#8c8c8c', lineHeight: 1.8 }}>
                                    不选择角色时，默认赋予「平台管理员」角色（拥有所有权限）。
                                </div>
                            )}
                        </div>
                    </div>
                </Form>
            </Spin>
        </div>
    );
};

export default UserForm;
