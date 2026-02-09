import {
    PlusOutlined, DeleteOutlined, SettingOutlined,
    ThunderboltOutlined, SearchOutlined, ReloadOutlined,
    CodeOutlined, DesktopOutlined, ContainerOutlined, DockerOutlined, InfoCircleOutlined,
    EyeOutlined, PlayCircleOutlined, EditOutlined, FileTextOutlined,
    GlobalOutlined, ProjectOutlined, ClockCircleOutlined, BellOutlined, KeyOutlined, CloseOutlined, CheckOutlined,
    AlertOutlined, ExclamationCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { PageContainer, ProColumns, ProTable, ActionType, StatisticCard } from '@ant-design/pro-components';
import {
    Button, message, Space, Tag, Tooltip, Card, Row, Col, Typography, Input,
    Table, Empty, Modal, Form, Select, Avatar, Popconfirm, Spin, Alert,
    Drawer, Divider, Tabs, Switch, Steps, Badge, Collapse, Popover,
} from 'antd';
import { history, useAccess } from '@umijs/max';
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    getExecutionTasks, createExecutionTask, deleteExecutionTask, executeTask, updateExecutionTask,
    confirmExecutionTaskReview, getExecutionSchedules
} from '@/services/auto-healing/execution';
import { getPlaybooks, getPlaybook } from '@/services/auto-healing/playbooks';
import { getSecretsSources } from '@/services/auto-healing/secrets';
import { getChannels, getTemplates } from '@/services/auto-healing/notification';
import HostSelector from '@/components/HostSelector';
import VariableInput, { extractDefaultValue } from '@/components/VariableInput';
import PlaybookSelector from '@/components/PlaybookSelector';
import SecretsSelector from '@/components/SecretsSelector';
import NotificationSelector from '@/components/NotificationSelector';
import NotificationConfigDisplay from '@/components/NotificationSelector/NotificationConfigDisplay';
import './index.css';

const { Text } = Typography;

