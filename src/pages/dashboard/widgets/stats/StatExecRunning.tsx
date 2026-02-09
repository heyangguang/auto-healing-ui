import { ThunderboltOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatExecRunning: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('execution');
    return (
        <WidgetWrapper title="运行中任务" icon={<ThunderboltOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.running ?? 0} suffix="个" description={`总记录 ${data?.runs_total ?? 0}`} color="#1677ff" />
        </WidgetWrapper>
    );
};
export default StatExecRunning;
