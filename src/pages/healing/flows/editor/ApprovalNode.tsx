import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Typography, Tooltip } from 'antd';
import { AuditOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';
import { STATUS_CONFIG, getCurrentNodeShadow } from './CustomNode';

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
const NODE_HEADER_HEIGHT = 40;
const NODE_FOOTER_HEIGHT = 24;
const NODE_HEIGHT = NODE_HEADER_HEIGHT + NODE_FOOTER_HEIGHT;

const ApprovalNode = ({ data, isConnectable, selected }: NodeProps) => {
    const status = data.status;
    const color = '#faad14';
    const statusConfig = status ? STATUS_CONFIG[status] : null;
    const statusColor = statusConfig?.color;
    const isCurrent = !!data.isCurrent;

    // 构建悬浮提示内容
    const tooltipContent = data.dryRunMessage ? (
        <div style={{ maxWidth: 300 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {statusConfig?.label || '审批状态'}
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
                boxShadow: getCurrentNodeShadow(isCurrent, !!selected, color),
                border: isCurrent ? '2px solid #1890ff' : '1px solid #d9d9d9',
                borderLeft: `3px solid ${statusColor || color}`,
                transition: 'all 0.3s',
                overflow: 'hidden',
                animation: isCurrent ? 'currentNodePulse 2s ease-in-out infinite' : undefined,
            }}>
                <Handle
                    type="target"
                    position={Position.Top}
                    isConnectable={isConnectable}
                    style={{ ...handleStyle, top: -4, borderColor: '#d9d9d9' }}
                />

                <div style={{
                    padding: '0 12px',
                    height: NODE_HEADER_HEIGHT,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    <AuditOutlined style={{ fontSize: 16, color: statusColor || color, flexShrink: 0 }} />
                    <Text style={{ fontSize: 13, userSelect: 'none', flex: 1 }} ellipsis>
                        {data.label || '人工审批'}
                    </Text>
                    {statusConfig && (
                        <span style={{ color: statusConfig.color, fontSize: 14, display: 'flex', flexShrink: 0 }}>
                            {statusConfig.icon}
                        </span>
                    )}
                </div>

                <div style={{ height: NODE_FOOTER_HEIGHT, position: 'relative', borderTop: '1px solid #f5f5f5' }}>
                    {/* 通过 */}
                    <div style={{
                        position: 'absolute', left: 0, bottom: 0, width: '50%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        borderRight: '1px solid #f5f5f5'
                    }}>
                        <CheckOutlined style={{ fontSize: 12, color: '#52c41a' }} />
                        <Handle
                            type="source"
                            position={Position.Bottom}
                            id="approved"
                            style={{ ...handleStyle, borderColor: '#52c41a', bottom: -4 }}
                            isConnectable={isConnectable}
                        />
                    </div>
                    {/* 拒绝 */}
                    <div style={{
                        position: 'absolute', right: 0, bottom: 0, width: '50%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                        <CloseOutlined style={{ fontSize: 12, color: '#ff4d4f' }} />
                        <Handle
                            type="source"
                            position={Position.Bottom}
                            id="rejected"
                            style={{ ...handleStyle, borderColor: '#ff4d4f', bottom: -4 }}
                            isConnectable={isConnectable}
                        />
                    </div>
                </div>
            </div>
        </Tooltip>
    );
};

export default memo(ApprovalNode);
