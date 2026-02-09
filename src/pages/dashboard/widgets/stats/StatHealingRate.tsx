import { HeartOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import React from 'react';
import { getIncidentStats } from '@/services/auto-healing/incidents';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatHealingRate: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data: rawData, loading, refresh } = useRequest(getIncidentStats, { formatResult: (r: any) => r });
    const data = rawData as any;
    const healed = data?.healed ?? 0;
    const total = (data?.healed ?? 0) + (data?.failed ?? 0);
    const rate = total > 0 ? ((healed / total) * 100).toFixed(1) : '0.0';
    return (
        <WidgetWrapper title="自愈成功率" icon={<HeartOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent
                value={rate}
                suffix="%"
                description={`成功 ${healed} · 失败 ${data?.failed ?? 0}`}
                color={Number(rate) >= 50 ? '#52c41a' : '#faad14'}
            />
        </WidgetWrapper>
    );
};
export default StatHealingRate;
