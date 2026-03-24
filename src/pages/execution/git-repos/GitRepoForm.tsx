import React, { useState, useEffect, useCallback } from 'react';
import {
    Form, Input, Button, Select, Radio, Space, message, Alert, Tag, Row, Col, Typography, Divider, InputNumber,
} from 'antd';
import {
    LinkOutlined, GithubOutlined, GlobalOutlined, KeyOutlined, LockOutlined,
    SafetyCertificateOutlined, BranchesOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import { history, useParams, useAccess } from '@umijs/max';
import SubPageHeader from '@/components/SubPageHeader';
import {
    validateGitRepo, createGitRepo, getGitRepo, updateGitRepo,
} from '@/services/auto-healing/git-repos';
import './GitRepoForm.css';

const { Text } = Typography;

const authTypeOptions = [
    { value: 'none', label: '公开仓库', icon: <GlobalOutlined />, desc: '无需认证' },
    { value: 'token', label: 'Token', icon: <KeyOutlined />, desc: '访问令牌' },
    { value: 'password', label: '密码', icon: <LockOutlined />, desc: '用户名/密码' },
    { value: 'ssh_key', label: 'SSH', icon: <SafetyCertificateOutlined />, desc: 'SSH 密钥' },
];

const valuesChangedAuthType = (current?: string, original?: string) => (current || 'none') !== (original || 'none');

const GitRepoFormPage: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);

    // 验证相关
    const [validating, setValidating] = useState(false);
    const [validated, setValidated] = useState(false);
    const [availableBranches, setAvailableBranches] = useState<string[]>([]);
    const [defaultBranch, setDefaultBranch] = useState('');
    const [originalAuthType, setOriginalAuthType] = useState<string>('none');

    const authType = Form.useWatch('auth_type', form);
    const syncEnabled = Form.useWatch('sync_enabled', form);

    // 编辑模式加载
    useEffect(() => {
        if (!isEdit || !params.id) return;
        setLoading(true);
        getGitRepo(params.id).then(res => {
            const r = res.data;
            // 解析 sync_interval (e.g. "1h" -> value=1, unit="h")
            let intervalValue = 1;
            let intervalUnit = 'h';
            if (r.sync_interval) {
                const match = r.sync_interval.match(/^(\d+)([mhd])$/);
                if (match) {
                    intervalValue = parseInt(match[1], 10);
                    intervalUnit = match[2];
                }
            }
            form.setFieldsValue({
                name: r.name,
                url: r.url,
                auth_type: r.auth_type || 'none',
                default_branch: r.default_branch,
                sync_enabled: r.sync_enabled || false,
                interval_value: intervalValue,
                interval_unit: intervalUnit,
                max_failures: r.max_failures ?? 5,
            });
            // 编辑模式下已验证
            setValidated(true);
            setDefaultBranch(r.default_branch || 'main');
            setAvailableBranches(r.branches?.length ? r.branches : [r.default_branch || 'main']);
            setOriginalAuthType(r.auth_type || 'none');
        }).catch(() => {
            /* global error handler */
        }).finally(() => setLoading(false));
    }, [isEdit, params.id, form]);

    // 验证仓库
    const handleValidate = useCallback(async () => {
        try {
            await form.validateFields(['url', 'auth_type', 'token', 'username', 'password', 'private_key']);
        } catch { return; }

        const values = form.getFieldsValue();
        setValidating(true);

        try {
            const req: any = { url: values.url, auth_type: values.auth_type || 'none' };
            if (values.auth_type === 'token') req.auth_config = { token: values.token };
            else if (values.auth_type === 'password') req.auth_config = { username: values.username, password: values.password };
            else if (values.auth_type === 'ssh_key') req.auth_config = { private_key: values.private_key, passphrase: values.passphrase };

            const res = await validateGitRepo(req);
            const branches = res.data?.branches || [];
            const defBranch = res.data?.default_branch || 'main';

            if (branches.length === 0) {
                message.warning('未检测到分支');
                return;
            }

            setAvailableBranches(branches);
            setDefaultBranch(defBranch);
            setValidated(true);
            form.setFieldValue('default_branch', defBranch);
            message.success(`验证成功，检测到 ${branches.length} 个分支`);
        } catch {
            // 全局错误处理
        } finally {
            setValidating(false);
        }
    }, [form]);

    // 提交
    const handleSubmit = async () => {
        if (!validated && !isEdit) {
            message.warning('请先验证仓库连接');
            return;
        }

        try {
            const values = await form.validateFields();
            setSubmitting(true);

            // 组合间隔值
            let syncInterval = '1h';
            if (values.interval_value && values.interval_unit) {
                syncInterval = `${values.interval_value}${values.interval_unit}`;
            }

            const buildAuthConfig = () => {
                if (values.auth_type === 'none') return {};
                if (values.auth_type === 'token') {
                    if (isEdit && originalAuthType === 'token' && !values.token) return undefined;
                    return { token: values.token };
                }
                if (values.auth_type === 'password') {
                    const hasUsername = !!values.username;
                    const hasPassword = !!values.password;
                    if (isEdit && originalAuthType === 'password' && !hasUsername && !hasPassword) return undefined;
                    return { username: values.username, password: values.password };
                }
                if (values.auth_type === 'ssh_key') {
                    if (isEdit && originalAuthType === 'ssh_key' && !values.private_key && !values.passphrase) return undefined;
                    return { private_key: values.private_key, passphrase: values.passphrase };
                }
                return undefined;
            };

            if (isEdit && params.id) {
                const authConfig = buildAuthConfig();
                await updateGitRepo(params.id, {
                    default_branch: values.default_branch,
                    auth_type: values.auth_type,
                    auth_config: authConfig,
                    sync_enabled: values.sync_enabled || false,
                    sync_interval: syncInterval,
                    max_failures: Number(values.max_failures) || 0,
                });
                message.success('更新成功');
            } else {
                const req: any = {
                    url: values.url,
                    auth_type: values.auth_type || 'none',
                };
                if (values.auth_type === 'token') req.auth_config = { token: values.token };
                else if (values.auth_type === 'password') req.auth_config = { username: values.username, password: values.password };
                else if (values.auth_type === 'ssh_key') req.auth_config = { private_key: values.private_key, passphrase: values.passphrase };

                await createGitRepo({
                    name: values.name,
                    url: values.url,
                    default_branch: values.default_branch,
                    auth_type: req.auth_type,
                    auth_config: req.auth_config,
                    sync_enabled: values.sync_enabled || false,
                    sync_interval: syncInterval,
                    max_failures: Number(values.max_failures) || 0,
                });
                message.success('创建成功');
            }
            history.push('/execution/git-repos');
        } catch (error) {
            if (!(error as any).errorFields) {
                /* global error handler */
            }
        } finally {
            setSubmitting(false);
        }
    };

    // URL 变更时重置验证
    const handleUrlChange = () => {
        if (!isEdit) {
            setValidated(false);
            setAvailableBranches([]);
        }
    };

    return (
        <div className="git-form-page">
            <SubPageHeader
                title={isEdit ? '编辑代码仓库' : '添加代码仓库'}
                onBack={() => history.push('/execution/git-repos')}
                actions={
                    <div className="git-form-actions">
                        <Button onClick={() => history.push('/execution/git-repos')}>取消</Button>
                        <Button type="primary" onClick={handleSubmit} loading={submitting} disabled={isEdit ? !access.canUpdateGitRepo : !access.canCreateGitRepo}>
                            {isEdit ? '保存' : '创建'}
                        </Button>
                    </div>
                }
            />

            <div className="git-form-card">
                <div className="git-form-content">
                    <Form form={form} layout="vertical" requiredMark={false} initialValues={{ auth_type: 'none', sync_enabled: false, interval_value: 1, interval_unit: 'h', max_failures: 5 }}>

                        {/* 仓库信息 */}
                        <h4 className="git-form-section-title">
                            <GithubOutlined style={{ marginRight: 8 }} />仓库信息
                        </h4>

                        <Form.Item name="url" label="仓库地址" rules={[{ required: true, message: '请输入仓库地址' }]}
                            extra="支持 HTTPS 和 SSH 协议">
                            <Input
                                size="large"
                                placeholder="https://github.com/org/repo.git"
                                prefix={<LinkOutlined style={{ color: '#bfbfbf' }} />}
                                onChange={handleUrlChange}
                                disabled={isEdit}
                            />
                        </Form.Item>

                        <Form.Item name="auth_type" label="认证方式">
                            <Radio.Group>
                                <Space size="middle">
                                    {authTypeOptions.map(o => (
                                        <Radio key={o.value} value={o.value}>
                                            <Space size={4}>
                                                <span style={{ color: '#666' }}>{o.icon}</span>
                                                <span>{o.label}</span>
                                            </Space>
                                        </Radio>
                                    ))}
                                </Space>
                            </Radio.Group>
                        </Form.Item>

                        {authType === 'token' && (
                            <Form.Item
                                name="token"
                                label="Access Token"
                                rules={[{
                                    validator: async (_, value) => {
                                        const changedType = !isEdit || valuesChangedAuthType(form.getFieldValue('auth_type'), originalAuthType);
                                        if ((changedType && !value) || (!changedType && !isEdit && !value)) {
                                            throw new Error('请输入 Access Token');
                                        }
                                    }
                                }]}
                            >
                                <Input.Password placeholder={isEdit ? '留空保持原值' : 'ghp_xxxx'} />
                            </Form.Item>
                        )}
                        {authType === 'password' && (
                            <Row gutter={12}>
                                <Col span={12}>
                                    <Form.Item
                                        name="username"
                                        label="用户名"
                                        rules={[{
                                            validator: async (_, value) => {
                                                const currentType = form.getFieldValue('auth_type');
                                                const changedType = valuesChangedAuthType(currentType, originalAuthType);
                                                const password = form.getFieldValue('password');
                                                if (changedType && !value) throw new Error('请输入用户名');
                                                if (!changedType && password && !value) throw new Error('请输入用户名');
                                            }
                                        }]}
                                    >
                                        <Input placeholder={isEdit ? '留空保持原值' : '请输入用户名'} />
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="password"
                                        label="密码"
                                        rules={[{
                                            validator: async (_, value) => {
                                                const currentType = form.getFieldValue('auth_type');
                                                const changedType = valuesChangedAuthType(currentType, originalAuthType);
                                                const username = form.getFieldValue('username');
                                                if (changedType && !value) throw new Error('请输入密码');
                                                if (!changedType && username && !value) throw new Error('请输入密码');
                                            }
                                        }]}
                                    >
                                        <Input.Password placeholder={isEdit ? '留空保持原值' : '请输入密码'} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}
                        {authType === 'ssh_key' && (
                            <>
                                <Form.Item
                                    name="private_key"
                                    label="SSH 私钥"
                                    rules={[{
                                        validator: async (_, value) => {
                                            const changedType = !isEdit || valuesChangedAuthType(form.getFieldValue('auth_type'), originalAuthType);
                                            if (changedType && !value) {
                                                throw new Error('请输入 SSH 私钥');
                                            }
                                        }
                                    }]}
                                >
                                    <Input.TextArea rows={3} placeholder={isEdit ? '留空保持原值' : '-----BEGIN RSA PRIVATE KEY-----'} style={{ fontFamily: 'monospace', fontSize: 11 }} />
                                </Form.Item>
                                <Form.Item name="passphrase" label="密钥密码">
                                    <Input.Password placeholder={isEdit ? '留空保持原值' : '可选'} />
                                </Form.Item>
                            </>
                        )}

                        {/* 验证按钮 */}
                        {!isEdit && (
                            <Form.Item>
                                <Button onClick={handleValidate} loading={validating} icon={<CheckCircleOutlined />}
                                    disabled={!access.canCreateGitRepo}
                                    type={validated ? 'default' : 'primary'}>
                                    {validating ? '验证中...' : validated ? '重新验证' : '验证并获取分支'}
                                </Button>
                            </Form.Item>
                        )}

                        {/* 验证结果 */}
                        {validated && availableBranches.length > 0 && !isEdit && (
                            <div className="git-form-validate-result">
                                <Space>
                                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                                    <Text>验证成功，检测到 {availableBranches.length} 个分支</Text>
                                </Space>
                                <div style={{ marginTop: 8 }}>
                                    {availableBranches.map(b => (
                                        <Tag key={b} icon={<BranchesOutlined />} color={b === defaultBranch ? 'blue' : undefined}>{b}</Tag>
                                    ))}
                                </div>
                            </div>
                        )}

                        <Divider />

                        {/* 基本设置 */}
                        <h4 className="git-form-section-title">
                            基本设置
                        </h4>

                        <Row gutter={16}>
                            <Col span={12}>
                                <Form.Item name="name" label="仓库名称" rules={[{ required: true, message: '请输入仓库名称' }]}>
                                    <Input placeholder="ansible-playbooks" disabled={isEdit} />
                                </Form.Item>
                                {isEdit && (
                                    <div style={{ marginTop: -8, marginBottom: 12, fontSize: 12, color: '#8c8c8c' }}>
                                        仓库名称当前前端仅作展示，编辑时不会提交到后端。
                                    </div>
                                )}
                            </Col>
                            <Col span={12}>
                                <Form.Item name="default_branch" label="默认分支" rules={[{ required: true, message: '请选择分支' }]}>
                                    <Select placeholder={validated ? '请选择' : '请先验证仓库'} disabled={!validated && !isEdit}>
                                        {availableBranches.map(b => (
                                            <Select.Option key={b} value={b}>
                                                {b === defaultBranch ? `${b} (默认)` : b}
                                            </Select.Option>
                                        ))}
                                    </Select>
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider />

                        {/* 同步设置 */}
                        <h4 className="git-form-section-title">
                            同步设置
                        </h4>

                        <Form.Item name="sync_enabled" label="定时同步">
                            <Radio.Group>
                                <Radio value={false}>不启用</Radio>
                                <Radio value={true}>启用自动同步</Radio>
                            </Radio.Group>
                        </Form.Item>

                        {syncEnabled && (
                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item label="同步频率">
                                        <Space>
                                            <span>每</span>
                                            <Form.Item name="interval_value" noStyle>
                                                <Select style={{ width: 80 }}>
                                                    {[1, 2, 3, 4, 5, 6, 8, 10, 12, 15, 20, 24, 30].map(n => (
                                                        <Select.Option key={n} value={n}>{n}</Select.Option>
                                                    ))}
                                                </Select>
                                            </Form.Item>
                                            <Form.Item name="interval_unit" noStyle>
                                                <Select style={{ width: 80 }}>
                                                    <Select.Option value="m">分钟</Select.Option>
                                                    <Select.Option value="h">小时</Select.Option>
                                                    <Select.Option value="d">天</Select.Option>
                                                </Select>
                                            </Form.Item>
                                            <span>同步一次</span>
                                        </Space>
                                    </Form.Item>
                                </Col>
                                <Col span={12}>
                                    <Form.Item
                                        name="max_failures"
                                        label="连续失败暂停"
                                        tooltip="达到该次数后自动暂停定时同步，0 表示不自动暂停"
                                        extra="默认 5 次"
                                    >
                                        <InputNumber min={0} max={100} style={{ width: '100%' }} suffix="次" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}

                        {syncEnabled && (
                            <Alert
                                type="info"
                                showIcon
                                message="同步时会自动拉取最新代码，并触发关联 Playbook 的变量重新扫描"
                                style={{ marginBottom: 16 }}
                            />
                        )}
                    </Form>
                </div>
            </div>
        </div>
    );
};

export default GitRepoFormPage;
