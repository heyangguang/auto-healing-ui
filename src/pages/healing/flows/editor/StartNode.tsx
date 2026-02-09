import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { STATUS_CONFIG, getCurrentNodeShadow } from './CustomNode';

const { Text } = Typography;

const handleStyle = {
    width: 6,
    height: 6,
    background: '#fff',
    border: '1px solid #52c41a',
    borderRadius: '50%',
    zIndex: 10,
};

// 固定节点尺寸
const NODE_WIDTH = 160;
const NODE_HEIGHT = 40;

const StartNode = ({ data, isConnectable, selected }: NodeProps) => {
    const status = data.status;
    const color = '#52c41a';
    const statusConfig = status ? STATUS_CONFIG[status] : null;
    const statusColor = statusConfig?.color;
    const isCurrent = !!data.isCurrent;

    // 当有 status 时用 status 颜色做 glow，不叠加蓝色硬边框
    const effectiveColor = statusColor || color;
    const currentBorder = isCurrent
        ? (statusColor ? `2px solid ${statusColor}` : '2px solid #1890ff')
        : '1px solid #d9d9d9';

    return (
        <div style={{
            position: 'relative',
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            background: '#fff',
            borderRadius: 0,
            boxShadow: isCurrent
                ? `0 0 0 2px ${effectiveColor}40, 0 4px 16px ${effectiveColor}30`
                : selected ? `0 0 0 1px ${color}` : '0 2px 6px rgba(0,0,0,0.04)',
            border: currentBorder,
            borderLeft: `3px solid ${effectiveColor}`,
            transition: 'all 0.3s',
            overflow: 'hidden',
            animation: isCurrent && !statusColor ? 'currentNodePulse 2s ease-in-out infinite' : undefined,
        }}>
            {/* Target Handle for incoming edges (e.g., from trigger rule) */}
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                style={{ ...handleStyle, top: -4, borderColor: '#d9d9d9' }}
            />

            <div style={{
                padding: '0 12px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8
            }}>
                <PlayCircleOutlined style={{ color: statusColor || color, fontSize: 16, flexShrink: 0 }} />
                <Text style={{ fontSize: 13, userSelect: 'none', flex: 1 }}>开始</Text>
                {statusConfig && (
                    <span style={{ color: statusConfig.color, fontSize: 14, display: 'flex', flexShrink: 0 }}>
                        {statusConfig.icon}
                    </span>
                )}
            </div>

            <Handle
                type="source"
                position={Position.Bottom}
                id="default"
                isConnectable={isConnectable}
                style={{ ...handleStyle, bottom: -4 }}
            />
        </div>
    );
};

export default memo(StartNode);
