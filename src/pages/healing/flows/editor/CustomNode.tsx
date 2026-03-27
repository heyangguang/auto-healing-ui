import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from 'reactflow';
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
import { NODE_TYPE_COLORS } from '../../nodeConfig';

// 节点类型配置
const nodeConfigs: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    host_extractor: { color: NODE_TYPE_COLORS.host_extractor, icon: <CloudServerOutlined />, label: '主机提取' },
    cmdb_validator: { color: NODE_TYPE_COLORS.cmdb_validator, icon: <SafetyCertificateOutlined />, label: 'CMDB验证' },
    set_variable: { color: NODE_TYPE_COLORS.set_variable, icon: <FunctionOutlined />, label: '设置变量' },
    compute: { color: NODE_TYPE_COLORS.compute, icon: <CalculatorOutlined />, label: '计算节点' },
    notification: { color: NODE_TYPE_COLORS.notification, icon: <BellOutlined />, label: '发送通知' },
    trigger: { color: NODE_TYPE_COLORS.trigger, icon: <ThunderboltOutlined />, label: '自愈规则' },
    default: { color: '#8c8c8c', icon: <AppstoreOutlined />, label: '节点' },
};

// 节点状态配置（包含实际执行和 Dry-Run 模拟状态）
export const STATUS_CONFIG: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    // 通用状态
    approved: { color: '#52c41a', icon: <CheckCircleOutlined />, label: '已通过' },
    rejected: { color: '#ff4d4f', icon: <CloseCircleOutlined />, label: '已拒绝' },
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

/** 获取当前执行节点的高亮 boxShadow — 仅 current_node_id 触发 */
export function getCurrentNodeShadow(isCurrent: boolean, _selected: boolean, _baseColor: string, _statusColor?: string): string {
    if (isCurrent) return '0 0 0 3px #1677ff, 0 0 20px rgba(22, 119, 255, 0.40)';
    return '0 1px 4px rgba(0,0,0,0.06)';
}

/** 获取当前节点的边框覆盖 — 仅 current_node_id 触发蓝色边框 */
export function getNodeOutlineStyle(isCurrent: boolean, _selected: boolean): React.CSSProperties {
    if (isCurrent) {
        return {
            border: '1.5px solid #1677ff',
            borderLeft: '3px solid #1677ff',
        };
    }
    return {};
}

/**
 * 获取活跃连接点的增强样式 — 蓝色光晕 + 呼吸动画
 */
export function getActiveHandleStyle(
    handleId: string,
    activeHandles: string[] | undefined,
    _color: string = '#52c41a',
): React.CSSProperties {
    if (!activeHandles || !activeHandles.includes(handleId)) return {};
    return {
        width: 8,
        height: 8,
        background: '#fff',
        borderColor: '#1677ff',
        borderWidth: 2,
        boxShadow: '0 0 4px 1px rgba(22, 119, 255, 0.5)',
        animation: 'handlePulse 2s ease-in-out infinite',
    };
}

/**
 * 获取统一的节点标题栏状态背景色
 */
export function getNodeHeaderBg(status?: string): string {
    if (status === 'failed' || status === 'error' || status === 'rejected') return '#fff1f0';
    if (status === 'partial') return '#fffbe6';
    if (status === 'completed' || status === 'success' || status === 'approved' || status === 'ok') return '#f6ffed';
    return '#fff';
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
    const headerBg = getNodeHeaderBg(status);

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
                border: '1px solid #d9d9d9',
                borderLeft: `3px solid ${statusColor || config.color}`,
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
                    gap: 6,
                    background: headerBg,
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
                    style={{ ...handleStyle, bottom: -4, borderColor: config.color, ...getActiveHandleStyle('default', data.activeHandles, '#52c41a') }}
                />
            </div>
        </Tooltip>
    );
};

export default memo(CustomNode);
