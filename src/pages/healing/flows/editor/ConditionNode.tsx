import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
import { Typography, Tooltip } from 'antd';
import { BranchesOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { STATUS_CONFIG, getCurrentNodeShadow, getNodeOutlineStyle, getActiveHandleStyle, getNodeHeaderBg } from './CustomNode';

const { Text } = Typography;

// 极简连接点
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
const NODE_HEADER_HEIGHT = 40;
const NODE_FOOTER_HEIGHT = 24;
const NODE_HEIGHT = NODE_HEADER_HEIGHT + NODE_FOOTER_HEIGHT;

const ConditionNode = ({ data, isConnectable, selected }: NodeProps) => {
    const status = data.status;
    const isCurrent = data.isCurrent;
    const color = '#722ed1';
    const statusConfig = status ? STATUS_CONFIG[status] : null;
    const statusColor = statusConfig?.color;
    const headerBg = getNodeHeaderBg(status);

    // 构建悬浮提示内容
    const tooltipContent = data.dryRunMessage ? (
        <div style={{ maxWidth: 300 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {statusConfig?.label || '条件判断'}
            </div>
            <div>{data.dryRunMessage}</div>
        </div>
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
                boxShadow: getCurrentNodeShadow(isCurrent, !!selected, color, statusColor),
                border: '1px solid #d9d9d9',
                borderLeft: `3px solid ${statusColor || color}`,
                transition: 'all 0.3s',
                overflow: 'hidden',
                animation: isCurrent ? 'currentNodePulse 2s ease-in-out infinite' : undefined,
                ...getNodeOutlineStyle(isCurrent, !!selected),
            }}>
                {/* 输入连接点 */}
                <Handle
                    type="target"
                    position={Position.Top}
                    isConnectable={isConnectable}
                    style={{ ...handleStyle, top: -4, borderColor: '#d9d9d9', ...getActiveHandleStyle('target', data.activeHandles, '#52c41a') }}
                />

                {/* 主内容 */}
                <div style={{
                    padding: '0 12px',
                    height: NODE_HEADER_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: headerBg,
                }}>
                    <BranchesOutlined style={{ fontSize: 16, color: statusColor || color, flexShrink: 0 }} />
                    <Text style={{ fontSize: 13, userSelect: 'none', flex: 1 }} ellipsis>
                        {data.label || '条件分支'}
                    </Text>
                    {statusConfig && (
                        <span style={{ color: statusConfig.color, fontSize: 14, display: 'flex', flexShrink: 0 }}>
                            {statusConfig.icon}
                        </span>
                    )}
                </div>

                {/* 极简底部出口 - 只有图标 */}
                <div style={{ height: NODE_FOOTER_HEIGHT, position: 'relative', borderTop: '1px solid #f5f5f5' }}>
                    {/* 满足 (✓) */}
                    <div style={{
                        position: 'absolute', left: 0, bottom: 0, width: '50%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRight: '1px solid #f5f5f5'
                    }}>
                        <CheckOutlined style={{ fontSize: 12, color: '#52c41a' }} />
                        <Handle
                            type="source"
                            position={Position.Bottom}
                            id="true"
                            style={{ ...handleStyle, borderColor: '#52c41a', bottom: -4, ...getActiveHandleStyle('true', data.activeHandles, '#52c41a') }}
                            isConnectable={isConnectable}
                        />
                    </div>

                    {/* 不满足 (✗) */}
                    <div style={{
                        position: 'absolute', right: 0, bottom: 0, width: '50%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <CloseOutlined style={{ fontSize: 12, color: '#ff4d4f' }} />
                        <Handle
                            type="source"
                            position={Position.Bottom}
                            id="false"
                            style={{ ...handleStyle, borderColor: '#ff4d4f', bottom: -4, ...getActiveHandleStyle('false', data.activeHandles, '#ff4d4f') }}
                            isConnectable={isConnectable}
                        />
                    </div>
                </div>
            </div>
        </Tooltip>
    );
};

export default memo(ConditionNode);
