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
    assignPlatformUserRoles,
    getPlatformUser,
    createPlatformUser,
    updatePlatformUser,
} from '@/services/auto-healing/platform/users';
import type {
    CreatePlatformUserRequest,
    PlatformUserRecord,
    PlatformUserRole,
} from '@/services/auto-healing/platform/contracts';
import { getPlatformRoles } from '@/services/auto-healing/roles';
import { fetchActivePlatformAdminCount, isPlatformAdminRole } from './platformUserHelpers';
import './UserForm.css';

type PlatformRoleOption = Pick<PlatformUserRole, 'id' | 'name' | 'display_name'>;
type UserFormValues = {
    username: string;
    display_name?: string;
    email: string;
    password?: string;
    confirm_password?: string;
    role_id?: string;
};

/* ===================================================
   平台用户表单（创建 / 编辑）
   - 创建：POST /platform/users（后端自动赋予 platform_admin）
   - 编辑：PUT /platform/users/:id + PUT /platform/users/:id/roles
   =================================================== */
const UserForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const isEdit = !!id;
    const [form] = Form.useForm<UserFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [platformRoles, setPlatformRoles] = useState<PlatformRoleOption[]>([]);
    const [rolesLoading, setRolesLoading] = useState(false);
    const [rolesLoadFailed, setRolesLoadFailed] = useState(false);
    const [isLastAdmin, setIsLastAdmin] = useState(false);
    const [currentRoleId, setCurrentRoleId] = useState<string | undefined>(undefined);

    const handleGoBack = useCallback(() => {
        if (window.history.length > 1) history.back();
        else history.push('/platform/users');
    }, []);

    // 编辑模式下加载平台角色列表
    useEffect(() => {
        if (!isEdit) {
            setPlatformRoles([]);
            setRolesLoading(false);
            setRolesLoadFailed(false);
            return;
        }
        setRolesLoading(true);
        getPlatformRoles()
            .then((roles) => {
                setRolesLoadFailed(false);
                setPlatformRoles(roles);
            })
            .catch(() => {
                setPlatformRoles([]);
                setRolesLoadFailed(true);
                message.error('平台角色加载失败，请刷新页面重试');
            })
            .finally(() => setRolesLoading(false));
    }, [isEdit]);

    // 编辑模式：加载用户数据 + 检测是否为最后一个管理员
    useEffect(() => {
        if (!isEdit) return;
        setLoading(true);
        (async () => {
            try {
                const user = await getPlatformUser(id!) as PlatformUserRecord;
                form.setFieldsValue({
                    username: user.username,
                    display_name: user.display_name,
                    email: user.email,
                    role_id: user.roles?.[0]?.id,
                });
                setCurrentRoleId(user.roles?.[0]?.id);

                const { activeCount } = await fetchActivePlatformAdminCount({});
                const isCurrentAdmin =
                    user.status === 'active' && !!user.roles?.some(isPlatformAdminRole);
                setIsLastAdmin(Boolean(typeof activeCount === 'number' && activeCount <= 1 && isCurrentAdmin));
            } catch {
                /* global error handler */
            } finally {
                setLoading(false);
            }
        })();
    }, [id, isEdit, form]);

    const handleSubmit = async (values: UserFormValues) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                await updatePlatformUser(id!, {
                    display_name: values.display_name,
                });
                const nextRoleId = values.role_id;
                if (nextRoleId && nextRoleId !== currentRoleId) {
                    await assignPlatformUserRoles(id!, { role_ids: [nextRoleId] });
                }
                message.success(nextRoleId && nextRoleId !== currentRoleId ? '用户信息与角色更新成功' : '用户信息更新成功');
            } else {
                if (!values.password) {
                    throw new Error('缺少初始密码');
                }
                const createPayload: CreatePlatformUserRequest = {
                    username: values.username,
                    password: values.password,
                    display_name: values.display_name,
                    email: values.email,
                };
                await createPlatformUser(createPayload);
                message.success('用户创建成功，后端已自动赋予「平台管理员」角色');
            }
            history.push('/platform/users');
        } catch {
            /* global error handler */
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
                            disabled={isEdit ? !access.canUpdatePlatformUser : !access.canCreatePlatformUser}
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
                                rules={[
                                    { required: true, message: '请输入邮箱' },
                                    { type: 'email', message: '邮箱格式不正确' },
                                ]}
                            >
                                <Input
                                    prefix={<MailOutlined style={{ color: '#bfbfbf' }} />}
                                    placeholder="请输入邮箱"
                                    disabled={isEdit}
                                    maxLength={100}
                                />
                            </Form.Item>
                            {isEdit && (
                                <div style={{ marginTop: -8, marginBottom: 12, fontSize: 12, color: '#8c8c8c' }}>
                                    邮箱当前由后端视为只读字段，如需变更请走后端调整流程。
                                </div>
                            )}
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
                                        { min: 8, message: '密码至少8位' },
                                    ]}
                                >
                                    <Input.Password placeholder="至少8位" maxLength={64} />
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
                            {isEdit ? (
                                <Form.Item
                                    name="role_id"
                                    label="选择角色"
                                    extra={isLastAdmin
                                        ? '❗当前用户是最后一个活跃的平台管理员，角色不可变更'
                                        : '角色变更将通过后端的全局角色分配接口提交'}
                                >
                                    <Select
                                        placeholder="请选择平台角色"
                                        loading={rolesLoading}
                                        disabled={isLastAdmin}
                                        notFoundContent={rolesLoadFailed ? '平台角色加载失败，请刷新页面重试' : '暂无可选角色'}
                                        options={platformRoles.map(r => ({
                                            label: `${r.display_name}（${r.name}）`,
                                            value: r.id,
                                        }))}
                                        style={{ maxWidth: 400 }}
                                    />
                                </Form.Item>
                            ) : (
                                <div style={{ padding: '8px 14px', background: '#f5f5f5', borderRadius: 2, fontSize: 12, color: '#8c8c8c', lineHeight: 1.8 }}>
                                    新建平台用户时不再由前端选择角色。后端会在创建成功后自动赋予「平台管理员」角色。
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
