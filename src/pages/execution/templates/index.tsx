import {
    PlusOutlined, DeleteOutlined, SettingOutlined,
    ThunderboltOutlined, SearchOutlined, ReloadOutlined,
    DesktopOutlined, InfoCircleOutlined,
    EyeOutlined, PlayCircleOutlined, EditOutlined, FileTextOutlined,
    GlobalOutlined, ProjectOutlined, ClockCircleOutlined, BellOutlined, KeyOutlined, CloseOutlined, CheckOutlined,
    AlertOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
    ContainerOutlined, CodeOutlined, RocketOutlined, StopOutlined, SendOutlined,
} from '@ant-design/icons';
import {
    Button, message, Space, Tag, Tooltip, Row, Col, Typography,
    Table, Empty, Alert, Drawer, Divider, Badge, Input,
    Avatar, Popconfirm, Modal, Checkbox,
} from 'antd';
import { history, useAccess } from '@umijs/max';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    getExecutionTasks, deleteExecutionTask,
    confirmExecutionTaskReview,
    getExecutionTaskStats, batchConfirmReview,
} from '@/services/auto-healing/execution';
import { getPlaybooks } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { getChannels, getTemplates } from '@/services/auto-healing/notification';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef, AdvancedSearchField } from '@/components/StandardTable';
import { ExecutorIcon, DockerExecIcon, LocalExecIcon } from './TemplateIcons';
import dayjs from 'dayjs';
import './index.css';
import { EXECUTOR_TYPE_CONFIG, getRunStatusOptions } from '@/constants/executionDicts';

const { Text } = Typography;

// 执行器配置（从集中化字典适配为本地接口）
const executorConfig: Record<string, { color: string; text: string }> = Object.fromEntries(
    Object.entries(EXECUTOR_TYPE_CONFIG).map(([k, v]) => [k, { color: k === 'ssh' ? 'purple' : 'blue', text: v.label }])
);

// ==================== 搜索配置 ====================
const templateAdvancedSearchFields: AdvancedSearchField[] = [
    { key: 'playbook_name', label: 'Playbook', type: 'input', placeholder: '输入 Playbook 名称' },
    { key: 'target_hosts', label: '目标主机', type: 'input', placeholder: '输入主机地址' },
    {
        key: 'executor_type', label: '执行器类型', type: 'select', options: [
            { label: 'SSH / Local', value: 'local' },
            { label: 'Docker', value: 'docker' },
        ]
    },
    {
        key: 'needs_review', label: '审核状态', type: 'select', options: [
            { label: '需审核', value: 'true' },
            { label: '正常', value: 'false' },
        ]
    },
    {
        key: 'last_run_status', label: '最后执行状态', type: 'select',
        description: '按最后一次执行记录的状态筛选',
        options: getRunStatusOptions(),
    },
    {
        key: 'has_runs', label: '执行记录', type: 'select',
        description: '筛选是否有执行记录',
        options: [
            { label: '有执行记录', value: 'true' },
            { label: '无执行记录', value: 'false' },
        ]
    },
    { key: 'created_at', label: '创建时间', type: 'dateRange' },
];

