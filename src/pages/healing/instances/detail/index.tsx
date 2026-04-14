import {
    cancelHealingInstance,
    getHealingInstanceRecoveryLogs,
    getHealingInstanceDetail,
    recoverHealingInstance,
    retryHealingInstance,
    type FlowRecoveryAttempt,
} from '@/services/auto-healing/instances';
import { history, useParams, useRequest, useAccess } from '@umijs/max';
import { Button, Empty, Space, Spin, message } from 'antd';
import { EyeOutlined, ReloadOutlined } from '@ant-design/icons';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactFlow, {
    Background,
    BackgroundVariant,
    Controls,
} from 'reactflow';
import 'reactflow/dist/style.css';
import AutoLayoutButton from '../components/AutoLayoutButton';
import '../instances.css';
import InstanceContextDrawer from './InstanceContextDrawer';
import InstanceDetailTitleExtra from './InstanceDetailTitleExtra';
import InstanceExecutionAlerts from './InstanceExecutionAlerts';
import InstanceIncidentDrawer from './InstanceIncidentDrawer';
import InstanceRuleDrawer from './InstanceRuleDrawer';
import NodeDetailDrawer from './NodeDetailDrawer';
import { instanceDetailNodeTypes, instanceDetailProOptions } from './instanceDetailCanvasConfig';
import SubPageHeader from '@/components/SubPageHeader';
import type { SelectedNodeDataLike } from './nodeDetailTypes';
import { useInstanceCanvasState } from './useInstanceCanvasState';
import { useInstanceDetailStream } from './useInstanceDetailStream';
import { useInstanceNodeSelection } from './useInstanceNodeSelection';
import { useResolvedNodeNames } from './useResolvedNodeNames';

const HealingInstanceDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const access = useAccess();
    const {
        edges,
        handleAutoLayout,
        hydrateCanvasFromInstance,
        nodes,
        onEdgesChange,
        onNodesChange,
        updateNodeStatus,
    } = useInstanceCanvasState();
    const [contextDrawerVisible, setContextDrawerVisible] = useState(false);
    const [nodeDetailVisible, setNodeDetailVisible] = useState(false);
    const [recoverySubmitting, setRecoverySubmitting] = useState(false);
    const [recoveryAttempts, setRecoveryAttempts] = useState<FlowRecoveryAttempt[]>([]);
    const [recoveryAttemptsLoading, setRecoveryAttemptsLoading] = useState(false);
    const [selectedNodeData, setSelectedNodeData] = useState<SelectedNodeDataLike | null>(null);
    const selectedNodeDataRef = useRef<SelectedNodeDataLike | null>(null);
    const [contextData, setContextData] = useState<Record<string, unknown>>({});
    const [instanceStatus, setInstanceStatus] = useState<string>('pending');
    const { resolvedNames, resolutionErrors } = useResolvedNodeNames(selectedNodeData);

    const [ruleDrawerVisible, setRuleDrawerVisible] = useState(false);
    const [incidentDrawerVisible, setIncidentDrawerVisible] = useState(false);

    const loadRecoveryAttempts = useCallback(async (instanceId?: string) => {
        if (!instanceId) {
            setRecoveryAttempts([]);
            return;
        }
        setRecoveryAttemptsLoading(true);
        try {
            const response = await getHealingInstanceRecoveryLogs(instanceId);
            setRecoveryAttempts(response.data || []);
        } catch {
            setRecoveryAttempts([]);
        } finally {
            setRecoveryAttemptsLoading(false);
        }
    }, []);

    // Fetch initial instance data
    const { data: instance, loading, refresh } = useRequest(
        async () => {
            if (!id) return null;
            return getHealingInstanceDetail(id);
        },
        {
            ready: !!id,
            refreshDeps: [id],
            onSuccess: (response) => {
                const data = response?.data || response;
                if (data?.flow_nodes && data.flow_edges) {
                    setInstanceStatus(data.status);
                    setContextData(data.context || {});
                    hydrateCanvasFromInstance(data);
                }
                void loadRecoveryAttempts(data?.id);
            },
        },
    );
    const instanceData = useMemo(() => {
        if (!instance) {
            return null;
        }

        return ((instance as { data?: AutoHealing.FlowInstance }).data || instance) as AutoHealing.FlowInstance;
    }, [instance]);

    const nodeLogs = useInstanceDetailStream({
        id,
        instanceStatus,
        refresh,
        selectedNodeDataRef,
        setInstanceStatus,
        setSelectedNodeData,
        updateNodeStatus,
    });

    // Keep ref in sync with selectedNodeData state
    useEffect(() => {
        selectedNodeDataRef.current = selectedNodeData;
    }, [selectedNodeData]);
    const handleNodeClick = useInstanceNodeSelection({
        nodeLogs,
        setNodeDetailVisible,
        setRuleDrawerVisible,
        setSelectedNodeData,
    });

    const handleCancel = async () => {
        if (!id) return;
        try {
            await cancelHealingInstance(id);
            message.success('已发送取消请求');
            refresh();
        } catch (_error) {
            /* global error handler */
        }
    };

    const handleRetry = async () => {
        if (!id) return;
        try {
            await retryHealingInstance(id);
            message.success('已开始重试');
            refresh();
        } catch (_error) {
            /* global error handler */
        }
    };

    const handleRecover = async () => {
        if (!id) {
            return;
        }
        setRecoverySubmitting(true);
        try {
            await recoverHealingInstance(id);
            message.success('已开始恢复实例');
            setInstanceStatus('running');
            void loadRecoveryAttempts(id);
            void refresh();
            window.setTimeout(() => {
                void refresh();
                void loadRecoveryAttempts(id);
            }, 1500);
        } catch (_error) {
            /* global error handler */
        } finally {
            setRecoverySubmitting(false);
        }
    };

    const handleApprovalActionSuccess = useCallback(() => {
        setNodeDetailVisible(false);
        void refresh();
    }, [refresh]);

    return (
        <div style={{ padding: 0, minHeight: 'calc(100vh - 120px)', background: '#f5f5f5' }}>
            {/* ==================== SubPageHeader（跟添加代码仓库页面对齐）==================== */}
            <SubPageHeader
                title={instanceData?.flow_name || '自愈实例详情'}
                titleExtra={
                    <InstanceDetailTitleExtra
                        id={id}
                        instance={instanceData}
                        instanceStatus={instanceStatus}
                        onOpenIncident={() => setIncidentDrawerVisible(true)}
                        onOpenRule={() => setRuleDrawerVisible(true)}
                    />
                }
                onBack={() => history.push('/healing/instances')}
                actions={
                    <Space>
                        <Button icon={<EyeOutlined />} onClick={() => setContextDrawerVisible(true)}>执行概况</Button>
                        {(instanceStatus === 'running' || instanceStatus === 'waiting_approval' || instanceStatus === 'pending') && (
                            <Button danger onClick={handleCancel} disabled={!access.canUpdateFlow}>取消执行</Button>
                        )}
                        {['running', 'waiting_approval', 'failed'].includes(instanceStatus) && (
                            <Button
                                icon={<ReloadOutlined />}
                                loading={recoverySubmitting}
                                onClick={handleRecover}
                                disabled={!access.canUpdateFlow}
                            >
                                恢复实例
                            </Button>
                        )}
                        {instanceStatus === 'failed' && (
                            <Button type="primary" onClick={handleRetry} disabled={!access.canUpdateFlow}>重试</Button>
                        )}
                    </Space>
                }
            />

            <InstanceExecutionAlerts instance={instanceData} instanceStatus={instanceStatus} />

            {/* ==================== 流程画布卡（对齐 git-form-card）==================== */}
            <div style={{ background: '#fff', margin: '16px 24px 24px', border: '1px solid #f0f0f0', height: 'calc(100vh - 200px)' }}>
                {loading && !instanceData ? (
                    <div style={{ padding: 50, textAlign: 'center' }}><Spin /></div>
                ) : instanceData ? (
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        nodeTypes={instanceDetailNodeTypes}
                        proOptions={instanceDetailProOptions}
                        fitView
                        fitViewOptions={{ padding: 0.3, maxZoom: 0.85 }}
                        attributionPosition="bottom-right"
                        onNodeClick={handleNodeClick}
                    >
                        <Background variant={BackgroundVariant.Dots} gap={16} size={1.5} color="#bfbfbf" />
                        <Controls />
                        <AutoLayoutButton onAutoLayout={handleAutoLayout} />
                    </ReactFlow>
                ) : (
                    <Empty description="未找到实例数据" />
                )}
            </div>

            <InstanceContextDrawer
                contextData={contextData}
                instance={instanceData}
                instanceStatus={instanceStatus}
                onClose={() => setContextDrawerVisible(false)}
                onRecover={handleRecover}
                open={contextDrawerVisible}
                recoverSubmitting={recoverySubmitting}
                recoveryAttempts={recoveryAttempts}
                recoveryAttemptsLoading={recoveryAttemptsLoading}
                showRecoverAction={['running', 'waiting_approval', 'failed'].includes(instanceStatus) && Boolean(access.canUpdateFlow)}
            />

            <InstanceIncidentDrawer
                incident={instanceData?.incident}
                onClose={() => setIncidentDrawerVisible(false)}
                open={incidentDrawerVisible}
            />

            <InstanceRuleDrawer
                onClose={() => setRuleDrawerVisible(false)}
                open={ruleDrawerVisible}
                rule={instanceData?.rule}
            />

            <NodeDetailDrawer
                canApprove={Boolean(access.canApprove)}
                flowInstanceId={id}
                nodeLogs={nodeLogs}
                onClose={() => setNodeDetailVisible(false)}
                onApprovalActionSuccess={handleApprovalActionSuccess}
                open={nodeDetailVisible}
                resolvedNames={resolvedNames}
                resolutionErrors={resolutionErrors}
                selectedNodeData={selectedNodeData}
            />
        </div>
    );
};

export default HealingInstanceDetail;
