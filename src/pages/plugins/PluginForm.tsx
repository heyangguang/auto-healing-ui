import React, { useState, useEffect, useCallback, useRef } from 'react';
import { history, useParams, useAccess } from '@umijs/max';
import {
    Form, Input, Select, Button, message, Spin, Row, Col, Alert, Switch, Typography, InputNumber, Divider,
} from 'antd';
import { SaveOutlined, PlusOutlined, MinusCircleOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import { getPlugin, createPlugin, updatePlugin } from '@/services/auto-healing/plugins';
import './PluginForm.css';

const { Text } = Typography;

/* ========== 常量 ========== */
const PLUGIN_TYPES = [
    { value: 'itsm', label: 'ITSM - 工单系统' },
    { value: 'cmdb', label: 'CMDB - 配置管理' },
];

const AUTH_TYPES = [
    { value: 'basic', label: 'Basic 认证 (用户名/密码)' },
    { value: 'bearer', label: 'Bearer Token' },
    { value: 'api_key', label: 'API Key' },
];

const FILTER_OPERATORS = [
    { value: 'equals', label: '等于' }, { value: 'not_equals', label: '不等于' },
    { value: 'contains', label: '包含' }, { value: 'not_contains', label: '不包含' },
    { value: 'starts_with', label: '以...开头' }, { value: 'ends_with', label: '以...结尾' },
    { value: 'regex', label: '正则匹配' },
    { value: 'in', label: '在列表中 (逗号分隔)' }, { value: 'not_in', label: '不在列表中 (逗号分隔)' },
];

const ITSM_FIELDS = [
    { value: 'external_id', label: '外部工单ID' }, { value: 'title', label: '标题' },
    { value: 'description', label: '描述' }, { value: 'severity', label: '严重程度' },
    { value: 'priority', label: '优先级' }, { value: 'status', label: '状态' },
    { value: 'category', label: '分类' }, { value: 'affected_ci', label: '受影响配置项' },
    { value: 'affected_service', label: '受影响服务' }, { value: 'assignee', label: '处理人' },
    { value: 'reporter', label: '报告人' },
];

const CMDB_FIELDS = [
    { value: 'external_id', label: '外部ID' }, { value: 'name', label: '名称' },
    { value: 'type', label: '类型' }, { value: 'status', label: '状态' },
    { value: 'ip_address', label: 'IP地址' }, { value: 'hostname', label: '主机名' },
    { value: 'os', label: '操作系统' }, { value: 'os_version', label: '系统版本' },
    { value: 'cpu', label: 'CPU' }, { value: 'memory', label: '内存' },
    { value: 'disk', label: '磁盘' }, { value: 'location', label: '位置' },
    { value: 'owner', label: '负责人' }, { value: 'environment', label: '环境' },
    { value: 'manufacturer', label: '厂商' }, { value: 'model', label: '型号' },
    { value: 'serial_number', label: '序列号' }, { value: 'department', label: '部门' },
];

const PluginFormPage: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const originalConfigRef = useRef<Record<string, any>>({});
    const [loadedAuthType, setLoadedAuthType] = useState<string | undefined>(undefined);

    // Dynamic arrays
    const [mappings, setMappings] = useState<{ standard: string; external: string }[]>([]);
    const [filters, setFilters] = useState<{ field: string; operator: string; value: string }[]>([]);
    const [extraParams, setExtraParams] = useState<{ key: string; value: string }[]>([]);

    const currentType = Form.useWatch('type', form) || 'itsm';
    const authType = Form.useWatch('auth_type', form) || 'basic';
    const syncEnabled = Form.useWatch('sync_enabled', form);
    const standardFields = currentType === 'cmdb' ? CMDB_FIELDS : ITSM_FIELDS;

    // ==================== Load Data ====================
    useEffect(() => {
        if (!isEdit || !params.id) {
            originalConfigRef.current = {};
            setLoadedAuthType(undefined);
            form.setFieldsValue({
                type: 'itsm', auth_type: 'basic', sync_enabled: true, sync_interval_minutes: 5, max_failures: 5,
            });
            return;
        }
        setLoading(true);
        (async () => {
            try {
                const res = await getPlugin(params.id!);
                const plugin = (res as any)?.data || res;
                originalConfigRef.current = plugin.config || {};
                setLoadedAuthType(plugin.config?.auth_type || 'basic');
                form.setFieldsValue({
                    name: plugin.name,
                    type: plugin.type,
                    description: plugin.description,
                    version: plugin.version,
                    url: plugin.config?.url,
                    auth_type: plugin.config?.auth_type || 'basic',
                    username: plugin.config?.username,
                    password: undefined,
                    token: undefined,
                    api_key: undefined,
                    api_key_header: plugin.config?.api_key_header,
                    since_param: plugin.config?.since_param,
                    response_data_path: plugin.config?.response_data_path,
                    close_incident_url: plugin.config?.close_incident_url,
                    close_incident_method: plugin.config?.close_incident_method,
                    sync_enabled: plugin.sync_enabled,
                    sync_interval_minutes: plugin.sync_interval_minutes || 5,
                });

                // Mappings
                const mapping = plugin.type === 'cmdb'
                    ? plugin.field_mapping?.cmdb_mapping
                    : plugin.field_mapping?.incident_mapping;
                setMappings(mapping
                    ? Object.entries(mapping).map(([k, v]) => ({ standard: k, external: v as string }))
                    : []);

                // Filters
                setFilters(plugin.sync_filter?.rules?.map((r: any) => ({
                    field: r.field || '',
                    operator: r.operator || 'equals',
                    value: Array.isArray(r.value) ? r.value.join(',') : String(r.value || ''),
                })) || []);

                // Extra Params
                const ep = plugin.config?.extra_params;
                setExtraParams(ep
                    ? Object.entries(ep).map(([k, v]) => ({ key: k, value: String(v) }))
                    : []);

            } catch {
                /* global error handler */
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, params.id]);

    // ==================== Dynamic List Helpers ====================
    const addMapping = useCallback(() => setMappings(prev => [...prev, { standard: '', external: '' }]), []);
    const removeMapping = useCallback((i: number) => setMappings(prev => prev.filter((_, idx) => idx !== i)), []);
    const updateMapping = useCallback((i: number, f: 'standard' | 'external', v: string) => {
        setMappings(prev => { const a = [...prev]; a[i] = { ...a[i], [f]: v }; return a; });
    }, []);

    const addFilter = useCallback(() => setFilters(prev => [...prev, { field: '', operator: 'equals', value: '' }]), []);
    const removeFilter = useCallback((i: number) => setFilters(prev => prev.filter((_, idx) => idx !== i)), []);
    const updateFilter = useCallback((i: number, f: 'field' | 'operator' | 'value', v: string) => {
        setFilters(prev => { const a = [...prev]; a[i] = { ...a[i], [f]: v }; return a; });
    }, []);

    const addExtraParam = useCallback(() => setExtraParams(prev => [...prev, { key: '', value: '' }]), []);
    const removeExtraParam = useCallback((i: number) => setExtraParams(prev => prev.filter((_, idx) => idx !== i)), []);
    const updateExtraParam = useCallback((i: number, f: 'key' | 'value', v: string) => {
        setExtraParams(prev => { const a = [...prev]; a[i] = { ...a[i], [f]: v }; return a; });
    }, []);

    // ==================== Submit ====================
    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setSubmitting(true);

            const originalConfig = originalConfigRef.current || {};
            const config: any = {
                url: values.url,
                auth_type: values.auth_type,
            };
            if (values.auth_type === 'basic') {
                config.username = values.username;
                if (values.password) {
                    config.password = values.password;
                } else if (isEdit && originalConfig.auth_type === 'basic' && originalConfig.password) {
                    config.password = originalConfig.password;
                }
            } else if (values.auth_type === 'bearer') {
                if (values.token) {
                    config.token = values.token;
                } else if (isEdit && originalConfig.auth_type === 'bearer' && originalConfig.token) {
                    config.token = originalConfig.token;
                }
            } else if (values.auth_type === 'api_key') {
                config.api_key_header = values.api_key_header;
                if (values.api_key) {
                    config.api_key = values.api_key;
                } else if (isEdit && originalConfig.auth_type === 'api_key' && originalConfig.api_key) {
                    config.api_key = originalConfig.api_key;
                }
            }
            if (values.since_param) config.since_param = values.since_param;
            if (values.response_data_path) config.response_data_path = values.response_data_path;
            if (values.close_incident_url) config.close_incident_url = values.close_incident_url;
            if (values.close_incident_method) config.close_incident_method = values.close_incident_method;

            const vep = extraParams.filter(p => p.key && p.value);
            if (vep.length > 0) {
                const ep: Record<string, string> = {};
                vep.forEach(p => { ep[p.key] = p.value; });
                config.extra_params = ep;
            }

            let field_mapping: any = {};
            const vm = mappings.filter(m => m.standard && m.external);
            if (vm.length > 0) {
                const map: Record<string, string> = {};
                vm.forEach(m => { map[m.standard] = m.external; });
                field_mapping = values.type === 'cmdb' ? { cmdb_mapping: map } : { incident_mapping: map };
            }

            const vf = filters.filter(f => f.field);
            const sync_filter = {
                logic: 'and',
                rules: vf.map(f => ({
                    field: f.field,
                    operator: f.operator,
                    value: ['in', 'not_in'].includes(f.operator)
                        ? (f.value || '').split(',').map(v => v.trim()).filter(v => v)
                        : (f.value || ''),
                })),
            };

            const payload = {
                name: values.name,
                type: values.type,
                description: values.description,
                version: values.version,
                config,
                field_mapping,
                sync_filter,
                sync_enabled: Boolean(values.sync_enabled),
                sync_interval_minutes: Number(values.sync_interval_minutes) || 5,
                max_failures: Number(values.max_failures) || 0,
            };

            if (isEdit && params.id) {
                await updatePlugin(params.id, payload as any);
                message.success('更新成功');
            } else {
                await createPlugin(payload as any);
                message.success('创建成功');
            }
            history.push('/resources/plugins');
        } catch (error) {
            if (!(error as any).errorFields) {
                /* global error handler */
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== Render ====================
    return (
        <div className="plugin-form-page">
            <SubPageHeader
                title={isEdit ? '编辑插件' : '新建插件'}
                onBack={() => history.push('/resources/plugins')}
            />

            <div className="plugin-form-card">
                <Spin spinning={loading}>
                    <Form form={form} layout="vertical" className="plugin-form-content">
                        {isEdit && (
                            <Alert
                                message="敏感配置保护中"
                                description="出于安全考虑，密码和密钥等敏感信息不会回显。如需修改，请直接输入新值覆盖；留空则保持原有配置不变。"
                                type="info" showIcon style={{ marginBottom: 24 }}
                            />
                        )}

                        {/* ========== 基本信息 ========== */}
                        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>基本信息</Typography.Title>
                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item
                                    name="name" label="插件名称"
                                    tooltip="插件的唯一标识名称，创建后不可修改。建议包含系统类型和环境信息"
                                    rules={[{ required: true, message: '请输入插件名称' }]}
                                >
                                    <Input placeholder="例如：生产环境 ServiceNow" disabled={isEdit} />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="type" label="插件类型"
                                    tooltip="ITSM：对接工单/事件管理系统（如 ServiceNow、Jira Service Desk），用于同步工单和事件。CMDB：对接配置管理系统，用于同步资产和配置项"
                                    rules={[{ required: true }]}
                                >
                                    <Select options={PLUGIN_TYPES} disabled={isEdit} />
                                </Form.Item>
                            </Col>
                            <Col span={4}>
                                <Form.Item
                                    name="version" label="版本号"
                                    tooltip="自定义版本标识，用于跟踪配置变更历史"
                                    extra="如 1.0.0"
                                >
                                    <Input placeholder="1.0.0" />
                                </Form.Item>
                            </Col>
                        </Row>
                        <Row gutter={24}>
                            <Col span={18}>
                                <Form.Item
                                    name="description" label="描述"
                                    tooltip="简要说明此插件对接的系统和用途"
                                    style={{ marginBottom: 0 }}
                                >
                                    <Input placeholder="例如：对接生产环境 ServiceNow 事件管理模块，同步 P1-P3 级别事件" />
                                </Form.Item>
                            </Col>
                        </Row>

                        <Divider style={{ margin: '8px 0 24px' }} />

                        {/* ========== 连接配置 ========== */}
                        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>连接配置</Typography.Title>
                        <Row gutter={24}>
                            <Col span={14}>
                                <Form.Item
                                    name="url" label="API 地址"
                                    tooltip="外部系统提供数据的 REST API 端点地址。系统会通过此地址定时拉取数据"
                                    rules={[{ required: true, message: '请输入 API 地址' }]}
                                    extra={currentType === 'itsm'
                                        ? '例如：https://your-servicenow.com/api/now/table/incident'
                                        : '例如：https://your-cmdb.com/api/v1/assets'}
                                >
                                    <Input placeholder={currentType === 'itsm'
                                        ? 'https://instance.service-now.com/api/now/table/incident'
                                        : 'https://cmdb.company.com/api/v1/assets'} />
                                </Form.Item>
                            </Col>
                            <Col span={6}>
                                <Form.Item
                                    name="auth_type" label="认证方式"
                                    tooltip="Basic 认证：使用用户名和密码。Bearer Token：使用 OAuth2 或 JWT 令牌。API Key：在请求头中传递 API 密钥"
                                    rules={[{ required: true }]}
                                >
                                    <Select options={AUTH_TYPES} />
                                </Form.Item>
                            </Col>
                        </Row>

                        {authType === 'basic' && (
                            <Row gutter={24}>
                                <Col span={8}>
                                    <Form.Item
                                        name="username" label="用户名"
                                        tooltip="用于调用外部系统 API 的账号用户名"
                                        rules={[{ required: !isEdit || loadedAuthType !== 'basic' }]}
                                    >
                                        <Input placeholder="api_user" />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="password" label="密码"
                                        tooltip="该账号对应的密码"
                                        rules={[{ required: !isEdit || loadedAuthType !== 'basic' }]}
                                    >
                                        <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}
                        {authType === 'bearer' && (
                            <Row gutter={24}>
                                <Col span={16}>
                                    <Form.Item
                                        name="token" label="Bearer Token"
                                        tooltip="OAuth2 Access Token 或 JWT Token。不需要加 'Bearer' 前缀"
                                        rules={[{ required: !isEdit || loadedAuthType !== 'bearer' }]}
                                        extra="系统会自动添加 'Bearer' 前缀到请求头中"
                                    >
                                        <Input.Password placeholder={isEdit ? '留空保持不变' : 'eyJhbGciOiJIUzI1NiIs...'} />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}
                        {authType === 'api_key' && (
                            <Row gutter={24}>
                                <Col span={8}>
                                    <Form.Item
                                        name="api_key" label="API Key"
                                        tooltip="外部系统颁发的 API 密钥"
                                        rules={[{ required: !isEdit || loadedAuthType !== 'api_key' }]}
                                    >
                                        <Input.Password placeholder={isEdit ? '留空保持不变' : ''} />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    <Form.Item
                                        name="api_key_header" label="Header 名称"
                                        tooltip="API Key 放置在 HTTP 请求头中的名称。如果外部系统要求使用特定的 Header 名"
                                        extra="留空则使用默认值 X-API-Key"
                                    >
                                        <Input placeholder="X-API-Key" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}

                        <Row gutter={24}>
                            <Col span={8}>
                                <Form.Item
                                    name="since_param" label="增量同步参数"
                                    tooltip="外部 API 中用于过滤「最近更新」记录的查询参数名。系统每次同步时会自动传入上次同步的时间戳"
                                    extra="例如 ServiceNow 使用 sys_updated_on"
                                >
                                    <Input placeholder="updated_after" />
                                </Form.Item>
                            </Col>
                            <Col span={8}>
                                <Form.Item
                                    name="response_data_path" label="响应数据路径"
                                    tooltip="API 返回 JSON 中，实际数据数组所在的路径。例如 ServiceNow 返回 {result: [...]}，则填 result"
                                    extra='留空表示整个响应体就是数据数组'
                                >
                                    <Input placeholder="data.items" />
                                </Form.Item>
                            </Col>
                        </Row>

                        {/* 额外查询参数 */}
                        <div className="plugin-form-subsection">
                            <div className="plugin-form-subsection-header">
                                <Text strong style={{ fontSize: 13 }}>额外查询参数</Text>
                                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                    附加到每次 API 请求中的固定参数，例如 sysparm_limit=100
                                </Text>
                            </div>
                            {extraParams.map((p, i) => (
                                <Row gutter={12} key={i} className="plugin-form-dynamic-row">
                                    <Col span={8}><Input placeholder="参数名 (如 sysparm_limit)" value={p.key} onChange={e => updateExtraParam(i, 'key', e.target.value)} /></Col>
                                    <Col span={10}><Input placeholder="参数值 (如 100)" value={p.value} onChange={e => updateExtraParam(i, 'value', e.target.value)} /></Col>
                                    <Col span={2}><Button icon={<MinusCircleOutlined />} onClick={() => removeExtraParam(i)} /></Col>
                                </Row>
                            ))}
                            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addExtraParam} style={{ marginTop: extraParams.length ? 4 : 0 }}>
                                添加参数
                            </Button>
                        </div>

                        {/* 关闭工单回调 (仅 ITSM) */}
                        {currentType === 'itsm' && (
                            <div className="plugin-form-subsection">
                                <div className="plugin-form-subsection-header">
                                    <Text strong style={{ fontSize: 13 }}>关闭工单回调</Text>
                                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                        修复完成后自动调用此接口关闭外部工单
                                    </Text>
                                </div>
                                <Row gutter={24}>
                                    <Col span={14}>
                                        <Form.Item
                                            name="close_incident_url"
                                            tooltip="当事件被标记为已修复时，系统自动调用此 URL 关闭外部工单。支持 {id} 变量"
                                            extra="示例：https://instance.service-now.com/api/now/table/incident/{id}"
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Input placeholder="https://your-system.com/api/incidents/{id}/close" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={6}>
                                        <Form.Item
                                            name="close_incident_method"
                                            tooltip="关闭接口使用的 HTTP 方法"
                                            style={{ marginBottom: 0 }}
                                        >
                                            <Select placeholder="请求方法" options={[{ value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' }]} />
                                        </Form.Item>
                                    </Col>
                                </Row>
                            </div>
                        )}

                        <Divider style={{ margin: '8px 0 24px' }} />

                        {/* ========== 同步设置 ========== */}
                        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>同步设置</Typography.Title>
                        <Row gutter={24} align="middle">
                            <Col span={6}>
                                <Form.Item
                                    name="sync_enabled" label="启用定时同步" valuePropName="checked"
                                    tooltip="开启后系统将按指定间隔自动从外部系统拉取数据"
                                    style={{ marginBottom: syncEnabled ? 20 : 0 }}
                                >
                                    <Switch />
                                </Form.Item>
                            </Col>
                            {syncEnabled && (
                                <>
                                    <Col span={5}>
                                        <Form.Item
                                            name="sync_interval_minutes" label="同步间隔"
                                            tooltip="两次同步之间的间隔时间（分钟）。建议不低于 5 分钟，避免对外部系统造成过大压力"
                                            extra="范围：1 ~ 1440 分钟"
                                        >
                                            <InputNumber min={1} max={1440} style={{ width: '100%' }} suffix="分钟" />
                                        </Form.Item>
                                    </Col>
                                    <Col span={5}>
                                        <Form.Item
                                            name="max_failures" label="连续失败暂停"
                                            tooltip="当同步连续失败达到此次数时，系统将自动暂停该插件的定时同步。设为 0 表示不启用自动暂停"
                                            extra="0 = 不自动暂停"
                                        >
                                            <InputNumber min={0} max={100} style={{ width: '100%' }} suffix="次" />
                                        </Form.Item>
                                    </Col>
                                </>
                            )}
                        </Row>

                        {/* 过滤规则 */}
                        <div className="plugin-form-subsection">
                            <div className="plugin-form-subsection-header">
                                <Text strong style={{ fontSize: 13 }}>过滤规则</Text>
                                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                    只同步满足所有条件的数据（AND 逻辑）
                                </Text>
                            </div>
                            <Alert type="info" message="示例：只同步 severity=P1 且 status=open 的工单，可添加两条规则：severity 等于 P1、status 等于 open" style={{ marginBottom: 12 }} />
                            {filters.map((f, i) => (
                                <Row gutter={12} key={i} className="plugin-form-dynamic-row" align="middle">
                                    <Col span={7}>
                                        <Input placeholder='外部系统字段名 (如 severity)' value={f.field}
                                            onChange={e => updateFilter(i, 'field', e.target.value)} />
                                    </Col>
                                    <Col span={5}>
                                        <Select style={{ width: '100%' }} value={f.operator}
                                            onChange={v => updateFilter(i, 'operator', v)} options={FILTER_OPERATORS} />
                                    </Col>
                                    <Col span={9}>
                                        <Input placeholder='匹配值 (如 P1 或 P1,P2)' value={f.value}
                                            onChange={e => updateFilter(i, 'value', e.target.value)} />
                                    </Col>
                                    <Col span={2}>
                                        <Button icon={<MinusCircleOutlined />} onClick={() => removeFilter(i)} />
                                    </Col>
                                </Row>
                            ))}
                            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addFilter}
                                style={{ marginTop: filters.length ? 4 : 0 }}>
                                添加规则
                            </Button>
                        </div>

                        <Divider style={{ margin: '8px 0 24px' }} />

                        {/* ========== 字段映射 ========== */}
                        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>字段映射</Typography.Title>
                        <Alert type="info" style={{ marginBottom: 16 }}
                            message="将外部系统的字段名映射为本系统的标准字段名"
                            description={
                                <span>例如：外部系统使用 <code>incident_number</code> 表示工单ID，而标准字段为 <code>external_id</code>，则添加一条映射：标准字段选择「外部工单ID」，外部字段填写 <code>incident_number</code>。如果外部系统字段名与标准一致，则无需添加映射。</span>
                            }
                        />
                        {mappings.map((m, i) => (
                            <Row gutter={12} key={i} className="plugin-form-dynamic-row">
                                <Col span={9}>
                                    <Select
                                        style={{ width: '100%' }}
                                        placeholder="选择标准字段"
                                        value={m.standard || undefined}
                                        onChange={v => updateMapping(i, 'standard', v)}
                                        options={standardFields}
                                    />
                                </Col>
                                <Col flex="24px" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c', fontSize: 12 }}>→</Col>
                                <Col span={9}>
                                    <Input placeholder="外部系统字段名 (如 incident_number)" value={m.external} onChange={e => updateMapping(i, 'external', e.target.value)} />
                                </Col>
                                <Col span={2}>
                                    <Button icon={<MinusCircleOutlined />} onClick={() => removeMapping(i)} />
                                </Col>
                            </Row>
                        ))}
                        <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={addMapping}
                            style={{ marginTop: mappings.length ? 4 : 0 }}>
                            添加映射
                        </Button>

                        <Divider style={{ margin: '16px 0 24px' }} />
                        <div className="plugin-form-actions">
                            <Button type="primary" icon={<SaveOutlined />} loading={submitting} disabled={isEdit ? !access.canUpdatePlugin : !access.canCreatePlugin} onClick={handleSubmit}>
                                {isEdit ? '保存修改' : '创建插件'}
                            </Button>
                            <Button onClick={() => history.push('/resources/plugins')}>取消</Button>
                        </div>
                    </Form>
                </Spin>
            </div>
        </div>
    );
};

export default PluginFormPage;
