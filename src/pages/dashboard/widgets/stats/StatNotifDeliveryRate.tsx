import { MailOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatNotifDeliveryRate: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('notifications');
    return (
        <WidgetWrapper title="通知送达率" icon={<MailOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={Number(data?.delivery_rate ?? 0).toFixed(1)} suffix="%" description={`总发送 ${data?.logs_total ?? 0}`} color="#52c41a" />
        </WidgetWrapper>
    );
};
export default StatNotifDeliveryRate;
