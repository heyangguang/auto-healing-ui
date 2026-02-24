import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { history, useParams, useAccess } from '@umijs/max';
import {
    Form, Input, Select, Button, message, Spin, Row, Col, Typography, Alert, Tag, Space, Tabs,
    Modal, Tree, Checkbox, Empty, Skeleton, Progress, Tooltip, Badge,
} from 'antd';
import {
    SaveOutlined, ThunderboltOutlined, SettingOutlined, ExperimentOutlined,
    CheckCircleOutlined, CloseCircleOutlined, SearchOutlined, LockOutlined,
    BugOutlined, FireOutlined, WarningOutlined, ExclamationCircleOutlined,
    FolderOutlined, BookOutlined, CodeOutlined, LoadingOutlined,
    FileTextOutlined, SelectOutlined, DeleteOutlined,
} from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import {
    getCommandBlacklistRule,
    createCommandBlacklistRule,
    updateCommandBlacklistRule,
    simulateBlacklist,
} from '@/services/auto-healing/commandBlacklist';
import { getExecutionTasks } from '@/services/auto-healing/execution';
import { getPlaybook, getPlaybooks, getPlaybookFiles } from '@/services/auto-healing/playbooks';
import { getFiles as getGitRepoFiles, getGitRepos } from '@/services/auto-healing/git-repos';
import type { DataNode } from 'antd/es/tree';
import './BlacklistRuleForm.css';

const { TextArea } = Input;
const { Text } = Typography;

/* ========== 配置常量 ========== */
const MATCH_TYPE_OPTIONS = [
    { value: 'contains', label: '包含匹配', desc: '行中任意位置包含该文本即命中', icon: <SearchOutlined /> },
    { value: 'regex', label: '正则匹配', desc: '使用正则表达式匹配行内容', icon: <BugOutlined /> },
    { value: 'exact', label: '精确匹配', desc: '整行去空格后必须完全等于该文本', icon: <LockOutlined /> },
];

const SEVERITY_OPTIONS = [
    { value: 'critical', label: '严重' },
    { value: 'high', label: '高危' },
    { value: 'medium', label: '中危' },
];

const CATEGORY_OPTIONS = [
    { value: 'filesystem', label: '文件系统' },
    { value: 'network', label: '网络' },
    { value: 'system', label: '系统' },
    { value: 'database', label: '数据库' },
];

const FILE_TYPE_COLORS: Record<string, string> = {
    entry: 'blue', task: 'green', template: 'orange',
    handlers: 'purple', vars: 'cyan', defaults: 'geekblue', meta: '#999',
};

const PAGE_SIZE = 50;

interface LoadedFile {
    path: string;
    type: string;
    content: string;
    size: number;
    checked: boolean;
}

