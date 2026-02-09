import { ToolOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatCMDBMaintenance: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('cmdb');
    return (
        <WidgetWrapper title="维护中资产" icon={<ToolOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.maintenance ?? 0} suffix="台" description={`离线 ${data?.offline ?? 0}`} color="#fa8c16" />
        </WidgetWrapper>
    );
};
export default StatCMDBMaintenance;
