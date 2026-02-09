import { BellOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatNotifChannels: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('notifications');
    return (
        <WidgetWrapper title="通知渠道" icon={<BellOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.channels_total ?? 0} suffix="个" description={`模板 ${data?.templates_total ?? 0} 个`} color="#1677ff" />
        </WidgetWrapper>
    );
};
export default StatNotifChannels;
