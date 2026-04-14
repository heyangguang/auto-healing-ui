import React from 'react';
import { Col, Form, InputNumber, Row, Select, Switch } from 'antd';
import type { ChannelFormValues } from './channelFormHelpers';
import { getIntervalInitialValue, validateEmailRecipients } from './channelFormHelpers';

interface ChannelRetrySectionProps {
    channelType?: AutoHealing.ChannelType;
}

const ChannelRetrySection: React.FC<ChannelRetrySectionProps> = ({ channelType }) => {
    return (
        <>
            {channelType === 'email' && (
                <Form.Item<ChannelFormValues>
                    label="默认收件邮箱"
                    name="recipients"
                    help="输入邮箱地址后回车添加，支持多个"
                    rules={[{ validator: validateEmailRecipients }]}
                >
                    <Select
                        mode="tags"
                        placeholder="example@company.com"
                        style={{ width: '100%' }}
                        tokenSeparators={[',', ' ']}
                    />
                </Form.Item>
            )}

            <Row gutter={16}>
                <Col xs={24} md={12}>
                    <Form.Item<ChannelFormValues> label="最大重试次数" name="max_retries" initialValue={3}>
                        <Select
                            className="channel-form-control-md"
                            options={[
                                { value: 0, label: '不重试' },
                                { value: 1, label: '1 次' },
                                { value: 2, label: '2 次' },
                                { value: 3, label: '3 次' },
                            ]}
                        />
                    </Form.Item>
                </Col>
                <Col xs={24} md={12}>
                    <Form.Item<ChannelFormValues> label="速率限制 (条/分)" name="rate_limit_per_minute">
                        <InputNumber className="channel-form-control-md" min={1} placeholder="默认无限制" />
                    </Form.Item>
                </Col>
            </Row>

            <Form.Item noStyle shouldUpdate={(prev, curr) => prev.max_retries !== curr.max_retries}>
                {({ getFieldValue }) => {
                    const count = getFieldValue('max_retries') || 0;
                    if (count === 0) {
                        return null;
                    }

                    return (
                        <Form.Item label="重试间隔配置 (分钟)">
                            <div className="channel-retry-intervals">
                                {Array.from({ length: count }).map((_, index) => (
                                    <div key={`retry-${index + 1}`} className="channel-retry-interval">
                                        <span className="channel-retry-interval-label">
                                            第 {index + 1} 次:
                                        </span>
                                        <Form.Item<ChannelFormValues>
                                            name={`interval_${index}`}
                                            initialValue={getIntervalInitialValue(index)}
                                            rules={[{ required: true, message: '必填' }]}
                                            noStyle
                                        >
                                            <InputNumber className="channel-form-control-sm" min={1} max={1440} />
                                        </Form.Item>
                                    </div>
                                ))}
                            </div>
                        </Form.Item>
                    );
                }}
            </Form.Item>

            <Form.Item<ChannelFormValues> name="is_default" valuePropName="checked" label="设为默认渠道" style={{ marginBottom: 0 }}>
                <Switch />
            </Form.Item>
        </>
    );
};

export default ChannelRetrySection;
