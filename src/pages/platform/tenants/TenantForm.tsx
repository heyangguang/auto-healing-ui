import React, { useEffect, useState, useCallback } from 'react';
import {
    Form, Input, Select, Button, message, Spin, Space, Typography,
} from 'antd';
import {
    InfoCircleOutlined, AppstoreOutlined,
    BankOutlined, ShopOutlined, TeamOutlined, CloudOutlined,
    ApartmentOutlined, ToolOutlined, GlobalOutlined, RocketOutlined,
    HomeOutlined, BulbOutlined, SafetyOutlined, ThunderboltOutlined,
    DatabaseOutlined, ApiOutlined, DeploymentUnitOutlined, ClusterOutlined,
    DashboardOutlined, ExperimentOutlined, MonitorOutlined, CodeOutlined,
    BuildOutlined, FundOutlined, TrophyOutlined, StarOutlined,
    ProductOutlined, AlertOutlined, AuditOutlined, FireOutlined,
    CustomerServiceOutlined, ControlOutlined, SendOutlined, FolderOpenOutlined,
} from '@ant-design/icons';
import { history, useParams, useAccess } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getTenant, createTenant, updateTenant,
} from '@/services/auto-healing/platform/tenants';
import './TenantForm.css';

const { Text } = Typography;

const ICON_OPTIONS: { label: string; value: string; icon: React.ReactNode }[] = [
    { label: '银行', value: 'bank', icon: <BankOutlined /> },
    { label: '商店', value: 'shop', icon: <ShopOutlined /> },
    { label: '团队', value: 'team', icon: <TeamOutlined /> },
    { label: '云服务', value: 'cloud', icon: <CloudOutlined /> },
    { label: '企业', value: 'apartment', icon: <ApartmentOutlined /> },
    { label: '工具', value: 'tool', icon: <ToolOutlined /> },
    { label: '全球', value: 'global', icon: <GlobalOutlined /> },
    { label: '火箭', value: 'rocket', icon: <RocketOutlined /> },
    { label: '主页', value: 'home', icon: <HomeOutlined /> },
    { label: '灯泡', value: 'bulb', icon: <BulbOutlined /> },
    { label: '安全', value: 'safety', icon: <SafetyOutlined /> },
    { label: '闪电', value: 'thunder', icon: <ThunderboltOutlined /> },
    { label: '数据库', value: 'database', icon: <DatabaseOutlined /> },
    { label: 'API', value: 'api', icon: <ApiOutlined /> },
    { label: '部署', value: 'deployment', icon: <DeploymentUnitOutlined /> },
    { label: '集群', value: 'cluster', icon: <ClusterOutlined /> },
    { label: '仪表盘', value: 'dashboard', icon: <DashboardOutlined /> },
    { label: '实验', value: 'experiment', icon: <ExperimentOutlined /> },
    { label: '监控', value: 'monitor', icon: <MonitorOutlined /> },
    { label: '代码', value: 'code', icon: <CodeOutlined /> },
    { label: '构建', value: 'build', icon: <BuildOutlined /> },
    { label: '基金', value: 'fund', icon: <FundOutlined /> },
    { label: '奖杯', value: 'trophy', icon: <TrophyOutlined /> },
    { label: '星级', value: 'star', icon: <StarOutlined /> },
    { label: '产品', value: 'product', icon: <ProductOutlined /> },
    { label: '告警', value: 'alert', icon: <AlertOutlined /> },
    { label: '审计', value: 'audit', icon: <AuditOutlined /> },
    { label: '火焰', value: 'fire', icon: <FireOutlined /> },
    { label: '客服', value: 'service', icon: <CustomerServiceOutlined /> },
    { label: '控制', value: 'control', icon: <ControlOutlined /> },
    { label: '发送', value: 'send', icon: <SendOutlined /> },
    { label: '文件夹', value: 'folder', icon: <FolderOpenOutlined /> },
];

const TenantForm: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const isEdit = !!id;
    const [form] = Form.useForm();
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
        getTenant(id).then((res: any) => {
            const tenant = res?.data || res;
            form.setFieldsValue({
                name: tenant.name,
                code: tenant.code,
                description: tenant.description,
                icon: tenant.icon,
                status: tenant.status,
            });
        }).catch(() => {
            /* global error handler */
        }).finally(() => setLoading(false));
    }, [id, isEdit, form]);

    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            if (isEdit) {
                await updateTenant(id, values);
                message.success('租户更新成功');
            } else {
                await createTenant(values);
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
                                        const icon = ICON_OPTIONS.find(o => o.value === opt.value);
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
                                        const icon = ICON_OPTIONS.find(o => o.value === opt.value);
                                        return (
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                                <span style={{ fontSize: 14, color: '#1677ff' }}>{icon?.icon}</span>
                                                {opt.label as string}
                                            </div>
                                        );
                                    }}
                                    options={ICON_OPTIONS.map(o => ({ label: o.label, value: o.value }))}
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
                                        <Select.Option value="inactive">
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
