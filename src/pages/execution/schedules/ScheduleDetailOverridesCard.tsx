import React from 'react';
import { EyeOutlined } from '@ant-design/icons';
import { Space, Tag, Typography } from 'antd';

const { Text } = Typography;

interface ScheduleDetailOverridesCardProps {
    fieldLabelStyle: React.CSSProperties;
    hasOverrides: boolean;
    overrideHosts: string[];
    overrideSecrets: string[];
    overrideVars: Record<string, unknown>;
    resolveSecretsName: (id: string) => string;
}

const ScheduleDetailOverridesCard: React.FC<ScheduleDetailOverridesCardProps> = ({
    fieldLabelStyle,
    hasOverrides,
    overrideHosts,
    overrideSecrets,
    overrideVars,
    resolveSecretsName,
}) => {
    if (!hasOverrides) {
        return (
            <div style={{ padding: '12px 0', textAlign: 'center', color: '#bfbfbf', fontSize: 12 }}>
                未配置覆盖参数，将使用模板默认配置
            </div>
        );
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {overrideHosts.length > 0 && (
                <div>
                    <div style={fieldLabelStyle}>目标主机 ({overrideHosts.length})</div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {overrideHosts.slice(0, 8).map((host) => (
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
                                {host}
                            </div>
                        ))}
                        {overrideHosts.length > 8 && (
                            <Text type="secondary" style={{ fontSize: 11, alignSelf: 'center' }}>
                                +{overrideHosts.length - 8}
                            </Text>
                        )}
                    </div>
                </div>
            )}
            {Object.keys(overrideVars).length > 0 && (
                <div>
                    <div style={fieldLabelStyle}>变量覆盖 ({Object.keys(overrideVars).length})</div>
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {Object.entries(overrideVars).map(([key, value]) => (
                            <div
                                key={key}
                                style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '4px 10px',
                                    background: '#fafafa',
                                    border: '1px solid #f0f0f0',
                                    fontSize: 12,
                                    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
                                }}
                            >
                                <span style={{ color: '#262626', fontWeight: 600 }}>{key}</span>
                                <span style={{ color: '#bfbfbf', margin: '0 6px' }}>=</span>
                                <span style={{ color: '#8c8c8c' }}>{typeof value === 'string' ? value : JSON.stringify(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            {overrideSecrets.length > 0 && (
                <div>
                    <div style={fieldLabelStyle}>密钥源</div>
                    <div style={{ marginTop: 6 }}>
                        <Space size={4} wrap>
                            {overrideSecrets.map((id) => (
                                <Tag key={id} icon={<EyeOutlined />} color="blue" style={{ margin: 0, fontSize: 11 }}>
                                    {resolveSecretsName(id)}
                                </Tag>
                            ))}
                        </Space>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ScheduleDetailOverridesCard;
