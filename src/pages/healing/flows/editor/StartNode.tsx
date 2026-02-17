import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { STATUS_CONFIG, getCurrentNodeShadow, getNodeOutlineStyle, getActiveHandleStyle } from './CustomNode';

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

    const effectiveColor = statusColor || color;

    return (
        <div style={{
            position: 'relative',
            width: NODE_WIDTH,
            height: NODE_HEIGHT,
            background: '#fff',
            borderRadius: 0,
            boxShadow: getCurrentNodeShadow(isCurrent, !!selected, color),
            border: '1px solid #d9d9d9',
            borderLeft: `3px solid ${effectiveColor}`,
            transition: 'all 0.3s',
            overflow: 'visible',
            animation: isCurrent && !statusColor ? 'currentNodePulse 2s ease-in-out infinite' : undefined,
            ...getNodeOutlineStyle(isCurrent, !!selected),
        }}>
            {/* Target Handle for incoming edges (e.g., from trigger rule) */}
            <Handle
                type="target"
                position={Position.Top}
                isConnectable={isConnectable}
                style={{ ...handleStyle, top: -4, borderColor: '#d9d9d9', ...getActiveHandleStyle('target', data.activeHandles, '#52c41a') }}
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
                style={{ ...handleStyle, bottom: -4, ...getActiveHandleStyle('default', data.activeHandles, '#52c41a') }}
            />
        </div>
    );
};

export default memo(StartNode);
