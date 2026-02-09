import React, { useMemo } from 'react';
import { Tag, Tooltip, Space, Typography } from 'antd';
import { DesktopOutlined, ClusterOutlined } from '@ant-design/icons';

const { Text } = Typography;

interface HostListProps {
    hosts: string;
}

const HostList: React.FC<HostListProps> = ({ hosts }) => {
    const parsedHosts = useMemo(() => {
        if (!hosts) return [];
        // 支持逗号、换行分隔
        return hosts.split(/[,;\n\s]+/).filter(Boolean);
    }, [hosts]);

    if (parsedHosts.length === 0) {
        return <Text type="secondary">-</Text>;
    }

    // 如果主机数量过多，显示概要
    if (parsedHosts.length > 20) {
        return (
            <Space>
                <ClusterOutlined style={{ color: '#1890ff' }} />
                <Text strong>{parsedHosts.length}</Text>
                <Text>台主机</Text>
            </Space>
        );
    }

    return (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {parsedHosts.map((host, index) => (
                <Tooltip key={`${host}-${index}`} title={host}>
                    <Tag
                        icon={<DesktopOutlined />}
                        color="blue"
                        style={{
                            marginRight: 0,
                            fontFamily: 'monospace',
                            borderRadius: 2,
                        }}
                    >
                        {host.length > 20 ? `${host.slice(0, 18)}...` : host}
                    </Tag>
                </Tooltip>
            ))}
        </div>
    );
};

export default HostList;
