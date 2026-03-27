import React from 'react';
import { Tag } from 'antd';
import {
    EyeOutlined,
    InfoCircleOutlined,
    NodeIndexOutlined,
    PlayCircleOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import { NODE_TYPE_COLORS } from '../../nodeConfig';
import { INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';
import { NODE_TYPE_LABELS } from '../utils/canvasBuilder';

type NodeDetailDrawerHeaderProps = {
    selectedNodeData?: {
        id?: string;
        name?: string;
        status?: string;
        type?: string;
        state?: {
            status?: string;
        };
    } | null;
};

const getStatusColor = (status?: string, nodeType?: string) => {
    const nodeTypeColor = NODE_TYPE_COLORS[nodeType || ''] || '#8c8c8c';
    if (status === 'success' || status === 'completed' || status === 'approved') return '#52c41a';
    if (status === 'failed' || status === 'error' || status === 'rejected') return '#ff4d4f';
    if (status === 'running') return '#1890ff';
    if (status === 'waiting_approval') return '#faad14';
    if (status === 'skipped') return '#8c8c8c';
    if (status === 'triggered') return '#722ed1';
    return nodeTypeColor;
};

const getNodeIcon = (nodeType?: string) => {
    if (nodeType === 'execution') return <PlayCircleOutlined />;
    if (nodeType === 'approval') return <EyeOutlined />;
    if (nodeType === 'condition') return <NodeIndexOutlined />;
    if (nodeType === 'trigger') return <ThunderboltOutlined />;
    return <InfoCircleOutlined />;
};

const NodeDetailDrawerHeader: React.FC<NodeDetailDrawerHeaderProps> = ({
    selectedNodeData,
}) => {
    const status = selectedNodeData?.state?.status || selectedNodeData?.status;
    const nodeType = selectedNodeData?.type;
    const statusColor = getStatusColor(status, nodeType);

    return (
        <div style={{ background: `linear-gradient(135deg, ${statusColor}12 0%, #ffffff 100%)`, padding: '20px 24px', borderBottom: `2px solid ${statusColor}30` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${statusColor}12`, border: `1px solid ${statusColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: statusColor }}>
                    {getNodeIcon(nodeType)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 16, fontWeight: 600, color: '#262626' }}>{selectedNodeData?.name || selectedNodeData?.id || '-'}</span>
                        {status && (
                            <Tag color={status === 'success' || status === 'completed' || status === 'approved' ? 'success' : status === 'failed' || status === 'error' || status === 'rejected' ? 'error' : status === 'running' ? 'processing' : status === 'waiting_approval' ? 'warning' : 'default'} style={{ borderRadius: 4, fontSize: 12 }}>
                                {INSTANCE_STATUS_LABELS[status] || status}
                            </Tag>
                        )}
                    </div>
                    <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 2 }}>
                        {NODE_TYPE_LABELS[nodeType || ''] || nodeType || '未知'} · {selectedNodeData?.id || '-'}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NodeDetailDrawerHeader;
