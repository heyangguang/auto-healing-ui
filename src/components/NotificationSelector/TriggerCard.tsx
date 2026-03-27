import React from 'react';
import { Button, Space, Switch, Tag, Typography } from 'antd';
import { CloseOutlined, PlusOutlined, SendOutlined } from '@ant-design/icons';
import type { ChannelTemplateConfig, TriggerMeta } from './types';

const { Text } = Typography;

interface TriggerCardProps {
    trigger: TriggerMeta;
    isEnabled: boolean;
    configList: ChannelTemplateConfig[];
    getChannelName: (id: string) => string;
    getTemplateName: (id: string) => string;
    onToggleEnabled: (checked: boolean) => void;
    onRemoveConfig: (index: number) => void;
    onAddConfig: () => void;
}

const TriggerCard: React.FC<TriggerCardProps> = ({
    trigger,
    isEnabled,
    configList,
    getChannelName,
    getTemplateName,
    onToggleEnabled,
    onRemoveConfig,
    onAddConfig,
}) => {
    return (
        <div
            style={{
                border: `1px dashed ${isEnabled ? trigger.color : '#d9d9d9'}`,
                borderRadius: 0,
                padding: 12,
                background: isEnabled ? `${trigger.color}08` : '#fafafa',
            }}
        >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={4}>
                    <span style={{ color: trigger.color, fontSize: 13 }}>{trigger.icon}</span>
                    <Text strong style={{ fontSize: 13 }}>{trigger.label}</Text>
                    {configList.length > 0 && (
                        <Tag color={trigger.tagColor} style={{ margin: 0, fontSize: 10 }}>
                            {configList.length}
                        </Tag>
                    )}
                </Space>
                <Switch
                    size="small"
                    checked={isEnabled}
                    onChange={onToggleEnabled}
                />
            </div>
            {isEnabled && (
                <div style={{ marginTop: 8, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {configList.map((cfg, idx) => (
                        <div
                            key={`${cfg.channel_id}-${cfg.template_id}`}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                padding: '4px 8px',
                                border: '1px dashed #d9d9d9',
                                borderRadius: 0,
                                background: '#fff',
                                fontSize: 11,
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: 4, overflow: 'hidden' }}>
                                <SendOutlined style={{ color: '#999', fontSize: 10, flexShrink: 0 }} />
                                <Text ellipsis={{ tooltip: getChannelName(cfg.channel_id) }} style={{ fontSize: 11, maxWidth: 80 }}>{getChannelName(cfg.channel_id)}</Text>
                                <Text type="secondary" style={{ fontSize: 10 }}>→</Text>
                                <Text type="secondary" ellipsis={{ tooltip: getTemplateName(cfg.template_id) }} style={{ fontSize: 11, maxWidth: 80 }}>{getTemplateName(cfg.template_id)}</Text>
                            </div>
                            <CloseOutlined
                                style={{ color: '#bfbfbf', cursor: 'pointer', fontSize: 9, flexShrink: 0 }}
                                onClick={() => onRemoveConfig(idx)}
                                onMouseEnter={(e) => { e.currentTarget.style.color = '#ff4d4f'; }}
                                onMouseLeave={(e) => { e.currentTarget.style.color = '#bfbfbf'; }}
                            />
                        </div>
                    ))}
                    <Button
                        type="dashed"
                        size="small"
                        icon={<PlusOutlined />}
                        onClick={onAddConfig}
                        style={{
                            borderRadius: 0,
                            borderColor: '#d9d9d9',
                            color: '#595959',
                            fontSize: 11,
                        }}
                    >
                        添加策略
                    </Button>
                </div>
            )}
        </div>
    );
};

export default TriggerCard;
