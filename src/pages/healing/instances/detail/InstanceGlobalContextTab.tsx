import React from 'react';
import { Empty, Tag, Typography } from 'antd';
import JsonPrettyView from '../components/JsonPrettyView';
import { CONTEXT_LABELS } from './detailConstants';

type DetailField = {
    fullWidth?: boolean;
    label: string;
    value: React.ReactNode;
};

type ScalarValue = string | number | boolean | null | undefined;

const PRIORITY_KEYS = [
    'status',
    'message',
    'error_message',
    'target_hosts',
    'host_count',
    'started_at',
    'finished_at',
    'duration_ms',
    'task_id',
    'run_id',
];

const HIDDEN_KEYS = new Set([
    'incident',
    'execution_result',
    'rule',
    'raw_data',
]);

const INCIDENT_SUMMARY_LABELS: Record<string, string> = {
    title: '工单标题',
    status: '工单状态',
    severity: '工单等级',
    affected_ci: '影响 CI',
    affected_service: '影响服务',
};

const isRecord = (value: unknown): value is Record<string, unknown> => (
    Boolean(value) && typeof value === 'object' && !Array.isArray(value)
);

const isScalar = (value: unknown): value is ScalarValue => (
    value == null || ['string', 'number', 'boolean'].includes(typeof value)
);

const isScalarArray = (value: unknown): value is ScalarValue[] => (
    Array.isArray(value) && value.every(isScalar)
);

const stripSimpleHtml = (value: string) => value
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<p>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();

const formatDateTime = (value: string) => {
    const timestamp = Date.parse(value);
    if (Number.isNaN(timestamp)) {
        return value;
    }
    return new Date(timestamp).toLocaleString('zh-CN');
};

const formatText = (value: unknown) => {
    if (value === null || value === undefined || value === '') {
        return '-';
    }
    if (typeof value === 'boolean') {
        return value ? '是' : '否';
    }
    if (typeof value === 'string') {
        const normalized = /<[^>]+>/.test(value) ? stripSimpleHtml(value) || value : value;
        return /\d{4}-\d{2}-\d{2}T/.test(normalized) ? formatDateTime(normalized) : normalized;
    }
    return String(value);
};

const toLabel = (key: string) => CONTEXT_LABELS[key] || key.replace(/_/g, ' ');

const formatScalarArray = (items: ScalarValue[]) => (
    <div className="instance-context-chip-list">
        {items.map((item, index) => (
            <span className="instance-context-chip" key={`${String(item)}-${index}`}>
                {formatText(item)}
            </span>
        ))}
    </div>
);

const renderValue = (value: unknown) => {
    if (isScalarArray(value)) {
        return formatScalarArray(value);
    }
    return formatText(value);
};

const createField = (label: string, value: unknown, fullWidth = false): DetailField => ({
    fullWidth,
    label,
    value: renderValue(value),
});

const collectTopLevelFields = (contextData: Record<string, unknown>): DetailField[] => {
    const entries = Object.entries(contextData)
        .filter(([key, value]) => !HIDDEN_KEYS.has(key) && (isScalar(value) || isScalarArray(value)));

    const sorted = entries.sort(([leftKey], [rightKey]) => {
        const leftIndex = PRIORITY_KEYS.indexOf(leftKey);
        const rightIndex = PRIORITY_KEYS.indexOf(rightKey);
        if (leftIndex === -1 && rightIndex === -1) {
            return leftKey.localeCompare(rightKey);
        }
        if (leftIndex === -1) {
            return 1;
        }
        if (rightIndex === -1) {
            return -1;
        }
        return leftIndex - rightIndex;
    });

    return sorted.map(([key, value]) => createField(toLabel(key), value, key === 'message' || key === 'error_message'));
};

const collectExecutionResultFields = (contextData: Record<string, unknown>): DetailField[] => {
    const executionResult = contextData.execution_result;
    if (!isRecord(executionResult)) {
        return [];
    }

    return PRIORITY_KEYS
        .filter((key) => key in executionResult)
        .map((key) => createField(toLabel(key), executionResult[key], key === 'message' || key === 'error_message'));
};

const collectIncidentSummaryFields = (contextData: Record<string, unknown>): DetailField[] => {
    const incident = contextData.incident;
    if (!isRecord(incident)) {
        return [];
    }

    const summaryKeys = ['title', 'status', 'severity', 'affected_ci', 'affected_service'];
    return summaryKeys
        .filter((key) => key in incident)
        .map((key) => createField(INCIDENT_SUMMARY_LABELS[key] || toLabel(key), incident[key], key === 'title'));
};

const buildSummaryLines = (contextData: Record<string, unknown>) => {
    const modules = Object.keys(contextData).length;
    const incident = isRecord(contextData.incident) ? contextData.incident : undefined;
    const executionResult = isRecord(contextData.execution_result) ? contextData.execution_result : undefined;

    return [
        `上下文模块：${modules}`,
        incident?.title ? `关联工单：${formatText(incident.title)}` : '',
        executionResult?.status ? `执行状态：${formatText(executionResult.status)}` : '',
    ].filter(Boolean).join('   ');
};

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

type InstanceGlobalContextTabProps = {
    contextData: Record<string, unknown>;
};

const InstanceGlobalContextTab: React.FC<InstanceGlobalContextTabProps> = ({ contextData }) => {
    if (Object.keys(contextData).length === 0) {
        return <Empty description="暂无上下文数据" style={{ marginTop: 80 }} />;
    }

    const summaryText = buildSummaryLines(contextData);
    const topLevelFields = collectTopLevelFields(contextData);
    const executionResultFields = collectExecutionResultFields(contextData);
    const incidentSummaryFields = collectIncidentSummaryFields(contextData);

    return (
        <div className="instance-context-panel">
            <div className="instance-context-stack">
                <section className="instance-context-summary">
                    <div className="instance-context-summary-top">
                        <div className="instance-context-summary-main">
                            <div className="instance-context-summary-title">全局上下文</div>
                            {summaryText && (
                                <div className="instance-context-summary-sub">{summaryText}</div>
                            )}
                        </div>
                        <div className="instance-context-summary-tags">
                            <Tag>{Object.keys(contextData).length} 项</Tag>
                        </div>
                    </div>
                </section>

                {incidentSummaryFields.length > 0 && (
                    <DetailCard title="关联工单摘要">
                        <DetailGrid fields={incidentSummaryFields} />
                    </DetailCard>
                )}

                {executionResultFields.length > 0 && (
                    <DetailCard title="执行结果摘要">
                        <DetailGrid fields={executionResultFields} />
                    </DetailCard>
                )}

                {topLevelFields.length > 0 && (
                    <DetailCard title="基础变量">
                        <DetailGrid fields={topLevelFields} />
                    </DetailCard>
                )}

                <DetailCard title="原始上下文">
                    <JsonPrettyView data={contextData} />
                </DetailCard>
            </div>
        </div>
    );
};

export default InstanceGlobalContextTab;
