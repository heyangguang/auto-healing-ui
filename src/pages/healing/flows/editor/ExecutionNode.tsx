import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Typography, Tooltip } from 'antd';
import {
    CodeOutlined, CheckOutlined, CloseOutlined,
    ExclamationCircleOutlined
} from '@ant-design/icons';
import { STATUS_CONFIG, getCurrentNodeShadow, getNodeOutlineStyle, getActiveHandleStyle, getNodeHeaderBg } from './CustomNode';
import { getNodeTypeColor } from '../../nodeConfig';

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
const NODE_WIDTH = 180;
const NODE_HEADER_HEIGHT = 40;
const NODE_FOOTER_HEIGHT = 24;
const NODE_HEIGHT = NODE_HEADER_HEIGHT + NODE_FOOTER_HEIGHT;

const ExecutionNode = ({ data, isConnectable, selected }: NodeProps) => {
    const status = data.status;
    const color = getNodeTypeColor('execution');
    const statusConfig = status ? STATUS_CONFIG[status] : null;
    const statusColor = statusConfig?.color;
    const isCurrent = !!data.isCurrent;
    const headerBg = getNodeHeaderBg(status);

    const tooltipContent = data.dryRunMessage ? (
        <div style={{ maxWidth: 300 }}>{data.dryRunMessage}</div>
    ) : null;

    return (
        <Tooltip
            title={tooltipContent}
            placement="right"
            mouseEnterDelay={0.3}
        >
            <div style={{
                position: 'relative',
                width: NODE_WIDTH,
                height: NODE_HEIGHT,
                background: '#fff',
                borderRadius: 0,
                boxShadow: getCurrentNodeShadow(isCurrent, !!selected, color),
                border: '1px solid #d9d9d9',
                borderLeft: `3px solid ${statusColor || color}`,
                transition: 'all 0.3s',
                animation: isCurrent ? 'currentNodePulse 2s ease-in-out infinite' : undefined,
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
                    height: NODE_HEADER_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: headerBg,
                }}>
                    <CodeOutlined style={{ fontSize: 16, color: statusColor || color, flexShrink: 0 }} />
                    <Text style={{ fontSize: 13, userSelect: 'none', flex: 1 }} ellipsis>
                        {data.label || '任务执行'}
                    </Text>
                    {statusConfig && (
                        <span style={{ color: statusConfig.color, fontSize: 14, display: 'flex', flexShrink: 0 }}>
                            {statusConfig.icon}
                        </span>
                    )}
                </div>

                <div style={{
                    height: NODE_FOOTER_HEIGHT,
                    display: 'flex',
                    borderTop: '1px solid #f0f0f0'
                }}>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid #f0f0f0', position: 'relative' }}>
                        <CheckOutlined style={{ fontSize: 12, color: '#52c41a' }} />
                        <Handle type="source" position={Position.Bottom} id="success" isConnectable={isConnectable} style={{ ...handleStyle, borderColor: '#52c41a', bottom: -4, ...getActiveHandleStyle('success', data.activeHandles, '#52c41a') }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', borderRight: '1px solid #f0f0f0', position: 'relative' }}>
                        <ExclamationCircleOutlined style={{ fontSize: 12, color: '#faad14' }} />
                        <Handle type="source" position={Position.Bottom} id="partial" isConnectable={isConnectable} style={{ ...handleStyle, borderColor: '#faad14', bottom: -4, ...getActiveHandleStyle('partial', data.activeHandles, '#faad14') }} />
                    </div>
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', position: 'relative' }}>
                        <CloseOutlined style={{ fontSize: 12, color: '#ff4d4f' }} />
                        <Handle type="source" position={Position.Bottom} id="failed" isConnectable={isConnectable} style={{ ...handleStyle, borderColor: '#ff4d4f', bottom: -4, ...getActiveHandleStyle('failed', data.activeHandles, '#ff4d4f') }} />
                    </div>
                </div>
            </div>
        </Tooltip>
    );
};

export default memo(ExecutionNode);
