import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { AuditOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Space, Tag, Typography, message } from 'antd';
import type { PendingApprovalRecord } from '@/pages/pending-center/types';
import { openApprovalDecisionModal } from '@/pages/pending-center/shared';
import { approveTask, getApprovals, rejectTask } from '@/services/auto-healing/healing';
import { extractErrorMsg } from '@/utils/errorMsg';
import type { SelectedNodeDataLike } from './nodeDetailTypes';

const { Text } = Typography;
const APPROVAL_LOOKUP_PAGE_SIZE = 50;

type ApprovalQuickActionsBarProps = {
    canApprove: boolean;
    flowInstanceId?: string;
    onActionSuccess: () => void;
    selectedNodeData?: SelectedNodeDataLike | null;
};

function isApprovalNode(selectedNodeData?: SelectedNodeDataLike | null) {
    return selectedNodeData?.type === 'approval';
}

function isWaitingApproval(selectedNodeData?: SelectedNodeDataLike | null) {
    const status = selectedNodeData?.state?.status || selectedNodeData?.status;
    return status === 'pending' || status === 'waiting_approval';
}

async function findPendingApprovalTask(
    flowInstanceId: string,
    nodeId: string,
) {
    let page = 1;
    let total = 0;

    do {
        const response = await getApprovals({
            page,
            page_size: APPROVAL_LOOKUP_PAGE_SIZE,
            flow_instance_id: flowInstanceId,
            status: 'pending',
        });
        const items = (response.data || []) as PendingApprovalRecord[];
        const matched = items.find((item) => item.node_id === nodeId && item.status === 'pending');
        if (matched) {
            return matched;
        }

        total = Number(response.total ?? items.length);
        if (items.length === 0 || page * APPROVAL_LOOKUP_PAGE_SIZE >= total) {
            return null;
        }
        page += 1;
    } while (true);
}

export default function ApprovalQuickActionsBar({
    canApprove,
    flowInstanceId,
    onActionSuccess,
    selectedNodeData,
}: ApprovalQuickActionsBarProps) {
    const [actionLoading, setActionLoading] = useState(false);
    const [approvalTask, setApprovalTask] = useState<PendingApprovalRecord | null>(null);
    const [loading, setLoading] = useState(false);
    const [loadError, setLoadError] = useState<string | null>(null);
    const nodeId = selectedNodeData?.id;
    const nodeName = selectedNodeData?.name || nodeId || '审批节点';
    const shouldShow = useMemo(
        () => canApprove && Boolean(flowInstanceId) && Boolean(nodeId) && isApprovalNode(selectedNodeData),
        [canApprove, flowInstanceId, nodeId, selectedNodeData],
    );

    useEffect(() => {
        if (!shouldShow || !flowInstanceId || !nodeId) {
            setApprovalTask(null);
            setLoadError(null);
            setLoading(false);
            return;
        }

        let active = true;
        setLoading(true);
        setLoadError(null);
        void findPendingApprovalTask(flowInstanceId, nodeId)
            .then((task) => {
                if (active) {
                    setApprovalTask(task);
                }
            })
            .catch((error) => {
                if (active) {
                    setApprovalTask(null);
                    setLoadError(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '待审批任务加载失败'));
                }
            })
            .finally(() => {
                if (active) {
                    setLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [flowInstanceId, nodeId, shouldShow]);

    const openDecisionModal = useCallback((decision: 'approve' | 'reject') => {
        if (!approvalTask?.id) {
            return;
        }

        openApprovalDecisionModal({
            title: `${decision === 'approve' ? '批准' : '拒绝'}任务: ${nodeName}`,
            placeholder: decision === 'approve' ? '请输入审批意见（可选）' : '请输入拒绝原因（必填）',
            okText: decision === 'approve' ? '批准' : '拒绝',
            danger: decision === 'reject',
            requireComment: decision === 'reject',
            onSubmit: async (comment) => {
                setActionLoading(true);
                try {
                    if (decision === 'approve') {
                        await approveTask(approvalTask.id, { comment });
                        message.success('已批准');
                    } else {
                        await rejectTask(approvalTask.id, { comment });
                        message.success('已拒绝');
                    }
                    onActionSuccess();
                } finally {
                    setActionLoading(false);
                }
            },
        });
    }, [approvalTask?.id, nodeName, onActionSuccess]);

    if (!shouldShow) {
        return null;
    }
    if (loading) {
        return <Card size="small" loading style={{ marginBottom: 16 }} />;
    }
    if (loadError) {
        return <Alert showIcon type="warning" title="快速审批不可用" description={loadError} style={{ marginBottom: 16 }} />;
    }
    if (!approvalTask) {
        return isWaitingApproval(selectedNodeData)
            ? <Alert showIcon type="info" title="当前节点暂无可处理审批" description="这条待审批记录可能已经被其他审批人处理，请刷新实例详情后再查看。" style={{ marginBottom: 16 }} />
            : null;
    }

    return (
        <Card size="small" style={{ marginBottom: 16, borderLeft: '3px solid #faad14' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
                <div>
                    <Space size={8}>
                        <AuditOutlined style={{ color: '#fa8c16' }} />
                        <Text strong>快速审批</Text>
                        <Tag color="warning">待审批</Tag>
                    </Space>
                    <div style={{ marginTop: 6 }}>
                        <Text type="secondary">当前审批节点可直接在这里处理，无需跳转审批中心。</Text>
                    </div>
                </div>
                <Space>
                    <Button type="primary" loading={actionLoading} onClick={() => openDecisionModal('approve')}>
                        批准
                    </Button>
                    <Button danger loading={actionLoading} onClick={() => openDecisionModal('reject')}>
                        拒绝
                    </Button>
                </Space>
            </div>
        </Card>
    );
}
