import React, { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Typography, Tooltip } from 'antd';
import {
    CloudServerOutlined,
    SafetyCertificateOutlined,
    FunctionOutlined,
    BellOutlined,
    AppstoreOutlined,
    LoadingOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    ClockCircleOutlined,
    ExclamationCircleOutlined,
    StopOutlined,
    HourglassOutlined,
    CalculatorOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';

const { Text } = Typography;

const handleStyle = {
    width: 6,
    height: 6,
    background: '#fff',
    border: '1px solid #999',
    borderRadius: '50%',
    zIndex: 10,
};

// 节点类型配置
const nodeConfigs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    host_extractor: { color: '#1890ff', icon: <CloudServerOutlined />, label: '主机提取' },
    cmdb_validator: { color: '#13c2c2', icon: <SafetyCertificateOutlined />, label: 'CMDB验证' },
    set_variable: { color: '#eb2f96', icon: <FunctionOutlined />, label: '设置变量' },
    compute: { color: '#2f54eb', icon: <CalculatorOutlined />, label: '计算节点' },
    notification: { color: '#52c41a', icon: <BellOutlined />, label: '发送通知' },
    trigger: { color: '#722ed1', icon: <ThunderboltOutlined />, label: '自愈规则' },
    default: { color: '#8c8c8c', icon: <AppstoreOutlined />, label: '节点' },
};

// 节点状态配置（包含实际执行和 Dry-Run 模拟状态）
export const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    // 通用状态
    pending: { color: '#d9d9d9', icon: <ClockCircleOutlined />, label: '等待中' },
    running: { color: '#1890ff', icon: <LoadingOutlined spin />, label: '执行中' },
    success: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '成功' },
    ok: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '成功' },
    partial: { color: '#faad14', icon: <ExclamationCircleOutlined />, label: '部分成功' },
    failed: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '失败' },
    error: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '失败' },
    skipped: { color: '#bfbfbf', icon: <StopOutlined />, label: '已跳过' },
    waiting_approval: { color: '#fa8c16', icon: <HourglassOutlined />, label: '等待审批' },
    completed: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已完成' },
    // 规则触发状态 - 用于标记流程外部触发源
    triggered: { color: '#722ed1', icon: <ThunderboltOutlined />, label: '已触发' },
    // Dry-Run 模拟状态
    simulated: { color: '#13c2c2', icon: <CheckCircleOutlined />, label: '模拟通过' },
    would_execute: { color: '#722ed1', icon: <CheckCircleOutlined />, label: '将会执行' },
    would_send: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '将会发送' },
};

/** 获取当前执行节点的高亮 boxShadow */
export function getCurrentNodeShadow(isCurrent: boolean, selected: boolean, baseColor: string, statusColor?: string): string {
    if (isCurrent) {
        const glowColor = statusColor || '#1890ff';
        return `0 0 0 2px ${glowColor}40, 0 4px 16px ${glowColor}30`;
    }
    if (selected) return `0 0 0 1px ${baseColor}`;
    return '0 2px 6px rgba(0,0,0,0.04)';
}

// 固定节点尺寸
const NODE_WIDTH = 160;
const TRIGGER_NODE_WIDTH = 220; // 自愈规则节点更宽
const NODE_HEIGHT = 40;

const CustomNode = ({ data, isConnectable, selected }: NodeProps) => {
    const nodeType = data.type || 'default';
    const config = nodeConfigs[nodeType] || nodeConfigs.default;
    const status = data.status;
    const statusConfig = status ? STATUS_CONFIG[status] : null;
    const statusColor = statusConfig?.color;
    const isCurrent = !!data.isCurrent;

    // 自愈规则节点使用更宽的宽度
    const nodeWidth = nodeType === 'trigger' ? TRIGGER_NODE_WIDTH : NODE_WIDTH;

    // 构建悬浮提示内容
    const tooltipContent = data.dryRunMessage ? (
        <div style={{ maxWidth: 300 }}>
            <div style={{ fontWeight: 'bold', marginBottom: 4 }}>
                {statusConfig?.label || '状态'}
            </div>
            <div>{data.dryRunMessage}</div>
        </div>
    ) : null;

    // 当有 status 时，isCurrent 高亮用 status 颜色，不用蓝色
    const effectiveHighlight = statusColor || config.color;
    const currentBorder = isCurrent
        ? (statusColor ? `2px solid ${statusColor}` : '2px solid #1890ff')
        : '1px solid #d9d9d9';

    return (
        <Tooltip
            title={tooltipContent}
            placement="right"
            mouseEnterDelay={0.3}
        >
            <div style={{
                position: 'relative',
                width: nodeWidth,
                height: NODE_HEIGHT,
                background: '#fff',
                borderRadius: 0,
                boxShadow: getCurrentNodeShadow(isCurrent, !!selected, config.color, statusColor),
                border: currentBorder,
                borderLeft: `3px solid ${statusColor || config.color}`,
                transition: 'all 0.3s',
                overflow: 'hidden',
                animation: isCurrent && !statusColor ? 'currentNodePulse 2s ease-in-out infinite' : undefined,
            }}>
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
                    <span style={{ fontSize: 16, color: statusColor || config.color, display: 'flex', flexShrink: 0 }}>
                        {config.icon}
                    </span>
                    <Text style={{ fontSize: 13, userSelect: 'none', flex: 1 }} ellipsis>
                        {data.label || config.label}
                    </Text>
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
                    style={{ ...handleStyle, bottom: -4, borderColor: config.color }}
                />
            </div>
        </Tooltip>
    );
};

export default memo(CustomNode);