// 执行器配置
const executorConfig: Record<string, { color: string; text: string }> = {
    local: { color: 'blue', text: 'Local' },
    docker: { color: 'cyan', text: 'Docker' },
    ssh: { color: 'purple', text: 'SSH' },
};

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
}> = ({ open, template, onClose, playbooks, secretsSources, notifyChannels, notifyTemplates, onConfirmReview }) => {
    const [hostSearch, setHostSearch] = useState('');
    const [confirming, setConfirming] = useState(false);

    if (!template) return null;
    // Use embedded playbook object from template instead of list lookup
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

    return (
        <Drawer
            title="任务模板详情"
            width={700}
            open={open}
            onClose={() => { onClose(); setHostSearch(''); }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* 1. 头部信息 */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 24, borderBottom: '1px solid #f0f0f0' }}>
                    <div style={{ width: 48, height: 48, background: '#e6f7ff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <FileTextOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                    </div>
                    <div>
                        <div style={{ fontSize: 18, fontWeight: 600 }}>{template.name}</div>
                        <div style={{ color: '#8c8c8c', marginTop: 4 }}>ID: {template.id}</div>
                    </div>
                </div>

                {/* 0. 审核警告 (如果需要) - Moved below header */}
                {template.needs_review && (
                    <Alert
                        message={<span style={{ fontWeight: 600, fontSize: 15 }}>Playbook 变量变更待确认</span>}
                        description={
                            <div style={{ marginTop: 12 }}>
                                <div style={{ color: '#595959', marginBottom: 12 }}>
                                    检测到 Playbook 定义已更新，以下变量发生了变更，请确认：
                                </div>
                                <div style={{
                                    background: 'rgba(255, 255, 255, 0.6)',
                                    border: '1px dashed #ffd591',
                                    borderRadius: 6,
                                    padding: '12px',
                                    marginBottom: 16,
                                    display: 'flex',
                                    flexWrap: 'wrap',
                                    gap: 8
                                }}>
                                    {template.changed_variables?.map(v => (
                                        <Tag key={v} color="orange" style={{ margin: 0, background: '#fff7e6', borderColor: '#ffd591', color: '#d46b08' }}>
                                            {v}
                                        </Tag>
                                    ))}
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <Button
                                        type="primary"
                                        size="middle"
                                        icon={<CheckCircleOutlined />}
                                        loading={confirming}
                                        style={{ background: '#fa8c16', borderColor: '#fa8c16' }}
                                        onClick={async () => {
                                            setConfirming(true);
                                            await onConfirmReview(template.id);
                                            setConfirming(false);
                                            onClose();
                                        }}
                                    >
                                        确认变更并同步
                                    </Button>
                                </div>
                            </div>
                        }
                        type="warning"
                        showIcon
                        icon={<ExclamationCircleOutlined style={{ fontSize: 24, marginTop: 4, color: '#fa8c16' }} />}
                        style={{
                            border: '1px solid #ffe58f',
                            background: '#fffbe6',
                            padding: '16px 24px',
                            borderRadius: 8
                        }}
                    />
                )}

                {/* 2. 基础配置 */}

                {/* 2. 基础配置 */}
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>基础配置</div>
                    <Row gutter={[24, 16]}>
                        <Col span={12}>
                            <div style={{ color: '#8c8c8c', fontSize: 12 }}>关联 Playbook</div>
                            <div style={{ display: 'flex', alignItems: 'center', marginTop: 4 }}>
                                <ProjectOutlined style={{ marginRight: 6, color: '#1890ff' }} />
                                {playbook?.name || template.playbook_id}
                            </div>
                        </Col>
                        <Col span={12}>
                            <div style={{ color: '#8c8c8c', fontSize: 12 }}>执行环境</div>
                            <div style={{ marginTop: 4 }}>
                                {template.executor_type === 'docker'
                                    ? <Tag icon={<ContainerOutlined />} color="cyan">Docker 容器</Tag>
                                    : <Tag icon={<DesktopOutlined />} color="blue">本地进程</Tag>
                                }
                            </div>
                        </Col>
                        {/* Host List Redesigned */}
                        <Col span={24}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                                <div style={{ color: '#8c8c8c', fontSize: 12 }}>
                                    目标主机 ({hosts.length})
                                </div>
                                {hosts.length > 5 && (
                                    <Input
                                        placeholder="搜索主机..."
                                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                        size="small"
                                        style={{ width: 180, borderRadius: 0 }}
                                        value={hostSearch}
                                        onChange={e => setHostSearch(e.target.value)}
                                        allowClear
                                    />
                                )}
                            </div>

                            <div style={{
                                background: '#fcfcfc',
                                border: '1px solid #f0f0f0',
                                padding: 12,
                                borderRadius: 4,
                                maxHeight: 200,
                                overflowY: 'auto'
                            }}>
                                {filteredHosts.length > 0 ? (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                                        {filteredHosts.map(h => (
                                            <div key={h} style={{
                                                border: '1px dashed #d9d9d9',
                                                background: '#fff',
                                                padding: '4px 12px',
                                                fontSize: 12,
                                                color: '#595959',
                                                display: 'flex',
                                                alignItems: 'center',
                                                borderRadius: 2
                                            }}>
                                                <DesktopOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                                                {h}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="无匹配主机" />
                                )}
                            </div>
                        </Col>
                    </Row>
                </div>

                <Divider />

                {/* 3. 变量配置 */}
                <div>
                    <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16, display: 'flex', alignItems: 'center' }}>
                        变量配置
                        <Badge count={Object.keys(vars).length} style={{ marginLeft: 8, background: '#52c41a' }} />
                    </div>
                    <div style={{ background: '#fafafa', borderRadius: 8, overflow: 'hidden', border: '1px solid #f0f0f0' }}>
                        {Object.keys(vars).length === 0 ? (
                            <Empty description="无自定义变量" image={Empty.PRESENTED_IMAGE_SIMPLE} />
                        ) : (
                            <Table
                                dataSource={Object.entries(vars).map(([k, v]) => ({ key: k, value: v }))}
                                columns={[
                                    { title: '变量名', dataIndex: 'key', width: 200, render: t => <Text strong>{t}</Text> },
                                    { title: '设定值', dataIndex: 'value', render: t => <Text code copyable>{String(t)}</Text> },
                                ]}
                                pagination={false}
                                size="small"
                                showHeader={false}
                            />
                        )}
                    </div>
                </div>

                <Divider />

                {/* 4. 密钥与通知 */}
                <Row gutter={24}>
                    <Col span={12}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>密钥源</div>
                        <Space wrap>
                            {template.secrets_source_ids && template.secrets_source_ids.length > 0 ? (
                                template.secrets_source_ids.map(id => {
                                    const source = secretsSources.find(s => s.id === id);
                                    return (
                                        <Tag key={id} icon={<KeyOutlined />} color="orange" style={{ borderRadius: 2 }}>
                                            {source?.name || id.slice(0, 8)}
                                        </Tag>
                                    );
                                })
                            ) : (
                                <Text type="secondary">未关联密钥源</Text>
                            )}
                        </Space>
                    </Col>
                    <Col span={12}>
                        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 16 }}>通知配置</div>
                        <NotificationConfigDisplay
                            value={template.notification_config}
                            channels={notifyChannels}
                            templates={notifyTemplates}
                        />
                    </Col>
                </Row>
            </div >
        </Drawer >
    );
};



