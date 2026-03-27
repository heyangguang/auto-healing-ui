import { DeploymentUnitOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatInstanceTotal: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('healing');
    const total = data?.instances_total ?? 0;
    return (
        <WidgetWrapper title="自愈实例总数" icon={<DeploymentUnitOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={total} suffix="个" description={`运行中 ${data?.instances_running ?? 0}`} color="#722ed1" />
        </WidgetWrapper>
    );
};
export default StatInstanceTotal;
