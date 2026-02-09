import { EyeInvisibleOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatIncidentUnscanned: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('incidents');
    return (
        <WidgetWrapper title="未扫描工单" icon={<EyeInvisibleOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.unscanned ?? 0} suffix="条" description="尚未被规则扫描" color="#8c8c8c" />
        </WidgetWrapper>
    );
};
export default StatIncidentUnscanned;
