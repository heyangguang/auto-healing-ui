import React from 'react';
import { Col, Form, Input, Row, Select } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import {
    getCategoryFormOptions,
    getSeverityFormOptions,
} from './blacklistRuleFormOptions';

const { TextArea } = Input;

type Props = {
    isSystem: boolean;
};

const BlacklistRuleBasicInfoSection: React.FC<Props> = ({ isSystem }) => (
    <div className="blacklist-form-card">
        <h4 className="blacklist-form-section-title">
            <ThunderboltOutlined />
            基本信息
        </h4>

        <Row gutter={16}>
            <Col span={12}>
                <Form.Item
                    name="name"
                    label="规则名称"
                    rules={[{ required: true, message: '请输入规则名称' }]}
                    extra="简短描述规则用途，如「删除根目录」「格式化磁盘」"
                >
                    <Input placeholder="如：删除根目录、格式化磁盘" maxLength={128} disabled={isSystem} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item
                    name="severity"
                    label="严重级别"
                    rules={[{ required: true, message: '请选择严重级别' }]}
                >
                    <Select options={getSeverityFormOptions()} placeholder="选择级别" disabled={isSystem} />
                </Form.Item>
            </Col>
            <Col span={6}>
                <Form.Item name="category" label="分类">
                    <Select options={getCategoryFormOptions()} placeholder="选择分类" allowClear disabled={isSystem} />
                </Form.Item>
            </Col>
        </Row>

        <Form.Item
            name="description"
            label="风险说明"
            extra="可选，描述该指令的危险性和可能造成的后果"
        >
            <TextArea
                placeholder="描述该指令的危险性和可能造成的后果"
                rows={2}
                maxLength={500}
                showCount
                disabled={isSystem}
            />
        </Form.Item>
    </div>
);

export default BlacklistRuleBasicInfoSection;