const BlacklistRuleForm: React.FC = () => {
    const params = useParams<{ id?: string }>();
    const access = useAccess();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [selectedMatchType, setSelectedMatchType] = useState('contains');
    const [isSystem, setIsSystem] = useState(false);

    const patternValue = Form.useWatch('pattern', form);

    // ==================== 仿真测试状态 ====================
    const [testInput, setTestInput] = useState('');
    const [loadedFiles, setLoadedFiles] = useState<LoadedFile[]>([]);
    const [selectedTemplateName, setSelectedTemplateName] = useState('');
    const [selectedPlaybookName, setSelectedPlaybookName] = useState('');
    const [loadingPlaybook, setLoadingPlaybook] = useState(false);
    const [loadProgress, setLoadProgress] = useState(0);
    const [simMode, setSimMode] = useState<'template' | 'manual'>('template');

    // ==================== 模板选择 Modal ====================
    const [selectorOpen, setSelectorOpen] = useState(false);
    const [repositories, setRepositories] = useState<any[]>([]);
    const [playbookList, setPlaybookList] = useState<any[]>([]);
    const [initLoading, setInitLoading] = useState(true);

    // 任务列表分页
    const [tasks, setTasks] = useState<any[]>([]);
    const [tasksLoading, setTasksLoading] = useState(false);
    const [tasksTotal, setTasksTotal] = useState(0);
    const [taskPage, setTaskPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const listRef = useRef<HTMLDivElement>(null);

    // 筛选
    const [selectedTreeKey, setSelectedTreeKey] = useState<string>('all');
    const [expandedKeys, setExpandedKeys] = useState<string[]>([]);
    const [taskSearch, setTaskSearch] = useState('');
    const [executorType, setExecutorType] = useState<string | undefined>();
    const [statusFilter, setStatusFilter] = useState<string | undefined>();

    // 选中的任务
    const [pendingTask, setPendingTask] = useState<any>(null);

    // ==================== 模板选择 Modal 逻辑 ====================

    // 打开 Modal 时加载基础数据
    useEffect(() => {
        if (selectorOpen) {
            loadBaseData();
        } else {
            setTasks([]);
            setTaskPage(1);
            setHasMore(true);
            setTaskSearch('');
            setExecutorType(undefined);
            setStatusFilter(undefined);
            setSelectedTreeKey('all');
            setPendingTask(null);
        }
    }, [selectorOpen]);

    const loadBaseData = async () => {
        setInitLoading(true);
        try {
            const [playbooksRes, reposRes] = await Promise.all([
                getPlaybooks({ page_size: 100 }),
                getGitRepos(),
            ]);
            setPlaybookList(playbooksRes.data || []);
            setRepositories(reposRes.data || []);

            const repos = reposRes.data || [];
            if (repos.length) {
                setExpandedKeys(repos.slice(0, 3).map((r: any) => `repo-${r.id}`));
            }
            await loadTasks(1, true, playbooksRes.data || []);
        } catch {
            console.error('[BlacklistRuleForm] loadBaseData error');
        } finally {
            setInitLoading(false);
        }
    };

    const buildTaskParams = useCallback(() => {
        const p: any = { page_size: PAGE_SIZE };
        if (selectedTreeKey !== 'all') {
            if (selectedTreeKey.startsWith('playbook-')) {
                p.playbook_id = selectedTreeKey.replace('playbook-', '');
            }
        }
        if (taskSearch) p.name = taskSearch;
        if (executorType) p.executor_type = executorType;
        if (statusFilter === 'ready') p.status = 'ready';
        else if (statusFilter === 'review') p.status = 'pending_review';
        return p;
    }, [selectedTreeKey, taskSearch, executorType, statusFilter]);

    const loadTasks = useCallback(async (pageNum: number, reset: boolean, pbs?: any[]) => {
        if (tasksLoading && !reset) return;
        setTasksLoading(true);
        try {
            const p = { ...buildTaskParams(), page: pageNum };
            const res = await getExecutionTasks(p);
            const newTasks = res.data || [];
            const total = res.total || 0;

            if (reset) setTasks(newTasks);
            else setTasks(prev => [...prev, ...newTasks]);
            setTasksTotal(total);
            setTaskPage(pageNum);
            setHasMore(pageNum * PAGE_SIZE < total);
        } catch {
            console.error('[BlacklistRuleForm] loadTasks error');
        } finally {
            setTasksLoading(false);
        }
    }, [buildTaskParams, tasksLoading]);

    // 筛选条件变化时重加载
    useEffect(() => {
        if (!initLoading && selectorOpen) {
            const timer = setTimeout(() => loadTasks(1, true), 300);
            return () => clearTimeout(timer);
        }
        return undefined;
    }, [selectedTreeKey, taskSearch, executorType, statusFilter, initLoading, selectorOpen]);

    const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
        if (scrollHeight - scrollTop - clientHeight < 100 && !tasksLoading && hasMore) {
            loadTasks(taskPage + 1, false);
        }
    }, [tasksLoading, hasMore, taskPage, loadTasks]);

    // 前端过滤（仓库节点选中）
    const displayTasks = useMemo(() => {
        if (selectedTreeKey.startsWith('repo-')) {
            const repoId = selectedTreeKey.replace('repo-', '');
            const repoPlaybookIds = playbookList
                .filter((p: any) => p.repository_id === repoId)
                .map((p: any) => p.id);
            return tasks.filter((t: any) => t.playbook_id && repoPlaybookIds.includes(t.playbook_id));
        }
        return tasks;
    }, [tasks, selectedTreeKey, playbookList]);

    // 树形数据
    const treeData = useMemo((): DataNode[] => {
        const repoNodes: DataNode[] = repositories.map(repo => {
            const repoPlaybooks = playbookList.filter((p: any) => p.repository_id === repo.id);
            return {
                key: `repo-${repo.id}`,
                title: (
                    <Space>
                        {repo.name}
                        <Tag style={{ fontSize: 10 }}>{repoPlaybooks.length}</Tag>
                    </Space>
                ),
                icon: <FolderOutlined style={{ color: '#1890ff' }} />,
                children: repoPlaybooks.map((playbook: any) => ({
                    key: `playbook-${playbook.id}`,
                    title: playbook.name,
                    icon: <BookOutlined style={{ color: '#52c41a' }} />,
                    isLeaf: true,
                })),
            };
        });

        return [
            {
                key: 'all',
                title: (
                    <Space>
                        全部任务
                        <Tag style={{ fontSize: 10 }}>{tasksTotal}</Tag>
                    </Space>
                ),
                icon: <CodeOutlined style={{ color: '#722ed1' }} />,
                isLeaf: true,
            },
            ...repoNodes,
        ];
    }, [repositories, playbookList, tasksTotal]);

    // ==================== 确认选择 → 加载 Playbook 全部文件 ====================

    const handleConfirmTemplate = useCallback(async () => {
        if (!pendingTask) return;
        setSelectorOpen(false);
        setSimMode('template');

        const template = pendingTask;
        if (!template.playbook_id) {
            message.warning('该任务模板未关联 Playbook');
            return;
        }

        setLoadingPlaybook(true);
        setLoadProgress(0);
        setLoadedFiles([]);
        setTestInput('');
        setSelectedTemplateName(template.name);

        try {
            // 1. 获取 Playbook 详情
            const playbookRes = await getPlaybook(template.playbook_id);
            const playbookData = (playbookRes as any)?.data || playbookRes;
            if (!playbookData?.repository_id) {
                message.warning('Playbook 未关联 Git 仓库');
                return;
            }
            setSelectedPlaybookName(playbookData.name || '');
            const repoId = playbookData.repository_id;
            setLoadProgress(10);

            // 2. 获取 Playbook 所有关联文件路径
            const filesRes = await getPlaybookFiles(template.playbook_id);
            const filesData = (filesRes as any)?.data?.files || (filesRes as any)?.files || [];
            const fileList: { path: string; type: string }[] = filesData.length > 0
                ? filesData.map((f: any) => ({ path: f.path || f.name, type: f.type || 'unknown' }))
                : [{ path: playbookData.file_path, type: 'entry' }];
            setLoadProgress(20);

            // 3. 并行获取所有文件内容
            const results: LoadedFile[] = [];
            const batchSize = 5; // 并行批次大小
            for (let i = 0; i < fileList.length; i += batchSize) {
                const batch = fileList.slice(i, i + batchSize);
                const batchResults = await Promise.allSettled(
                    batch.map(async (file) => {
                        const contentRes = await getGitRepoFiles(repoId, file.path);
                        const content = (contentRes as any)?.data?.content || (contentRes as any)?.content || '';
                        return {
                            path: file.path,
                            type: file.type,
                            content,
                            size: content.length,
                            checked: true,
                        };
                    })
                );

                batchResults.forEach((r) => {
                    if (r.status === 'fulfilled' && r.value.content) {
                        results.push(r.value);
                    }
                });

                setLoadProgress(20 + Math.round(((i + batch.length) / fileList.length) * 80));
            }

            if (results.length > 0) {
                setLoadedFiles(results);
                // 拼接所有文件内容
                const allContent = results
                    .map(f => `# --- ${f.path} ---\n${f.content}`)
                    .join('\n\n');
                setTestInput(allContent);
                message.success(`已加载 ${results.length} 个文件，共 ${fileList.length} 个`);
            } else {
                message.warning('Playbook 无文件内容');
            }
        } catch {
            message.error('加载 Playbook 文件失败');
        } finally {
            setLoadingPlaybook(false);
            setLoadProgress(100);
        }
    }, [pendingTask]);

    // 文件勾选变化 → 重建 testInput
    const handleFileCheckChange = useCallback((filePath: string, checked: boolean) => {
        setLoadedFiles(prev => {
            const updated = prev.map(f => f.path === filePath ? { ...f, checked } : f);
            const content = updated
                .filter(f => f.checked)
                .map(f => `# --- ${f.path} ---\n${f.content}`)
                .join('\n\n');
            setTestInput(content);
            return updated;
        });
    }, []);

    // 清除已加载
    const handleClearLoaded = useCallback(() => {
        setLoadedFiles([]);
        setTestInput('');
        setSelectedTemplateName('');
        setSelectedPlaybookName('');
    }, []);

    // ==================== 仿真测试结果（调用后端引擎） ====================
    const [testResults, setTestResults] = useState<{ line: number; content: string; matched: boolean; file?: string }[] | null>(null);
    const [matchCount, setMatchCount] = useState(0);
    const [matchedFiles, setMatchedFiles] = useState<string[]>([]);
    const [simulating, setSimulating] = useState(false);

    // Debounced 调用后端仿真接口
    useEffect(() => {
        if (!patternValue) {
            setTestResults(null);
            setMatchCount(0);
            setMatchedFiles([]);
            return;
        }

        // 根据当前 tab 判断是否有数据
        const hasFiles = simMode === 'template' && loadedFiles.filter(f => f.checked).length > 0;
        const hasManualInput = simMode === 'manual' && testInput;
        if (!hasFiles && !hasManualInput) {
            setTestResults(null);
            setMatchCount(0);
            setMatchedFiles([]);
            return;
        }

        const timer = setTimeout(async () => {
            setSimulating(true);
            try {
                const reqData: any = {
                    pattern: patternValue,
                    match_type: selectedMatchType,
                };

                if (hasFiles) {
                    // 模板模式：按文件传入
                    reqData.files = loadedFiles
                        .filter(f => f.checked)
                        .map(f => ({ path: f.path, content: f.content }));
                } else {
                    // 手动模式：纯文本
                    reqData.content = testInput;
                }

                const res = await simulateBlacklist(reqData);
                const data = (res as any)?.data;
                if (data) {
                    setTestResults(data.results || []);
                    setMatchCount(data.match_count || 0);
                    const files = data.matched_files ? Object.keys(data.matched_files) : [];
                    setMatchedFiles(files);
                }
            } catch {
                console.error('[Simulate] 仿真测试失败');
            } finally {
                setSimulating(false);
            }
        }, 500); // 500ms debounce

        return () => clearTimeout(timer);
    }, [patternValue, selectedMatchType, testInput, loadedFiles, simMode]);

    // ==================== Load Data ====================
    useEffect(() => {
        if (!isEdit || !params.id) {
            form.setFieldsValue({ match_type: 'contains', severity: 'critical' });
            return;
        }
        setLoading(true);
        (async () => {
            try {
                const res = await getCommandBlacklistRule(params.id!);
                const rule = (res as any)?.data || res;
                form.setFieldsValue({
                    name: rule.name, pattern: rule.pattern,
                    match_type: rule.match_type, severity: rule.severity,
                    category: rule.category, description: rule.description,
                });
                setSelectedMatchType(rule.match_type);
                setIsSystem(rule.is_system);
            } catch {
                message.error('加载规则失败');
            } finally {
                setLoading(false);
            }
        })();
    }, [isEdit, params.id]);

    // ==================== Submit ====================
    const handleSubmit = useCallback(async () => {
        try {
            const values = await form.validateFields();
            values.match_type = selectedMatchType;
            setSubmitting(true);

            if (isEdit && params.id) {
                await updateCommandBlacklistRule(params.id, values);
                message.success('规则已更新');
            } else {
                await createCommandBlacklistRule(values);
                message.success('规则已创建');
            }
            history.push('/security/command-blacklist');
        } catch (error) {
            if (!(error as any).errorFields) {
                message.error('保存失败');
            }
        } finally {
            setSubmitting(false);
        }
    }, [form, isEdit, params.id, selectedMatchType]);

    // ==================== Render ====================
    return (
        <div className="blacklist-form-page">
            <SubPageHeader
                title={isEdit ? '编辑黑名单规则' : '添加黑名单规则'}
                onBack={() => history.push('/security/command-blacklist')}
                actions={
                    <div className="blacklist-form-header-actions">
                        <Button onClick={() => history.push('/security/command-blacklist')}>取消</Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            loading={submitting}
                            disabled={!access.canManageBlacklist}
                            onClick={handleSubmit}
                        >
                            {isEdit ? '保存修改' : '创建规则'}
                        </Button>
                    </div>
                }
            />

            <Spin spinning={loading}>
                <Form form={form} layout="vertical" requiredMark={false} initialValues={{ match_type: 'contains', severity: 'critical' }} size="large">
                    <div className="blacklist-form-cards">

                        {/* 系统规则警告 */}
                        {isEdit && isSystem && (
                            <Alert
                                message="系统内置规则"
                                description="该规则为系统预置规则，部分字段不可修改。"
                                type="warning" showIcon
                                icon={<ExclamationCircleOutlined style={{ fontSize: 20 }} />}
                                style={{ border: '1px solid #ffe58f' }}
                            />
                        )}

                        {/* ========== Card 1: 基本信息 ========== */}
                        <div className="blacklist-form-card">
                            <h4 className="blacklist-form-section-title">
                                <ThunderboltOutlined />基本信息
                            </h4>

                            <Row gutter={16}>
                                <Col span={12}>
                                    <Form.Item
                                        name="name" label="规则名称"
                                        rules={[{ required: true, message: '请输入规则名称' }]}
                                        extra="简短描述规则用途，如「删除根目录」「格式化磁盘」"
                                    >
                                        <Input placeholder="如：删除根目录、格式化磁盘" maxLength={128} disabled={isSystem} />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item
                                        name="severity" label="严重级别"
                                        rules={[{ required: true, message: '请选择严重级别' }]}
                                    >
                                        <Select options={SEVERITY_OPTIONS} placeholder="选择级别" />
                                    </Form.Item>
                                </Col>
                                <Col span={6}>
                                    <Form.Item name="category" label="分类">
                                        <Select options={CATEGORY_OPTIONS} placeholder="选择分类" allowClear />
                                    </Form.Item>
                                </Col>
                            </Row>

                            <Form.Item
                                name="description" label="风险说明"
                                extra="可选，描述该指令的危险性和可能造成的后果"
                            >
                                <TextArea placeholder="描述该指令的危险性和可能造成的后果" rows={2} maxLength={500} showCount />
                            </Form.Item>
                        </div>

                        {/* ========== Card 2: 匹配配置 ========== */}
                        <div className="blacklist-form-card">
                            <h4 className="blacklist-form-section-title">
                                <SettingOutlined />匹配配置
                            </h4>

                            <Form.Item label="匹配类型" required extra="选择规则的匹配策略，不同类型适用于不同场景">
                                <div className="blacklist-match-type-cards">
                                    {MATCH_TYPE_OPTIONS.map(opt => (
                                        <div
                                            key={opt.value}
                                            className={`blacklist-match-type-card ${selectedMatchType === opt.value ? 'active' : ''}`}
                                            onClick={() => {
                                                setSelectedMatchType(opt.value);
                                                form.setFieldsValue({ match_type: opt.value });
                                            }}
                                        >
                                            <div className="blacklist-match-type-card-icon">{opt.icon}</div>
                                            <div>
                                                <div className="blacklist-match-type-card-title">{opt.label}</div>
                                                <div className="blacklist-match-type-card-desc">{opt.desc}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Form.Item>

                            <Row gutter={16}>
                                <Col span={16}>
                                    <Form.Item
                                        name="pattern" label="匹配模式"
                                        rules={[{ required: true, message: '请输入匹配模式' }]}
                                        extra={
                                            selectedMatchType === 'regex' ? '请输入有效的正则表达式，将逐行匹配文件内容' :
                                                selectedMatchType === 'exact' ? '整行内容去掉首尾空格后必须完全等于此文本才算命中（不是子串包含）' :
                                                    '扫描时检查每一行是否包含该文本片段'
                                        }
                                    >
                                        <TextArea
                                            placeholder={
                                                selectedMatchType === 'contains' ? '如：rm -rf /' :
                                                    selectedMatchType === 'regex' ? '如：dd\\s+if=.*\\s+of=/dev/' :
                                                        '如：init 0'
                                            }
                                            rows={3}
                                            style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 13 }}
                                            disabled={isSystem}
                                        />
                                    </Form.Item>
                                </Col>
                                <Col span={8}>
                                    {patternValue && (
                                        <div className="blacklist-pattern-preview">
                                            <div className="blacklist-pattern-preview-label">模式预览</div>
                                            <code className="blacklist-pattern-preview-code">{patternValue}</code>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </div>

                        {/* ========== Card 3: 仿真测试（Tabs 布局） ========== */}
                        <div className="blacklist-form-card">
                            <h4 className="blacklist-form-section-title">
                                <ExperimentOutlined />仿真测试
                                <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400 }}>
                                    {simulating ? (
                                        <Tag color="processing" style={{ margin: 0 }}>
                                            <LoadingOutlined /> 匹配中...
                                        </Tag>
                                    ) : testResults && testResults.length > 0 ? (
                                        matchCount > 0 ? (
                                            <Tag color="red" style={{ margin: 0 }}>
                                                <FireOutlined /> 命中 {matchCount} 行（{matchedFiles.length} 个文件）
                                            </Tag>
                                        ) : (
                                            <Tag color="green" style={{ margin: 0 }}>
                                                <CheckCircleOutlined /> 无匹配
                                            </Tag>
                                        )
                                    ) : null}
                                </span>
                            </h4>

                            <Tabs
                                activeKey={simMode}
                                onChange={key => {
                                    setSimMode(key as 'template' | 'manual');
                                    // 切 tab 立即清空上一个 tab 的检测结果
                                    setTestResults(null);
                                    setMatchCount(0);
                                    setMatchedFiles([]);
                                }}
                                size="small"
                                items={[
                                    {
                                        key: 'template',
                                        label: <span><SelectOutlined /> 选择任务模板</span>,
                                        children: (
                                            <div style={{ paddingTop: 4 }}>
                                                <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                                                    选择任务模板自动加载 Playbook 的所有关联文件（入口文件、tasks、templates、handlers 等），实时验证当前规则的匹配效果。
                                                </Text>

                                                {/* 任务模板选择按钮 */}
                                                <div className="blacklist-sim-toolbar">
                                                    <Button
                                                        icon={<SelectOutlined />}
                                                        onClick={() => setSelectorOpen(true)}
                                                        loading={loadingPlaybook}
                                                    >
                                                        {selectedTemplateName ? '重新选择任务模板' : '选择任务模板'}
                                                    </Button>
                                                    {selectedTemplateName && (
                                                        <>
                                                            <div className="blacklist-sim-selected-info">
                                                                <Tag color="blue">{selectedTemplateName}</Tag>
                                                                <Tag color="green"><BookOutlined /> {selectedPlaybookName}</Tag>
                                                                <Tag>{loadedFiles.length} 个文件</Tag>
                                                            </div>
                                                            <Button
                                                                type="text" size="small" danger
                                                                icon={<DeleteOutlined />}
                                                                onClick={handleClearLoaded}
                                                            >
                                                                清除
                                                            </Button>
                                                        </>
                                                    )}
                                                </div>

                                                {/* 加载进度 */}
                                                {loadingPlaybook && (
                                                    <Progress
                                                        percent={loadProgress}
                                                        size="small"
                                                        status="active"
                                                        style={{ marginBottom: 12 }}
                                                    />
                                                )}

                                                {/* 已加载文件清单 */}
                                                {loadedFiles.length > 0 && (
                                                    <div className="blacklist-sim-files">
                                                        <div className="blacklist-sim-files-header">
                                                            <Text strong style={{ fontSize: 12 }}>
                                                                <FileTextOutlined /> 已加载文件
                                                            </Text>
                                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                                勾选参与检测的文件（{loadedFiles.filter(f => f.checked).length}/{loadedFiles.length}）
                                                            </Text>
                                                        </div>
                                                        <div className="blacklist-sim-files-body">
                                                            {loadedFiles.map(f => {
                                                                const isHit = matchedFiles.includes(f.path);
                                                                return (
                                                                    <div key={f.path} className={`blacklist-sim-file-item ${isHit ? 'hit' : ''}`}>
                                                                        <Checkbox
                                                                            checked={f.checked}
                                                                            onChange={e => handleFileCheckChange(f.path, e.target.checked)}
                                                                        />
                                                                        <Tag
                                                                            color={FILE_TYPE_COLORS[f.type] || '#999'}
                                                                            style={{ fontSize: 10, margin: 0, minWidth: 56, textAlign: 'center' }}
                                                                        >
                                                                            {f.type}
                                                                        </Tag>
                                                                        <span className="blacklist-sim-file-path">{f.path}</span>
                                                                        <span className="blacklist-sim-file-size">
                                                                            {f.size > 1024 ? `${(f.size / 1024).toFixed(1)}K` : `${f.size}B`}
                                                                        </span>
                                                                        {isHit && (
                                                                            <Badge count={testResults?.filter(r => r.matched && r.file === f.path).length || 0} size="small" />
                                                                        )}
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}

                                                {!selectedTemplateName && !loadingPlaybook && (
                                                    <Empty
                                                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                                                        description="请选择一个任务模板来加载 Playbook 文件"
                                                        style={{ margin: '24px 0' }}
                                                    />
                                                )}
                                            </div>
                                        ),
                                    },
                                    {
                                        key: 'manual',
                                        label: <span><FileTextOutlined /> 手动输入</span>,
                                        children: (
                                            <div style={{ paddingTop: 4 }}>
                                                <Text type="secondary" style={{ display: 'block', marginBottom: 12, fontSize: 13 }}>
                                                    粘贴或输入任意文本内容，每一行独立检测是否匹配当前规则。
                                                </Text>
                                                <TextArea
                                                    value={testInput}
                                                    onChange={e => setTestInput(e.target.value)}
                                                    placeholder={'粘贴或输入测试内容，每一行独立检测，例如：\n\nrm -rf /tmp/logs\necho "hello world"\ndd if=/dev/zero of=/dev/sda'}
                                                    rows={6}
                                                    style={{ fontFamily: "'SFMono-Regular', Consolas, monospace", fontSize: 13 }}
                                                />
                                            </div>
                                        ),
                                    },
                                ]}
                            />

                            {/* 测试结果 */}
                            <Spin spinning={simulating} tip="后端匹配中...">
                                {testResults && testResults.length > 0 && (
                                    <div className="blacklist-test-results">
                                        <div className="blacklist-test-results-header">
                                            <Text strong style={{ fontSize: 13 }}>检测结果</Text>
                                            <Space size={16}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    共 {testResults.length} 行
                                                </Text>
                                                {matchCount > 0 && (
                                                    <Text style={{ fontSize: 12, color: '#ff4d4f' }}>
                                                        <CloseCircleOutlined /> {matchCount} 行命中
                                                    </Text>
                                                )}
                                            </Space>
                                        </div>
                                        <div className="blacklist-test-results-body">
                                            {testResults.map(r => (
                                                <div key={r.line} className={`blacklist-test-line ${r.matched ? 'matched' : ''}`}>
                                                    <span className="blacklist-test-line-num">{r.line}</span>
                                                    {r.file && loadedFiles.length > 0 && (
                                                        <Tooltip title={r.file}>
                                                            <span className="blacklist-test-line-file">
                                                                {r.file.split('/').pop()}
                                                            </span>
                                                        </Tooltip>
                                                    )}
                                                    <span className="blacklist-test-line-content">{r.content || ' '}</span>
                                                    {r.matched && (
                                                        <span className="blacklist-test-line-badge">
                                                            <WarningOutlined /> 命中
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </Spin>
                        </div>

                    </div>
                </Form>
            </Spin>

            {/* ========== 任务模板选择 Modal ========== */}
            <Modal
                title={
                    <Space>
                        <CodeOutlined />
                        选择任务模板 — 仿真测试
                    </Space>
                }
                open={selectorOpen}
                onCancel={() => setSelectorOpen(false)}
                onOk={handleConfirmTemplate}
                okText="确认加载"
                okButtonProps={{ disabled: !pendingTask || initLoading }}
                width={1000}
                destroyOnHidden
            >
                <Spin spinning={initLoading} tip="加载中...">
                    {/* 搜索和筛选栏 */}
                    <Row gutter={12} style={{ marginBottom: 16 }}>
                        <Col span={12}>
                            <Input
                                placeholder="搜索任务名称..."
                                prefix={<SearchOutlined />}
                                value={taskSearch}
                                onChange={e => setTaskSearch(e.target.value)}
                                allowClear
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                placeholder="执行器类型"
                                value={executorType}
                                onChange={setExecutorType}
                                allowClear
                                style={{ width: '100%' }}
                                options={[
                                    { label: '本地执行', value: 'local' },
                                    { label: 'Docker', value: 'docker' },
                                ]}
                            />
                        </Col>
                        <Col span={6}>
                            <Select
                                placeholder="任务状态"
                                value={statusFilter}
                                onChange={setStatusFilter}
                                allowClear
                                style={{ width: '100%' }}
                                options={[
                                    { label: '仅就绪', value: 'ready' },
                                    { label: '仅审核中', value: 'review' },
                                ]}
                            />
                        </Col>
                    </Row>

                    <Row gutter={16} style={{ height: 420 }}>
                        {/* 左侧树 */}
                        <Col span={8} style={{ height: '100%', borderRight: '1px solid #f0f0f0', paddingRight: 16 }}>
                            <div style={{ marginBottom: 8 }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>Git仓库 / Playbook</Text>
                            </div>
                            <div style={{ height: 390, overflow: 'auto' }}>
                                {initLoading ? (
                                    <Skeleton active paragraph={{ rows: 10 }} />
                                ) : (
                                    <Tree
                                        showIcon
                                        showLine={{ showLeafIcon: false }}
                                        treeData={treeData}
                                        selectedKeys={[selectedTreeKey]}
                                        expandedKeys={expandedKeys}
                                        onSelect={(keys) => keys.length > 0 && setSelectedTreeKey(keys[0] as string)}
                                        onExpand={(keys) => setExpandedKeys(keys as string[])}
                                        style={{ fontSize: 13 }}
                                    />
                                )}
                            </div>
                        </Col>

                        {/* 右侧列表 */}
                        <Col span={16} style={{ height: '100%', paddingLeft: 8 }}>
                            <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                                <Text type="secondary" style={{ fontSize: 12 }}>任务模板列表</Text>
                                <Text type="secondary" style={{ fontSize: 12 }}>
                                    {selectedTreeKey === 'all' ? `共 ${tasksTotal} 个` : `已筛选 ${displayTasks.length} 个`}
                                </Text>
                            </div>
                            <div
                                ref={listRef}
                                style={{ height: 390, overflow: 'auto' }}
                                onScroll={handleScroll}
                            >
                                {initLoading ? (
                                    <Skeleton active paragraph={{ rows: 12 }} />
                                ) : displayTasks.length === 0 && !tasksLoading ? (
                                    <Empty description="暂无任务模板" style={{ marginTop: 100 }} />
                                ) : (
                                    <>
                                        {displayTasks.map((task: any) => {
                                            const isSelected = task.id === pendingTask?.id;
                                            const hasPlaybook = !!task.playbook_id;
                                            const playbook = playbookList.find((p: any) => p.id === task.playbook_id);

                                            return (
                                                <div
                                                    key={task.id}
                                                    onClick={() => hasPlaybook && setPendingTask(task)}
                                                    className={`blacklist-sim-task-item ${isSelected ? 'selected' : ''} ${!hasPlaybook ? 'disabled' : ''}`}
                                                >
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                                        <Text strong style={{ fontSize: 13 }}>{task.name}</Text>
                                                        {!hasPlaybook && (
                                                            <Tag color="default" style={{ fontSize: 10 }}>无 Playbook</Tag>
                                                        )}
                                                    </div>
                                                    {playbook && (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                                <BookOutlined style={{ marginRight: 4 }} />
                                                                {playbook.name}
                                                            </Text>
                                                            <Text type="secondary" style={{ fontSize: 11 }}>
                                                                <FileTextOutlined style={{ marginRight: 2 }} />
                                                                {playbook.file_path}
                                                            </Text>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                        {tasksLoading && (
                                            <div style={{ textAlign: 'center', padding: 12 }}>
                                                <Space><LoadingOutlined /><Text type="secondary">加载中...</Text></Space>
                                            </div>
                                        )}
                                        {!hasMore && displayTasks.length > 0 && (
                                            <div style={{ textAlign: 'center', padding: 8, color: '#ccc', fontSize: 12 }}>
                                                已加载全部 {displayTasks.length} 个任务
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        </Col>
                    </Row>

                    {/* 已选提示 */}
                    {pendingTask && (
                        <div style={{
                            marginTop: 12,
                            padding: '8px 12px',
                            background: '#e6f7ff',
                            border: '1px solid #91d5ff',
                        }}>
                            <Text strong>已选择：</Text> {pendingTask.name}
                            {playbookList.find((p: any) => p.id === pendingTask.playbook_id) && (
                                <Text type="secondary" style={{ marginLeft: 16 }}>
                                    Playbook: {playbookList.find((p: any) => p.id === pendingTask.playbook_id)?.name}
                                </Text>
                            )}
                        </div>
                    )}
                </Spin>
            </Modal>
        </div>
    );
};

export default BlacklistRuleForm;
