import { InboxOutlined } from '@ant-design/icons';
import React from 'react';

interface DashboardEmptyStateProps {
    description?: string;
    minHeight?: number | string;
}

const DashboardEmptyState: React.FC<DashboardEmptyStateProps> = ({
    description = '暂无数据',
    minHeight = 120,
}) => {
    return (
        <div
            style={{
                minHeight,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexDirection: 'column',
                gap: 10,
                color: '#bfbfbf',
                textAlign: 'center',
            }}
        >
            <InboxOutlined style={{ fontSize: 28, color: '#d9d9d9' }} />
            <span style={{ fontSize: 14, lineHeight: '22px' }}>{description}</span>
        </div>
    );
};

export default DashboardEmptyState;
