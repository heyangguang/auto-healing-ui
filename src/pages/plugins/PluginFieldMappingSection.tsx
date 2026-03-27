import React from 'react';
import { Alert, Button, Col, Divider, Input, Row, Select, Typography } from 'antd';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { CMDB_FIELDS, ITSM_FIELDS } from './pluginShared';

type FieldMapping = {
    external: string;
    standard: string;
};

type PluginFieldMappingSectionProps = {
    currentType: string;
    mappings: FieldMapping[];
    onAddMapping: () => void;
    onRemoveMapping: (index: number) => void;
    onUpdateMapping: (index: number, field: 'standard' | 'external', value: string) => void;
};

const PluginFieldMappingSection: React.FC<PluginFieldMappingSectionProps> = ({
    currentType,
    mappings,
    onAddMapping,
    onRemoveMapping,
    onUpdateMapping,
}) => {
    const standardFields = currentType === 'cmdb' ? CMDB_FIELDS : ITSM_FIELDS;

    return (
        <>
            <Divider style={{ margin: '8px 0 24px' }} />
            <Typography.Title level={5} style={{ marginBottom: 16, color: '#595959' }}>字段映射</Typography.Title>
            <Alert
                type="info"
                style={{ marginBottom: 16 }}
                title="将外部系统的字段名映射为本系统的标准字段名"
                description={<span>例如：外部系统使用 <code>incident_number</code> 表示工单ID，而标准字段为 <code>external_id</code>。</span>}
            />
            {mappings.map((mapping, index) => (
                <Row gutter={12} key={`${mapping.standard}-${index}`} className="plugin-form-dynamic-row">
                    <Col span={9}>
                        <Select
                            style={{ width: '100%' }}
                            placeholder="选择标准字段"
                            value={mapping.standard || undefined}
                            onChange={(value) => onUpdateMapping(index, 'standard', value)}
                            options={standardFields}
                        />
                    </Col>
                    <Col flex="24px" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8c8c8c', fontSize: 12 }}>→</Col>
                    <Col span={9}>
                        <Input placeholder="外部系统字段名 (如 incident_number)" value={mapping.external} onChange={(event) => onUpdateMapping(index, 'external', event.target.value)} />
                    </Col>
                    <Col span={2}><Button icon={<MinusCircleOutlined />} onClick={() => onRemoveMapping(index)} /></Col>
                </Row>
            ))}
            <Button type="dashed" size="small" icon={<PlusOutlined />} onClick={onAddMapping} style={{ marginTop: mappings.length ? 4 : 0 }}>
                添加映射
            </Button>
        </>
    );
};

export default PluginFieldMappingSection;
