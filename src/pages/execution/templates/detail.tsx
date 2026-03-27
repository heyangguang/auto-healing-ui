import React, { startTransition, useCallback } from 'react';
import {
    PlayCircleOutlined,
    ReloadOutlined,
} from '@ant-design/icons';
import { history, useAccess, useParams } from '@umijs/max';
import { Alert, Button, Space, Spin, Typography } from 'antd';
import SubPageHeader from '@/components/SubPageHeader';
import TemplateDetailHeaderTitle from './TemplateDetailHeaderTitle';
import TemplateDetailPageCards from './TemplateDetailPageCards';
import TemplateDetailReviewAlert from './TemplateDetailReviewAlert';
import { useTemplateDetailData } from './useTemplateDetailData';
import './detail.css';

const { Text } = Typography;

const TaskTemplateDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const fromUrl = new URLSearchParams(window.location.search).get('from');
    const {
        channels,
        confirming,
        detailLoadError,
        handleConfirmReview,
        loading,
        referenceLoadError,
        reload,
        secretsSources,
        task,
        templates,
    } = useTemplateDetailData(id);

    const handleGoBack = useCallback(() => {
        if (fromUrl) {
            history.push(fromUrl);
            return;
        }
        if (window.history.length > 1) {
            history.back();
            return;
        }
        history.push('/execution/templates');
    }, [fromUrl]);

    if (loading) {
        return (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f5f5f5' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!task) {
        return (
            <div style={{ padding: 40, textAlign: 'center' }}>
                <Text type={detailLoadError ? 'danger' : 'secondary'} style={{ fontSize: 16 }}>
                    {detailLoadError || '未找到任务模板'}
                </Text>
                <div style={{ marginTop: 16 }}>
                    <Button onClick={handleGoBack}>返回</Button>
                </div>
            </div>
        );
    }

    return (
        <div className="tpl-detail-page">
            <SubPageHeader
                title={<TemplateDetailHeaderTitle template={task} templateId={id} />}
                onBack={handleGoBack}
                actions={(
                    <Space size={8}>
                        <Button
                            size="small"
                            icon={<PlayCircleOutlined />}
                            disabled={!access.canExecuteTask}
                            onClick={() => startTransition(() => history.push(`/execution/execute?template=${task.id}`))}
                        >
                            前往发射台
                        </Button>
                        <Button
                            size="small"
                            icon={<ReloadOutlined spin={loading} />}
                            onClick={() => void (id && reload(id))}
                        >
                            刷新
                        </Button>
                    </Space>
                )}
            />

            <div className="tpl-detail-cards">
                {referenceLoadError && (
                    <Alert type="error" showIcon message={referenceLoadError} />
                )}
                <TemplateDetailReviewAlert
                    canConfirmReview={!!access.canUpdateTask}
                    changedVariables={task.changed_variables || []}
                    confirming={confirming}
                    onConfirmReview={() => void handleConfirmReview()}
                    visible={!!task.needs_review}
                />

                <TemplateDetailPageCards
                    task={task}
                    channels={channels}
                    secretsSources={secretsSources}
                    templates={templates}
                />
            </div>
        </div>
    );
};

export default TaskTemplateDetail;
