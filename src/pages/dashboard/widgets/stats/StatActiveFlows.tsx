import { ForkOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatActiveFlows: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    const totalFlows = data?.flows_total ?? 0;
    const activeFlows = data?.flows_active ?? 0;
    return (
        <WidgetWrapper title="活跃流程数" icon={<ForkOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={activeFlows} suffix={`/ ${totalFlows}`} description="已激活 / 总流程数" color="#2f54eb" />
        </WidgetWrapper>
    );
};
export default StatActiveFlows;
