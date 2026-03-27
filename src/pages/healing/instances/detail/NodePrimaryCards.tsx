import React from 'react';
import {
    Badge,
    Card,
    Col,
    Descriptions,
    Row,
    Space,
    Tag,
    Typography,
} from 'antd';
import {
    AimOutlined,
    CheckCircleOutlined,
    CloseCircleOutlined,
    CodeOutlined,
    DashboardOutlined,
    InfoCircleOutlined,
    NodeIndexOutlined,
    TagOutlined,
} from '@ant-design/icons';
import JsonPrettyView from '../components/JsonPrettyView';
import { INSTANCE_STATUS_LABELS } from '@/constants/instanceDicts';
import { NODE_TYPE_LABELS } from '../utils/canvasBuilder';
import type { SelectedNodeDataLike } from './nodeDetailTypes';

type NodePrimaryCardsProps = {
    resolvedNames: Record<string, string>;
    selectedNodeData: SelectedNodeDataLike;
    stdoutLogs: Array<{ log_level?: string; message: string }>;
};

const descLabelStyle = { background: '#fafafa', color: '#595959', width: 100, fontSize: 12 };
const descContentStyle = { color: '#262626', fontSize: 13 };

const getBadgeStatus = (status?: string) => {
    if (status === 'failed' || status === 'error' || status === 'rejected') return 'error';
    if (status === 'completed' || status === 'success' || status === 'approved') return 'success';
    if (status === 'running') return 'processing';
    if (status === 'skipped') return 'default';
    return 'warning';
};

const getNotificationStatusText = (status?: string) => {
    if (status === 'completed' || status === 'success') return '✓ 发送成功';
    if (status === 'failed') return '✗ 发送失败';
    if (status === 'skipped') return '已跳过';
    if (status === 'running') return '发送中...';
    return status || '未知';
};

const getNotificationStatusColor = (status?: string) => {
    if (status === 'completed' || status === 'success') return 'success';
    if (status === 'failed') return 'error';
    if (status === 'skipped') return 'default';
    return 'processing';
};

const getHosts = (selectedNodeData: SelectedNodeDataLike) => {
    const hosts = selectedNodeData.state?.hosts;
    if (Array.isArray(hosts) && hosts.length > 0) {
        return hosts;
    }
    const targetHosts = selectedNodeData.state?.target_hosts;
    if (typeof targetHosts === 'string') {
        return targetHosts.split(',').map((host) => host.trim()).filter(Boolean);
    }
    return [];
};

