import { DisconnectOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatCMDBOffline: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('cmdb');
    return (
        <WidgetWrapper title="离线资产" icon={<DisconnectOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.offline ?? 0} suffix="台" description="当前离线状态" color="#ff4d4f" />
        </WidgetWrapper>
    );
};
export default StatCMDBOffline;
