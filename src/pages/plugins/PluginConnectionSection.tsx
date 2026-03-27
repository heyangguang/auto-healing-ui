import React from 'react';
import { Alert, Button, Col, Divider, Form, Input, Row, Select, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { BASIC_AUTH_USERNAME_RULES } from './pluginFormHelpers';
import { AUTH_TYPES, PLUGIN_TYPES } from './pluginShared';

const { Text } = Typography;

type ExtraParam = {
    key: string;
    value: string;
};

type PluginConnectionSectionProps = {
    authType: string;
    currentType: string;
    extraParams: ExtraParam[];
    isEdit: boolean;
    loadedAuthType?: string;
    onAddExtraParam: () => void;
    onRemoveExtraParam: (index: number) => void;
    onUpdateExtraParam: (index: number, field: 'key' | 'value', value: string) => void;
};

const PluginConnectionSection: React.FC<PluginConnectionSectionProps> = ({
    authType,
    currentType,
    extraParams,
    isEdit,
    loadedAuthType,
    onAddExtraParam,
    onRemoveExtraParam,
    onUpdateExtraParam,
}) => (
    <>
        {isEdit && (
            <Alert
                title="敏感配置保护中"
                description="出于安全考虑，密码和密钥等敏感信息不会回显。如需修改，请直接输入新值覆盖；留空会继续沿用当前已保存凭据。"
                type="info"
                showIcon
                style={{ marginBottom: 24 }}
            />
        )}

        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>基本信息</Typography.Title>
        <Row gutter={24}>
            <Col span={8}>
                <Form.Item name="name" label="插件名称" tooltip="插件的唯一标识名称，创建后不可修改。建议包含系统类型和环境信息" rules={[{ required: true, message: '请输入插件名称' }]}>
                    <Input placeholder="例如：生产环境 ServiceNow" disabled={isEdit} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item name="type" label="插件类型" tooltip="ITSM：对接工单/事件管理系统。CMDB：对接配置管理系统" rules={[{ required: true }]}>
                    <Select options={PLUGIN_TYPES} disabled={isEdit} />
                </Form.Item>
            </Col>
            <Col span={4}>
                <Form.Item name="version" label="版本号" tooltip="自定义版本标识，用于跟踪配置变更历史" extra="如 1.0.0">
                    <Input placeholder="1.0.0" />
                </Form.Item>
            </Col>
        </Row>
        <Row gutter={24}>
            <Col span={18}>
                <Form.Item name="description" label="描述" tooltip="简要说明此插件对接的系统和用途" style={{ marginBottom: 0 }}>
                    <Input placeholder="例如：对接生产环境 ServiceNow 事件管理模块，同步 P1-P3 级别事件" />
                </Form.Item>
            </Col>
        </Row>

        <Divider style={{ margin: '8px 0 24px' }} />

        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>连接配置</Typography.Title>
        <Row gutter={24}>
            <Col span={14}>
                <Form.Item
                    name="url"
                    label="API 地址"
                    tooltip="外部系统提供数据的 REST API 端点地址。系统会通过此地址定时拉取数据"
                    rules={[{ required: true, message: '请输入 API 地址' }]}
                    extra={currentType === 'itsm' ? '例如：https://your-servicenow.com/api/now/table/incident' : '例如：https://your-cmdb.com/api/v1/assets'}
                >
                    <Input placeholder={currentType === 'itsm' ? 'https://instance.service-now.com/api/now/table/incident' : 'https://cmdb.company.com/api/v1/assets'} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item name="auth_type" label="认证方式" tooltip="Basic 认证：使用用户名和密码。Bearer Token：使用令牌。API Key：在请求头中传递 API 密钥" rules={[{ required: true }]}>
                    <Select options={AUTH_TYPES} />
                </Form.Item>
            </Col>
        </Row>

        {authType === 'basic' && (
            <Row gutter={24}>
                <Col span={8}>
                    <Form.Item name="username" label="用户名" tooltip="用于调用外部系统 API 的账号用户名" rules={BASIC_AUTH_USERNAME_RULES}>
                        <Input placeholder="api_user" />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="password" label="密码" tooltip="该账号对应的密码" rules={[{ required: !isEdit || loadedAuthType !== 'basic' }]}>
                        <Input.Password placeholder={isEdit ? '留空则沿用当前已保存密码' : ''} />
                    </Form.Item>
                </Col>
            </Row>
        )}

        {authType === 'bearer' && (
            <Row gutter={24}>
                <Col span={16}>
                    <Form.Item name="token" label="Bearer Token" tooltip="OAuth2 Access Token 或 JWT Token。不需要加 Bearer 前缀" rules={[{ required: !isEdit || loadedAuthType !== 'bearer' }]} extra="系统会自动添加 Bearer 前缀到请求头中">
                        <Input.Password placeholder={isEdit ? '留空则沿用当前已保存 Token' : 'eyJhbGciOiJIUzI1NiIs...'} />
                    </Form.Item>
                </Col>
            </Row>
        )}

        {authType === 'api_key' && (
            <Row gutter={24}>
                <Col span={8}>
                    <Form.Item name="api_key" label="API Key" tooltip="外部系统颁发的 API 密钥" rules={[{ required: !isEdit || loadedAuthType !== 'api_key' }]}>
                        <Input.Password placeholder={isEdit ? '留空则沿用当前已保存 API Key' : ''} />
                    </Form.Item>
                </Col>
                <Col span={8}>
                    <Form.Item name="api_key_header" label="Header 名称" tooltip="API Key 放置在 HTTP 请求头中的名称" extra="留空则使用默认值 X-API-Key">
                        <Input placeholder="X-API-Key" />
                    </Form.Item>
                </Col>
            </Row>
        )}

        <Row gutter={24}>
            <Col span={8}>
                <Form.Item name="since_param" label="增量同步参数" tooltip="用于过滤最近更新记录的查询参数名" extra="例如 ServiceNow 使用 sys_updated_on">
                    <Input placeholder="updated_after" />
                </Form.Item>
            </Col>
            <Col span={8}>
                <Form.Item name="response_data_path" label="响应数据路径" tooltip="API 返回 JSON 中实际数据数组所在的路径" extra="留空表示整个响应体就是数据数组">
                    <Input placeholder="data.items" />
                </Form.Item>
            </Col>
        </Row>

        <div className="plugin-form-subsection">
            <div className="plugin-form-subsection-header">
                <Text strong style={{ fontSize: 13 }}>额外查询参数</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>附加到每次 API 请求中的固定参数，例如 sysparm_limit=100</Text>
            </div>
            {extraParams.map((param, index) => (
                <Row gutter={12} key={`${param.key}-${index}`} className="plugin-form-dynamic-row">
                    <Col span={8}><Input placeholder="参数名 (如 sysparm_limit)" value={param.key} onChange={(event) => onUpdateExtraParam(index, 'key', event.target.value)} /></Col>
                    <Col span={10}><Input placeholder="参数值 (如 100)" value={param.value} onChange={(event) => onUpdateExtraParam(index, 'value', event.target.value)} /></Col>
                    <Col span={2}><Button icon={<MinusCircleOutlined />} onClick={() => onRemoveExtraParam(index)} /></Col>
                </Row>
            ))}
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={onAddExtraParam} style={{ marginTop: extraParams.length ? 4 : 0 }}>
                添加参数
            </Button>
        </div>

        {currentType === 'itsm' && (
            <div className="plugin-form-subsection">
                <div className="plugin-form-subsection-header">
                    <Text strong style={{ fontSize: 13 }}>关闭工单回调</Text>
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>修复完成后自动调用此接口关闭外部工单</Text>
                </div>
                <Row gutter={24}>
                    <Col span={14}>
                        <Form.Item name="close_incident_url" tooltip="修复完成后自动调用此 URL 关闭外部工单，支持 {id} 变量" extra="示例：https://instance.service-now.com/api/now/table/incident/{id}" style={{ marginBottom: 0 }}>
                            <Input placeholder="https://your-system.com/api/incidents/{id}/close" />
                        </Form.Item>
                    </Col>
                    <Col span={6}>
                        <Form.Item name="close_incident_method" tooltip="关闭接口使用的 HTTP 方法" style={{ marginBottom: 0 }}>
                            <Select placeholder="请求方法" options={[{ value: 'POST', label: 'POST' }, { value: 'PUT', label: 'PUT' }, { value: 'PATCH', label: 'PATCH' }]} />
                        </Form.Item>
                    </Col>
                </Row>
            </div>
        )}
    </>
);

export default PluginConnectionSection;
