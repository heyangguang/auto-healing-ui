import {
    PlusOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined,
    CodeOutlined, FileTextOutlined, DeleteOutlined, ReloadOutlined, FolderOpenOutlined,
    InfoCircleOutlined, EditOutlined, ExclamationCircleOutlined, SearchOutlined,
    SettingOutlined, HistoryOutlined, BranchesOutlined, SaveOutlined, FolderOutlined,
    RightOutlined, DownOutlined, PlusSquareOutlined, MinusSquareOutlined, CheckOutlined,
    BookOutlined,
} from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import { PageContainer, ProCard, ModalForm, ProFormText, ProFormTextArea, ProFormSelect } from '@ant-design/pro-components';
import {
    Button, message, Space, Tag, Tooltip, Descriptions, Card, Row, Col,
    Typography, Tabs, Empty, Alert, Modal, Input, Table, Spin, Badge, Statistic, List, Form,
    Switch, Select, Tree, Steps, Checkbox, Divider, Popover, InputNumber, AutoComplete,
} from 'antd';
import type { DataNode, TreeProps } from 'antd/es/tree';
import React, { useState, useEffect, useMemo, useCallback, useRef, useDeferredValue, startTransition } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import {
    getPlaybooks, getPlaybook, createPlaybook, updatePlaybook, deletePlaybook,
    scanPlaybook, updatePlaybookVariables, setPlaybookReady, getPlaybookScanLogs,
    setPlaybookOffline, getPlaybookFiles,
} from '@/services/auto-healing/playbooks';
import { getGitRepos, getFiles } from '@/services/auto-healing/git-repos';
import { getExecutionTasks } from '@/services/auto-healing/execution';

const { Text, Paragraph } = Typography;

// UUID 生成函数（兼容非 HTTPS 环境）
const generateId = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        return crypto.randomUUID();
    }
    // Fallback: 使用 Math.random 生成伪随机 ID
    return `${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 11)}`;
};

// ==================== 状态配置 ====================
const statusConfig: Record<string, { text: string; color: string; icon: React.ReactNode }> = {
    pending: { text: '待扫描', color: '#8c8c8c', icon: <ClockCircleOutlined /> },
    scanned: { text: '待上线', color: '#1890ff', icon: <ClockCircleOutlined /> },
    ready: { text: '就绪', color: '#52c41a', icon: <CheckCircleOutlined /> },
    error: { text: '错误', color: '#ff4d4f', icon: <CloseCircleOutlined /> },
    invalid: { text: '无效', color: '#faad14', icon: <ExclamationCircleOutlined /> },
};

const variableTypeConfig: Record<string, { text: string; color: string }> = {
    string: { text: '字符串', color: '#1890ff' },
    number: { text: '数字', color: '#52c41a' },
    boolean: { text: '布尔', color: '#faad14' },
    list: { text: '列表', color: '#722ed1' },
    object: { text: '对象', color: '#13c2c2' },
    enum: { text: '枚举', color: '#eb2f96' },
    password: { text: '密码', color: '#f5222d' },
};

