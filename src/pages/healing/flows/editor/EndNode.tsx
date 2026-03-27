import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Typography } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import { STATUS_CONFIG, getCurrentNodeShadow, getNodeOutlineStyle, getActiveHandleStyle, getNodeHeaderBg } from './CustomNode';

const { Text } = Typography;

const handleStyle = {
    width: 6,
    height: 6,
    background: '#fff',
    border: '1px solid #999',
    borderRadius: '50%',
    zIndex: 10,
};

// 固定节点尺寸
const NODE_WIDTH = 160;
const NODE_HEIGHT = 40;

const EndNode = ({ data, isConnectable, selected }: NodeProps) => {
    const status = data.status;
    const color = '#ff4d4f';
    const statusConfig = status ? STATUS_CONFIG[status] : null;
    const statusColor = statusConfig?.color;
    const isCurrent = !!data.isCurrent;
    const headerBg = getNodeHeaderBg(status);

    // 当有 status 时用 status 颜色做左边框
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
                gap: 8,
                background: headerBg,
            }}>
                <StopOutlined style={{ color: statusColor || color, fontSize: 16, flexShrink: 0 }} />
                <Text style={{ fontSize: 13, userSelect: 'none', flex: 1 }}>结束</Text>
                {statusConfig && (
                    <span style={{ color: statusConfig.color, fontSize: 14, display: 'flex', flexShrink: 0 }}>
                        {statusConfig.icon}
                    </span>
                )}
            </div>
        </div>
    );
};

export default memo(EndNode);
