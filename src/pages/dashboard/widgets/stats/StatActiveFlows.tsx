import { ForkOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getFlowStats } from '@/services/auto-healing/healing';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatActiveFlows: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(() => getFlowStats());
    const data = rawData as any;
    const statsData = data?.data ?? data ?? {};
    const totalFlows = statsData.total ?? 0;
    const activeFlows = statsData.active ?? 0;
    return (
        <WidgetWrapper title="活跃流程数" icon={<ForkOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={activeFlows} suffix={`/ ${totalFlows}`} description="已激活 / 总流程数" color="#2f54eb" />
        </WidgetWrapper>
    );
};
export default StatActiveFlows;
