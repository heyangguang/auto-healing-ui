import { NodeIndexOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatHealingFlows: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    return (
        <WidgetWrapper title="流程总数" icon={<NodeIndexOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.flows_total ?? 0} suffix="个" description={`活跃 ${data?.flows_active ?? 0}`} color="#722ed1" />
        </WidgetWrapper>
    );
};
export default StatHealingFlows;
