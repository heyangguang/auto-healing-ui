import React, { useEffect, useState, useCallback } from 'react';
import {
    Form, Input, Select, Button, message, Spin, Space, Typography,
} from 'antd';
import {
    InfoCircleOutlined, AppstoreOutlined,
} from '@ant-design/icons';
import { history, useParams, useAccess } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getTenant, createTenant, updateTenant, type PlatformTenantRecord,
} from '@/services/auto-healing/platform/tenants';
import type { CreateTenantRequest, PlatformTenant, UpdateTenantRequest } from '@/services/auto-healing/platform/contracts';
import { TENANT_ICON_OPTIONS, findTenantIconOption } from './tenantFormOptions';
import './TenantForm.css';

const { Text } = Typography;

type TenantFormValues = {
    name: string;
    code: string;
    description?: string;
    icon?: string;
    status?: PlatformTenant['status'];
};

const toTenantFormValues = (tenant: PlatformTenantRecord): TenantFormValues => ({
    name: tenant.name,
    code: tenant.code,
    description: tenant.description,
    icon: tenant.icon,
    status: tenant.status,
});

const buildCreateTenantPayload = (values: TenantFormValues): CreateTenantRequest => ({
    name: values.name,
    code: values.code,
    description: values.description,
    icon: values.icon,
});

const buildUpdateTenantPayload = (values: TenantFormValues): UpdateTenantRequest => ({
    name: values.name,
    description: values.description,
    icon: values.icon,
    status: values.status,
});

const TenantForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const isEdit = !!id;
    const [form] = Form.useForm<TenantFormValues>();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const handleGoBack = useCallback(() => {
        if (window.history.length > 1) history.back();
        else history.push('/platform/tenants');
    }, []);

    // 编辑模式：加载租户数据
    useEffect(() => {
        if (!isEdit) return;
        setLoading(true);
        getTenant(id)
            .then((tenant) => {
                form.setFieldsValue(toTenantFormValues(tenant));
            })
            .catch(() => {
                /* global error handler */
            })
            .finally(() => setLoading(false));
    }, [id, isEdit, form]);

    const handleSubmit = async (values: TenantFormValues) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                await updateTenant(id, buildUpdateTenantPayload(values));
                message.success('租户更新成功');
            } else {
                await createTenant(buildCreateTenantPayload(values));
                message.success('租户创建成功');
            }
            history.push('/platform/tenants');
        } catch {
            message.error(isEdit ? '租户更新失败' : '租户创建失败');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="tenant-form-page">
            <SubPageHeader
                title={isEdit ? '编辑租户' : '创建租户'}
                onBack={handleGoBack}
                actions={
                    <div className="tenant-form-actions">
                        <Button onClick={handleGoBack}>取消</Button>
                        <Button
                            type="primary"
                            loading={submitting}
                            disabled={!access.canManagePlatformTenants}
                            onClick={() => form.submit()}
                        >
                            {isEdit ? '保存修改' : '创建租户'}
                        </Button>
                    </div>
                }
            />

            <Spin spinning={loading}>
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ status: 'active' }}
                    size="large"
                    requiredMark={false}
                >
                    <div className="tenant-form-cards">

                        {/* ===== 基础信息 ===== */}
                        <div className="tenant-form-card">
                            <h4 className="tenant-form-section-title">
                                <InfoCircleOutlined />
                                基础信息
                            </h4>

                            <Form.Item
                                name="name"
                                label="租户名称"
                                rules={[{ required: true, message: '请输入租户名称' }]}
                                extra="简短描述该租户的用途，例如「研发部门」「生产运维」"
                            >
                                <Input placeholder="请输入租户名称，如：研发部门" />
                            </Form.Item>

                            <Form.Item
                                name="code"
                                label={
                                    <Space size={4}>
                                        <span>租户代码</span>
                                        <Text type="secondary" style={{ fontSize: 12 }}>（唯一标识，创建后不可修改）</Text>
                                    </Space>
                                }
                                rules={[
                                    { required: true, message: '请输入租户代码' },
                                    { pattern: /^[a-z0-9_-]+$/, message: '只允许小写字母、数字、下划线和连字符' },
                                ]}
                                extra="只允许小写字母、数字、下划线和连字符，如：dev_team、prod_ops"
                            >
                                <Input
                                    placeholder="如：dev_team、prod_ops"
                                    disabled={isEdit}
                                    style={{ fontFamily: 'monospace' }}
                                />
                            </Form.Item>

                            <Form.Item
                                name="description"
                                label="描述"
                                extra="可选，用于记录该租户的详细说明或归属团队"
                            >
                                <Input.TextArea
                                    placeholder="租户描述（可选），说明该租户的用途或归属团队"
                                    rows={3}
                                    showCount
                                    maxLength={200}
                                />
                            </Form.Item>
                        </div>

                        {/* ===== 外观与状态 ===== */}
                        <div className="tenant-form-card">
                            <h4 className="tenant-form-section-title">
                                <AppstoreOutlined />
                                外观与状态
                            </h4>

                            <Form.Item
                                name="icon"
                                label="图标"
                                extra="为租户选择一个代表性图标，将显示在租户卡片和切换菜单中"
                            >
                                <Select
                                    placeholder="选择租户图标（可选）"
                                    allowClear
                                    showSearch
                                    style={{ width: 360 }}
                                    optionFilterProp="label"
                                    optionRender={(opt) => {
                                        const icon = findTenantIconOption(String(opt.value));
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                <span style={{ fontSize: 16, color: '#1677ff', width: 20, display: 'flex', justifyContent: 'center' }}>
                                                    {icon?.icon}
                                                </span>
                                                {opt.label as string}
                                            </div>
                                        );
                                    }}
                                    labelRender={(opt) => {
                                        const icon = findTenantIconOption(
                                            opt.value === undefined ? undefined : String(opt.value),
                                        );
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 14, color: '#1677ff' }}>{icon?.icon}</span>
                                                {opt.label as string}
                                            </div>
                                        );
                                    }}
                                    options={TENANT_ICON_OPTIONS.map(option => ({ label: option.label, value: option.value }))}
                                />
                            </Form.Item>

                            {isEdit && (
                                <Form.Item
                                    name="status"
                                    label="状态"
                                    extra="禁用后该租户下的用户将无法登录"
                                >
                                    <Select style={{ width: 160 }}>
                                        <Select.Option value="active">
                                            <Space size={6}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#52c41a', display: 'inline-block' }} />
                                                已启用
                                            </Space>
                                        </Select.Option>
                                        <Select.Option value="disabled">
                                            <Space size={6}>
                                                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#bfbfbf', display: 'inline-block' }} />
                                                已禁用
                                            </Space>
                                        </Select.Option>
                                    </Select>
                                </Form.Item>
                            )}
                        </div>

                    </div>
                </Form>
            </Spin>
        </div>
    );
};

export default TenantForm;
