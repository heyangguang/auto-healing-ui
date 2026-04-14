import React from 'react';
import { Tag, Typography } from 'antd';
import {
    CATEGORY_LABELS,
    getSeverityText,
    INCIDENT_STATUS_MAP,
    SEVERITY_TAG_COLORS,
} from '@/constants/incidentDicts';
import JsonPrettyView from '../components/JsonPrettyView';

type DetailField = {
    fullWidth?: boolean;
    label: string;
    value: React.ReactNode;
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const stripSimpleHtml = (value: string) => value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

const formatString = (value: string) => (
    /<[^>]+>/.test(value) ? stripSimpleHtml(value) || value : value
);

const formatText = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    if (typeof value === 'boolean') {
        return value ? '是' : '否';
    }
    if (typeof value === 'string') {
        return formatString(value);
    }
    return String(value);
};

const formatPriority = (value: unknown) => {
    const text = formatText(value);
    if (text === '-') {
        return text;
    }
    return /^P/i.test(text) ? text : `P${text}`;
};

const renderSeverityTag = (severity: unknown) => {
    const value = formatText(severity);
    return <Tag color={SEVERITY_TAG_COLORS[value] || 'default'}>{getSeverityText(value)}</Tag>;
};

const renderStatusTag = (status: unknown) => {
    const value = formatText(status);
    const config = INCIDENT_STATUS_MAP[value];
    return <Tag color={config?.color || 'default'}>{config?.text || value}</Tag>;
};

const buildBasicFields = (incident: Record<string, unknown>): DetailField[] => [
    {
        fullWidth: true,
        label: '工单标题',
        value: <Typography.Text strong>{formatText(incident.title)}</Typography.Text>,
    },
    { label: '工单编号', value: formatText(incident.external_id || incident.id) },
    { label: '工单状态', value: renderStatusTag(incident.status) },
    { label: '工单等级', value: renderSeverityTag(incident.severity) },
    { label: '优先级', value: formatPriority(incident.priority) },
    { label: '分类', value: CATEGORY_LABELS[String(incident.category || '')] || formatText(incident.category) },
    { label: '影响 CI', value: formatText(incident.affected_ci) },
    { label: '影响服务', value: formatText(incident.affected_service) },
];

const buildSourceFields = (incident: Record<string, unknown>): DetailField[] => [
    { label: '来源系统', value: formatText(incident.source_plugin_name) },
    { label: '报告人', value: formatText(incident.reporter) },
    { label: '处理人', value: formatText(incident.assignee) },
    { label: '当前状态', value: renderStatusTag(incident.status) },
];

const buildSummaryText = (incident: Record<string, unknown>) => [
    incident.external_id ? `工单编号：${formatText(incident.external_id)}` : '',
    incident.source_plugin_name ? `来源系统：${formatText(incident.source_plugin_name)}` : '',
    incident.affected_ci ? `影响 CI：${formatText(incident.affected_ci)}` : '',
]
    .filter(Boolean)
    .join('   ');

const DetailCard: React.FC<{ children: React.ReactNode; title: string }> = ({ children, title }) => (
    <section className="instance-context-card">
        <div className="instance-context-card-header">
            <span className="instance-context-card-title">{title}</span>
        </div>
        <div className="instance-context-card-body">{children}</div>
    </section>
);

const DetailGrid: React.FC<{ fields: DetailField[] }> = ({ fields }) => (
    <div className="instance-context-grid">
        {fields.map((field) => (
            <div
                className={`instance-context-field${field.fullWidth ? ' instance-context-field-full' : ''}`}
                key={field.label}
            >
                <span className="instance-context-field-label">{field.label}</span>
                <div className="instance-context-field-value">{field.value}</div>
            </div>
        ))}
    </div>
);

type InstanceContextIncidentTabProps = {
    incident: Record<string, unknown>;
};

const InstanceContextIncidentTab: React.FC<InstanceContextIncidentTabProps> = ({ incident }) => {
    const description = typeof incident.description === 'string' ? formatString(incident.description) : '';
    const summaryText = buildSummaryText(incident);
    const hasRawData = (
        (Array.isArray(incident.raw_data) && incident.raw_data.length > 0)
        || (isRecord(incident.raw_data) && Object.keys(incident.raw_data).length > 0)
    );

    return (
        <div className="instance-context-panel">
            <div className="instance-context-stack">
                <section className="instance-context-summary">
                    <div className="instance-context-summary-top">
                        <div className="instance-context-summary-main">
                            <div className="instance-context-summary-title">{formatText(incident.title)}</div>
                            {summaryText && (
                                <div className="instance-context-summary-sub">{summaryText}</div>
                            )}
                        </div>
                        <div className="instance-context-summary-tags">
                            {renderStatusTag(incident.status)}
                            {renderSeverityTag(incident.severity)}
                            <Tag>{formatPriority(incident.priority)}</Tag>
                        </div>
                    </div>
                </section>

                <DetailCard title="基本信息">
                    <DetailGrid fields={buildBasicFields(incident)} />
                </DetailCard>

                <DetailCard title="协同信息">
                    <DetailGrid fields={buildSourceFields(incident)} />
                </DetailCard>

                {description && (
                    <DetailCard title="描述">
                        <div className="instance-context-description">{description}</div>
                    </DetailCard>
                )}

                {hasRawData && (
                    <DetailCard title="原始数据">
                        <JsonPrettyView data={incident.raw_data} />
                    </DetailCard>
                )}
            </div>
        </div>
    );
};

export default InstanceContextIncidentTab;
