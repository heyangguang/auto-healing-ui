import React from 'react';
import { RocketOutlined } from '@ant-design/icons';
import { Space, Tag, Typography } from 'antd';
import { getExecutorConfig } from '@/constants/executionDicts';

const { Text } = Typography;

interface ScheduleDetailTemplateCardProps {
    fieldLabelStyle: React.CSSProperties;
    fieldValueStyle: React.CSSProperties;
    template?: AutoHealing.ExecutionTask;
}

const ScheduleDetailTemplateCard: React.FC<ScheduleDetailTemplateCardProps> = ({
    fieldLabelStyle,
    fieldValueStyle,
    template,
}) => {
    if (!template) {
        return <Text type="secondary" style={{ fontSize: 12 }}>模板已删除或不可用</Text>;
    }
    const executor = getExecutorConfig(template.executor_type);

    return (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
            <div>
                <div style={fieldLabelStyle}>模板名称</div>
                <div style={fieldValueStyle}>
                    <Space size={6}>
                        <RocketOutlined style={{ color: '#1890ff' }} />
                        <span style={{ fontWeight: 600 }}>{template.name}</span>
                    </Space>
                </div>
            </div>
            <div>
                <div style={fieldLabelStyle}>执行器类型</div>
                <div style={fieldValueStyle}>{executor.label}</div>
            </div>
            <div>
                <div style={fieldLabelStyle}>Playbook</div>
                <div style={fieldValueStyle}>{template.playbook?.name || '-'}</div>
            </div>
            <div>
                <div style={fieldLabelStyle}>状态</div>
                <div style={fieldValueStyle}>
                    {template.needs_review
                        ? <Tag color="warning" style={{ margin: 0 }}>待审核</Tag>
                        : <Tag color="success" style={{ margin: 0 }}>就绪</Tag>}
                </div>
            </div>
            {template.target_hosts && (
                <div style={{ gridColumn: '1 / -1' }}>
                    <div style={fieldLabelStyle}>默认主机 ({template.target_hosts.split(',').filter(Boolean).length})</div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {template.target_hosts.split(',').filter(Boolean).slice(0, 8).map((host) => (
                            <div
                                key={host}
                                style={{
                                    border: '1px dashed #d9d9d9',
                                    background: '#fafafa',
                                    padding: '3px 10px',
                                    fontSize: 12,
                                    color: '#595959',
                                }}
                            >
                                {host.trim()}
                            </div>
                        ))}
                        {template.target_hosts.split(',').filter(Boolean).length > 8 && (
                            <Text type="secondary" style={{ fontSize: 11, alignSelf: 'center' }}>
                                +{template.target_hosts.split(',').filter(Boolean).length - 8}
                            </Text>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleDetailTemplateCard;
