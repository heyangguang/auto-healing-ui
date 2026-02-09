import { KeyOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatSecrets: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('secrets');
    return (
        <WidgetWrapper title="密钥源" icon={<KeyOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent value={data?.total ?? 0} suffix="个" description={`活跃 ${data?.active ?? 0}`} color="#eb2f96" />
        </WidgetWrapper>
    );
};
export default StatSecrets;
