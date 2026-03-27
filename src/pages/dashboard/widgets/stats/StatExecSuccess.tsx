import { CheckCircleOutlined } from '@ant-design/icons';
import React from 'react';
import { useDashboardSection } from '../useDashboardSection';
import WidgetWrapper from '../WidgetWrapper';
import type { WidgetComponentProps } from '../widgetRegistry';
import StatCardContent from './StatCardContent';

const StatExecSuccess: React.FC<WidgetComponentProps> = ({ isEditing, onRemove }) => {
    const { data, loading, refresh } = useDashboardSection('execution');
    const total = Number(data?.runs_total ?? 0);
    const running = Number(data?.running ?? 0);
    const rate = Number(data?.success_rate ?? 0).toFixed(1);
    return (
        <WidgetWrapper title="执行成功率" icon={<CheckCircleOutlined />} loading={loading} onRefresh={refresh} isEditing={isEditing} onRemove={onRemove}>
            <StatCardContent
                value={rate}
                suffix="%"
                description={`运行中 ${running} / 总计 ${total}`}
                color={Number(rate) >= 80 ? '#52c41a' : '#faad14'}
            />
        </WidgetWrapper>
    );
};
export default StatExecSuccess;
