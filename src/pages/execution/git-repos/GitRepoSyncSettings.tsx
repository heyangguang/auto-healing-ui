import React from 'react';
import { Alert, Col, Form, InputNumber, Radio, Row, Select, Space } from 'antd';
import { syncIntervalOptions } from './gitRepoFormConfig';

type GitRepoSyncSettingsProps = {
    syncEnabled?: boolean;
};

export default function GitRepoSyncSettings(props: GitRepoSyncSettingsProps) {
    const { syncEnabled } = props;

    return (
        <>
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
                                        {syncIntervalOptions.map((value) => (
                                            <Select.Option key={value} value={value}>{value}</Select.Option>
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
        </>
    );
}