// ==================== 主组件 ====================
const ExecutionTemplateList: React.FC = () => {
    const access = useAccess();
    const [tasks, setTasks] = useState<AutoHealing.ExecutionTask[]>([]);
    const [loading, setLoading] = useState(true);
    const [playbooks, setPlaybooks] = useState<AutoHealing.Playbook[]>([]);
    const actionRef = useRef<ActionType>(null);

    // 创建弹窗 State
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [createForm] = Form.useForm();
    const [creating, setCreating] = useState(false);

    // 创建过程中的 Playbook 相关 State
    const [selectedPlaybook, setSelectedPlaybook] = useState<AutoHealing.Playbook>();
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);
    const [variableValues, setVariableValues] = useState<Record<string, any>>({});
    const [varSearch, setVarSearch] = useState('');
    const [showOnlyRequired, setShowOnlyRequired] = useState(false);

    // 详情抽屉 State
    const [detailOpen, setDetailOpen] = useState(false);
    const [currentTemplate, setCurrentTemplate] = useState<AutoHealing.ExecutionTask>();
    // 编辑状态
    const [editingTemplate, setEditingTemplate] = useState<AutoHealing.ExecutionTask | null>(null);
    // 抽屉动画完成状态（用于同步便签显示）
    const [drawerFullyOpen, setDrawerFullyOpen] = useState(false);

    // 搜索与筛选
    const [searchText, setSearchText] = useState('');
    const [filterExecutor, setFilterExecutor] = useState<string>('');
    const [filterStatus, setFilterStatus] = useState<string>('');
    const [filterPlaybook, setFilterPlaybook] = useState<string>('');

    const filteredTasks = useMemo(() => {
        let result = tasks;

        // Text search
        if (searchText) {
            const lower = searchText.toLowerCase();
            result = result.filter(t =>
                t.name?.toLowerCase().includes(lower) ||
                t.id.includes(lower) ||
                (t.target_hosts && String(t.target_hosts).toLowerCase().includes(lower))
            );
        }

        // Executor filter
        if (filterExecutor) {
            result = result.filter(t => t.executor_type === filterExecutor);
        }

        // Playbook filter
        if (filterPlaybook) {
            result = result.filter(t => t.playbook_id === filterPlaybook);
        }

        // Status filter
        if (filterStatus === 'ready') {
            result = result.filter(t => !t.needs_review && t.playbook?.status === 'ready');
        } else if (filterStatus === 'review') {
            result = result.filter(t => t.needs_review);
        } else if (filterStatus === 'offline') {
            result = result.filter(t => t.playbook?.status !== 'ready');
        }

        return result;
    }, [tasks, searchText, filterExecutor, filterPlaybook, filterStatus]);

    const stats = useMemo(() => {
        return {
            total: tasks.length,
            docker: tasks.filter(t => t.executor_type === 'docker').length,
            local: tasks.filter(t => t.executor_type === 'local').length,
            // Removed 'withSchedule' as templates don't define schedule
        };
    }, [tasks]);

    // 监听 Playbook 选择，自动填充变量
    const variables = useMemo((): any[] => {
        if (!selectedPlaybook) return [];
        const pb = selectedPlaybook as any;
        // 优先使用已确认的 variables，如果没有则使用 scanned_variables
        return (pb.variables && pb.variables.length > 0)
            ? pb.variables
            : (pb.scanned_variables || []);
    }, [selectedPlaybook]);
    const filteredVariables = useMemo(() => {
        return variables.filter(v => {
            const matchesSearch = v.name.toLowerCase().includes(varSearch.toLowerCase());
            const matchesRequired = showOnlyRequired ? v.required : true;
            return matchesSearch && matchesRequired;
        });
    }, [variables, varSearch, showOnlyRequired]);

    // 加载数据
    const loadTasks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getExecutionTasks({ page: 1, page_size: 100 });
            setTasks(res.data || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    const loadPlaybooks = useCallback(async () => {
        try {
            const res = await getPlaybooks({ status: 'ready', page_size: 100 });
            setPlaybooks(res.data || res.items || []);
        } catch { /* ignore */ }
    }, []);

    // 密钥源
    const [secretsSources, setSecretsSources] = useState<any[]>([]);
    const loadSecretsSources = useCallback(async () => {
        try {
            const res = await getSecretsSources({ page_size: 100 });
            setSecretsSources(res.data || []);
        } catch { /* ignore */ }
    }, []);

    // 通知渠道和模板
    const [notifyChannels, setNotifyChannels] = useState<AutoHealing.NotificationChannel[]>([]);
    const [notifyTemplates, setNotifyTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);
    const loadNotifications = useCallback(async () => {
        try {
            const [chRes, tplRes] = await Promise.all([
                getChannels({ page_size: 100 }),
                getTemplates({ page_size: 100 }),
            ]);
            setNotifyChannels(chRes.data || []);
            setNotifyTemplates(tplRes.data || []);
        } catch { /* ignore */ }
    }, []);

    // 调度数据（用于删除保护检查）- 必须在 useEffect 之前定义
    const [schedules, setSchedules] = useState<AutoHealing.ExecutionSchedule[]>([]);
    const loadSchedules = useCallback(async () => {
        try {
            const res = await getExecutionSchedules({ page: 1, page_size: 500 });
            setSchedules(res.data || []);
        } catch { /* ignore */ }
    }, []);

    // 获取任务关联的调度
    const getTaskSchedules = useCallback((taskId: string) => {
        return schedules.filter(s => s.task_id === taskId);
    }, [schedules]);

    useEffect(() => {
        loadTasks();
        loadPlaybooks();
        loadSecretsSources();
        loadNotifications();
        loadSchedules();
    }, [loadTasks, loadPlaybooks, loadSecretsSources, loadNotifications, loadSchedules]);

    // 重置状态 - 在 Drawer 关闭动画完成后通过 afterOpenChange 清空

    // 处理 Playbook 选择
    const handleSelectPlaybook = async (playbookId: string) => {
        setLoadingPlaybook(true);
        createForm.setFieldsValue({ playbook_id: playbookId }); // Sync form
        try {
            const res = await getPlaybook(playbookId);
            if (res.data) {
                setSelectedPlaybook(res.data);
                const newVariables = (res.data.variables && res.data.variables.length > 0)
                    ? res.data.variables
                    : (res.data.scanned_variables || []);

                // 初始化新 Playbook 的默认值
                const initials: Record<string, any> = {};
                newVariables.forEach(v => {
                    const def = extractDefaultValue(v);
                    if (def !== undefined) initials[v.name] = def;
                });

                // 只有在切换 Playbook 时才清空并重新初始化变量
                setVariableValues(initials);
            }
        } catch {
            message.error('加载 Playbook 详情失败');
        } finally {
            setLoadingPlaybook(false);
        }
    };

    // 处理变量变更
    const handleVariableChange = (name: string, value: any) => {
        setVariableValues(prev => ({ ...prev, [name]: value }));
    };

    // 打开创建/编辑弹窗
    const handleOpenCreateModal = useCallback(() => {
        setEditingTemplate(null);
        createForm.resetFields();
        setVariableValues({});
        setSelectedPlaybook(undefined);
        setCreateModalOpen(true);
    }, [createForm]);

    // 处理编辑点击
    const handleEdit = useCallback(async (record: AutoHealing.ExecutionTask) => {
        setEditingTemplate(record);
        setLoadingPlaybook(true);
        setCreateModalOpen(true);

        try {
            // 首先填充基本表单，避免视觉延迟
            createForm.setFieldsValue({
                name: record.name,
                description: record.description,
                playbook_id: record.playbook_id,
                executor_type: record.executor_type,
                target_hosts: Array.isArray(record.target_hosts)
                    ? record.target_hosts
                    : (record.target_hosts ? (record.target_hosts as string).split(',') : []),
                secrets_source_ids: record.secrets_source_ids || [],
                notification_config: record.notification_config || {},
            });
            setVariableValues(record.extra_vars || {});

            if (record.playbook_id) {
                const res = await getPlaybook(record.playbook_id);
                setSelectedPlaybook(res.data);
            }
        } catch (e) {
            console.error('Failed to load playbook details', e);
            message.error('加载 Playbook 详情失败');
        } finally {
            setLoadingPlaybook(false);
        }
    }, [createForm]);


    // handle Create / Update
    const handleCreate = async () => {
        try {
            const values = await createForm.validateFields();

            // 检查必填变量
            const missingVars = variables.filter(v => v.required && (variableValues[v.name] === undefined || variableValues[v.name] === ''));
            if (missingVars.length > 0) {
                message.error(`缺少必填参数: ${missingVars.map(v => v.name).join(', ')}`);
                return;
            }

            setCreating(true);

            // 清理通知配置 - 如果触发器enabled但没有配置策略，自动禁用
            let cleanedNotificationConfig = values.notification_config;
            if (cleanedNotificationConfig?.enabled) {
                const triggers = ['on_start', 'on_success', 'on_failure'] as const;
                let hasAnyConfig = false;
                for (const trigger of triggers) {
                    const triggerConfig = cleanedNotificationConfig[trigger];
                    if (triggerConfig?.enabled) {
                        const hasConfigs = (triggerConfig.configs?.length || 0) > 0 ||
                            ((triggerConfig.channel_ids?.length || 0) > 0 && triggerConfig.template_id);
                        if (!hasConfigs) {
                            // 没有配置策略，自动禁用此触发器
                            cleanedNotificationConfig = {
                                ...cleanedNotificationConfig,
                                [trigger]: { ...triggerConfig, enabled: false }
                            };
                        } else {
                            hasAnyConfig = true;
                        }
                    }
                }
                // 如果所有触发器都没有配置，整体禁用
                if (!hasAnyConfig) {
                    cleanedNotificationConfig = undefined;
                }
            }

            const commonPayload = {
                name: values.name,
                description: values.description,
                playbook_id: values.playbook_id,
                target_hosts: Array.isArray(values.target_hosts) ? values.target_hosts.join(',') : values.target_hosts,
                extra_vars: variableValues,
                executor_type: values.executor_type,
                secrets_source_ids: values.secrets_source_ids || [],
                notification_config: cleanedNotificationConfig,
            };

            if (editingTemplate) {
                await updateExecutionTask(editingTemplate.id, commonPayload);
                message.success('更新成功');
            } else {
                await createExecutionTask(commonPayload as any);
                message.success('创建成功');
            }

            setCreateModalOpen(false);
            loadTasks();
        } catch (error) {
            console.error(error);
        } finally {
            setCreating(false);
        }
    };

    // 确认审核
    const handleConfirmReview = async (id: string) => {
        try {
            await confirmExecutionTaskReview(id);
            message.success('已确认变更');
            setDetailOpen(false); // 先关闭抽屉
            loadTasks(); // 再刷新数据（异步，不阻塞关闭动画）
        } catch (error) {
            console.error(error);
        }
    };

    // 删除保护检查
    const handleDelete = async (id: string) => {
        const relatedSchedules = getTaskSchedules(id);
        if (relatedSchedules.length > 0) {
            message.error(`无法删除：该模板关联 ${relatedSchedules.length} 个调度任务，请先删除调度`);
            return;
        }
        try {
            await deleteExecutionTask(id);
            message.success('已删除');
            loadTasks();
        } catch { /* ignore */ }
    };

    // 表格列定义
    const columns: ProColumns<AutoHealing.ExecutionTask>[] = [
        {
            title: '模板信息',
            // 不设宽度，自动占满剩余空间
            width: 250,
            render: (_, record) => (
                <div style={{ display: 'flex', alignItems: 'flex-start' }}>
                    <div style={{
                        width: 32, height: 32, background: '#e6f7ff', borderRadius: 4,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 12,
                        flexShrink: 0, marginTop: 2
                    }}>
                        <FileTextOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 4 }}>
                            <span style={{ fontWeight: 600, color: '#262626', fontSize: 14 }}>{record.name}</span>
                            {record.needs_review && (
                                <Tooltip title={
                                    <div>
                                        Playbook 变量发生变更
                                        <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                                            变更变量: {record.changed_variables?.join(', ') || '无数据'}
                                        </div>
                                    </div>
                                }>
                                    <Tag color="error" style={{ margin: 0, fontSize: 12, lineHeight: '20px', cursor: 'help' }}>
                                        <ExclamationCircleOutlined style={{ marginRight: 4 }} />
                                        需审核
                                    </Tag>
                                </Tooltip>
                            )}
                        </div>
                        {record.description && (
                            <div style={{ fontSize: 13, color: '#8c8c8c', lineHeight: '20px' }} className="text-ellipsis-2">
                                {record.description}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
        {
            title: 'ID',
            width: 100,
            render: (_, record) => (
                <Text copyable={{ text: record.id }} style={{ fontSize: 13, color: '#8c8c8c' }}>
                    {record.id.slice(0, 8)}
                </Text>
            ),
        },
        {
            title: '关联 Playbook',
            width: 180,
            render: (_, record) => {
                const pb = playbooks?.find(p => p.id === record.playbook_id);
                return (
                    <Tag icon={<ProjectOutlined />} color="blue" bordered={false} style={{ fontSize: 13, padding: '2px 8px' }}>
                        {pb?.name || record.playbook_id}
                    </Tag>
                );
            }
        },
        {
            title: '目标主机',
            width: 150,
            render: (_, record) => {
                // target_hosts might be string or array
                const hosts = Array.isArray(record.target_hosts)
                    ? record.target_hosts
                    : (record.target_hosts ? (record.target_hosts as string).split(',') : []);

                if (hosts.length === 0) return <span style={{ color: '#bfbfbf' }}>未指定</span>;
                return (
                    <Avatar.Group maxCount={3} size="small">
                        {hosts.map(host => (
                            <Tooltip title={host} key={host}>
                                <Avatar style={{ backgroundColor: '#87d068' }} icon={<DesktopOutlined />} />
                            </Tooltip>
                        ))}
                    </Avatar.Group>
                );
            },
        },
        {
            title: '执行配置',
            width: 140,
            render: (_, record) => {
                const configuredCount = Object.keys(record.extra_vars || {}).length;
                // 优先从 playbook_variables_snapshot 获取，或者从 playbooks 列表查找
                const pb = playbooks?.find(p => p.id === record.playbook_id);
                const totalCount = record.playbook_variables_snapshot?.length
                    ?? pb?.variables?.length
                    ?? pb?.variables_count
                    ?? configuredCount;

                return (
                    <Space direction="vertical" size={0}>
                        <Space size={4}>
                            {record.executor_type === 'docker' ? <DockerOutlined style={{ color: '#13c2c2' }} /> : <CodeOutlined style={{ color: '#1890ff' }} />}
                            <span style={{ fontSize: 13 }}>{record.executor_type === 'docker' ? 'Docker 环境' : '本地执行'}</span>
                        </Space>
                        <Tooltip title={`已配置 ${configuredCount} 个参数，Playbook 共定义 ${totalCount} 个变量`}>
                            <span style={{ fontSize: 12, color: '#8c8c8c', cursor: 'help' }}>
                                <SettingOutlined style={{ marginRight: 4, fontSize: 11 }} />
                                {configuredCount}/{totalCount} 个参数
                            </span>
                        </Tooltip>
                    </Space>
                );
            }
        },
        {
            title: '更新时间',
            dataIndex: 'updated_at',
            valueType: 'fromNow',
            width: 140,
        },
        {
            title: '操作',
            valueType: 'option',
            width: 160,
            fixed: 'right', // 钉在右侧，减少留白尴尬
            render: (_, record) => [
                <a key="view" onClick={() => {
                    setCurrentTemplate(record);
                    setDetailOpen(true);
                }}>
                    <Tooltip title="查看详情"><EyeOutlined style={{ fontSize: 16 }} /></Tooltip>
                </a>,
                <Divider type="vertical" key="d1" />,
                <a key="execute" onClick={() => {
                    const pb = playbooks?.find(p => p.id === record.playbook_id);
                    const isPlaybookReady = pb?.status === 'ready';
                    if (!record.needs_review && isPlaybookReady) {
                        history.push(`/execution/execute?template=${record.id}`);
                    }
                }} style={{ cursor: (record.needs_review || !playbooks?.find(p => p.id === record.playbook_id && p.status === 'ready')) ? 'not-allowed' : 'pointer' }}>
                    <Tooltip title={
                        record.needs_review
                            ? "需确认变更后方可执行"
                            : !playbooks?.find(p => p.id === record.playbook_id && p.status === 'ready')
                                ? "Playbook 未上线，无法执行"
                                : "跳转执行"
                    }>
                        <PlayCircleOutlined style={{
                            fontSize: 16,
                            color: (record.needs_review || !playbooks?.find(p => p.id === record.playbook_id && p.status === 'ready'))
                                ? '#d9d9d9'
                                : '#52c41a'
                        }} />
                    </Tooltip>
                </a>,
                <Divider type="vertical" key="d2" />,
                <a key="edit" onClick={() => handleEdit(record)} style={{ color: !access.canUpdateTask ? '#d9d9d9' : undefined, pointerEvents: !access.canUpdateTask ? 'none' : undefined }}>
                    <Tooltip title="编辑"><EditOutlined style={{ fontSize: 16 }} /></Tooltip>
                </a>,
                <Divider type="vertical" key="d3" />,
                <Popconfirm
                    key="delete"
                    title={
                        getTaskSchedules(record.id).length > 0
                            ? <span>无法删除：关联 <b>{getTaskSchedules(record.id).length}</b> 个调度任务</span>
                            : "确定删除该模板？"
                    }
                    onConfirm={() => handleDelete(record.id)}
                    okButtonProps={{ disabled: getTaskSchedules(record.id).length > 0 }}
                    description={getTaskSchedules(record.id).length > 0 ? "请先删除关联的调度任务" : undefined}
                >
                    <a style={{ color: getTaskSchedules(record.id).length > 0 ? '#d9d9d9' : '#ff4d4f' }}>
                        <Tooltip title={getTaskSchedules(record.id).length > 0 ? `关联 ${getTaskSchedules(record.id).length} 个调度` : "删除"}>
                            <DeleteOutlined style={{ fontSize: 16 }} />
                        </Tooltip>
                    </a>
                </Popconfirm>,
            ],
        },
    ];

    console.log('Template page rendered', { editingTemplate });

    return (
        <PageContainer header={{ title: <><ThunderboltOutlined /> 任务模板 / TEMPLATES</> }}>
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={8}>
                    <StatisticCard
                        statistic={{
                            title: '全部模板',
                            value: stats.total,
                            icon: <ThunderboltOutlined style={{ color: '#1890ff', fontSize: 24 }} />,
                        }}
                    />
                </Col>
                <Col span={8}>
                    <StatisticCard
                        statistic={{
                            title: 'Docker 执行环境',
                            value: stats.docker,
                            icon: <DockerOutlined style={{ color: '#13c2c2', fontSize: 24 }} />,
                        }}
                    />
                </Col>
                <Col span={8}>
                    <StatisticCard
                        statistic={{
                            title: 'Local / SSH 执行',
                            value: stats.local,
                            icon: <CodeOutlined style={{ color: '#722ed1', fontSize: 24 }} />,
                        }}
                    />
                </Col>
            </Row>

            <ProTable<AutoHealing.ExecutionTask>
                columns={columns}
                dataSource={filteredTasks}
                toolBarRender={() => [
                    <Input.Search
                        key="search"
                        placeholder="搜索 模板 / ID / 主机"
                        onSearch={val => setSearchText(val)}
                        onChange={e => setSearchText(e.target.value)}
                        style={{ width: 240 }}
                        allowClear
                    />,
                    <Select
                        key="executor"
                        placeholder="执行器"
                        allowClear
                        style={{ width: 100 }}
                        value={filterExecutor || undefined}
                        onChange={v => setFilterExecutor(v || '')}
                        options={[
                            { label: 'SSH', value: 'local' },
                            { label: 'Docker', value: 'docker' }
                        ]}
                    />,
                    <Select
                        key="status"
                        placeholder="状态"
                        allowClear
                        style={{ width: 110 }}
                        value={filterStatus || undefined}
                        onChange={v => setFilterStatus(v || '')}
                        options={[
                            { label: '就绪', value: 'ready' },
                            { label: '需审核', value: 'review' },
                            { label: '未上线', value: 'offline' }
                        ]}
                    />,
                    <Select
                        key="playbook"
                        placeholder="Playbook"
                        allowClear
                        showSearch
                        optionFilterProp="label"
                        style={{ width: 160 }}
                        value={filterPlaybook || undefined}
                        onChange={v => setFilterPlaybook(v || '')}
                        options={playbooks.map(p => ({ label: p.name, value: p.id }))}
                    />,
                    <Button key="create" type="primary" icon={<PlusOutlined />} disabled={!access.canCreateTask} onClick={handleOpenCreateModal}>
                        创建任务模板
                    </Button>
                ]}
                loading={loading}
                rowKey="id"
                search={false}
                options={{
                    reload: loadTasks,
                    density: true,
                }}
                pagination={{
                    defaultPageSize: 16,
                    showSizeChanger: true,
                    pageSizeOptions: ['16', '32', '64'],
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条`,
                    size: 'default',
                }}
            />

            {/* 详情抽屉 */}
            <TemplateDetailDrawer
                open={detailOpen}
                template={currentTemplate}
                onClose={() => setDetailOpen(false)}
                playbooks={playbooks}
                secretsSources={secretsSources}
                notifyChannels={notifyChannels}
                notifyTemplates={notifyTemplates}
                onConfirmReview={handleConfirmReview}
            />

            {/* ========== 浮动便签 - 跟随抽屉滑动 ========== */}
            {editingTemplate?.needs_review && (
                <div style={{
                    position: 'fixed',
                    right: createModalOpen ? 1120 : -280,  // 打开时在抽屉左侧，关闭时滑出屏幕
                    top: 120,
                    width: 260,
                    zIndex: 1001,
                    background: 'linear-gradient(135deg, #fffbe6 0%, #fff7e6 100%)',
                    border: '1px solid #ffe58f',
                    borderRadius: 0,
                    padding: 16,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                    transition: 'right 0.3s cubic-bezier(0.7, 0.3, 0.1, 1)',  // 与 Ant Design Drawer 动画曲线一致
                    pointerEvents: createModalOpen ? 'auto' : 'none',
                    opacity: createModalOpen ? 1 : 0,
                }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                        <BellOutlined style={{ color: '#faad14', fontSize: 18, marginTop: 2 }} />
                        <div style={{ flex: 1 }}>
                            <div style={{ fontWeight: 600, fontSize: 14, color: '#d48806', marginBottom: 8 }}>
                                变量变更待确认
                            </div>
                            <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                                Playbook 已更新，保存将自动确认变更
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                                {editingTemplate.changed_variables?.map(v => (
                                    <Tag key={v} color="orange" style={{ margin: 0, fontSize: 11 }}>{v}</Tag>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* 创建/编辑抽屉 */}
            <Drawer
                title={editingTemplate ? "编辑任务模板" : "创建任务模板"}
                width={1100}
                open={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                afterOpenChange={(open) => {
                    setDrawerFullyOpen(open);
                    // 关闭动画完成后清空表单数据
                    if (!open) {
                        setVarSearch('');
                        setShowOnlyRequired(false);
                        setVariableValues({});
                        setSelectedPlaybook(undefined);
                        createForm.resetFields();
                    }
                }}
                destroyOnClose
                maskClosable={false}
                styles={{ body: { padding: 0 } }}
                footer={
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Button onClick={() => setCreateModalOpen(false)}>取消</Button>
                        <Button type="primary" onClick={handleCreate} loading={creating} size="large">
                            {editingTemplate ? "保存修改" : "立即创建"}
                        </Button>
                    </div>
                }
            >
                <Form form={createForm} layout="vertical" requiredMark="optional" style={{ height: '100%' }}>

                    {/* ========== 主内容区：左右分栏（统一白色背景）========== */}
                    <div style={{ display: 'flex', height: '100%', minHeight: 'calc(100vh - 108px)', background: '#fff' }}>

                        {/* 左侧：基础配置 (固定440px) */}
                        <div style={{
                            width: 440,
                            flexShrink: 0,
                            borderRight: '1px solid #e8e8e8',
                            overflowY: 'auto',
                            padding: '24px 24px'
                        }}>
                            {/* 标题栏 - 与右侧保持一致 */}
                            <div style={{ marginBottom: 24 }}>
                                <Space size={12}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', background: '#e6f7ff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <ContainerOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                                    </div>
                                    <div>
                                        <Text strong style={{ fontSize: 16 }}>基础配置</Text>
                                        <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1 }}>配置任务的基本属性和运行环境</div>
                                    </div>
                                </Space>
                            </div>

                            <Form.Item
                                name="name"
                                label="模板名称"
                                rules={[{ required: true, message: '请输入模板名称' }]}
                            >
                                <Input size="large" prefix={<ThunderboltOutlined style={{ color: '#bfbfbf' }} />} placeholder="例如：生产环境 Nginx 日志轮转" style={{ fontSize: 14 }} />
                            </Form.Item>

                            <Form.Item name="description" label="任务描述">
                                <Input.TextArea size="large" placeholder="请输入任务描述" rows={2} style={{ fontSize: 14 }} />
                            </Form.Item>

                            <Form.Item
                                name="playbook_id"
                                label="关联 Playbook"
                                rules={[{ required: true, message: '请选择 Playbook' }]}
                                tooltip="选择要执行的自动化脚本蓝图"
                            >
                                <PlaybookSelector
                                    playbooks={playbooks}
                                    value={createForm.getFieldValue('playbook_id')}
                                    onChange={handleSelectPlaybook}
                                />
                            </Form.Item>

                            <Form.Item name="executor_type" label="执行环境" initialValue="local">
                                <Select size="large" style={{ fontSize: 14 }} options={[
                                    { label: <span><DesktopOutlined /> 本地进程 (Local)</span>, value: 'local' },
                                    { label: <span><ContainerOutlined /> 容器环境 (Docker)</span>, value: 'docker' },
                                ]} />
                            </Form.Item>

                            <Divider style={{ margin: '16px 0 12px' }} />

                            <Collapse
                                ghost
                                defaultActiveKey={['targets', 'secrets', 'notify']}
                                expandIconPosition="end"
                                style={{ marginLeft: -16, marginRight: -16 }}
                                items={[
                                    {
                                        key: 'targets',
                                        label: <Text strong><GlobalOutlined /> 目标主机</Text>,
                                        children: (
                                            <div style={{ paddingLeft: 16, paddingRight: 16 }}>
                                                <Form.Item
                                                    name="target_hosts"
                                                    rules={[{ required: true, message: '请至少选择一台目标主机' }]}
                                                    noStyle
                                                >
                                                    <HostSelector />
                                                </Form.Item>
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'secrets',
                                        label: <Text strong><KeyOutlined /> 密钥源</Text>,
                                        children: (
                                            <div style={{ paddingLeft: 16, paddingRight: 16 }}>
                                                <Form.Item name="secrets_source_ids" noStyle>
                                                    <SecretsSelector dataSource={secretsSources} />
                                                </Form.Item>
                                            </div>
                                        )
                                    },
                                    {
                                        key: 'notify',
                                        label: <Text strong><BellOutlined /> 通知配置</Text>,
                                        children: (
                                            <div style={{ paddingLeft: 16, paddingRight: 16 }}>
                                                <Form.Item name="notification_config" noStyle>
                                                    <NotificationSelector
                                                        channels={notifyChannels}
                                                        templates={notifyTemplates}
                                                    />
                                                </Form.Item>
                                            </div>
                                        )
                                    }
                                ]}
                            />
                        </div>

                        {/* 右侧：变量配置 (自适应宽度) */}
                        <div style={{
                            flex: 1,
                            minWidth: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            background: '#fff',
                            padding: '24px 24px',
                            overflow: 'hidden'
                        }}>
                            {/* 标题栏 */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24, flexShrink: 0 }}>
                                <Space size={12}>
                                    <div style={{
                                        width: 32, height: 32, borderRadius: '50%', background: '#e6f7ff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                                    }}>
                                        <CodeOutlined style={{ fontSize: 18, color: '#1890ff' }} />
                                    </div>
                                    <div>
                                        <Text strong style={{ fontSize: 16 }}>变量配置</Text>
                                        <div style={{ fontSize: 12, color: '#8c8c8c', lineHeight: 1 }}>
                                            {selectedPlaybook ? `Playbook: ${selectedPlaybook.name}` : '请先选择 Playbook'}
                                        </div>
                                    </div>
                                </Space>

                                {variables.length > 0 && (
                                    <Space size={16}>
                                        <Input
                                            placeholder="搜索变量名/描述"
                                            prefix={<SearchOutlined style={{ color: 'rgba(0,0,0,.25)' }} />}
                                            value={varSearch}
                                            onChange={e => setVarSearch(e.target.value)}
                                            allowClear
                                            style={{ width: 200 }}
                                        />
                                        <Space>
                                            <Text style={{ fontSize: 14 }}>仅显示必填</Text>
                                            <Switch checked={showOnlyRequired} onChange={setShowOnlyRequired} />
                                        </Space>
                                    </Space>
                                )}
                            </div>

                            {/* 变量列表 - Form风格，无表格感 */}
                            <div style={{ flex: 1, overflow: 'auto', padding: '0 4px' }}>
                                {!selectedPlaybook ? (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description="请先在左侧选择 Playbook"
                                        style={{ marginTop: 80 }}
                                    />
                                ) : loadingPlaybook ? (
                                    <div style={{ textAlign: 'center', marginTop: 80 }}>
                                        <Spin tip="正在解析变量..." />
                                    </div>
                                ) : filteredVariables.length === 0 ? (
                                    <Empty
                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                        description={variables.length === 0 ? "该 Playbook 无可配置变量" : "未找到匹配的变量"}
                                        style={{ marginTop: 80 }}
                                    />
                                ) : (
                                    <div>
                                        {filteredVariables.map((record, index) => (
                                            <div
                                                key={record.name}
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'flex-start',
                                                    padding: '16px 0',
                                                    borderBottom: index < filteredVariables.length - 1 ? '1px solid #f5f5f5' : 'none'
                                                }}
                                            >
                                                {/* 左侧：变量名和描述 */}
                                                <div style={{ width: 200, flexShrink: 0, paddingRight: 16, paddingTop: 4 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                                                        <Text style={{ fontSize: 13, color: '#262626' }}>{record.name}</Text>
                                                        {record.required && (
                                                            <span style={{
                                                                marginLeft: 6,
                                                                fontSize: 10,
                                                                color: '#ff4d4f',
                                                                fontWeight: 500
                                                            }}>*</span>
                                                        )}
                                                    </div>
                                                    <Text type="secondary" style={{ fontSize: 11 }}>{record.type}</Text>
                                                </div>
                                                {/* 右侧：输入控件 - 限制最大宽度 */}
                                                <div style={{ flex: 1, maxWidth: 400 }}>
                                                    <Form.Item
                                                        style={{ marginBottom: 0 }}
                                                        rules={[{ required: record.required, message: '必填' }]}
                                                    >
                                                        <VariableInput
                                                            variable={record}
                                                            value={variableValues[record.name]}
                                                            onChange={val => handleVariableChange(record.name, val)}
                                                        />
                                                    </Form.Item>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </Form>
            </Drawer >
        </PageContainer >
    );
};

export default ExecutionTemplateList;