// 解析 Jinja2 default 表达式，提取实际默认值
const parseDefaultValue = (value: any): string => {
    if (value === undefined || value === null) return '';
    const strVal = String(value);

    // 匹配 {{ xxx | default(value) }} 格式
    const defaultMatch = strVal.match(/\|\s*default\s*\(\s*(.+?)\s*\)\s*\}\}/);
    if (defaultMatch) {
        let extracted = defaultMatch[1].trim();
        // 去除引号
        if ((extracted.startsWith("'") && extracted.endsWith("'")) ||
            (extracted.startsWith('"') && extracted.endsWith('"'))) {
            extracted = extracted.slice(1, -1);
        }
        return extracted;
    }

    // 如果是纯 Jinja2 变量引用 {{ xxx }}，返回空（表示动态值）
    if (/^\{\{\s*\w+/.test(strVal) && !strVal.includes('default')) {
        return '';
    }

    // 如果是 [object Object]，返回空
    if (strVal === '[object Object]') return '{}';

    // 其他情况直接返回
    return strVal;
};

// 根据类型格式化默认值显示 - 统一样式
const formatDefaultDisplay = (value: any, _type: string): React.ReactNode => {
    const parsed = parseDefaultValue(value);
    if (!parsed) return <Text type="secondary">-</Text>;
    // 统一用等宽字体显示
    return <Text style={{ fontFamily: 'SFMono-Regular, Consolas, monospace', fontSize: 13 }}>{parsed}</Text>;
};

// ==================== 主组件 ====================
const PlaybookList: React.FC = () => {
    const access = useAccess();
    const [playbooks, setPlaybooks] = useState<AutoHealing.Playbook[]>([]);
    const [repos, setRepos] = useState<AutoHealing.GitRepository[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState('');
    const deferredSearchText = useDeferredValue(searchText);

    // 选中的 Playbook
    const [selectedPlaybook, setSelectedPlaybook] = useState<AutoHealing.Playbook>();
    const [loadingDetail, setLoadingDetail] = useState(false);

    // 操作状态
    const [scanning, setScanning] = useState<string>();
    const [savingVariables, setSavingVariables] = useState(false);

    // 弹窗状态
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importStep, setImportStep] = useState(0);
    const [importRepoId, setImportRepoId] = useState<string>();
    const [importFileTree, setImportFileTree] = useState<DataNode[]>([]);
    const [importExpandedKeys, setImportExpandedKeys] = useState<string[]>([]);
    const [importSelectedFiles, setImportSelectedFiles] = useState<string[]>([]);
    const [importPlaybooks, setImportPlaybooks] = useState<{ file: string; name: string; description: string; config_mode: 'auto' | 'enhanced' }[]>([]);
    const [loadingFiles, setLoadingFiles] = useState(false);
    const [creating, setCreating] = useState(false);

    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [scanModeModalOpen, setScanModeModalOpen] = useState(false);
    const [scanMode, setScanMode] = useState<'auto' | 'enhanced'>('auto');

    // 扫描日志
    const [scanLogs, setScanLogs] = useState<AutoHealing.PlaybookScanLog[]>([]);
    const [loadingLogs, setLoadingLogs] = useState(false);

    // 文件列表
    const [playbookFiles, setPlaybookFiles] = useState<AutoHealing.PlaybookFile[]>([]);
    const [selectedFilePath, setSelectedFilePath] = useState('');
    const [fileContent, setFileContent] = useState('');
    const [loadingFileContent, setLoadingFileContent] = useState(false);

    // 变量编辑状态
    const [editedVariables, setEditedVariables] = useState<AutoHealing.PlaybookVariable[]>([]);
    // 使用 useDeferredValue 让表格渲染不阻塞 Tab 切换
    const deferredVariables = useDeferredValue(editedVariables);
    const isVariablesStale = deferredVariables !== editedVariables;
    const [activeTab, setActiveTab] = useState('overview');

    // 左侧树展开状态
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>([]);
    const [hasInitialExpanded, setHasInitialExpanded] = useState(false);
    const [initialized, setInitialized] = useState(false); // 等待所有数据加载完成

    // 任务模板数据（用于删除保护检查）
    const [tasks, setTasks] = useState<AutoHealing.ExecutionTask[]>([]);

    // ==================== 数据加载 ====================
    const loadPlaybooks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPlaybooks({ page: 1, page_size: 100 });
            setPlaybooks(res.data || res.items || []);
        } catch { /* ignore */ }
        finally { setLoading(false); }
    }, []);

    const loadRepos = useCallback(async () => {
        try {
            const res = await getGitRepos({ status: 'ready' });
            setRepos(res.data || []);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            try {
                // 并行加载所有数据
                const [playbooksRes, reposRes, tasksRes] = await Promise.all([
                    getPlaybooks({ page: 1, page_size: 100 }),
                    getGitRepos({ status: 'ready' }),
                    getExecutionTasks({ page: 1, page_size: 500 })
                ]);
                setPlaybooks(playbooksRes.data || playbooksRes.items || []);
                setRepos(reposRes.data || []);
                setTasks(tasksRes.data || []);
            } catch { /* ignore */ }
            finally {
                setLoading(false);
                setInitialized(true);
            }
        };
        init();
    }, []);

    // 获取 Playbook 关联的任务模板
    const getPlaybookTasks = useCallback((playbookId: string) => {
        return tasks.filter(t => t.playbook_id === playbookId);
    }, [tasks]);

    // 按仓库分组
    const groupedPlaybooks = useMemo(() => {
        const groups: Record<string, { repo: AutoHealing.GitRepository | null; playbooks: AutoHealing.Playbook[] }> = {};
        playbooks.forEach(p => {
            const repoId = p.repository_id;
            if (!groups[repoId]) {
                const repo = repos.find(r => r.id === repoId) || null;
                groups[repoId] = { repo, playbooks: [] };
            }
            groups[repoId].playbooks.push(p);
        });
        return groups;
    }, [playbooks, repos]);

    // 搜索过滤 (使用 deferred 值避免卡顿)
    const filteredGroupedPlaybooks = useMemo(() => {
        if (!deferredSearchText) return groupedPlaybooks;
        const result: typeof groupedPlaybooks = {};
        const searchLower = deferredSearchText.toLowerCase();
        Object.entries(groupedPlaybooks).forEach(([repoId, group]) => {
            const filtered = group.playbooks.filter(p =>
                p.name.toLowerCase().includes(searchLower) ||
                p.file_path.toLowerCase().includes(searchLower)
            );
            if (filtered.length > 0) {
                result[repoId] = { ...group, playbooks: filtered };
            }
        });
        return result;
    }, [groupedPlaybooks, deferredSearchText]);

    // 默认展开所有仓库
    useEffect(() => {
        const repoKeys = Object.keys(groupedPlaybooks);
        if (repoKeys.length > 0 && !hasInitialExpanded) {
            setExpandedKeys(repoKeys);
            setHasInitialExpanded(true);
        }
    }, [groupedPlaybooks, hasInitialExpanded]);

    // 统计 - 区分 pending 和 scanned 状态
    const stats = useMemo(() => ({
        total: playbooks.length,
        ready: playbooks.filter(p => p.status === 'ready').length,
        pendingScan: playbooks.filter(p => p.status === 'pending').length,
        pendingOnline: playbooks.filter(p => p.status === 'scanned').length,
        error: playbooks.filter(p => p.status === 'error' || p.status === 'invalid').length,
    }), [playbooks]);

    // ==================== 选中 Playbook ====================
    const handleSelectPlaybook = useCallback(async (playbook: AutoHealing.Playbook) => {
        setSelectedPlaybook(playbook);
        setActiveTab('overview');
        setScanLogs([]);
        setEditedVariables([]);
        setPlaybookFiles([]);
        setLoadingDetail(true);
        try {
            const res = await getPlaybook(playbook.id);
            setSelectedPlaybook(res.data);
            setEditedVariables(res.data.variables || []);
            // 加载扫描日志和文件列表
            setLoadingLogs(true);
            const [logsRes, filesRes] = await Promise.all([
                getPlaybookScanLogs(playbook.id, { page: 1, page_size: 10 }),
                getPlaybookFiles(playbook.id).catch(() => ({ data: { files: [] } })),
            ]);
            setScanLogs(logsRes.data || logsRes.items || []);
            setPlaybookFiles(filesRes.data?.files || []);
        } catch { /* ignore */ }
        finally { setLoadingDetail(false); setLoadingLogs(false); }
    }, []);

    // ==================== 操作 ====================
    const handleScan = useCallback(async () => {
        if (!selectedPlaybook) return;
        setScanning(selectedPlaybook.id);
        setScanModeModalOpen(false);
        try {
            const res = await scanPlaybook(selectedPlaybook.id, { mode: scanMode });
            message.success(`扫描完成：发现 ${res.data.variables_found} 个变量`);
            loadPlaybooks();
            // 刷新详情
            const detail = await getPlaybook(selectedPlaybook.id);
            setSelectedPlaybook(detail.data);
            setEditedVariables(detail.data.variables || []);
            // 刷新文件列表
            const filesRes = await getPlaybookFiles(selectedPlaybook.id);
            setPlaybookFiles(filesRes.data?.files || []);
            // 刷新日志
            const logsRes = await getPlaybookScanLogs(selectedPlaybook.id, { page: 1, page_size: 10 });
            setScanLogs(logsRes.data || logsRes.items || []);
        } catch { /* ignore */ }
        finally { setScanning(undefined); }
    }, [selectedPlaybook, scanMode, loadPlaybooks]);

    const handleSetReady = useCallback(async () => {
        if (!selectedPlaybook) return;
        try {
            await setPlaybookReady(selectedPlaybook.id);
            message.success('已设为就绪状态');
            loadPlaybooks();
            const detail = await getPlaybook(selectedPlaybook.id);
            setSelectedPlaybook(detail.data);
        } catch { /* ignore */ }
    }, [selectedPlaybook, loadPlaybooks]);

    const handleSetOffline = useCallback(async () => {
        if (!selectedPlaybook) return;
        try {
            await setPlaybookOffline(selectedPlaybook.id);
            message.success('已下线');
            loadPlaybooks();
            const detail = await getPlaybook(selectedPlaybook.id);
            setSelectedPlaybook(detail.data);
        } catch { /* ignore */ }
    }, [selectedPlaybook, loadPlaybooks]);

    const handleDelete = useCallback(async () => {
        if (!selectedPlaybook) return;
        const relatedTasks = getPlaybookTasks(selectedPlaybook.id);
        if (relatedTasks.length > 0) {
            message.error(`无法删除：该 Playbook 关联 ${relatedTasks.length} 个任务模板，请先删除任务模板`);
            return;
        }
        try {
            await deletePlaybook(selectedPlaybook.id);
            message.success('删除成功');
            setDeleteConfirmOpen(false);
            setSelectedPlaybook(undefined);
            loadPlaybooks();
        } catch { /* ignore */ }
    }, [selectedPlaybook, loadPlaybooks, getPlaybookTasks]);

    const handleSaveVariables = useCallback(async (vars?: AutoHealing.PlaybookVariable[]) => {
        if (!selectedPlaybook) return;
        const toSave = vars || editedVariables;
        setSavingVariables(true);
        try {
            await updatePlaybookVariables(selectedPlaybook.id, { variables: toSave });
            message.success('变量配置已保存');
        } catch {
            // 错误消息由全局错误处理器显示
        }
        finally { setSavingVariables(false); }
    }, [selectedPlaybook, editedVariables]);

    // 防抖自动保存 - 失焦后 500ms 自动保存
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const autoSaveVariables = useCallback((newVars: AutoHealing.PlaybookVariable[]) => {
        setEditedVariables(newVars);
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            if (selectedPlaybook) {
                try {
                    await updatePlaybookVariables(selectedPlaybook.id, { variables: newVars });
                    message.success('已自动保存');
                    // 静默刷新列表和当前详情
                    loadPlaybooks();
                    const detail = await getPlaybook(selectedPlaybook.id);
                    setSelectedPlaybook(detail.data);
                } catch {
                    message.error('自动保存失败');
                }
            }
        }, 500);
    }, [selectedPlaybook, loadPlaybooks]);

    // 选择文件查看内容
    const handleSelectFile = useCallback(async (filePath: string) => {
        if (!selectedPlaybook) return;
        setSelectedFilePath(filePath);
        setFileContent('');
        setLoadingFileContent(true);
        try {
            // 通过 Git 仓库 API 获取文件内容
            const res = await getFiles(selectedPlaybook.repository_id, filePath);
            setFileContent(res.data?.content || '');
        } catch {
            setFileContent('// 无法加载文件内容');
        }
        finally { setLoadingFileContent(false); }
    }, [selectedPlaybook]);

    // ==================== 导入 Playbook ====================
    const handleImportSelectRepo = useCallback(async (repoId: string) => {
        setImportRepoId(repoId);
        setLoadingFiles(true);
        try {
            const res = await getFiles(repoId);
            // 转换文件树，目录优先排序
            const buildTree = (nodes: any[]): DataNode[] => {
                // 排序：目录在前，文件在后，同类型按名称排序
                const sorted = [...nodes].sort((a, b) => {
                    const aIsDir = a.type === 'directory';
                    const bIsDir = b.type === 'directory';
                    if (aIsDir !== bIsDir) return aIsDir ? -1 : 1;
                    return a.name.localeCompare(b.name);
                });
                return sorted.map(node => {
                    const isDir = node.type === 'directory';
                    const isValidFile = /\.ya?ml$/i.test(node.name);
                    return {
                        key: node.path,
                        title: <span style={{ fontSize: 13 }}>{node.name}</span>,
                        icon: isDir
                            ? <FolderOutlined style={{ color: '#faad14' }} />
                            : isValidFile
                                ? <FileTextOutlined style={{ color: '#1890ff' }} />
                                : <FileTextOutlined style={{ color: '#d9d9d9' }} />,
                        isLeaf: !isDir,
                        children: node.children ? buildTree(node.children) : undefined,
                        // 目录：可展开但不可勾选；只有 yml/yaml 文件可选
                        checkable: !isDir && isValidFile,
                        selectable: false,
                        disabled: !isDir && !isValidFile,
                    };
                });
            };
            const fileData = Array.isArray(res.data) ? res.data : (res.data?.files || []);
            const tree = buildTree(fileData);
            setImportFileTree(tree);
            // 收集所有目录的 key 并默认展开
            const collectDirKeys = (nodes: DataNode[]): string[] => {
                return nodes.flatMap(n => {
                    if (n.children && n.children.length > 0) {
                        return [n.key as string, ...collectDirKeys(n.children)];
                    }
                    return [];
                });
            };
            setImportExpandedKeys(collectDirKeys(tree));
            setImportStep(1);
        } catch { /* 错误消息由全局错误处理器显示 */ }
        finally { setLoadingFiles(false); }
    }, []);

    const handleImportFilesSelect = useCallback(() => {
        // 根据选中的文件创建 Playbook 列表
        const newPlaybooks = importSelectedFiles.map(file => ({
            file,
            name: file.replace(/\.ya?ml$/i, '').replace(/\//g, '-'),
            description: '',
            config_mode: 'auto' as const,
        }));
        setImportPlaybooks(newPlaybooks);
        setImportStep(2);
    }, [importSelectedFiles]);

    const handleImportCreate = useCallback(async () => {
        if (!importRepoId) return;
        setCreating(true);
        try {
            for (const pb of importPlaybooks) {
                await createPlaybook({
                    repository_id: importRepoId,
                    name: pb.name,
                    file_path: pb.file,
                    config_mode: pb.config_mode,
                    description: pb.description,
                });
            }
            message.success(`成功创建 ${importPlaybooks.length} 个 Playbook`);
            setImportModalOpen(false);
            setImportStep(0);
            setImportRepoId(undefined);
            setImportSelectedFiles([]);
            setImportPlaybooks([]);
            loadPlaybooks();
        } catch { /* ignore */ }
        finally { setCreating(false); }
    }, [importRepoId, importPlaybooks, loadPlaybooks]);

    const closeImportModal = () => {
        setImportModalOpen(false);
        setImportStep(0);
        setImportRepoId(undefined);
        setImportSelectedFiles([]);
        setImportPlaybooks([]);
        setImportFileTree([]);
    };

    // ==================== 虚拟滚动：扁平化列表 ====================
    const flattenedList = useMemo(() => {
        const items: Array<{ type: 'repo' | 'playbook'; repoId: string; repo?: AutoHealing.GitRepository | null; playbook?: AutoHealing.Playbook }> = [];
        Object.entries(filteredGroupedPlaybooks).forEach(([repoId, group]) => {
            items.push({ type: 'repo', repoId, repo: group.repo });
            if (expandedKeys.includes(repoId)) {
                group.playbooks.forEach(pb => {
                    items.push({ type: 'playbook', repoId, playbook: pb });
                });
            }
        });
        return items;
    }, [filteredGroupedPlaybooks, expandedKeys]);

    // 虚拟滚动容器 ref
    const parentRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
        count: flattenedList.length,
        getScrollElement: () => parentRef.current,
        estimateSize: (index) => flattenedList[index]?.type === 'repo' ? 42 : 58,
        overscan: 5,
    });

    // ==================== 渲染左侧列表 ====================
    const renderLeftPanel = () => (
        <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid #f0f0f0' }}>
                <Input
                    placeholder="搜索 Playbook..."
                    prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    allowClear
                />
            </div>
            <div ref={parentRef} style={{ flex: 1, overflowY: 'auto' }}>
                {!initialized ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                        <Spin tip="加载中..." />
                    </div>
                ) : flattenedList.length === 0 ? (
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 Playbook" style={{ marginTop: 40 }} />
                ) : (
                    <div style={{ height: virtualizer.getTotalSize(), position: 'relative' }}>
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const item = flattenedList[virtualRow.index];
                            if (item.type === 'repo') {
                                const isExpanded = expandedKeys.includes(item.repoId);
                                const group = filteredGroupedPlaybooks[item.repoId];
                                return (
                                    <div
                                        key={virtualRow.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: virtualRow.size,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <div
                                            style={{
                                                padding: '10px 16px',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 8,
                                                color: '#595959',
                                                fontSize: 13,
                                                fontWeight: 500,
                                                backgroundColor: '#fafafa',
                                                borderBottom: '1px solid #f0f0f0',
                                                height: '100%',
                                                boxSizing: 'border-box',
                                            }}
                                            onClick={() => {
                                                setExpandedKeys(prev =>
                                                    prev.includes(item.repoId) ? prev.filter(k => k !== item.repoId) : [...prev, item.repoId]
                                                );
                                            }}
                                        >
                                            {isExpanded ? <DownOutlined style={{ fontSize: 10 }} /> : <RightOutlined style={{ fontSize: 10 }} />}
                                            <FolderOpenOutlined style={{ fontSize: 14 }} />
                                            <span style={{ flex: 1 }}>{item.repo?.name || '未知仓库'}</span>
                                            <Badge count={group?.playbooks.length || 0} size="small" style={{ backgroundColor: '#1890ff' }} />
                                        </div>
                                    </div>
                                );
                            } else {
                                const pb = item.playbook!;
                                const st = statusConfig[pb.status] || statusConfig.pending;
                                const isSelected = selectedPlaybook?.id === pb.id;
                                return (
                                    <div
                                        key={virtualRow.key}
                                        style={{
                                            position: 'absolute',
                                            top: 0,
                                            left: 0,
                                            width: '100%',
                                            height: virtualRow.size,
                                            transform: `translateY(${virtualRow.start}px)`,
                                        }}
                                    >
                                        <div
                                            onClick={() => handleSelectPlaybook(pb)}
                                            style={{
                                                padding: '12px 16px 12px 36px',
                                                cursor: 'pointer',
                                                backgroundColor: isSelected ? '#e6f7ff' : 'transparent',
                                                borderLeft: isSelected ? '3px solid #1890ff' : '3px solid transparent',
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 10,
                                                height: '100%',
                                                boxSizing: 'border-box',
                                            }}
                                        >
                                            {/* 状态圆点放在最左侧 */}
                                            {(() => {
                                                const color = (statusConfig[pb.status] || statusConfig.pending).color;
                                                const title = (statusConfig[pb.status] || statusConfig.pending).text;
                                                return (
                                                    <div style={{
                                                        width: 8,
                                                        height: 8,
                                                        borderRadius: '50%',
                                                        backgroundColor: color,
                                                        flexShrink: 0,
                                                    }} title={title} />
                                                );
                                            })()}
                                            <CodeOutlined style={{ color: '#8c8c8c', fontSize: 14 }} />
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <div style={{ fontWeight: isSelected ? 600 : 400, fontSize: 13, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                    {pb.name}
                                                </div>
                                                <div style={{ fontSize: 12, color: '#8c8c8c' }}>{pb.file_path}</div>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }
                        })}
                    </div>
                )}
            </div>
            <div style={{ padding: '12px 16px', borderTop: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Space size={12}>
                    <Text type="secondary" style={{ color: '#8c8c8c' }}>待扫描: {stats.pendingScan}</Text>
                    <Text type="secondary" style={{ color: '#1890ff' }}>待上线: {stats.pendingOnline}</Text>
                    <Text type="secondary" style={{ color: '#52c41a' }}>就绪: {stats.ready}</Text>
                    {stats.error > 0 && <Text type="secondary" style={{ color: '#ff4d4f' }}>错误: {stats.error}</Text>}
                </Space>
                <Button size="small" icon={<ReloadOutlined />} onClick={loadPlaybooks} loading={loading} />
            </div>
        </div>
    );

    // ==================== 渲染右侧详情 ====================
    const renderRightPanel = () => {
        if (!selectedPlaybook) {
            return (
                <div style={{ height: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Empty description="请从左侧选择一个 Playbook" />
                </div>
            );
        }

        if (loadingDetail) {
            return (
                <div style={{ height: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Spin size="large" />
                </div>
            );
        }

        // 状态标签：pending 根据是否有扫描时间区分
        const getStatusInfo = () => {
            // 直接使用 statusConfig
            return statusConfig[selectedPlaybook.status] || statusConfig.pending;
        };
        const statusInfo = getStatusInfo();

        return (
            <div style={{ height: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column' }}>
                {/* 头部 */}
                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                        <Space size={12}>
                            <CodeOutlined style={{ fontSize: 24, color: '#1890ff' }} />
                            <div>
                                <Text strong style={{ fontSize: 18 }}>{selectedPlaybook.name}</Text>
                                <Tag color={statusInfo.color} style={{ marginLeft: 12 }}>{statusInfo.text}</Tag>
                            </div>
                        </Space>
                        <div style={{ marginTop: 4, color: '#8c8c8c', fontSize: 13 }}>
                            <FileTextOutlined style={{ marginRight: 4 }} /> {selectedPlaybook.file_path}
                        </div>
                    </div>
                    <Space>
                        <Button icon={<SyncOutlined spin={scanning === selectedPlaybook.id} />} onClick={handleScan} disabled={scanning === selectedPlaybook.id}>
                            扫描变量
                        </Button>
                        {selectedPlaybook.status === 'scanned' && (
                            <Button type="primary" icon={<CheckCircleOutlined />} onClick={handleSetReady} disabled={!access.canManagePlaybook}>上线</Button>
                        )}
                        {selectedPlaybook.status === 'ready' && (
                            <Button icon={<ClockCircleOutlined />} onClick={handleSetOffline} disabled={!access.canManagePlaybook}>下线</Button>
                        )}
                        <Button icon={<EditOutlined />} onClick={() => setEditModalOpen(true)} disabled={!access.canManagePlaybook}>编辑</Button>
                        <Button danger icon={<DeleteOutlined />} onClick={() => setDeleteConfirmOpen(true)} disabled={!access.canManagePlaybook}>删除</Button>
                    </Space>
                </div>

                {/* Tabs */}
                <div style={{ flex: 1, overflow: 'auto' }}>
                    <Tabs
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        style={{ height: '100%' }}
                        tabBarStyle={{ padding: '0 24px', marginBottom: 0 }}
                        items={[
                            {
                                key: 'overview',
                                label: '概览',
                                children: (
                                    <div style={{ padding: 24, overflowY: 'auto', height: 'calc(100% - 46px)' }}>
                                        {/* 简约统计行 */}
                                        <div style={{ display: 'flex', gap: 32, marginBottom: 24, padding: '16px 24px', background: '#fafafa' /* borderRadius: 8 */ }}>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>变量总数</Text>
                                                <div style={{ fontSize: 24, fontWeight: 600 }}>{selectedPlaybook.variables?.length || 0}</div>
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>必填变量</Text>
                                                <div style={{ fontSize: 24, fontWeight: 600, color: '#ff4d4f' }}>{selectedPlaybook.variables?.filter((v: any) => v.required).length || 0}</div>
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>有默认值</Text>
                                                <div style={{ fontSize: 24, fontWeight: 600, color: '#52c41a' }}>{selectedPlaybook.variables?.filter((v: any) => v.default).length || 0}</div>
                                            </div>
                                            <div>
                                                <Text type="secondary" style={{ fontSize: 12 }}>扫描次数</Text>
                                                <div style={{ fontSize: 24, fontWeight: 600 }}>{scanLogs.length}</div>
                                            </div>
                                        </div>

                                        <Row gutter={16}>
                                            {/* 左列 */}
                                            <Col span={12}>
                                                {/* 基本信息 */}
                                                <Card title="基本信息" size="small" style={{ marginBottom: 16 }}>
                                                    <Descriptions column={1} size="small">
                                                        <Descriptions.Item label="名称">{selectedPlaybook.name}</Descriptions.Item>
                                                        <Descriptions.Item label="状态">
                                                            <Tag color={statusInfo.color}>{statusInfo.text}</Tag>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="入口文件">
                                                            <Text code copyable style={{ fontSize: 12 }}>{selectedPlaybook.file_path}</Text>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="扫描模式">
                                                            <Tag color={selectedPlaybook.config_mode === 'enhanced' ? 'purple' : 'blue'}>
                                                                {selectedPlaybook.config_mode === 'enhanced' ? '增强模式' : '自动模式'}
                                                            </Tag>
                                                        </Descriptions.Item>
                                                        <Descriptions.Item label="描述">
                                                            {selectedPlaybook.description || <Text type="secondary">-</Text>}
                                                        </Descriptions.Item>
                                                    </Descriptions>
                                                </Card>

                                                {/* 关联仓库 */}
                                                <Card title="关联仓库" size="small" style={{ marginBottom: 16 }}>
                                                    {(() => {
                                                        const repo = repos.find(r => r.id === selectedPlaybook.repository_id);
                                                        return repo ? (
                                                            <Descriptions column={1} size="small">
                                                                <Descriptions.Item label="仓库">{repo.name}</Descriptions.Item>
                                                                <Descriptions.Item label="分支">
                                                                    <Tag icon={<BranchesOutlined />}>{repo.default_branch}</Tag>
                                                                </Descriptions.Item>
                                                                <Descriptions.Item label="地址">
                                                                    <Text copyable style={{ fontSize: 11 }}>{repo.url}</Text>
                                                                </Descriptions.Item>
                                                            </Descriptions>
                                                        ) : <Text type="secondary">仓库信息不可用</Text>;
                                                    })()}
                                                </Card>

                                                {/* 时间信息 */}
                                                <Card title="时间记录" size="small">
                                                    <Descriptions column={1} size="small">
                                                        <Descriptions.Item label="创建">{new Date(selectedPlaybook.created_at).toLocaleString()}</Descriptions.Item>
                                                        <Descriptions.Item label="更新">{new Date(selectedPlaybook.updated_at || selectedPlaybook.created_at).toLocaleString()}</Descriptions.Item>
                                                        <Descriptions.Item label="扫描">
                                                            {selectedPlaybook.last_scanned_at ? new Date(selectedPlaybook.last_scanned_at).toLocaleString() : <Text type="secondary">尚未扫描</Text>}
                                                        </Descriptions.Item>
                                                    </Descriptions>
                                                </Card>
                                            </Col>

                                            {/* 右列 */}
                                            <Col span={12}>
                                                {/* 文件来源 */}
                                                <Card title={`文件列表 (${playbookFiles.length})`} size="small" style={{ marginBottom: 16 }}>
                                                    {playbookFiles.length > 0 ? (
                                                        <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                                                            {playbookFiles.map((file, i) => (
                                                                <div key={i} style={{ padding: '4px 0', borderBottom: i < playbookFiles.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                                                    <Space>
                                                                        <FileTextOutlined style={{ color: file.type === 'entry' ? '#1890ff' : '#8c8c8c' }} />
                                                                        <Text code style={{ fontSize: 12 }}>{file.path}</Text>
                                                                        <Tag color={file.type === 'entry' ? 'blue' : file.type === 'task' ? 'green' : 'default'} style={{ fontSize: 10 }}>
                                                                            {file.type}
                                                                        </Tag>
                                                                    </Space>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : <Text type="secondary">暂无文件信息，请先扫描</Text>}
                                                </Card>

                                                {/* 变量类型分布 */}
                                                {selectedPlaybook.variables && selectedPlaybook.variables.length > 0 && (
                                                    <Card title="变量类型分布" size="small">
                                                        <Space wrap>
                                                            {Object.entries(
                                                                selectedPlaybook.variables.reduce((acc: Record<string, number>, v: any) => {
                                                                    acc[v.type] = (acc[v.type] || 0) + 1;
                                                                    return acc;
                                                                }, {})
                                                            ).map(([type, count]) => {
                                                                const cfg = variableTypeConfig[type] || variableTypeConfig.string;
                                                                return (
                                                                    <Tag key={type} color={cfg.color}>
                                                                        {cfg.text}: {count as number}
                                                                    </Tag>
                                                                );
                                                            })}
                                                        </Space>
                                                    </Card>
                                                )}
                                            </Col>
                                        </Row>

                                        {/* 根据状态显示不同提示 */}
                                        {selectedPlaybook.status === 'pending' && !selectedPlaybook.last_scanned_at && (
                                            <Alert
                                                type="warning"
                                                showIcon
                                                message="此 Playbook 尚未扫描变量，请点击「扫描变量」按钮"
                                                style={{ marginTop: 16 }}
                                            />
                                        )}
                                        {selectedPlaybook.status === 'scanned' && (
                                            <Alert
                                                type="info"
                                                showIcon
                                                message="变量已扫描，请点击「上线」按钮使 Playbook 可用于执行任务"
                                                style={{ marginTop: 16 }}
                                            />
                                        )}
                                        {selectedPlaybook.status === 'error' && (
                                            <Alert
                                                type="error"
                                                showIcon
                                                message="扫描出错，请检查入口文件和仓库同步状态"
                                                style={{ marginTop: 16 }}
                                            />
                                        )}
                                        {selectedPlaybook.status === 'invalid' && (
                                            <Alert
                                                type="error"
                                                showIcon
                                                message="入口文件不存在，请检查仓库同步状态"
                                                style={{ marginTop: 16 }}
                                            />
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'variables',
                                label: <Badge count={editedVariables.length} size="small" offset={[8, 0]}>变量 </Badge>,
                                children: (
                                    <div style={{ padding: 24, overflowY: 'auto' }}>
                                        {editedVariables.length > 0 ? (
                                            <>
                                                <div style={{ marginBottom: 16 }}>
                                                    <Text type="secondary">共 {editedVariables.length} 个变量，修改后自动保存</Text>
                                                </div>
                                                <Table
                                                    size="middle"
                                                    rowKey="name"
                                                    dataSource={deferredVariables}
                                                    pagination={false}
                                                    style={{ opacity: isVariablesStale ? 0.6 : 1, transition: 'opacity 0.15s' }}
                                                    columns={[
                                                        {
                                                            title: '变量名',
                                                            dataIndex: 'name',
                                                            width: 180,
                                                            render: v => <span style={{ fontWeight: 600, fontSize: 14 }}>{v}</span>,
                                                        },
                                                        {
                                                            title: '类型',
                                                            dataIndex: 'type',
                                                            width: 100,
                                                            render: (v, record) => {
                                                                const cfg = variableTypeConfig[v] || variableTypeConfig.string;
                                                                return (
                                                                    <Select
                                                                        variant="borderless"
                                                                        value={v}
                                                                        popupMatchSelectWidth={false}
                                                                        style={{ width: 90, color: cfg.color, fontWeight: 500 }}
                                                                        onChange={val => {
                                                                            autoSaveVariables(
                                                                                editedVariables.map(v => v.name === record.name ? { ...v, type: val } : v)
                                                                            );
                                                                        }}
                                                                        options={Object.entries(variableTypeConfig).map(([k, c]) => ({
                                                                            value: k,
                                                                            label: <span style={{ color: c.color, fontWeight: 500 }}>{c.text}</span>
                                                                        }))}
                                                                    />
                                                                );
                                                            },
                                                        },
                                                        {
                                                            title: '必填',
                                                            dataIndex: 'required',
                                                            width: 70,
                                                            align: 'center' as const,
                                                            render: (v, record) => (
                                                                <Switch
                                                                    size="small"
                                                                    checked={v}
                                                                    onChange={val => {
                                                                        autoSaveVariables(
                                                                            editedVariables.map(v => v.name === record.name ? { ...v, required: val } : v)
                                                                        );
                                                                    }}
                                                                />
                                                            ),
                                                        },
                                                        {
                                                            title: '默认值',
                                                            dataIndex: 'default',
                                                            width: 180,
                                                            render: (v, record) => {
                                                                const parsed = parseDefaultValue(v);
                                                                const saveDefault = (newVal: any) => {
                                                                    autoSaveVariables(
                                                                        editedVariables.map(item => item.name === record.name ? { ...item, default: newVal } : item)
                                                                    );
                                                                };

                                                                // 根据类型渲染不同的输入组件
                                                                switch (record.type) {
                                                                    case 'number':
                                                                        return (
                                                                            <InputNumber
                                                                                key={`${record.name}-default`}
                                                                                variant="borderless"
                                                                                defaultValue={parsed ? Number(parsed) : undefined}
                                                                                placeholder="数字"
                                                                                style={{ width: '100%' }}
                                                                                onBlur={e => {
                                                                                    const val = e.target.value;
                                                                                    if (val !== parsed) saveDefault(val);
                                                                                }}
                                                                            />
                                                                        );
                                                                    case 'boolean':
                                                                        return (
                                                                            <Select
                                                                                variant="borderless"
                                                                                value={parsed === 'true' ? 'true' : parsed === 'false' ? 'false' : undefined}
                                                                                placeholder="选择"
                                                                                style={{ width: '100%' }}
                                                                                allowClear
                                                                                onChange={val => saveDefault(val)}
                                                                                options={[
                                                                                    { value: 'true', label: 'true' },
                                                                                    { value: 'false', label: 'false' },
                                                                                ]}
                                                                            />
                                                                        );
                                                                    case 'enum': {
                                                                        const enumVals = record.enum || [];
                                                                        const currentDefault = parsed; // 当前默认值
                                                                        return (
                                                                            <Popover
                                                                                trigger="click"
                                                                                placement="bottomLeft"
                                                                                destroyTooltipOnHide
                                                                                title={<span style={{ fontWeight: 500 }}>编辑枚举值</span>}
                                                                                content={
                                                                                    <div style={{ width: 280 }}>
                                                                                        {enumVals.length > 0 ? enumVals.map((val, i) => {
                                                                                            const isDefault = val === currentDefault;
                                                                                            return (
                                                                                                <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                                                                                    <Input
                                                                                                        defaultValue={val}
                                                                                                        style={{ flex: 1 }}
                                                                                                        onBlur={e => {
                                                                                                            const newVal = e.target.value;
                                                                                                            if (newVal !== val) {
                                                                                                                const newEnums = [...enumVals];
                                                                                                                newEnums[i] = newVal;
                                                                                                                // 如果修改的是当前默认值，同时更新default
                                                                                                                const updates: any = { enum: newEnums };
                                                                                                                if (isDefault) updates.default = newVal;
                                                                                                                autoSaveVariables(
                                                                                                                    editedVariables.map(v => v.name === record.name ? { ...v, ...updates } : v)
                                                                                                                );
                                                                                                            }
                                                                                                        }}
                                                                                                    />
                                                                                                    <Tooltip title={isDefault ? '当前默认值' : '设为默认'}>
                                                                                                        <Button
                                                                                                            size="small"
                                                                                                            type={isDefault ? 'primary' : 'default'}
                                                                                                            icon={<CheckOutlined />}
                                                                                                            style={{ opacity: isDefault ? 1 : 0.5 }}
                                                                                                            onClick={() => {
                                                                                                                if (!isDefault) {
                                                                                                                    saveDefault(val);
                                                                                                                }
                                                                                                            }}
                                                                                                        />
                                                                                                    </Tooltip>
                                                                                                    <Button
                                                                                                        size="small"
                                                                                                        danger
                                                                                                        icon={<DeleteOutlined />}
                                                                                                        onClick={() => {
                                                                                                            const newEnums = enumVals.filter((_, idx) => idx !== i);
                                                                                                            // 如果删除的是默认值，清空default
                                                                                                            const updates: any = { enum: newEnums };
                                                                                                            if (isDefault) updates.default = undefined;
                                                                                                            autoSaveVariables(
                                                                                                                editedVariables.map(v => v.name === record.name ? { ...v, ...updates } : v)
                                                                                                            );
                                                                                                        }}
                                                                                                    />
                                                                                                </div>
                                                                                            );
                                                                                        }) : <Text type="secondary">暂无枚举值</Text>}
                                                                                        <Button
                                                                                            type="dashed"
                                                                                            size="small"
                                                                                            icon={<PlusOutlined />}
                                                                                            style={{ width: '100%', marginTop: 4 }}
                                                                                            onClick={() => {
                                                                                                const newEnums = [...enumVals, `选项${enumVals.length + 1}`];
                                                                                                autoSaveVariables(
                                                                                                    editedVariables.map(v => v.name === record.name ? { ...v, enum: newEnums } : v)
                                                                                                );
                                                                                            }}
                                                                                        >
                                                                                            添加枚举值
                                                                                        </Button>
                                                                                    </div>
                                                                                }
                                                                            >
                                                                                <Button type="link" style={{ padding: 0 }}>
                                                                                    {enumVals.length > 0 ? (
                                                                                        <span>
                                                                                            {enumVals.join(' / ')}
                                                                                            {currentDefault && <span style={{ color: '#52c41a', marginLeft: 8 }}>(默认: {currentDefault})</span>}
                                                                                        </span>
                                                                                    ) : '点击编辑'}
                                                                                </Button>
                                                                            </Popover>
                                                                        );
                                                                    }
                                                                    case 'list': {
                                                                        // 可选项存储在 enum，默认值存储在 default（JSON数组）
                                                                        const options = record.enum || [];
                                                                        let defaultVals: string[] = [];
                                                                        try {
                                                                            if (parsed) {
                                                                                const p = JSON.parse(parsed);
                                                                                if (Array.isArray(p)) defaultVals = p;
                                                                            }
                                                                        } catch { /* ignore */ }

                                                                        const updateOptions = (newOptions: string[]) => {
                                                                            autoSaveVariables(
                                                                                editedVariables.map(v => v.name === record.name ? { ...v, enum: newOptions } : v)
                                                                            );
                                                                        };

                                                                        const toggleDefault = (val: string) => {
                                                                            const newDefaults = defaultVals.includes(val)
                                                                                ? defaultVals.filter(d => d !== val)
                                                                                : [...defaultVals, val];
                                                                            saveDefault(JSON.stringify(newDefaults));
                                                                        };

                                                                        return (
                                                                            <Popover
                                                                                trigger="click"
                                                                                placement="bottomLeft"
                                                                                destroyTooltipOnHide
                                                                                title={<span style={{ fontWeight: 500 }}>编辑列表可选项</span>}
                                                                                content={
                                                                                    <div style={{ width: 280 }}>
                                                                                        <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
                                                                                            勾选的项将作为默认值
                                                                                        </div>
                                                                                        {options.length > 0 ? options.map((val, i) => {
                                                                                            const isDefault = defaultVals.includes(val);
                                                                                            return (
                                                                                                <div key={generateId()} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                                                                                    <Checkbox
                                                                                                        checked={isDefault}
                                                                                                        onChange={() => toggleDefault(val)}
                                                                                                    />
                                                                                                    <Input
                                                                                                        defaultValue={val}
                                                                                                        style={{ flex: 1 }}
                                                                                                        onBlur={e => {
                                                                                                            const newVal = e.target.value;
                                                                                                            if (newVal !== val) {
                                                                                                                const newOptions = [...options];
                                                                                                                newOptions[i] = newVal;
                                                                                                                // 如果修改的是默认值中的项，同步更新default
                                                                                                                if (isDefault) {
                                                                                                                    const newDefaults = defaultVals.map(d => d === val ? newVal : d);
                                                                                                                    autoSaveVariables(
                                                                                                                        editedVariables.map(v => v.name === record.name ? { ...v, enum: newOptions, default: JSON.stringify(newDefaults) } : v)
                                                                                                                    );
                                                                                                                } else {
                                                                                                                    updateOptions(newOptions);
                                                                                                                }
                                                                                                            }
                                                                                                        }}
                                                                                                    />
                                                                                                    <Button
                                                                                                        size="small"
                                                                                                        danger
                                                                                                        icon={<DeleteOutlined />}
                                                                                                        onClick={() => {
                                                                                                            const newOptions = options.filter((_, idx) => idx !== i);
                                                                                                            // 如果删除的是默认值中的项，同步从default中移除
                                                                                                            const newDefaults = defaultVals.filter(d => d !== val);
                                                                                                            autoSaveVariables(
                                                                                                                editedVariables.map(v => v.name === record.name ? { ...v, enum: newOptions, default: JSON.stringify(newDefaults) } : v)
                                                                                                            );
                                                                                                        }}
                                                                                                    />
                                                                                                </div>
                                                                                            );
                                                                                        }) : <Text type="secondary">暂无可选项</Text>}
                                                                                        <Button
                                                                                            type="dashed"
                                                                                            size="small"
                                                                                            icon={<PlusOutlined />}
                                                                                            style={{ width: '100%', marginTop: 4 }}
                                                                                            onClick={() => {
                                                                                                const newOptions = [...options, `选项${options.length + 1}`];
                                                                                                updateOptions(newOptions);
                                                                                            }}
                                                                                        >
                                                                                            添加可选项
                                                                                        </Button>
                                                                                    </div>
                                                                                }
                                                                            >
                                                                                <Button type="link" style={{ padding: 0 }}>
                                                                                    {options.length > 0 ? (
                                                                                        <span>
                                                                                            [{options.length}可选/{defaultVals.length}默认]
                                                                                        </span>
                                                                                    ) : '点击编辑'}
                                                                                </Button>
                                                                            </Popover>
                                                                        );
                                                                    }
                                                                    case 'object': {
                                                                        // 可选的key存储在 enum，默认值存储在 default（JSON对象）
                                                                        const options = record.enum || [];
                                                                        let defaultObj: Record<string, string> = {};
                                                                        try { if (parsed) defaultObj = JSON.parse(parsed); } catch { /* ignore */ }
                                                                        const selectedKeys = Object.keys(defaultObj);

                                                                        const updateOptions = (newOptions: string[]) => {
                                                                            autoSaveVariables(
                                                                                editedVariables.map(v => v.name === record.name ? { ...v, enum: newOptions } : v)
                                                                            );
                                                                        };

                                                                        const toggleKey = (key: string) => {
                                                                            const newObj = { ...defaultObj };
                                                                            if (key in newObj) {
                                                                                delete newObj[key];
                                                                            } else {
                                                                                newObj[key] = '';
                                                                            }
                                                                            saveDefault(JSON.stringify(newObj));
                                                                        };

                                                                        const updateValue = (key: string, value: string) => {
                                                                            saveDefault(JSON.stringify({ ...defaultObj, [key]: value }));
                                                                        };

                                                                        return (
                                                                            <Popover
                                                                                trigger="click"
                                                                                placement="bottomLeft"
                                                                                destroyTooltipOnHide
                                                                                title={<span style={{ fontWeight: 500 }}>编辑对象可选属性</span>}
                                                                                content={
                                                                                    <div style={{ width: 360 }}>
                                                                                        <div style={{ marginBottom: 8, fontSize: 12, color: '#8c8c8c' }}>
                                                                                            勾选的属性将包含在默认值中
                                                                                        </div>
                                                                                        {options.length > 0 ? options.map((key, i) => {
                                                                                            const isSelected = key in defaultObj;
                                                                                            return (
                                                                                                <div key={generateId()} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center' }}>
                                                                                                    <Checkbox
                                                                                                        checked={isSelected}
                                                                                                        onChange={() => toggleKey(key)}
                                                                                                    />
                                                                                                    <Input
                                                                                                        placeholder="key"
                                                                                                        defaultValue={key}
                                                                                                        style={{ width: 100 }}
                                                                                                        onBlur={e => {
                                                                                                            const newKey = e.target.value;
                                                                                                            if (newKey !== key) {
                                                                                                                const newOptions = [...options];
                                                                                                                newOptions[i] = newKey;
                                                                                                                // 如果这个key在默认值中，需要同步更新
                                                                                                                if (isSelected) {
                                                                                                                    const newObj = { ...defaultObj };
                                                                                                                    const oldVal = newObj[key];
                                                                                                                    delete newObj[key];
                                                                                                                    newObj[newKey] = oldVal;
                                                                                                                    autoSaveVariables(
                                                                                                                        editedVariables.map(v => v.name === record.name ? { ...v, enum: newOptions, default: JSON.stringify(newObj) } : v)
                                                                                                                    );
                                                                                                                } else {
                                                                                                                    updateOptions(newOptions);
                                                                                                                }
                                                                                                            }
                                                                                                        }}
                                                                                                    />
                                                                                                    <Input
                                                                                                        placeholder="value"
                                                                                                        defaultValue={defaultObj[key] || ''}
                                                                                                        style={{ flex: 1 }}
                                                                                                        onBlur={e => {
                                                                                                            // 只有当已勾选时才保存value变更
                                                                                                            if (isSelected && e.target.value !== defaultObj[key]) {
                                                                                                                updateValue(key, e.target.value);
                                                                                                            }
                                                                                                        }}
                                                                                                    />
                                                                                                    <Button
                                                                                                        size="small"
                                                                                                        danger
                                                                                                        icon={<DeleteOutlined />}
                                                                                                        onClick={() => {
                                                                                                            const newOptions = options.filter((_, idx) => idx !== i);
                                                                                                            const newObj = { ...defaultObj };
                                                                                                            delete newObj[key];
                                                                                                            autoSaveVariables(
                                                                                                                editedVariables.map(v => v.name === record.name ? { ...v, enum: newOptions, default: JSON.stringify(newObj) } : v)
                                                                                                            );
                                                                                                        }}
                                                                                                    />
                                                                                                </div>
                                                                                            );
                                                                                        }) : <Text type="secondary">暂无可选属性</Text>}
                                                                                        <Button
                                                                                            type="dashed"
                                                                                            size="small"
                                                                                            icon={<PlusOutlined />}
                                                                                            style={{ width: '100%', marginTop: 4 }}
                                                                                            onClick={() => {
                                                                                                const newKey = `key${options.length + 1}`;
                                                                                                updateOptions([...options, newKey]);
                                                                                            }}
                                                                                        >
                                                                                            添加可选属性
                                                                                        </Button>
                                                                                    </div>
                                                                                }
                                                                            >
                                                                                <Button type="link" style={{ padding: 0 }}>
                                                                                    {options.length > 0 ? (
                                                                                        <span>
                                                                                            {`{${options.length}可选/${selectedKeys.length}默认}`}
                                                                                        </span>
                                                                                    ) : '点击编辑'}
                                                                                </Button>
                                                                            </Popover>
                                                                        );
                                                                    }
                                                                    default: // string
                                                                        return (
                                                                            <Input
                                                                                key={`${record.name}-default`}
                                                                                variant="borderless"
                                                                                defaultValue={parsed}
                                                                                placeholder="-"
                                                                                style={{ width: '100%' }}
                                                                                onBlur={e => {
                                                                                    if (e.target.value !== parsed) saveDefault(e.target.value);
                                                                                }}
                                                                                onPressEnter={e => (e.target as HTMLInputElement).blur()}
                                                                            />
                                                                        );
                                                                }
                                                            },
                                                        },
                                                        {
                                                            title: '描述',
                                                            dataIndex: 'description',
                                                            width: 200,
                                                            ellipsis: true,
                                                            render: (v, record) => (
                                                                <Input
                                                                    key={`${record.name}-desc`}
                                                                    variant="borderless"
                                                                    defaultValue={v || ''}
                                                                    placeholder="-"
                                                                    style={{ width: '100%' }}
                                                                    onBlur={e => {
                                                                        const newVal = e.target.value;
                                                                        if (newVal !== (v || '')) {
                                                                            autoSaveVariables(
                                                                                editedVariables.map(item => item.name === record.name ? { ...item, description: newVal } : item)
                                                                            );
                                                                        }
                                                                    }}
                                                                    onPressEnter={e => (e.target as HTMLInputElement).blur()}
                                                                />
                                                            ),
                                                        },
                                                        {
                                                            title: '验证',
                                                            width: 60,
                                                            align: 'center' as const,
                                                            render: (_, record) => {
                                                                const hasValidation = record.pattern || record.min !== undefined || record.max !== undefined || (record.enum && record.enum.length > 0);
                                                                return (
                                                                    <Popover
                                                                        trigger="click"
                                                                        placement="leftTop"
                                                                        destroyTooltipOnHide
                                                                        title={<span style={{ fontSize: 15, fontWeight: 500 }}>验证规则配置</span>}
                                                                        content={
                                                                            <div style={{ width: 320, padding: '8px 0' }}>
                                                                                <Form layout="vertical" size="middle">
                                                                                    <Form.Item label="正则表达式" style={{ marginBottom: 16 }}>
                                                                                        <Input
                                                                                            defaultValue={record.pattern || ''}
                                                                                            placeholder="如 ^[a-zA-Z0-9]+$"
                                                                                            onBlur={e => {
                                                                                                const newVal = e.target.value;
                                                                                                if (newVal !== (record.pattern || '')) {
                                                                                                    autoSaveVariables(
                                                                                                        editedVariables.map(item => item.name === record.name ? { ...item, pattern: newVal } : item)
                                                                                                    );
                                                                                                }
                                                                                            }}
                                                                                        />
                                                                                    </Form.Item>
                                                                                    <Row gutter={16}>
                                                                                        <Col span={12}>
                                                                                            <Form.Item label="最小值" style={{ marginBottom: 16 }}>
                                                                                                <InputNumber
                                                                                                    defaultValue={record.min}
                                                                                                    placeholder="min"
                                                                                                    style={{ width: '100%' }}
                                                                                                    onBlur={e => {
                                                                                                        const val = e.target.value ? Number(e.target.value) : undefined;
                                                                                                        if (val !== record.min) {
                                                                                                            autoSaveVariables(
                                                                                                                editedVariables.map(item => item.name === record.name ? { ...item, min: val } : item)
                                                                                                            );
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                            </Form.Item>
                                                                                        </Col>
                                                                                        <Col span={12}>
                                                                                            <Form.Item label="最大值" style={{ marginBottom: 16 }}>
                                                                                                <InputNumber
                                                                                                    defaultValue={record.max}
                                                                                                    placeholder="max"
                                                                                                    style={{ width: '100%' }}
                                                                                                    onBlur={e => {
                                                                                                        const val = e.target.value ? Number(e.target.value) : undefined;
                                                                                                        if (val !== record.max) {
                                                                                                            autoSaveVariables(
                                                                                                                editedVariables.map(item => item.name === record.name ? { ...item, max: val } : item)
                                                                                                            );
                                                                                                        }
                                                                                                    }}
                                                                                                />
                                                                                            </Form.Item>
                                                                                        </Col>
                                                                                    </Row>
                                                                                    {record.type === 'enum' && (
                                                                                        <Form.Item label="枚举值" style={{ marginBottom: 0 }}>
                                                                                            <Input
                                                                                                defaultValue={(record.enum || []).join(', ')}
                                                                                                placeholder="a, b, c"
                                                                                                onBlur={e => {
                                                                                                    const newEnum = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
                                                                                                    autoSaveVariables(
                                                                                                        editedVariables.map(item => item.name === record.name ? { ...item, enum: newEnum } : item)
                                                                                                    );
                                                                                                }}
                                                                                            />
                                                                                        </Form.Item>
                                                                                    )}
                                                                                </Form>
                                                                            </div>
                                                                        }
                                                                    >
                                                                        <Button
                                                                            type="text"
                                                                            size="small"
                                                                            icon={<SettingOutlined />}
                                                                            style={{ color: hasValidation ? '#1677ff' : '#bbb' }}
                                                                        />
                                                                    </Popover>
                                                                );
                                                            },
                                                        },
                                                    ]}
                                                />
                                            </>
                                        ) : (
                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无变量，请先扫描" />
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: 'files',
                                label: <Badge count={playbookFiles.length} size="small" offset={[8, 0]}>文件 </Badge>,
                                children: (
                                    <div style={{ padding: 24, height: 'calc(100% - 46px)', display: 'flex', gap: 16 }}>
                                        {/* 左侧文件树 - GitHub 风格 */}
                                        <div style={{
                                            width: 320,
                                            flexShrink: 0,
                                            border: '1px solid #d0d7de',
                                            // borderRadius: 6,
                                            overflow: 'hidden',
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}>
                                            {/* 文件树头部 */}
                                            <div style={{
                                                padding: '8px 12px',
                                                background: '#f6f8fa',
                                                borderBottom: '1px solid #d0d7de',
                                                fontWeight: 500,
                                                fontSize: 13,
                                            }}>
                                                <FolderOpenOutlined style={{ marginRight: 8 }} />
                                                文件 ({playbookFiles.length})
                                            </div>
                                            {/* 文件列表 - 按目录结构分组 */}
                                            <div style={{ flex: 1, overflowY: 'auto', maxHeight: 'calc(100vh - 400px)' }}>
                                                {playbookFiles.length > 0 ? (() => {
                                                    // 构建目录树
                                                    const tree: Record<string, AutoHealing.PlaybookFile[]> = {};
                                                    playbookFiles.forEach(file => {
                                                        const parts = file.path.split('/');
                                                        const dir = parts.length > 1 ? parts.slice(0, -1).join('/') : '.';
                                                        if (!tree[dir]) tree[dir] = [];
                                                        tree[dir].push(file);
                                                    });
                                                    const dirs = Object.keys(tree).sort();
                                                    return dirs.map(dir => (
                                                        <div key={dir}>
                                                            {/* 目录行 */}
                                                            {dir !== '.' && (
                                                                <div style={{
                                                                    padding: '6px 12px',
                                                                    background: '#f6f8fa',
                                                                    borderBottom: '1px solid #eaecef',
                                                                    fontSize: 12,
                                                                    color: '#57606a',
                                                                    display: 'flex',
                                                                    alignItems: 'center',
                                                                    gap: 6,
                                                                }}>
                                                                    <FolderOutlined />
                                                                    <span>{dir}</span>
                                                                </div>
                                                            )}
                                                            {/* 文件列表 */}
                                                            {tree[dir].map((file, i) => {
                                                                const fileName = file.path.split('/').pop();
                                                                return (
                                                                    <div
                                                                        key={i}
                                                                        onClick={() => handleSelectFile(file.path)}
                                                                        style={{
                                                                            padding: '8px 12px',
                                                                            paddingLeft: dir !== '.' ? 32 : 12,
                                                                            cursor: 'pointer',
                                                                            background: selectedFilePath === file.path ? '#ddf4ff' : 'transparent',
                                                                            borderBottom: '1px solid #eaecef',
                                                                            display: 'flex',
                                                                            alignItems: 'center',
                                                                            gap: 8,
                                                                            fontSize: 13,
                                                                        }}
                                                                        onMouseEnter={e => { if (selectedFilePath !== file.path) e.currentTarget.style.background = '#f6f8fa'; }}
                                                                        onMouseLeave={e => { if (selectedFilePath !== file.path) e.currentTarget.style.background = 'transparent'; }}
                                                                    >
                                                                        <FileTextOutlined style={{ color: file.type === 'entry' ? '#1890ff' : '#57606a' }} />
                                                                        <span style={{ flex: 1 }}>{fileName}</span>
                                                                        <Tag
                                                                            color={file.type === 'entry' ? 'blue' : file.type === 'task' ? 'green' : file.type === 'vars' ? 'orange' : 'default'}
                                                                            style={{ fontSize: 10, margin: 0 }}
                                                                        >
                                                                            {file.type}
                                                                        </Tag>
                                                                    </div>
                                                                );
                                                            })}
                                                        </div>
                                                    ));
                                                })() : (
                                                    <div style={{ padding: 24, textAlign: 'center' }}>
                                                        <Text type="secondary">请先扫描变量</Text>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        {/* 右侧文件内容 */}
                                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                                            {selectedFilePath ? (
                                                <div style={{
                                                    flex: 1,
                                                    border: '1px solid #d0d7de',
                                                    // borderRadius: 6,
                                                    overflow: 'hidden',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                }}>
                                                    {/* 文件头部 */}
                                                    <div style={{
                                                        padding: '8px 12px',
                                                        background: '#f6f8fa',
                                                        borderBottom: '1px solid #d0d7de',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: 8,
                                                    }}>
                                                        <FileTextOutlined />
                                                        <Text style={{ fontFamily: 'monospace', fontSize: 13 }}>{selectedFilePath}</Text>
                                                    </div>
                                                    {/* 文件内容 */}
                                                    <div style={{ flex: 1, overflow: 'auto', background: '#0d1117' }}>
                                                        {loadingFileContent ? (
                                                            <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
                                                        ) : (
                                                            <pre style={{
                                                                color: '#c9d1d9',
                                                                padding: 16,
                                                                margin: 0,
                                                                fontSize: 12,
                                                                fontFamily: 'ui-monospace, SFMono-Regular, Consolas, monospace',
                                                                lineHeight: 1.6,
                                                                whiteSpace: 'pre-wrap',
                                                            }}>{fileContent}</pre>
                                                        )}
                                                    </div>
                                                </div>
                                            ) : (
                                                <div style={{
                                                    flex: 1,
                                                    border: '1px solid #d0d7de',
                                                    borderRadius: 6,
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    background: '#f6f8fa',
                                                }}>
                                                    <Empty description="选择左侧文件查看内容" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ),
                            },
                            {
                                key: 'logs',
                                label: '扫描日志',
                                children: (
                                    <div style={{ padding: 24, overflowY: 'auto', height: 'calc(100% - 46px)' }}>
                                        {loadingLogs ? <Spin /> : scanLogs.length > 0 ? (
                                            <div>
                                                {/* 统计顶栏 */}
                                                <Card size="small" style={{ marginBottom: 16, background: '#fafafa' }}>
                                                    <Row gutter={24}>
                                                        <Col span={6}>
                                                            <Statistic title="总扫描次数" value={scanLogs.length} valueStyle={{ fontSize: 20 }} />
                                                        </Col>
                                                        <Col span={6}>
                                                            <Statistic
                                                                title="最近扫描"
                                                                value={scanLogs[0] ? new Date(scanLogs[0].created_at).toLocaleDateString() : '-'}
                                                                valueStyle={{ fontSize: 14 }}
                                                            />
                                                        </Col>
                                                        <Col span={6}>
                                                            <Statistic
                                                                title="新增变量"
                                                                value={scanLogs.reduce((sum, log) => sum + (log.new_count || 0), 0)}
                                                                valueStyle={{ fontSize: 20, color: '#52c41a' }}
                                                                prefix="+"
                                                            />
                                                        </Col>
                                                        <Col span={6}>
                                                            <Statistic
                                                                title="移除变量"
                                                                value={scanLogs.reduce((sum, log) => sum + (log.removed_count || 0), 0)}
                                                                valueStyle={{ fontSize: 20, color: '#ff4d4f' }}
                                                                prefix="-"
                                                            />
                                                        </Col>
                                                    </Row>
                                                </Card>

                                                {/* 时间线 - 超出时自动显示滚动条 */}
                                                <div style={{ maxHeight: 'calc(100vh - 450px)', overflowY: 'auto' }}>
                                                    {scanLogs.map((log, index) => (
                                                        <Card
                                                            key={log.id}
                                                            size="small"
                                                            style={{
                                                                marginBottom: 12,
                                                                borderLeft: `3px solid ${log.error_message ? '#ff4d4f' : '#52c41a'}`,
                                                            }}
                                                        >
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                <div>
                                                                    <Space style={{ marginBottom: 8 }}>
                                                                        <Text strong>{new Date(log.created_at).toLocaleString()}</Text>
                                                                        <Tag color={log.trigger_type === 'manual' ? 'blue' : 'green'}>
                                                                            {log.trigger_type === 'manual' ? '手动触发' : log.trigger_type === 'auto' ? '自动触发' : '同步触发'}
                                                                        </Tag>
                                                                        {log.scan_mode && (
                                                                            <Tag color={log.scan_mode === 'enhanced' ? 'purple' : 'default'}>
                                                                                {log.scan_mode === 'auto' ? '自动模式' : '增强模式'}
                                                                            </Tag>
                                                                        )}
                                                                        {index === 0 && <Tag color="gold">最新</Tag>}
                                                                    </Space>
                                                                    <div>
                                                                        <Space size={24}>
                                                                            <Text type="secondary">
                                                                                <FileTextOutlined style={{ marginRight: 4 }} />
                                                                                扫描 {log.files_scanned || 0} 个文件
                                                                            </Text>
                                                                            <Text type="secondary">
                                                                                <SettingOutlined style={{ marginRight: 4 }} />
                                                                                发现 {log.variables_found || 0} 个变量
                                                                            </Text>
                                                                            {(log.new_count || 0) > 0 && (
                                                                                <Text style={{ color: '#52c41a' }}>+{log.new_count} 新增</Text>
                                                                            )}
                                                                            {(log.removed_count || 0) > 0 && (
                                                                                <Text style={{ color: '#ff4d4f' }}>-{log.removed_count} 移除</Text>
                                                                            )}
                                                                        </Space>
                                                                    </div>
                                                                    {log.error_message && (
                                                                        <Alert type="error" message={log.error_message} style={{ marginTop: 8 }} showIcon />
                                                                    )}
                                                                </div>
                                                                <Tag color={log.error_message ? 'error' : 'success'}>
                                                                    {log.error_message ? '失败' : '成功'}
                                                                </Tag>
                                                            </div>
                                                        </Card>
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无扫描记录，点击「扫描变量」开始" />
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                    />
                </div>
            </div>
        );
    };

    return (
        <PageContainer
            header={{ title: <><BookOutlined /> Playbook 模板 / PLAYBOOKS</> }}
            extra={[
                <Button key="import" type="primary" icon={<PlusOutlined />} onClick={() => { setImportModalOpen(true); setExpandedKeys(Object.keys(groupedPlaybooks)); }} disabled={!access.canManagePlaybook}>
                    导入 Playbook
                </Button>,
            ]}
        >
            {/* 双栏布局 - 带 opacity 过渡动画 */}
            <div style={{ display: 'flex', gap: 16, height: 'calc(100vh - 160px)' }}>
                {/* 左侧面板 - 带淡入淡出动画 */}
                <div style={{
                    width: (activeTab === 'variables' || activeTab === 'files') ? 48 : 280,
                    flexShrink: 0,
                    transition: 'opacity 0.15s ease-out',
                    opacity: 1,
                }}>
                    {(activeTab === 'variables' || activeTab === 'files') ? (
                        // 收缩模式：垂直工具条
                        <Card
                            bodyStyle={{ padding: '12px 8px' }}
                            style={{ height: '100%', textAlign: 'center', overflow: 'hidden' }}
                        >
                            <Tooltip title={selectedPlaybook?.name} placement="right">
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        // borderRadius: 6,
                                        background: 'linear-gradient(135deg, #1890ff 0%, #096dd9 100%)',
                                        color: '#fff',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        marginBottom: 12,
                                    }}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    <FileTextOutlined />
                                </div>
                            </Tooltip>
                            <Tooltip title="返回概览" placement="right">
                                <div
                                    style={{
                                        width: 32,
                                        height: 32,
                                        // borderRadius: 6,
                                        background: '#f5f5f5',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                    }}
                                    onClick={() => setActiveTab('overview')}
                                >
                                    <FolderOpenOutlined style={{ color: '#666' }} />
                                </div>
                            </Tooltip>
                        </Card>
                    ) : (
                        // 正常模式：完整列表
                        <Card bodyStyle={{ padding: 0 }} style={{ height: '100%' }}>
                            {renderLeftPanel()}
                        </Card>
                    )}
                </div>
                {/* 右侧面板 - 带过渡动画 */}
                <div style={{ flex: 1, minWidth: 0, transition: 'opacity 0.15s ease-out' }}>
                    <Card bodyStyle={{ padding: 0 }} style={{ height: '100%' }}>
                        {renderRightPanel()}
                    </Card>
                </div>
            </div>

            {/* 扫描模式选择弹窗已移除，config_mode 在创建时固定 */}

            {/* 导入 Playbook 弹窗 - 简约大气设计 */}
            <Modal
                title={null}
                open={importModalOpen}
                onCancel={closeImportModal}
                footer={null}
                width={600}
                destroyOnClose
                centered
                styles={{ body: { padding: 0 } }}
            >
                <div style={{ padding: 32 }}>
                    {/* 头部 - 简约风格 */}
                    <div style={{ textAlign: 'center', marginBottom: 24 }}>
                        <div style={{
                            width: 56,
                            height: 56,
                            // borderRadius: 12,
                            background: '#f5f5f5',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginBottom: 12,
                        }}>
                            <CodeOutlined style={{ fontSize: 24, color: '#333' }} />
                        </div>
                        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>导入 Playbook</div>
                        <div style={{ color: '#8c8c8c', fontSize: 13 }}>从 Git 仓库导入 Ansible Playbook 模板</div>
                    </div>

                    {/* 步骤条 - 简约 */}
                    <Steps
                        current={importStep}
                        size="small"
                        style={{ marginBottom: 24 }}
                        items={[{ title: '选择仓库' }, { title: '选择文件' }, { title: '配置' }]}
                    />

                    {/* Step 0: 选择仓库 */}
                    {importStep === 0 && (
                        <div>
                            <Select
                                placeholder="选择 Git 仓库"
                                style={{ width: '100%' }}
                                size="large"
                                value={importRepoId}
                                onChange={handleImportSelectRepo}
                                loading={loadingFiles}
                                optionLabelProp="label"
                            >
                                {repos.map(r => (
                                    <Select.Option key={r.id} value={r.id} label={r.name}>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                            <BranchesOutlined style={{ color: '#8c8c8c' }} />
                                            <div>
                                                <div style={{ fontWeight: 500 }}>{r.name}</div>
                                                <div style={{ fontSize: 11, color: '#bfbfbf' }}>{r.default_branch}</div>
                                            </div>
                                        </div>
                                    </Select.Option>
                                ))}
                            </Select>
                            {loadingFiles && (
                                <div style={{ textAlign: 'center', padding: 32 }}>
                                    <Spin tip="加载文件..." />
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 1: 选择入口文件 */}
                    {importStep === 1 && (
                        <div>
                            <div style={{ marginBottom: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Text strong>选择入口文件</Text>
                                <Space size={16}>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <FolderOutlined style={{ color: '#faad14', marginRight: 4 }} />目录
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 12 }}>
                                        <FileTextOutlined style={{ color: '#1890ff', marginRight: 4 }} />可选文件
                                    </Text>
                                </Space>
                            </div>
                            {/* 展开/收起按钮 */}
                            <div style={{ marginBottom: 8 }}>
                                <Space size={8}>
                                    <Button
                                        size="small"
                                        icon={<PlusSquareOutlined />}
                                        onClick={() => {
                                            const collectDirKeys = (nodes: DataNode[]): string[] => {
                                                return nodes.flatMap(n => {
                                                    if (n.children && n.children.length > 0) {
                                                        return [n.key as string, ...collectDirKeys(n.children)];
                                                    }
                                                    return [];
                                                });
                                            };
                                            setImportExpandedKeys(collectDirKeys(importFileTree));
                                        }}
                                    >
                                        展开全部
                                    </Button>
                                    <Button
                                        size="small"
                                        icon={<MinusSquareOutlined />}
                                        onClick={() => setImportExpandedKeys([])}
                                    >
                                        收起全部
                                    </Button>
                                </Space>
                            </div>
                            <div style={{
                                border: '1px solid #d9d9d9',
                                // borderRadius: 6,
                                maxHeight: 240,
                                overflowY: 'auto',
                                background: '#fff',
                            }}>
                                <Tree
                                    checkable
                                    showIcon
                                    showLine={{ showLeafIcon: false }}
                                    treeData={importFileTree}
                                    expandedKeys={importExpandedKeys}
                                    onExpand={(keys) => setImportExpandedKeys(keys as string[])}
                                    checkedKeys={importSelectedFiles}
                                    onCheck={(keys) => setImportSelectedFiles(keys as string[])}
                                    style={{ padding: 8 }}
                                />
                            </div>
                            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                                <Button onClick={() => { setImportStep(0); setImportFileTree([]); setImportSelectedFiles([]); }}>
                                    返回
                                </Button>
                                <Button type="primary" onClick={handleImportFilesSelect} disabled={importSelectedFiles.length === 0}>
                                    下一步 ({importSelectedFiles.length})
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Step 2: 配置 */}
                    {importStep === 2 && (
                        <div>
                            <div style={{ marginBottom: 16 }}>
                                <Text strong>配置 Playbook</Text>
                                <div style={{ marginTop: 8, padding: 12, background: '#f5f5f5', /* borderRadius: 6 */ fontSize: 12, color: '#666' }}>
                                    <div><strong>名称</strong>：Playbook 模板的显示名称，用于在列表中识别</div>
                                    <div style={{ marginTop: 4 }}><strong>扫描模式</strong>：<Tag color="blue">自动</Tag> 基础变量扫描 | <Tag color="purple">增强</Tag> 深度扫描（包括注释中的变量）</div>
                                </div>
                            </div>
                            <div style={{ maxHeight: 260, overflowY: 'auto' }}>
                                {importPlaybooks.map((pb, idx) => (
                                    <div key={pb.file} style={{
                                        padding: 12,
                                        marginBottom: 8,
                                        background: '#fafafa',
                                        // borderRadius: 6,
                                        border: '1px solid #f0f0f0',
                                    }}>
                                        <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
                                            <FileTextOutlined style={{ marginRight: 4 }} />
                                            <code>{pb.file}</code>
                                        </div>
                                        <Row gutter={8}>
                                            <Col flex="1">
                                                <Input
                                                    placeholder="Playbook 名称"
                                                    value={pb.name}
                                                    onChange={e => {
                                                        const newList = [...importPlaybooks];
                                                        newList[idx] = { ...newList[idx], name: e.target.value };
                                                        setImportPlaybooks(newList);
                                                    }}
                                                />
                                            </Col>
                                            <Col>
                                                <Select
                                                    value={pb.config_mode}
                                                    onChange={val => {
                                                        const newList = [...importPlaybooks];
                                                        newList[idx] = { ...newList[idx], config_mode: val };
                                                        setImportPlaybooks(newList);
                                                    }}
                                                    style={{ width: 100 }}
                                                    options={[
                                                        { value: 'auto', label: '自动' },
                                                        { value: 'enhanced', label: '增强' },
                                                    ]}
                                                />
                                            </Col>
                                        </Row>
                                    </div>
                                ))}
                            </div>
                            <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                                <Button onClick={() => setImportStep(1)}>返回</Button>
                                <Button type="primary" onClick={handleImportCreate} loading={creating} disabled={importPlaybooks.some(p => !p.name)}>
                                    创建 ({importPlaybooks.length})
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </Modal>

            {/* 删除确认 */}
            <Modal
                title={<><ExclamationCircleOutlined style={{ color: '#ff4d4f', marginRight: 8 }} />确认删除</>}
                open={deleteConfirmOpen}
                onCancel={() => setDeleteConfirmOpen(false)}
                onOk={handleDelete}
                okText="删除"
                okButtonProps={{
                    danger: true,
                    disabled: selectedPlaybook ? getPlaybookTasks(selectedPlaybook.id).length > 0 : false
                }}
            >
                {selectedPlaybook && getPlaybookTasks(selectedPlaybook.id).length > 0 ? (
                    <>
                        <Alert
                            type="error"
                            message={<>无法删除：关联 <b>{getPlaybookTasks(selectedPlaybook.id).length}</b> 个任务模板</>}
                            description="请先删除关联的任务模板后再删除此 Playbook"
                            showIcon
                        />
                    </>
                ) : (
                    <>
                        <p>确定删除 Playbook <Text strong>{selectedPlaybook?.name}</Text> 吗？</p>
                        <Alert type="warning" message="删除后关联的扫描日志也会被删除" showIcon />
                    </>
                )}
            </Modal>

            {/* 编辑 Playbook */}
            <ModalForm
                title={<><EditOutlined style={{ marginRight: 8 }} />编辑 Playbook</>}
                open={editModalOpen}
                onOpenChange={setEditModalOpen}
                modalProps={{ destroyOnClose: true, width: 520 }}
                initialValues={selectedPlaybook}
                layout="vertical"
                onFinish={async (values) => {
                    if (!selectedPlaybook) return false;
                    try {
                        await updatePlaybook(selectedPlaybook.id, { name: values.name, description: values.description });
                        message.success('更新成功');
                        loadPlaybooks();
                        const res = await getPlaybook(selectedPlaybook.id);
                        setSelectedPlaybook(res.data);
                        return true;
                    } catch { return false; }
                }}
            >
                <ProFormText
                    name="name"
                    label="模板名称"
                    placeholder="请输入 Playbook 模板名称"
                    rules={[{ required: true, message: '请输入模板名称' }]}
                    fieldProps={{ size: 'large' }}
                />
                <ProFormTextArea
                    name="description"
                    label="描述"
                    placeholder="可选，描述此 Playbook 的用途"
                    fieldProps={{ rows: 4, showCount: true, maxLength: 500 }}
                />
            </ModalForm>
        </PageContainer>
    );
};

export default PlaybookList;
