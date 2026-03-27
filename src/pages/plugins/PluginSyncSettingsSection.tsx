import type { EditablePluginFilter } from './pluginFormHelpers';
import React from 'react';
import { Alert, Button, Col, Divider, Form, Input, InputNumber, Row, Select, Switch, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { FILTER_OPERATORS } from './pluginShared';

const { Text } = Typography;

type PluginSyncSettingsSectionProps = {
    filters: EditablePluginFilter[];
    onAddFilter: () => void;
    onRemoveFilter: (index: number) => void;
    onUpdateFilter: (index: number, field: 'field' | 'operator' | 'value', value: EditablePluginFilter['operator'] | string) => void;
    syncEnabled?: boolean;
};

const PluginSyncSettingsSection: React.FC<PluginSyncSettingsSectionProps> = ({
    filters,
    onAddFilter,
    onRemoveFilter,
    onUpdateFilter,
    syncEnabled,
}) => (
    <>
        <Divider style={{ margin: '8px 0 24px' }} />
        <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>同步设置</Typography.Title>
        <Row gutter={24} align="middle">
            <Col span={6}>
                <Form.Item name="sync_enabled" label="启用定时同步" valuePropName="checked" tooltip="开启后系统将按指定间隔自动从外部系统拉取数据" style={{ marginBottom: syncEnabled ? 20 : 0 }}>
                    <Switch />
                </Form.Item>
            </Col>
            {syncEnabled && (
                <>
                    <Col span={5}>
                        <Form.Item name="sync_interval_minutes" label="同步间隔" tooltip="两次同步之间的间隔时间（分钟）" extra="范围：1 ~ 1440 分钟">
                            <InputNumber min={1} max={1440} style={{ width: '100%' }} suffix="分钟" />
                        </Form.Item>
                    </Col>
                    <Col span={5}>
                        <Form.Item name="max_failures" label="连续失败暂停" tooltip="连续失败达到此次数时自动暂停同步，0 表示不启用自动暂停" extra="0 = 不自动暂停">
                            <InputNumber min={0} max={100} style={{ width: '100%' }} suffix="次" />
                        </Form.Item>
                    </Col>
                </>
            )}
        </Row>

        <div className="plugin-form-subsection">
            <div className="plugin-form-subsection-header">
                <Text strong style={{ fontSize: 13 }}>过滤规则</Text>
                <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>只同步满足所有条件的数据（AND 逻辑）</Text>
            </div>
            <Alert type="info" title="示例：只同步 severity=P1 且 status=open 的工单，可添加两条规则：severity 等于 P1、status 等于 open" style={{ marginBottom: 12 }} />
            {filters.map((filter, index) => (
                <Row gutter={12} key={`${filter.field}-${index}`} className="plugin-form-dynamic-row" align="middle">
                    <Col span={7}><Input placeholder="外部系统字段名 (如 severity)" value={filter.field} onChange={(event) => onUpdateFilter(index, 'field', event.target.value)} /></Col>
                    <Col span={5}><Select style={{ width: '100%' }} value={filter.operator} onChange={(value) => onUpdateFilter(index, 'operator', value)} options={FILTER_OPERATORS} /></Col>
                    <Col span={9}><Input placeholder="匹配值 (如 P1 或 P1,P2)" value={filter.value} onChange={(event) => onUpdateFilter(index, 'value', event.target.value)} /></Col>
                    <Col span={2}><Button icon={<MinusCircleOutlined />} onClick={() => onRemoveFilter(index)} /></Col>
                </Row>
            ))}
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={onAddFilter} style={{ marginTop: filters.length ? 4 : 0 }}>
                添加规则
            </Button>
        </div>
    </>
);

export default PluginSyncSettingsSection;
