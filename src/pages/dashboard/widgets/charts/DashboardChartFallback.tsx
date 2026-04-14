import { LoadingOutlined } from '@ant-design/icons';
import React from 'react';
import DashboardEmptyState from '../DashboardEmptyState';

type DashboardChartFallbackProps = {
    hasData: boolean;
};

export const DASHBOARD_CHART_CONTAINER_STYLE: React.CSSProperties = {
    width: '100%',
    flex: 1,
    minHeight: 0,
    overflow: 'hidden',
};

const fallbackWrapperStyle: React.CSSProperties = {
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
};

const loadingInlineStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    color: '#8c8c8c',
    fontSize: 13,
};

const DashboardChartFallback: React.FC<DashboardChartFallbackProps> = ({ hasData }) => {
    if (!hasData) {
        return (
            <div style={fallbackWrapperStyle}>
                <DashboardEmptyState minHeight="100%" />
            </div>
        );
    }

    return (
        <div style={fallbackWrapperStyle}>
            <div style={loadingInlineStyle}>
                <LoadingOutlined spin />
                <span>图表加载中</span>
            </div>
        </div>
    );
};

export default DashboardChartFallback;
