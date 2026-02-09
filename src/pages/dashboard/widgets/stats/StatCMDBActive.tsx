import { DatabaseOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatCMDBActive: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('cmdb');
    const total = data?.total ?? 0;
    const active = data?.by_status?.find((s: any) => s.status === 'active')?.count ?? 0;
    const rate = total > 0 ? ((active / total) * 100).toFixed(1) : '0.0';
    return (
        <WidgetWrapper title="资产活跃率" icon={<DatabaseOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent
                value={rate}
                suffix="%"
                description={`活跃 ${active} / 总计 ${total}`}
                color="#1677ff"
            />
        </WidgetWrapper>
    );
};
export default StatCMDBActive;
