import React from 'react';
import { Divider, Tag, Typography } from 'antd';
import { ClusterOutlined } from '@ant-design/icons';
import HostSelector from '@/components/HostSelector';
import HostList from './HostList';

const { Text } = Typography;

interface ExecutionMissionControlTargetsCardProps {
    additionalHosts: string[];
    targetHosts?: string;
    templateHosts: string[];
    onAdditionalHostsChange: (hosts: string[]) => void;
}

const ExecutionMissionControlTargetsCard: React.FC<ExecutionMissionControlTargetsCardProps> = ({
    additionalHosts,
    targetHosts,
    templateHosts,
    onAdditionalHostsChange,
}) => (
    <div className="industrial-dashed-box" style={{ height: '100%' }}>
        <div className="industrial-dashed-box-title">
            <span><ClusterOutlined /> 目标主机 (Target Hosts)</span>
            <Tag color="blue">Merge Mode</Tag>
        </div>

        <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>模板预设:</Text>
            <HostList hosts={targetHosts || ''} />
        </div>

        <Divider style={{ margin: '8px 0' }} dashed />

        <Text type="secondary" style={{ fontSize: 12, marginBottom: 4, display: 'block' }}>临时追加:</Text>
        <HostSelector
            value={additionalHosts}
            onChange={onAdditionalHostsChange}
            excludeHosts={templateHosts}
        />
    </div>
);

export default ExecutionMissionControlTargetsCard;
