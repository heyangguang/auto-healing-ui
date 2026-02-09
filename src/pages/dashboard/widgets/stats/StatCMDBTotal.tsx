import { DatabaseOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatCMDBTotal: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('cmdb');
    return (
        <WidgetWrapper title="资产总数" icon={<DatabaseOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.total ?? 0} suffix="台" description={`活跃 ${data?.active ?? 0} · 离线 ${data?.offline ?? 0}`} color="#1677ff" />
        </WidgetWrapper>
    );
};
export default StatCMDBTotal;
