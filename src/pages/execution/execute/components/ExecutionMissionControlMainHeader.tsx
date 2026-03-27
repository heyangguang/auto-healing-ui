import React from 'react';
import { Space, Typography } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

interface ExecutionMissionControlMainHeaderProps {
    totalHostsCount: number;
    totalSecretsCount: number;
}

const ExecutionMissionControlMainHeader: React.FC<ExecutionMissionControlMainHeaderProps> = ({
    totalHostsCount,
    totalSecretsCount,
}) => (
    <div className="main-header">
        <Space align="center">
            <ThunderboltOutlined style={{ fontSize: 20, color: '#1890ff' }} />
            <Title level={4} style={{ margin: 0 }}>操作控制台</Title>
        </Space>
        <Space size="large">
            <Space>
                <Text type="secondary">HOSTS:</Text>
                <Text strong>{totalHostsCount}</Text>
            </Space>
            <Space>
                <Text type="secondary">SECRETS:</Text>
                <Text strong>{totalSecretsCount}</Text>
            </Space>
        </Space>
    </div>
);

export default ExecutionMissionControlMainHeader;
