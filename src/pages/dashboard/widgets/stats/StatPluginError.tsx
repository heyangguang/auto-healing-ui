import { BugOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatPluginError: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('plugins');
    return (
        <WidgetWrapper title="异常插件" icon={<BugOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.error ?? 0} suffix="个" description={`总计 ${data?.total ?? 0} · 活跃 ${data?.active ?? 0}`} color="#ff4d4f" />
        </WidgetWrapper>
    );
};
export default StatPluginError;