// ==================== 详情展示组件 ====================
const TemplateDetailDrawer: React.FC<{
    open: boolean;
    template?: AutoHealing.ExecutionTask;
    onClose: () => void;
    playbooks: AutoHealing.Playbook[];
    secretsSources: any[];
    notifyChannels: AutoHealing.NotificationChannel[];
    notifyTemplates: AutoHealing.NotificationTemplate[];
    onConfirmReview: (id: string) => Promise<void>;
    canConfirmReview?: boolean;
}> = ({ open, template, onClose, playbooks, secretsSources, notifyChannels, notifyTemplates, onConfirmReview, canConfirmReview = true }) => {
    const [hostSearch, setHostSearch] = useState('');
    const [confirming, setConfirming] = useState(false);

    if (!template) return null;
    const playbook = template.playbook;

    // 解析变量
    let vars: Record<string, any> = {};
    try {
        vars = typeof template.extra_vars === 'string' ? JSON.parse(template.extra_vars) : template.extra_vars;
    } catch { /* ignore */ }

    // 解析主机
    const hosts = Array.isArray(template.target_hosts)
        ? template.target_hosts
        : (template.target_hosts as string)?.split(',').filter(Boolean) || [];

    const filteredHosts = hosts.filter(h => h.toLowerCase().includes(hostSearch.toLowerCase()));

    // 通知触发器
    const notifConfig = template.notification_config;
    const triggers = [
        { key: 'on_start', label: '开始时', icon: <RocketOutlined />, color: '#1890ff', config: notifConfig?.on_start },
        { key: 'on_success', label: '成功时', icon: <CheckCircleOutlined />, color: '#52c41a', config: notifConfig?.on_success },
        { key: 'on_failure', label: '失败时', icon: <StopOutlined />, color: '#ff4d4f', config: notifConfig?.on_failure },
    ];

    const getChannelName = (cid: string) => notifyChannels.find(c => c.id === cid)?.name || cid?.slice(0, 8);
    const getTemplateName = (tid: string) => notifyTemplates.find(t => t.id === tid)?.name || tid?.slice(0, 8);

    // 卡片样式
    const cardStyle: React.CSSProperties = { background: '#fff', border: '1px solid #f0f0f0', padding: '20px 24px' };
    const sectionTitleStyle: React.CSSProperties = {
        fontSize: 14, fontWeight: 600, color: '#262626', margin: '0 0 14px 0',
        paddingBottom: 8, borderBottom: '1px dashed #f0f0f0',
        display: 'flex', alignItems: 'center', gap: 8,
    };
    const fieldLabelStyle: React.CSSProperties = { fontSize: 12, color: '#8c8c8c', fontWeight: 500 };
    const fieldValueStyle: React.CSSProperties = { fontSize: 13, color: '#262626', fontWeight: 500, marginTop: 4 };

    return (
        <Drawer
            title="任务模板详情"
            size={700}
            open={open}
            onClose={() => { onClose(); setHostSearch(''); }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {/* 头部 */}
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

                {/* 审核警告 */}
                {template.needs_review && (
                    <Alert
                        message={<span style={{ fontWeight: 600 }}>Playbook 变量变更待确认</span>}
                        description={
                            <div style={{ marginTop: 8 }}>
                                <div style={{ color: '#595959', marginBottom: 10 }}>
                                    检测到 Playbook 定义已更新，以下变量发生了变更，请确认：
                                </div>
                                <div style={{
                                    background: 'rgba(255,255,255,0.6)', border: '1px dashed #ffd591',
                                    padding: 10, marginBottom: 12, display: 'flex', flexWrap: 'wrap', gap: 6
                                }}>
                                    {template.changed_variables?.map((v: any) => {
                                        const name = typeof v === 'string' ? v : v?.name;
                                        return <Tag key={name} color="orange" style={{ margin: 0 }}>{name}</Tag>;
                                    })}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <Button type="primary" size="small" icon={<CheckCircleOutlined />}
                                        loading={confirming}
                                        disabled={!canConfirmReview}
                                        style={{ background: '#faad14', borderColor: '#faad14' }}
                                        onClick={async () => {
                                            setConfirming(true);
                                            await onConfirmReview(template.id);
                                            setConfirming(false);
                                            onClose();
                                        }}
                                    >确认变更并同步</Button>
                                </div>
                            </div>
                        }
                        type="warning" showIcon
                        icon={<ExclamationCircleOutlined style={{ fontSize: 20, marginTop: 2 }} />}
                    />
                )}

                {/* Card: 基础信息 */}
                <div style={cardStyle}>
                    <h4 style={sectionTitleStyle}>
                        <ThunderboltOutlined style={{ color: '#1890ff' }} />基础信息
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px' }}>
                        <div>
                            <div style={fieldLabelStyle}>关联 Playbook</div>
                            <div style={fieldValueStyle}>
                                <Space size={6}>
                                    <FileTextOutlined style={{ color: '#1890ff' }} />
                                    <span style={{ fontWeight: 600 }}>{playbook?.name || template.playbook_id?.substring(0, 8)}</span>
                                </Space>
                            </div>
                        </div>
                        <div>
                            <div style={fieldLabelStyle}>执行器类型</div>
                            <div style={fieldValueStyle}>
                                <Space size={6}>
                                    {template.executor_type === 'docker'
                                        ? <DockerExecIcon size={14} />
                                        : <LocalExecIcon size={14} />
                                    }
                                    <span>{template.executor_type === 'docker' ? '容器 (Docker)' : '本地进程 (SSH)'}</span>
                                </Space>
                            </div>
                        </div>
                        <div>
                            <div style={fieldLabelStyle}>创建时间</div>
                            <div style={fieldValueStyle}>
                                {template.created_at ? dayjs(template.created_at).format('YYYY-MM-DD HH:mm') : '-'}
                            </div>
                        </div>
                        <div>
                            <div style={fieldLabelStyle}>更新时间</div>
                            <div style={fieldValueStyle}>
                                {template.updated_at ? dayjs(template.updated_at).format('YYYY-MM-DD HH:mm') : '-'}
                            </div>
                        </div>
                    </div>
                    {template.description && (
                        <>
                            <Divider dashed style={{ margin: '12px 0' }} />
                            <div>
                                <div style={fieldLabelStyle}>描述</div>
                                <div style={{ ...fieldValueStyle, fontWeight: 400, color: '#595959' }}>{template.description}</div>
                            </div>
                        </>
                    )}
                </div>

                {/* Card: 执行环境 */}
                <div style={cardStyle}>
                    <h4 style={sectionTitleStyle}>
                        <GlobalOutlined style={{ color: '#1890ff' }} />执行环境
                    </h4>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <div style={fieldLabelStyle}>目标主机 ({hosts.length})</div>
                        {hosts.length > 5 && (
                            <Input
                                placeholder="搜索主机..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                size="small"
                                style={{ width: 160, borderRadius: 0 }}
                                value={hostSearch}
                                onChange={e => setHostSearch(e.target.value)}
                                allowClear
                            />
                        )}
                    </div>
                    <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', padding: 10, maxHeight: 180, overflowY: 'auto' }}>
                        {filteredHosts.length > 0 ? (
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                                {filteredHosts.map(h => (
                                    <div key={h} style={{
                                        border: '1px dashed #d9d9d9', background: '#fff',
                                        padding: '3px 10px', fontSize: 12, color: '#595959',
                                        display: 'flex', alignItems: 'center'
                                    }}>
                                        <DesktopOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />{h}
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配主机" />
                        )}
                    </div>
                </div>

                {/* Card: 凭据配置 */}
                <div style={cardStyle}>
                    <h4 style={sectionTitleStyle}>
                        <KeyOutlined style={{ color: '#1890ff' }} />凭据配置
                    </h4>
                    <div>
                        <div style={fieldLabelStyle}>密钥源</div>
                        <div style={{ marginTop: 6 }}>
                            {template.secrets_source_ids && template.secrets_source_ids.length > 0 ? (
                                <Space size={4} wrap>
                                    {template.secrets_source_ids.map(sid => {
                                        const source = secretsSources.find(s => s.id === sid);
                                        return (
                                            <Tag key={sid} icon={<KeyOutlined />} color="blue" style={{ margin: 0, fontSize: 11 }}>
                                                {source?.name || sid.slice(0, 8)}
                                            </Tag>
                                        );
                                    })}
                                </Space>
                            ) : (
                                <Text type="secondary" style={{ fontSize: 12 }}>未指定</Text>
                            )}
                        </div>
                    </div>
                </div>

                {/* Card: 变量配置 */}
                <div style={cardStyle}>
                    <h4 style={sectionTitleStyle}>
                        <SettingOutlined style={{ color: '#1890ff' }} />变量配置
                        {Object.keys(vars).length > 0 && (
                            <Tag style={{ marginLeft: 'auto', fontSize: 10 }}>{Object.keys(vars).length} 已配置</Tag>
                        )}
                    </h4>

                    {Object.keys(vars).length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                            {Object.entries(vars).map(([k, v]) => (
                                <div key={k} style={{
                                    display: 'inline-flex', alignItems: 'center',
                                    padding: '4px 10px', background: '#fafafa',
                                    border: '1px solid #f0f0f0', fontSize: 12,
                                    fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
                                }}>
                                    <span style={{ color: '#262626', fontWeight: 600 }}>{k}</span>
                                    <span style={{ color: '#bfbfbf', margin: '0 6px' }}>=</span>
                                    <span style={{ color: '#8c8c8c' }} title={String(v)}>{String(v)}</span>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ padding: '24px 0', textAlign: 'center' }}>
                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无变量配置" />
                        </div>
                    )}
                </div>

                {/* Card: 通知配置 */}
                <div style={cardStyle}>
                    <h4 style={sectionTitleStyle}>
                        <BellOutlined style={{ color: '#1890ff' }} />通知配置
                    </h4>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {triggers.map(trigger => {
                            const isEnabled = trigger.config?.enabled ?? false;
                            const channelIds = trigger.config?.channel_ids || [];
                            const templateId = trigger.config?.template_id;

                            return (
                                <div key={trigger.key} style={{
                                    border: `1px dashed ${isEnabled ? trigger.color : '#e8e8e8'}`,
                                    padding: '8px 14px',
                                    background: isEnabled ? `${trigger.color}06` : '#fafafa',
                                    display: 'flex', alignItems: 'flex-start', gap: 12,
                                }}>
                                    {/* 左侧: 触发器标签 */}
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0, minWidth: 90 }}>
                                        <span style={{ color: trigger.color, fontSize: 13 }}>{trigger.icon}</span>
                                        <Text strong style={{ fontSize: 13 }}>{trigger.label}</Text>
                                        <Tag color={isEnabled ? 'green' : 'default'} style={{ margin: 0, fontSize: 10, lineHeight: '16px' }}>
                                            {isEnabled ? '启用' : '关闭'}
                                        </Tag>
                                    </div>
                                    {/* 右侧: 策略列表 */}
                                    {isEnabled && channelIds.length > 0 ? (
                                        <div style={{ flex: 1, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                            {channelIds.map((cid: string, idx: number) => (
                                                <div key={idx} style={{
                                                    display: 'flex', alignItems: 'center', gap: 4,
                                                    padding: '2px 8px', background: '#fff', border: '1px dashed #e8e8e8',
                                                    fontSize: 11,
                                                }}>
                                                    <SendOutlined style={{ color: '#999', fontSize: 10, flexShrink: 0 }} />
                                                    <span style={{ fontSize: 11 }}>{getChannelName(cid)}</span>
                                                    {templateId && (
                                                        <>
                                                            <Text type="secondary" style={{ fontSize: 10, flexShrink: 0 }}>→</Text>
                                                            <span style={{ fontSize: 11, color: '#8c8c8c' }}>{getTemplateName(templateId)}</span>
                                                        </>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : isEnabled ? (
                                        <Text type="secondary" style={{ fontSize: 11 }}>无策略</Text>
                                    ) : null}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </Drawer>
    );
};



// ==================== 主组件 ====================
const ExecutionTemplateList: React.FC = () => {
    const access = useAccess();
    const [playbooks, setPlaybooks] = useState<AutoHealing.Playbook[]>([]);

    // 详情抽屉 State
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<AutoHealing.ExecutionTask>();

    // 引用数据
    const [secretsSources, setSecretsSources] = useState<any[]>([]);
    const [notifyChannels, setNotifyChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);



    // 统计数据
    const [stats, setStats] = useState({ total: 0, docker: 0, local: 0, needsReview: 0, changedPlaybooks: 0 });

    // 批量审核状态
    const [batchReviewOpen, setBatchReviewOpen] = useState(false);
    const [batchReviewLoading, setBatchReviewLoading] = useState(false);
    const [reviewGroups, setReviewGroups] = useState<{ playbook_id: string; playbook_name: string; count: number; tasks: AutoHealing.ExecutionTask[] }[]>([]);
    const [selectedPlaybooks, setSelectedPlaybooks] = useState<string[]>([]);

    // 刷新触发器
    const [refreshTrigger, setRefreshTrigger] = useState(0);



    // 加载引用数据
    useEffect(() => {
        Promise.all([
            getPlaybooks({ status: 'ready', page_size: 100 }),
            getSecretsSources(),
            getChannels({ page_size: 100 }),
            getTemplates({ page_size: 100 }),

        ]).then(([pbRes, secRes, chRes, tplRes]) => {
            setPlaybooks(pbRes.data || pbRes.items || []);
            setSecretsSources(secRes.data || []);
            setNotifyChannels(chRes.data || []);
            setNotifyTemplates(tplRes.data || []);
        }).catch(() => { /* ignore */ });
    }, []);

    // 确认审核
    const handleConfirmReview = async (id: string) => {
        try {
            await confirmExecutionTaskReview(id);
            message.success('已确认变更');
            setDetailOpen(false);
            setRefreshTrigger(v => v + 1);
        } catch (error) {
            console.error(error);
        }
    };

    // 打开批量审核 Modal
    const openBatchReview = async () => {
        try {
            const res = await getExecutionTasks({ needs_review: true as any, page_size: 100 });
            const tasks = res.data || [];
            // 按 playbook 分组
            const groups = new Map<string, { playbook_id: string; playbook_name: string; count: number; tasks: AutoHealing.ExecutionTask[] }>();
            tasks.forEach(t => {
                const pbId = t.playbook_id;
                const pb = playbooks?.find(p => p.id === pbId);
                if (!groups.has(pbId)) {
                    groups.set(pbId, { playbook_id: pbId, playbook_name: pb?.name || pbId.slice(0, 8), count: 0, tasks: [] });
                }
                const g = groups.get(pbId)!;
                g.count++;
                g.tasks.push(t);
            });
            setReviewGroups(Array.from(groups.values()));
            setSelectedPlaybooks(Array.from(groups.keys()));
            setBatchReviewOpen(true);
        } catch { message.error('获取待审核列表失败'); }
    };

    // 执行批量审核
    const handleBatchReview = async () => {
        if (selectedPlaybooks.length === 0) { message.warning('请选择至少一个 Playbook'); return; }
        setBatchReviewLoading(true);
        try {
            let totalConfirmed = 0;
            for (const pbId of selectedPlaybooks) {
                const res = await batchConfirmReview({ playbook_id: pbId });
                const r = (res as any)?.data || res;
                totalConfirmed += r.confirmed_count || 0;
            }
            message.success(`已批量确认 ${totalConfirmed} 个任务模板`);
            setBatchReviewOpen(false);
            setRefreshTrigger(v => v + 1);
        } catch { message.error('批量审核失败'); }
        setBatchReviewLoading(false);
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteExecutionTask(id);
            message.success('已删除');
            setRefreshTrigger(v => v + 1);
        } catch { /* ignore */ }
    };

    // StandardTable 列定义
    const columns: StandardColumnDef<AutoHealing.ExecutionTask>[] = [
        {
            columnKey: 'name',
            columnTitle: '模板',
            sorter: true,
            width: 340,
            render: (_, record) => {
                const pb = playbooks?.find(p => p.id === record.playbook_id);
                const isDocker = record.executor_type === 'docker';
                const hosts = Array.isArray(record.target_hosts)
                    ? record.target_hosts
                    : (record.target_hosts ? (record.target_hosts as string).split(',') : []);
                const configuredCount = Object.keys(record.extra_vars || {}).length;
                const scheduleCount = (record as any).schedule_count || 0;

                return (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Tooltip title={isDocker ? 'Docker 容器执行' : '本地 / SSH 执行'}>
                            <ExecutorIcon executorType={record.executor_type} />
                        </Tooltip>
                        <div style={{ minWidth: 0, flex: 1 }}>
                            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                                <span style={{ fontWeight: 600, color: '#262626', fontSize: 13.5 }}>{record.name}</span>
                                {record.needs_review && (
                                    <Tooltip title={
                                        <div>
                                            Playbook 变量发生变更
                                            <div style={{ fontSize: 11, opacity: 0.8, marginTop: 4 }}>
                                                变更变量: {record.changed_variables?.map((v: any) => typeof v === 'string' ? v : v?.name).join(', ') || '—'}
                                            </div>
                                        </div>
                                    }>
                                        <Tag color="error" style={{ margin: 0, fontSize: 11, lineHeight: '18px', cursor: 'help', padding: '0 6px' }}>
                                            <ExclamationCircleOutlined style={{ marginRight: 3 }} />需审核
                                        </Tag>
                                    </Tooltip>
                                )}
                                {scheduleCount > 0 && (
                                    <Tooltip title={`关联 ${scheduleCount} 个调度任务`}>
                                        <Tag color="purple" variant="filled" style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px', cursor: 'default' }}>
                                            <ClockCircleOutlined style={{ marginRight: 3 }} />{scheduleCount}
                                        </Tag>
                                    </Tooltip>
                                )}
                            </div>
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                <ProjectOutlined style={{ marginRight: 3 }} />{pb?.name || record.playbook_id?.slice(0, 8)}
                                {hosts.length > 0 && <> · <DesktopOutlined style={{ marginRight: 3 }} />{hosts.length} 主机</>}
                                {configuredCount > 0 && <> · <SettingOutlined style={{ marginRight: 3 }} />{configuredCount} 参数</>}
                            </div>
                        </div>
                    </div>
                );
            },
        },
        {
            columnKey: 'executor',
            columnTitle: '执行环境',
            width: 150,
            headerFilters: [
                { label: 'SSH / Local', value: 'local' },
                { label: 'Docker', value: 'docker' },
            ],
            render: (_, record) => {
                const isDocker = record.executor_type === 'docker';
                const hosts = Array.isArray(record.target_hosts)
                    ? record.target_hosts
                    : (record.target_hosts ? (record.target_hosts as string).split(',') : []);
                const hasNotify = !!record.notification_config?.enabled;
                const hasSecrets = (record.secrets_source_ids?.length ?? 0) > 0;

                return (
                    <Space orientation="vertical" size={0}>
                        <Tag
                            icon={isDocker ? <ContainerOutlined /> : <CodeOutlined />}
                            color={isDocker ? 'blue' : 'purple'}
                            style={{ fontSize: 12, margin: 0 }}
                        >
                            {isDocker ? 'Docker 容器' : 'SSH / Local'}
                        </Tag>
                        <div style={{ marginTop: 4, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                            {hosts.length > 0 && (
                                <Tooltip title={hosts.join(', ')}>
                                    <Tag variant="filled" style={{ fontSize: 11, margin: 0, padding: '0 4px', color: '#52c41a', background: '#f6ffed', cursor: 'default' }}>
                                        <DesktopOutlined /> {hosts.length}
                                    </Tag>
                                </Tooltip>
                            )}
                            {hasSecrets && (
                                <Tooltip title="已配置凭据">
                                    <Tag variant="filled" style={{ fontSize: 11, margin: 0, padding: '0 4px', color: '#fa8c16', background: '#fff7e6', cursor: 'default' }}>
                                        <KeyOutlined />
                                    </Tag>
                                </Tooltip>
                            )}
                            {hasNotify && (
                                <Tooltip title="已配置通知">
                                    <Tag variant="filled" style={{ fontSize: 11, margin: 0, padding: '0 4px', color: '#1890ff', background: '#e6f7ff', cursor: 'default' }}>
                                        <BellOutlined />
                                    </Tag>
                                </Tooltip>
                            )}
                        </div>
                    </Space>
                );
            },
        },
        {
            columnKey: 'playbook',
            columnTitle: 'Playbook',
            width: 180,
            render: (_, record) => {
                const pb = playbooks?.find(p => p.id === record.playbook_id);
                const varsCount = record.playbook_variables_snapshot?.length ?? pb?.variables?.length ?? pb?.variables_count ?? 0;
                const configuredCount = Object.keys(record.extra_vars || {}).length;
                const isReady = pb?.status === 'ready';

                return (
                    <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{
                                width: 7, height: 7, borderRadius: '50%',
                                background: isReady ? '#52c41a' : '#faad14',
                                display: 'inline-block', flexShrink: 0,
                            }} />
                            <Text style={{ fontSize: 13, fontWeight: 500 }} ellipsis={{ tooltip: pb?.name || record.playbook_id }}>
                                {pb?.name || record.playbook_id?.slice(0, 8)}
                            </Text>
                        </div>
                        <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2, paddingLeft: 13 }}>
                            <SettingOutlined style={{ marginRight: 3, fontSize: 10 }} />
                            {configuredCount}/{varsCount} 参数已配置
                        </div>
                    </div>
                );
            }
        },
        {
            columnKey: 'needs_review',
            columnTitle: '状态',
            width: 100,
            headerFilters: [
                { label: '需审核', value: 'true' },
                { label: '正常', value: 'false' },
            ],
            render: (_, record) => (
                record.needs_review ? (
                    <Tooltip title={`变更变量: ${record.changed_variables?.map((v: any) => typeof v === 'string' ? v : v?.name).join(', ') || '—'}`}>
                        <Tag color="error" style={{ margin: 0, fontSize: 11, cursor: 'help' }}>
                            <ExclamationCircleOutlined style={{ marginRight: 3 }} />需审核
                        </Tag>
                    </Tooltip>
                ) : (
                    <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
                        <CheckCircleOutlined style={{ marginRight: 3 }} />正常
                    </Tag>
                )
            ),
        },
        {
            columnKey: 'updated_at',
            columnTitle: '更新',
            dataIndex: 'updated_at',
            width: 110,
            sorter: true,
            render: (val: string) => {
                if (!val) return '-';
                const d = new Date(val);
                const now = new Date();
                const diff = now.getTime() - d.getTime();
                const minutes = Math.floor(diff / 60000);
                let text = '';
                if (minutes < 1) text = '刚刚';
                else if (minutes < 60) text = `${minutes} 分钟前`;
                else {
                    const hours = Math.floor(minutes / 60);
                    if (hours < 24) text = `${hours} 小时前`;
                    else {
                        const days = Math.floor(hours / 24);
                        text = days < 30 ? `${days} 天前` : d.toLocaleDateString();
                    }
                }
                return (
                    <Tooltip title={d.toLocaleString()}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            <ClockCircleOutlined style={{ marginRight: 4, fontSize: 11 }} />{text}
                        </Text>
                    </Tooltip>
                );
            },
        },
        {
            columnKey: 'actions',
            columnTitle: '操作',
            width: 160,

            render: (_, record) => {
                const pb = playbooks?.find(p => p.id === record.playbook_id);
                const canExecute = !record.needs_review && pb?.status === 'ready';
                const hasSchedules = ((record as any).schedule_count || 0) > 0;
                return (
                    <Space size="small" onClick={(e) => e.stopPropagation()}>
                        <Tooltip title="查看详情">
                            <Button type="link" size="small" icon={<EyeOutlined />}
                                onClick={() => { setCurrentTemplate(record); setDetailOpen(true); }} />
                        </Tooltip>
                        <Tooltip title={record.needs_review ? '需确认变更后方可执行' : !pb || pb.status !== 'ready' ? 'Playbook 未就绪' : '执行'}>
                            <Button type="link" size="small"
                                icon={<PlayCircleOutlined style={{ color: canExecute ? '#52c41a' : undefined }} />}
                                disabled={!canExecute || !access.canExecuteTask}
                                onClick={() => history.push(`/execution/execute?template=${record.id}`)} />
                        </Tooltip>
                        <Tooltip title="编辑">
                            <Button type="link" size="small" icon={<EditOutlined />}
                                disabled={!access.canUpdateTask}
                                onClick={() => history.push(`/execution/templates/${record.id}/edit`)} />
                        </Tooltip>
                        <Popconfirm
                            title={hasSchedules ? <span>无法删除：关联 <b>{(record as any).schedule_count}</b> 个调度</span> : '确定删除该模板？'}
                            onConfirm={() => handleDelete(record.id)}
                            okButtonProps={{ disabled: hasSchedules }}
                            description={hasSchedules ? '请先删除关联的调度任务' : undefined}
                        >
                            <Button type="link" size="small" danger icon={<DeleteOutlined />}
                                disabled={hasSchedules || !access.canDeleteTask} />
                        </Popconfirm>
                    </Space>
                );
            },
        },
    ];

    // StandardTable request
    const handleRequest = useCallback(async (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        const { page, pageSize, advancedSearch, sorter } = params;

        const apiParams: any = {
            page,
            page_size: pageSize,
        };

        // 搜索参数
        if (advancedSearch) {
            // 去掉 __enum__ 前缀，统一 key 格式
            const cleanedSearch: Record<string, any> = {};
            for (const [k, v] of Object.entries(advancedSearch)) {
                cleanedSearch[k.replace(/^__enum__/, '')] = v;
            }
            const adv = cleanedSearch;
            // 全局搜索
            if (adv.search) apiParams.search = adv.search;
            // 执行器类型 — 兼容快速筛选 (executor) 和高级搜索 (executor_type)
            if (adv.executor) apiParams.executor_type = adv.executor;
            if (adv.executor_type) apiParams.executor_type = adv.executor_type;
            // 审核状态 — 兼容快速筛选 (needs_review) 和高级搜索
            if (adv.needs_review !== undefined && adv.needs_review !== null) {
                apiParams.needs_review = adv.needs_review === 'true' || adv.needs_review === true;
            }
            // Playbook 名称
            if (adv.playbook_name) apiParams.playbook_name = adv.playbook_name;
            // 目标主机
            if (adv.target_hosts) apiParams.target_hosts = adv.target_hosts;
            // 最后执行状态
            if (adv.last_run_status) apiParams.last_run_status = adv.last_run_status;
            // 有执行记录
            if (adv.has_runs !== undefined && adv.has_runs !== null) {
                apiParams.has_runs = adv.has_runs === 'true' || adv.has_runs === true;
            }
            // 创建时间范围 (dateRange → created_from / created_to)
            if (adv.created_at && Array.isArray(adv.created_at) && adv.created_at.length === 2) {
                apiParams.created_from = adv.created_at[0].toISOString();
                apiParams.created_to = adv.created_at[1].toISOString();
            }
        }

        // 排序
        if (sorter) {
            apiParams.sort_by = sorter.field;
            apiParams.sort_order = sorter.order === 'ascend' ? 'asc' : 'desc';
        }

        const res = await getExecutionTasks(apiParams);
        const tasks = res.data || [];
        const total = res.total || tasks.length;

        // 更新统计 — 调用后端 GET /api/v1/execution-tasks/stats
        if (page === 1) {
            try {
                const statsRes = await getExecutionTaskStats();
                const s = (statsRes as any)?.data || statsRes;
                setStats({
                    total: s.total ?? (res.total || 0),
                    docker: s.docker ?? 0,
                    local: s.local ?? 0,
                    needsReview: s.needs_review ?? 0,
                    changedPlaybooks: s.changed_playbooks ?? 0,
                });
            } catch {
                // stats 接口异常时，使用列表 total 兜底
                setStats(prev => ({ ...prev, total: res.total || 0 }));
            }
        }

        return { data: tasks, total };
    }, []);

    return (
        <>
            <StandardTable<AutoHealing.ExecutionTask>
                tabs={[{ key: 'list', label: '模板列表' }]}
                title="任务模板"
                description="管理可复用的自动化任务蓝图，配置 Playbook、执行环境和变量参数。"
                headerIcon={<ThunderboltOutlined style={{ fontSize: 32, color: '#1890ff' }} />}
                headerExtra={
                    <div className="template-stats-bar">
                        {[
                            { icon: <ThunderboltOutlined />, cls: 'total', val: stats.total, lbl: '全部模板' },
                            { icon: <ContainerOutlined />, cls: 'docker', val: stats.docker, lbl: 'Docker' },
                            { icon: <CodeOutlined />, cls: 'local', val: stats.local, lbl: 'Local / SSH' },
                            {
                                icon: <ExclamationCircleOutlined />, cls: 'review', val: stats.needsReview, lbl: '待审核模板',
                                tip: stats.needsReview > 0 ? `${stats.needsReview} 个模板需审核（涉及 ${stats.changedPlaybooks} 个 Playbook 变更）` : undefined
                            },
                        ].map((s: any, i: number) => (
                            <React.Fragment key={i}>
                                {i > 0 && <div className="template-stat-divider" />}
                                <Tooltip title={s.tip} placement="bottom">
                                    <div className="template-stat-item" style={{ cursor: s.tip ? 'help' : undefined }}>
                                        <span className={`template-stat-icon template-stat-icon-${s.cls}`}>{s.icon}</span>
                                        <div className="template-stat-content">
                                            <div className="template-stat-value">{s.val}</div>
                                            <div className="template-stat-label">{s.lbl}</div>
                                        </div>
                                    </div>
                                </Tooltip>
                            </React.Fragment>
                        ))}
                    </div>
                }
                searchFields={[
                    { key: 'search', label: '名称 / ID', placeholder: '搜索模板名称或 ID' },
                    {
                        key: '__enum__executor', label: '执行器类型', options: [
                            { label: 'SSH / Local', value: 'local' },
                            { label: 'Docker', value: 'docker' },
                        ]
                    },
                    {
                        key: '__enum__needs_review', label: '审核状态', options: [
                            { label: '需审核', value: 'true' },
                            { label: '正常', value: 'false' },
                        ]
                    },
                ]}
                advancedSearchFields={templateAdvancedSearchFields}
                columns={columns}
                rowKey="id"
                request={handleRequest}
                defaultPageSize={16}
                preferenceKey="execution_templates"
                refreshTrigger={refreshTrigger}
                primaryActionLabel="创建任务模板"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateTask}
                onPrimaryAction={() => history.push('/execution/templates/create')}
                extraToolbarActions={stats.needsReview > 0 ? (
                    <Tooltip title={`${stats.needsReview} 个模板待审核，点击批量确认`}>
                        <Badge dot offset={[-4, 4]}>
                            <Button icon={<AlertOutlined />} onClick={openBatchReview} disabled={!access.canUpdateTask} />
                        </Badge>
                    </Tooltip>
                ) : undefined}
                onRowClick={(record) => {
                    setCurrentTemplate(record);
                    setDetailOpen(true);
                }}
            />

            <TemplateDetailDrawer
                open={detailOpen}
                template={currentTemplate}
                onClose={() => { setDetailOpen(false); setCurrentTemplate(undefined); }}
                playbooks={playbooks}
                secretsSources={secretsSources}
                notifyChannels={notifyChannels}
                notifyTemplates={notifyTemplates}
                onConfirmReview={handleConfirmReview}
                canConfirmReview={access.canUpdateTask}
            />
            {/* 批量审核 Modal */}
            <Modal
                title={<><CheckOutlined style={{ color: '#52c41a', marginRight: 8 }} />批量确认审核</>}
                open={batchReviewOpen}
                onCancel={() => setBatchReviewOpen(false)}
                onOk={handleBatchReview}
                confirmLoading={batchReviewLoading}
                okText={`确认 ${selectedPlaybooks.length} 个 Playbook（${reviewGroups.filter(g => selectedPlaybooks.includes(g.playbook_id)).reduce((s, g) => s + g.count, 0)} 个模板）`}
                width={520}
            >
                <div style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 13 }}>
                    选择要批量确认审核的 Playbook，确认后其下所有待审核的任务模板将标记为已审核。
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 8 }}>
                    <Button type="link" size="small" onClick={() => setSelectedPlaybooks(
                        selectedPlaybooks.length === reviewGroups.length ? [] : reviewGroups.map(g => g.playbook_id)
                    )}>
                        {selectedPlaybooks.length === reviewGroups.length ? '取消全选' : '全选'}
                    </Button>
                </div>
                {reviewGroups.map(g => (
                    <div key={g.playbook_id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', marginBottom: 6,
                        border: `1px solid ${selectedPlaybooks.includes(g.playbook_id) ? '#1890ff' : '#f0f0f0'}`,
                        borderRadius: 6, cursor: 'pointer',
                        background: selectedPlaybooks.includes(g.playbook_id) ? '#f0f7ff' : '#fafafa',
                        transition: 'all 0.2s',
                    }} onClick={() => setSelectedPlaybooks(prev =>
                        prev.includes(g.playbook_id) ? prev.filter(id => id !== g.playbook_id) : [...prev, g.playbook_id]
                    )}>
                        <Checkbox checked={selectedPlaybooks.includes(g.playbook_id)} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 13 }}>
                                <ProjectOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                {g.playbook_name}
                            </div>
                            <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 2 }}>
                                {g.count} 个待审核模板
                            </div>
                        </div>
                        <Tag color="error" style={{ margin: 0 }}>{g.count}</Tag>
                    </div>
                ))}
            </Modal>
        </>
    );
};

export default ExecutionTemplateList;
