import { ApiOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatPluginCount: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('plugins');
    const total = data?.total ?? 0;
    const active = data?.active ?? 0;
    return (
        <WidgetWrapper title="插件数量" icon={<ApiOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={total} suffix="个" description={`活跃 ${active}`} color="#531dab" />
        </WidgetWrapper>
    );
};
export default StatPluginCount;
