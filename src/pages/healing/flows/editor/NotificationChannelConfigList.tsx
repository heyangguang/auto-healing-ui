import React from 'react';
import { CloseOutlined } from '@ant-design/icons';
import { Space, Tag, Typography } from 'antd';
import type { ChannelTemplateConfig } from './notificationChannelTemplateSelectorShared';
import { getChannelTypeConfig } from './notificationChannelTemplateSelectorShared';

const { Text } = Typography;

const LIST_CONTAINER_STYLE: React.CSSProperties = {
    border: '1px solid #f0f0f0',
    borderRadius: 4,
    background: '#fafafa',
};

const ROW_STYLE: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '10px 12px',
    background: '#fff',
};

interface NotificationChannelConfigListProps {
    value: ChannelTemplateConfig[];
    getChannelName: (id: string) => string;
    getChannelType: (id: string) => string;
    getTemplateName: (id: string) => string;
    onRemove: (index: number) => void;
}

interface ConfigRowProps {
    config: ChannelTemplateConfig;
    index: number;
    isLast: boolean;
    getChannelName: (id: string) => string;
    getChannelType: (id: string) => string;
    getTemplateName: (id: string) => string;
    onRemove: (index: number) => void;
}

const ConfigRow: React.FC<ConfigRowProps> = ({
    config,
    index,
    isLast,
    getChannelName,
    getChannelType,
    getTemplateName,
    onRemove,
}) => {
    const typeConfig = getChannelTypeConfig(getChannelType(config.channel_id));

    return (
        <div style={{ ...ROW_STYLE, borderBottom: isLast ? 'none' : '1px solid #f0f0f0' }}>
            <Space size={12}>
                <span
                    style={{
                        width: 28,
                        height: 28,
                        borderRadius: 4,
                        background: `${typeConfig.color}15`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: typeConfig.color,
                        fontSize: 14,
                    }}
                >
                    {typeConfig.icon}
                </span>
                <div>
                    <Text style={{ fontSize: 13 }}>{getChannelName(config.channel_id)}</Text>
                    <Text type="secondary" style={{ margin: '0 8px' }}>→</Text>
                    <Text type="secondary" style={{ fontSize: 13 }}>{getTemplateName(config.template_id)}</Text>
                </div>
                <Tag style={{ margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 6px' }}>
                    {typeConfig.label}
                </Tag>
            </Space>
            <CloseOutlined
                style={{ color: '#bfbfbf', cursor: 'pointer', fontSize: 12, padding: 4 }}
                onClick={() => onRemove(index)}
                onMouseEnter={event => {
                    event.currentTarget.style.color = '#ff4d4f';
                }}
                onMouseLeave={event => {
                    event.currentTarget.style.color = '#bfbfbf';
                }}
            />
        </div>
    );
};

const NotificationChannelConfigList: React.FC<NotificationChannelConfigListProps> = ({
    value,
    getChannelName,
    getChannelType,
    getTemplateName,
    onRemove,
}) => {
    if (value.length === 0) {
        return null;
    }

    return (
        <div style={LIST_CONTAINER_STYLE}>
            {value.map((config, index) => (
                <ConfigRow
                    key={`${config.channel_id}-${config.template_id}`}
                    config={config}
                    index={index}
                    isLast={index === value.length - 1}
                    getChannelName={getChannelName}
                    getChannelType={getChannelType}
                    getTemplateName={getTemplateName}
                    onRemove={onRemove}
                />
            ))}
        </div>
    );
};

export default NotificationChannelConfigList;