const NodePrimaryCards: React.FC<NodePrimaryCardsProps> = ({
    resolvedNames,
    selectedNodeData,
    stdoutLogs,
}) => {
    const nodeState = selectedNodeData.state;
    const effectiveStatus = nodeState?.status || selectedNodeData.status;
    const nodeType = selectedNodeData.type;
    const isExecution = nodeType === 'execution';
    const isApproval = nodeType === 'approval';
    const runId = nodeState?.run?.run_id;
    const hosts = getHosts(selectedNodeData);
    const executionStats = nodeState?.run?.stats || nodeState?.stats;
    const notificationStatus = nodeState?.status;
    const notificationResponse = nodeState?.response || nodeState?.result;
    const notificationError = nodeState?.error_message || nodeState?.error;
    const channelId = selectedNodeData.config?.channel_id || selectedNodeData.config?.notification_channel_id;
    const templateId = selectedNodeData.config?.template_id || selectedNodeData.config?.notification_template_id;
    const channelName = typeof channelId === 'string' ? resolvedNames[channelId] : null;
    const templateName = typeof templateId === 'string' ? resolvedNames[templateId] : null;

    return (
        <>
            <Card size="small" bordered={false} style={{ marginBottom: 16, background: '#fafafa' }} bodyStyle={{ padding: '16px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <span style={{ fontSize: 16, fontWeight: 600, color: '#1f1f1f' }}>{selectedNodeData.name || selectedNodeData.id}</span>
                    <Badge status={getBadgeStatus(effectiveStatus)} text={<span style={{ fontWeight: 500 }}>{INSTANCE_STATUS_LABELS[effectiveStatus || ''] || effectiveStatus || '未执行'}</span>} />
                </div>
                <Descriptions column={2} size="small" labelStyle={{ color: '#8c8c8c', fontSize: 12, paddingBottom: 4, width: 80 }} contentStyle={{ color: '#262626', fontSize: 13, paddingBottom: 4 }}>
                    <Descriptions.Item label="节点类型">{NODE_TYPE_LABELS[nodeType || ''] || nodeType}</Descriptions.Item>
                    {nodeState?.duration_ms != null && <Descriptions.Item label="执行耗时">{nodeState.duration_ms >= 1000 ? `${(nodeState.duration_ms / 1000).toFixed(1)}s` : `${nodeState.duration_ms}ms`}</Descriptions.Item>}
                    {nodeState?.started_at && <Descriptions.Item label="开始时间">{new Date(nodeState.started_at).toLocaleString('zh-CN')}</Descriptions.Item>}
                    {Boolean(nodeState?.finished_at || nodeState?.updated_at) && <Descriptions.Item label="结束时间">{new Date(String(nodeState?.finished_at || nodeState?.updated_at)).toLocaleString('zh-CN')}</Descriptions.Item>}
                    {runId && (
                        <Descriptions.Item label="执行记录">
                            {resolvedNames[`run:${runId}`]
                                ? <Tag color={resolvedNames[`run:${runId}`] === 'completed' ? 'success' : resolvedNames[`run:${runId}`] === 'failed' ? 'error' : 'processing'} style={{ margin: 0 }}>{resolvedNames[`run:${runId}`]}</Tag>
                                : <Typography.Text copyable style={{ fontSize: 12 }}>{runId}</Typography.Text>}
                        </Descriptions.Item>
                    )}
                    {typeof nodeState?.task_id === 'string' && (
                        <Descriptions.Item label="任务模板">
                            {resolvedNames[nodeState.task_id] || resolvedNames[`task:${nodeState.task_id}`]
                                ? <Tag color="blue" style={{ margin: 0 }}>{resolvedNames[nodeState.task_id] || resolvedNames[`task:${nodeState.task_id}`]}</Tag>
                                : <Typography.Text copyable style={{ fontSize: 12 }}>{nodeState.task_id}</Typography.Text>}
                        </Descriptions.Item>
                    )}
                    {isExecution && nodeState?.run?.exit_code != null && <Descriptions.Item label="退出码">{nodeState.run.exit_code}</Descriptions.Item>}
                </Descriptions>
            </Card>

            {!isApproval && (nodeState?.error_message || nodeState?.message) && (
                <Card size="small" style={{ marginBottom: 16 }} title={<span style={{ fontSize: 13, fontWeight: 600 }}>{effectiveStatus === 'failed' || effectiveStatus === 'error' ? <><CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: 6 }} />错误输出</> : <><InfoCircleOutlined style={{ color: '#1890ff', marginRight: 6 }} />节点输出</>}</span>} bodyStyle={{ padding: 0 }}>
                    <div style={{ background: '#1e1e1e', color: effectiveStatus === 'failed' || effectiveStatus === 'error' ? '#ff6b6b' : '#d4d4d4', padding: '14px 18px', fontFamily: "'SF Mono', 'Fira Code', Menlo, Monaco, Consolas, monospace", fontSize: 12.5, lineHeight: 1.7, maxHeight: 200, overflow: 'auto', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                        {String(nodeState.error_message || nodeState.message)}
                    </div>
                </Card>
            )}

            {isApproval && nodeState && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><CheckCircleOutlined style={{ marginRight: 6 }} />审批详情</span>} style={{ marginBottom: 16 }}>
                    <Descriptions column={2} size="small" bordered labelStyle={descLabelStyle} contentStyle={descContentStyle}>
                        {nodeState.title && <Descriptions.Item label="审批标题">{nodeState.title}</Descriptions.Item>}
                        {nodeState.timeout_at && <Descriptions.Item label="超时期限">{new Date(nodeState.timeout_at).toLocaleString('zh-CN')}</Descriptions.Item>}
                        {nodeState.description && <Descriptions.Item label="说明备注" span={2}>{nodeState.description}</Descriptions.Item>}
                        {(nodeState.decision_comment || effectiveStatus === 'rejected') && (
                            <Descriptions.Item label="决策意见" span={2}>
                                <Tag color={effectiveStatus === 'rejected' ? 'error' : 'success'} style={{ fontSize: 13, padding: '2px 10px' }}>
                                    {nodeState.decision_comment || (effectiveStatus === 'rejected' ? '无意见直接拒绝' : '无意见直接通过')}
                                </Tag>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                </Card>
            )}

            {isExecution && executionStats && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><DashboardOutlined style={{ marginRight: 6 }} />执行统计</span>} style={{ marginBottom: 16 }}>
                    <Row gutter={0}>
                        {[
                            { label: '总计', value: (executionStats.ok || 0) + (executionStats.changed || 0) + (executionStats.unreachable || 0) + (executionStats.failed || 0) + (executionStats.skipped || 0), color: '#262626' },
                            { label: '成功', value: executionStats.ok || 0, color: '#52c41a' },
                            { label: '失败', value: executionStats.failed || 0, color: '#ff4d4f' },
                            { label: '变更', value: executionStats.changed || 0, color: '#faad14' },
                            { label: '失联', value: executionStats.unreachable || 0, color: '#ff7a45' },
                            { label: '跳过', value: executionStats.skipped || 0, color: '#8c8c8c' },
                        ].map((item) => (
                            <Col span={4} key={item.label} style={{ textAlign: 'center' }}>
                                <div style={{ fontSize: 22, fontWeight: 700, color: item.color, lineHeight: 1.2 }}>{item.value}</div>
                                <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>{item.label}</div>
                            </Col>
                        ))}
                    </Row>
                </Card>
            )}

            {isExecution && stdoutLogs.length > 0 && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><CodeOutlined style={{ marginRight: 6 }} />执行日志 ({stdoutLogs.length} 行)</span>} style={{ marginBottom: 16 }} bodyStyle={{ padding: 0 }}>
                    <div style={{ background: '#0d1117', padding: '12px 16px', maxHeight: 250, overflow: 'auto', fontFamily: "'SF Mono', Menlo, Monaco, Consolas, monospace", fontSize: 11.5, lineHeight: 1.6 }}>
                        {stdoutLogs.slice(-30).map((log, index) => (
                            <div key={index} style={{ color: log.log_level === 'error' ? '#ff6b6b' : log.log_level === 'changed' ? '#faad14' : log.log_level === 'ok' ? '#52c41a' : log.log_level === 'skipping' ? '#8c8c8c' : '#c9d1d9', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
                                {log.message}
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {hosts.length > 0 && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><AimOutlined style={{ marginRight: 6 }} />目标主机 ({hosts.length})</span>} style={{ marginBottom: 16 }}>
                    <Space size={[6, 6]} wrap>{hosts.map((host) => <Tag key={host} style={{ margin: 0 }}>{host}</Tag>)}</Space>
                </Card>
            )}

            {nodeType === 'host_extractor' && nodeState?.extracted_hosts && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><AimOutlined style={{ color: '#52c41a', marginRight: 6 }} />提取结果</span>} style={{ marginBottom: 16, borderLeft: '3px solid #52c41a' }}>
                    <Space size={[6, 6]} wrap>
                        {(Array.isArray(nodeState.extracted_hosts) ? nodeState.extracted_hosts : String(nodeState.extracted_hosts).split(',').map((host) => host.trim()).filter(Boolean)).map((host, index) => (
                            <Tag key={`${host}-${index}`} color="green" style={{ margin: 0 }}>{host}</Tag>
                        ))}
                    </Space>
                    {nodeState.extract_mode && <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>提取方式: {nodeState.extract_mode}{nodeState.source_field ? ` | 来源: ${nodeState.source_field}` : ''}</div>}
                </Card>
            )}

            {nodeType === 'cmdb_validator' && (nodeState?.validated_hosts || nodeState?.invalid_hosts) && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><CheckCircleOutlined style={{ color: '#1890ff', marginRight: 6 }} />CMDB 验证结果</span>} style={{ marginBottom: 16, borderLeft: '3px solid #1890ff' }}>
                    {nodeState.validation_summary && <div style={{ marginBottom: 10, fontSize: 13 }}>{nodeState.validation_summary}</div>}
                    {Array.isArray(nodeState.validated_hosts) && nodeState.validated_hosts.length > 0 && (
                        <div style={{ marginBottom: 8 }}>
                            <span style={{ fontSize: 12, color: '#52c41a', fontWeight: 500 }}>✓ 验证通过 ({nodeState.validated_hosts.length})</span>
                            <div style={{ marginTop: 4 }}><Space size={[4, 4]} wrap>{nodeState.validated_hosts.map((host, index) => <Tag key={`${host}-${index}`} color="success" style={{ margin: 0 }}>{host}</Tag>)}</Space></div>
                        </div>
                    )}
                    {Array.isArray(nodeState.invalid_hosts) && nodeState.invalid_hosts.length > 0 && (
                        <div>
                            <span style={{ fontSize: 12, color: '#ff4d4f', fontWeight: 500 }}>✗ 未通过 ({nodeState.invalid_hosts.length})</span>
                            <div style={{ marginTop: 4 }}><Space size={[4, 4]} wrap>{nodeState.invalid_hosts.map((host, index) => <Tag key={`${host}-${index}`} color="error" style={{ margin: 0 }}>{host}</Tag>)}</Space></div>
                        </div>
                    )}
                </Card>
            )}

            {(nodeType === 'condition' || nodeType === 'compute') && nodeState?.activated_branch && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><NodeIndexOutlined style={{ color: '#722ed1', marginRight: 6 }} />分支决策</span>} style={{ marginBottom: 16, borderLeft: '3px solid #722ed1' }}>
                    <Descriptions column={1} size="small" bordered labelStyle={{ background: '#fafafa', color: '#595959', width: 100, fontSize: 12 }} contentStyle={{ color: '#262626', fontSize: 13 }}>
                        <Descriptions.Item label="激活分支"><Tag color="purple" style={{ margin: 0, fontSize: 13 }}>{nodeState.activated_branch}</Tag></Descriptions.Item>
                        {nodeState.matched_expression && <Descriptions.Item label="匹配表达式"><Typography.Text code style={{ fontSize: 12 }}>{nodeState.matched_expression}</Typography.Text></Descriptions.Item>}
                    </Descriptions>
                </Card>
            )}

            {nodeType === 'set_variable' && nodeState?.variables_set && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><TagOutlined style={{ color: '#13c2c2', marginRight: 6 }} />已设置变量</span>} style={{ marginBottom: 16, borderLeft: '3px solid #13c2c2' }}>
                    {typeof nodeState.variables_set === 'object' && !Array.isArray(nodeState.variables_set) ? (
                        <Descriptions column={1} size="small" bordered labelStyle={{ background: '#fafafa', color: '#595959', width: 120, fontSize: 12 }} contentStyle={{ color: '#262626', fontSize: 13 }}>
                            {Object.entries(nodeState.variables_set).map(([key, value]) => (
                                <Descriptions.Item key={key} label={key}>
                                    <Typography.Text code style={{ fontSize: 12 }}>{typeof value === 'object' ? JSON.stringify(value) : String(value)}</Typography.Text>
                                </Descriptions.Item>
                            ))}
                        </Descriptions>
                    ) : <JsonPrettyView data={nodeState.variables_set} />}
                </Card>
            )}

            {nodeType === 'compute' && nodeState?.computed_results && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><DashboardOutlined style={{ color: '#fa8c16', marginRight: 6 }} />计算结果</span>} style={{ marginBottom: 16, borderLeft: '3px solid #fa8c16' }}>
                    <JsonPrettyView data={nodeState.computed_results} />
                </Card>
            )}

            {(nodeType === 'notification' || nodeType === 'send_notification') && (
                <Card size="small" title={<span style={{ fontSize: 13, fontWeight: 600 }}><CodeOutlined style={{ marginRight: 6 }} />通知发送记录</span>} style={{ marginBottom: 16 }}>
                    <Descriptions column={2} size="small" bordered labelStyle={{ background: '#fafafa', color: '#595959', width: 100, fontSize: 12 }} contentStyle={{ color: '#262626', fontSize: 13 }}>
                        {channelName && <Descriptions.Item label="通知渠道"><Tag color="blue" style={{ margin: 0 }}>{channelName}</Tag></Descriptions.Item>}
                        {templateName && <Descriptions.Item label="通知模板"><Tag color="purple" style={{ margin: 0 }}>{templateName}</Tag></Descriptions.Item>}
                        <Descriptions.Item label="发送状态"><Tag color={getNotificationStatusColor(notificationStatus)} style={{ margin: 0 }}>{getNotificationStatusText(notificationStatus)}</Tag></Descriptions.Item>
                        {nodeState?.sent_at && <Descriptions.Item label="发送时间">{new Date(nodeState.sent_at).toLocaleString('zh-CN')}</Descriptions.Item>}
                        {nodeState?.duration_ms != null && <Descriptions.Item label="耗时">{nodeState.duration_ms}ms</Descriptions.Item>}
                    </Descriptions>
                    {Boolean(notificationResponse) && typeof notificationResponse === 'object' && (
                        <div style={{ marginTop: 10 }}>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>响应详情</div>
                            <Typography.Paragraph code copyable style={{ fontSize: 11, margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', maxHeight: 150, overflow: 'auto' }}>
                                {JSON.stringify(notificationResponse, null, 2)}
                            </Typography.Paragraph>
                        </div>
                    )}
                    {notificationError && <Card bordered={false} bodyStyle={{ padding: 0, marginTop: 10 }}><Typography.Text type="danger">{String(notificationError)}</Typography.Text></Card>}
                </Card>
            )}
        </>
    );
};

export default NodePrimaryCards;
