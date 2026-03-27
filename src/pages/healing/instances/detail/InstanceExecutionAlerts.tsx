import React from 'react';
import { Alert } from 'antd';
import { normalizeNodeState } from '../utils/canvasBuilder';

type InstanceExecutionAlertsProps = {
    instance?: AutoHealing.FlowInstance | null;
    instanceStatus: string;
};

type FailedEntry = {
    errorMessage: string;
    nodeId: string;
    nodeName: string;
};

const getFailedEntries = (instance?: AutoHealing.FlowInstance | null): FailedEntry[] => {
    if (!instance?.node_states) {
        return [];
    }
    return Object.entries(instance.node_states).flatMap(([nodeId, state]) => {
        const nodeState = normalizeNodeState(state);
        const isFailed = nodeState?.status === 'failed'
            || nodeState?.status === 'error'
            || nodeState?.status === 'rejected';
        if (!isFailed) {
            return [];
        }
        return [{
            errorMessage: nodeState?.message || nodeState?.error_message || nodeState?.error || '执行失败',
            nodeId,
            nodeName: instance.flow_nodes?.find((node) => node.id === nodeId)?.name || nodeId,
        }];
    });
};

const InstanceExecutionAlerts: React.FC<InstanceExecutionAlertsProps> = ({
    instance,
    instanceStatus,
}) => {
    const failedEntries = getFailedEntries(instance);

    if (instanceStatus === 'failed') {
        return (
            <div style={{ margin: '0 24px' }}>
                <Alert
                    type="error"
                    showIcon
                    message={<span style={{ fontSize: 15, fontWeight: 600 }}>流程执行失败</span>}
                    description={
                        <div style={{ marginTop: 4 }}>
                            {instance?.error_message && (
                                <div style={{ fontSize: 14, color: '#434343', marginBottom: 8 }}>{instance.error_message}</div>
                            )}
                            {failedEntries.map((entry) => (
                                <div key={entry.nodeId} style={{ fontSize: 13, color: '#595959', padding: '2px 0' }}>
                                    <span style={{ color: '#ff4d4f', marginRight: 6 }}>●</span>
                                    <strong>{entry.nodeName}</strong>：{entry.errorMessage}
                                </div>
                            ))}
                        </div>
                    }
                    style={{ borderRadius: 0, borderLeft: '4px solid #ff4d4f' }}
                />
            </div>
        );
    }

    if (instanceStatus === 'completed' && failedEntries.length > 0) {
        return (
            <div style={{ margin: '0 24px' }}>
                <Alert
                    type="warning"
                    showIcon
                    message={<span>流程已完成，但有 <strong>{failedEntries.length}</strong> 个节点执行异常</span>}
                    description={failedEntries.map((entry) => (
                        <div key={entry.nodeId} style={{ fontSize: 12, color: '#8c8c8c', padding: '1px 0' }}>
                            • {entry.nodeName}: {entry.errorMessage}
                        </div>
                    ))}
                    style={{ borderRadius: 0, borderLeft: '4px solid #faad14' }}
                    closable
                />
            </div>
        );
    }

    return null;
};

export default InstanceExecutionAlerts;
