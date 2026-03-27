import { Alert, Button, Drawer, Tag, Typography } from 'antd';
import {
    CheckCircleOutlined,
    ExclamationCircleOutlined,
} from '@ant-design/icons';
import React, { useState } from 'react';
import { ExecutorIcon } from './TemplateIcons';
import {
    ExecutionTaskRecord,
    getChangedVariableName,
} from './templateListHelpers';
import TemplateDetailSummaryCards from './TemplateDetailSummaryCards';

const { Text } = Typography;

type TemplateDetailDrawerProps = {
    open: boolean;
    template?: ExecutionTaskRecord;
    onClose: () => void;
    secretsSources: AutoHealing.SecretsSource[];
    notifyChannels: AutoHealing.NotificationChannel[];
    notifyTemplates: AutoHealing.NotificationTemplate[];
    onConfirmReview: (id: string) => Promise<void>;
    canConfirmReview?: boolean;
};

const TemplateDetailDrawer: React.FC<TemplateDetailDrawerProps> = ({
    open,
    template,
    onClose,
    secretsSources,
    notifyChannels,
    notifyTemplates,
    onConfirmReview,
    canConfirmReview = true,
}) => {
    const [hostSearch, setHostSearch] = useState('');
    const [confirming, setConfirming] = useState(false);

    if (!template) {
        return null;
    }

    return (
        <Drawer
            title="任务模板详情"
            size={700}
            open={open}
            onClose={() => {
                onClose();
                setHostSearch('');
            }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingBottom: 16, borderBottom: '1px dashed #f0f0f0' }}>
                    <ExecutorIcon executorType={template.executor_type} size={40} iconSize={20} />
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8 }}>
                            {template.name}
                            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                                #{template.id?.substring(0, 8)}
                            </Text>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                            <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>任务模板</Tag>
                            {template.needs_review && <Tag color="orange" style={{ margin: 0, fontSize: 11 }}>变量待确认</Tag>}
                        </div>
                    </div>
                </div>

                {template.needs_review && (
                    <Alert
                        message={<span style={{ fontWeight: 600 }}>Playbook 变量变更待确认</span>}
                        description={
                            <div style={{ marginTop: 8 }}>
                                <div style={{ color: '#595959', marginBottom: 10 }}>
                                    检测到 Playbook 定义已更新，以下变量发生了变更，请确认：
                                </div>
                                <div
                                    style={{
                                        background: 'rgba(255,255,255,0.6)',
                                        border: '1px dashed #ffd591',
                                        padding: 10,
                                        marginBottom: 12,
                                        display: 'flex',
                                        flexWrap: 'wrap',
                                        gap: 6,
                                    }}
                                >
                                    {template.changed_variables?.map((variable) => {
                                        const name = getChangedVariableName(variable);
                                        return <Tag key={name} color="orange" style={{ margin: 0 }}>{name}</Tag>;
                                    })}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <Button
                                        type="primary"
                                        size="small"
                                        icon={<CheckCircleOutlined />}
                                        loading={confirming}
                                        disabled={!canConfirmReview}
                                        style={{ background: '#faad14', borderColor: '#faad14' }}
                                        onClick={async () => {
                                            setConfirming(true);
                                            try {
                                                await onConfirmReview(template.id);
                                                onClose();
                                            } finally {
                                                setConfirming(false);
                                            }
                                        }}
                                    >
                                        确认变更并同步
                                    </Button>
                                </div>
                            </div>
                        }
                        type="warning"
                        showIcon
                        icon={<ExclamationCircleOutlined style={{ fontSize: 20, marginTop: 2 }} />}
                    />
                )}

                <TemplateDetailSummaryCards
                    hostSearch={hostSearch}
                    notifyChannels={notifyChannels}
                    notifyTemplates={notifyTemplates}
                    secretsSources={secretsSources}
                    template={template}
                    onHostSearchChange={setHostSearch}
                />
            </div>
        </Drawer>
    );
};

export default TemplateDetailDrawer;
