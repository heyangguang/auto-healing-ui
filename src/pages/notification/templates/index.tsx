import {
    PlusOutlined, SearchOutlined, ReloadOutlined,
    DeleteOutlined, SaveOutlined, CopyOutlined,
    FileTextOutlined, CodeOutlined, FlagOutlined,
    AppstoreOutlined, ThunderboltOutlined,
    CheckCircleOutlined, StopOutlined, EyeOutlined,
    MoreOutlined, SettingOutlined, UndoOutlined
} from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import './index.css';
import {
    Button, message, Space, Tag, Typography, Input,
    Empty, Switch, Spin, Popconfirm, Row, Col, Pagination, Avatar,
    Form, Select, Modal, Drawer, Alert, Badge, Card, Tooltip, Divider,
    List, Flex, Layout, Menu, Dropdown, Segmented
} from 'antd';
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAccess } from '@umijs/max';
import {
    getTemplates, createTemplate, updateTemplate, deleteTemplate, previewTemplate, getTemplateVariables
} from '@/services/auto-healing/notification';
import Editor, { loader } from '@monaco-editor/react';
import { marked } from 'marked';

// Configure Monaco to disable built-in HTML suggestions before it loads
loader.init().then(monaco => {
    // Disable HTML suggestions (date/time/timestamp come from here)
    if (monaco.languages.html?.htmlDefaults) {
        monaco.languages.html.htmlDefaults.setOptions({
            suggest: { html5: false, angular1: false, ionic: false }
        });
    }
});
// Reusing styles from execute module for consistency

const { Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Sider, Content } = Layout;

// ==================== Constants ====================

const EVENT_TYPE_CONFIG: Record<string, { icon: React.ReactNode; color: string; label: string; bg: string }> = {
    execution_result: { icon: <ThunderboltOutlined />, color: '#faad14', label: 'EXECUTION', bg: '#fffbe6' }, // Amber
    alert: { icon: <FlagOutlined />, color: '#ff4d4f', label: 'ALERT', bg: '#fff1f0' }, // Red
    execution_started: { icon: <AppstoreOutlined />, color: '#13c2c2', label: 'STARTED', bg: '#e6fffb' }, // Cyan
    custom: { icon: <FileTextOutlined />, color: '#722ed1', label: 'CUSTOM', bg: '#f9f0ff' }, // Purple
};

const FORMAT_COLORS: Record<string, string> = {
    text: 'default',
    markdown: 'blue',
    html: 'orange'
};

// ==================== Main Page Component ====================
const NotificationTemplatesPage: React.FC = () => {
    const access = useAccess();
    // Data State
    const [templates, setTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);
    const [loading, setLoading] = useState(true);

    // Selection State
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Editor State
    const [form] = Form.useForm();
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editorContent, setEditorContent] = useState(''); // Separate state for Monaco Editor

    // Filters (Backend-Driven)
    const [searchText, setSearchText] = useState('');
    const [filterEventType, setFilterEventType] = useState<string>('all');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterFormat, setFilterFormat] = useState<string>('all');
    const [filterChannel, setFilterChannel] = useState<string>('all');
    const [sortBy, setSortBy] = useState<string>('updated_at');
    const [sortOrder, setSortOrder] = useState<string>('desc');

    // Pagination (Infinite Scroll)
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const PAGE_SIZE = 20;

    // Preview
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<AutoHealing.PreviewTemplateResponse | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);

    // Variables Hint
    const [availableVariables, setAvailableVariables] = useState<AutoHealing.TemplateVariable[]>([]);
    const [variablesDrawerOpen, setVariablesDrawerOpen] = useState(false);
    const editorRef = React.useRef<any>(null);  // Monaco editor instance ref

    // StandardTable onSearch callback
    const handleSearchChange = useCallback((params: { searchField?: string; searchValue?: string; advancedSearch?: Record<string, any>; filters?: { field: string; value: string }[] }) => {
        const filters = params.filters || [];
        const nameFilter = filters.find(f => f.field === 'search');
        const eventTypeFilter = filters.find(f => f.field === '__enum__event_type');
        const statusFilter = filters.find(f => f.field === '__enum__status');
        const formatFilter = filters.find(f => f.field === '__enum__format');
        const channelFilter = filters.find(f => f.field === '__enum__channel_type');

        setSearchText(nameFilter?.value || params.advancedSearch?.search || '');
        setFilterEventType(eventTypeFilter?.value || params.advancedSearch?.event_type || 'all');
        setFilterStatus(statusFilter?.value || params.advancedSearch?.status || 'all');
        setFilterFormat(formatFilter?.value || params.advancedSearch?.format || 'all');
        setFilterChannel(channelFilter?.value || params.advancedSearch?.channel_type || 'all');
    }, []);

    // Responsive: Window Size Detection
    const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1200);

    useEffect(() => {
        const handleResize = () => setWindowWidth(window.innerWidth);
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Breakpoint flags
    const isLargeScreen = windowWidth >= 1200; // Show all 3 panels
    const isMediumScreen = windowWidth >= 768 && windowWidth < 1200; // Hide right panel
    const isSmallScreen = windowWidth < 768; // Narrow left sidebar

    const leftSidebarWidth = isSmallScreen ? 220 : 280;

    // ==================== Data Loading (Backend-Driven) ====================
    const buildFilterParams = useCallback(() => {
        const params: Record<string, any> = {
            page_size: PAGE_SIZE,
            sort_by: sortBy,
            sort_order: sortOrder,
        };
        if (searchText.trim()) params.search = searchText.trim();
        if (filterEventType !== 'all') params.event_type = filterEventType;
        if (filterStatus !== 'all') params.is_active = filterStatus === 'active';
        if (filterFormat !== 'all') params.format = filterFormat;
        if (filterChannel !== 'all') params.supported_channel = filterChannel;
        return params;
    }, [searchText, filterEventType, filterStatus, filterFormat, filterChannel, sortBy, sortOrder]);

    const loadTemplates = useCallback(async (resetPage = true, silent = false) => {
        if (resetPage) {
            if (!silent) setLoading(true);
            setPage(1);
        } else {
            setLoadingMore(true);
        }

        try {
            const currentPage = resetPage ? 1 : page;
            const params = { ...buildFilterParams(), page: currentPage };
            const res = await getTemplates(params);
            const data = res.data || [];
            const total = res.total || 0;

            if (resetPage) {
                setTemplates(data);
                // Auto-select first if none selected
                if (data.length > 0 && !selectedId && !isCreating) {
                    setSelectedId(data[0].id);
                }
            } else {
                setTemplates(prev => [...prev, ...data]);
            }

            // Check if more pages available
            setHasMore(currentPage * PAGE_SIZE < total);
        } catch (error) {
            console.error('Failed to load templates:', error);
            message.error('加载模板列表失败');
        } finally {
            if (!silent) setLoading(false);
            setLoadingMore(false);
        }
    }, [buildFilterParams, page, selectedId, isCreating]);

    // Load more (for infinite scroll)
    const loadMore = useCallback(() => {
        if (!loadingMore && hasMore && !loading) {
            setPage(p => p + 1);
        }
    }, [loadingMore, hasMore, loading]);

    // Trigger load when page changes (for infinite scroll)
    useEffect(() => {
        if (page > 1) {
            loadTemplates(false);
        }
    }, [page]);

    // Debounced search/filter effect
    useEffect(() => {
        const timer = setTimeout(() => {
            loadTemplates(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchText, filterEventType, filterStatus, filterFormat, filterChannel]);

    // Sort change — immediate silent refresh (no flicker)
    const sortMounted = useRef(false);
    useEffect(() => {
        if (!sortMounted.current) { sortMounted.current = true; return; }
        loadTemplates(true, true);
    }, [sortBy, sortOrder]);

    const loadVariables = async () => {
        try {
            const res: any = await getTemplateVariables();
            const list = res?.data?.variables || res?.variables || (Array.isArray(res) ? res : []);
            setAvailableVariables(list);
        } catch (e) {
            console.warn('Failed to load variables hint', e);
            setAvailableVariables([]);
        }
    };

    useEffect(() => {
        loadVariables();
    }, []);

    // Derived Selection
    const selectedTemplate = useMemo(() => {
        if (isCreating) return null;
        return templates.find(t => t.id === selectedId);
    }, [selectedId, templates, isCreating]);

    // Initial Form Set
    useEffect(() => {
        if (isCreating) {
            form.resetFields();
            form.setFieldsValue({
                is_active: true,
                format: 'text',
                supported_channels: ['webhook', 'email'],
                event_type: 'custom',
                body_template: ''
            });
            setEditorContent('');
            setIsDirty(false);
        } else if (selectedTemplate) {
            form.setFieldsValue({
                name: selectedTemplate.name,
                description: selectedTemplate.description,
                event_type: selectedTemplate.event_type,
                supported_channels: selectedTemplate.supported_channels || [],
                subject_template: selectedTemplate.subject_template,
                body_template: selectedTemplate.body_template,
                format: selectedTemplate.format,
                is_active: selectedTemplate.is_active
            });
            setEditorContent(selectedTemplate.body_template || '');
            setIsDirty(false);
        }
    }, [selectedTemplate, isCreating, form]);


    // ==================== Actions ====================

    const handleSelect = (id: string) => {
        if (isDirty) {
            Modal.confirm({
                title: '未保存的更改',
                content: '您有未保存的更改，切换将丢失这些更改。是否继续？',
                onOk: () => {
                    setSelectedId(id);
                    setIsCreating(false);
                    setShowPreview(false);
                }
            });
        } else {
            setSelectedId(id);
            setIsCreating(false);
            setShowPreview(false);
        }
    };

    const handleCreateNew = () => {
        if (isDirty) {
            Modal.confirm({
                title: '未保存的更改',
                content: '您有未保存的更改，切换将丢失这些更改。是否继续？',
                onOk: () => {
                    setIsCreating(true);
                    setSelectedId(null);
                    setShowPreview(false);
                }
            });
        } else {
            setIsCreating(true);
            setSelectedId(null);
            setShowPreview(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            const values = await form.validateFields();

            const payload = {
                ...values,
                body_template: editorContent, // Use editorContent state
                supported_channels: values.supported_channels || [],
            };

            if (isCreating) {
                const res = await createTemplate(payload);
                message.success('模板已创建');
                setIsCreating(false);
                setSelectedId(res.id);
                // 静默刷新：不闪 loading
                loadTemplates(true, true);
            } else if (selectedId) {
                await updateTemplate(selectedId, payload);
                message.success('模板已更新');
                // 静默刷新：不闪 loading
                loadTemplates(true, true);
            }
            setIsDirty(false);
        } catch (error) {
            if (!(error as any).errorFields) {
                message.error('保存失败');
            }
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        try {
            await deleteTemplate(id);
            message.success('模板已删除');
            if (id === selectedId) {
                setSelectedId(null);
                setIsCreating(false);
            }
            loadTemplates();
        } catch {
            // 错误消息由全局错误处理器显示
        }
    };

    const handlePreview = async () => {
        if (!selectedId && !isCreating) return;

        if (showPreview) {
            setShowPreview(false);
            return;
        }

        if (isDirty || isCreating) {
            message.warning('预览功能仅支持已保存的模板内容，请先保存您的更改。');
            return;
        }

        const id = selectedId!;
        setPreviewLoading(true);
        setShowPreview(true);
        setPreviewData(null);

        try {
            const res: any = await previewTemplate(id, {
                sample_data: {
                    execution: { status: 'success', status_emoji: '✅', duration: '1m 20s' },
                    task: { name: 'Demo Task', target_hosts: '192.168.1.10', host_count: 5 },
                    timestamp: new Date().toLocaleString()
                }
            });
            // API returns { code, message, data: { subject, body } }
            const previewResult = res?.data || res;
            setPreviewData(previewResult);
        } catch (e: any) {
            message.error('预览失败: ' + (e.message || '未知错误'));
            setShowPreview(false);
        } finally {
            setPreviewLoading(false);
        }
    };

    // Note: Filtering is now backend-driven, no client-side filter needed

    // ==================== Render Helpers ====================

    const renderVariableHints = () => {
        if (!availableVariables || availableVariables.length === 0) {
            return (
                <div style={{ padding: 12, textAlign: 'center' }}>
                    <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无可用变量" />
                </div>
            );
        }

        // Group by category
        const groups: Record<string, AutoHealing.TemplateVariable[]> = {};
        availableVariables.forEach(v => {
            const cat = v.category || 'other';
            if (!groups[cat]) groups[cat] = [];
            groups[cat].push(v);
        });

        return (
            <div>
                {/* Usage Instructions */}
                <Alert
                    message="使用说明"
                    description="点击变量名可复制到剪贴板，然后粘贴到模板中。变量会在发送时自动替换为实际值。"
                    type="info"
                    showIcon
                    style={{ marginBottom: 16, fontSize: 12 }}
                />

                {Object.entries(groups).map(([cat, vars]) => (
                    <div key={cat} style={{ marginBottom: 20 }}>
                        <div style={{
                            fontSize: 11,
                            fontWeight: 600,
                            color: '#8c8c8c',
                            textTransform: 'uppercase',
                            letterSpacing: 1,
                            marginBottom: 8,
                            borderBottom: '1px solid #f0f0f0',
                            paddingBottom: 4
                        }}>
                            {cat}
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                            {vars.map(v => (
                                <div
                                    key={v.name}
                                    style={{
                                        cursor: 'pointer',
                                        padding: '8px 12px',
                                        background: '#fff',
                                        borderRadius: 4,
                                        border: '1px solid #e8e8e8',
                                        transition: 'all 0.2s'
                                    }}
                                    onClick={() => {
                                        navigator.clipboard.writeText(`{{${v.name}}}`);
                                        message.success(`已复制 {{${v.name}}}`);
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <code style={{
                                            fontSize: 13,
                                            color: '#1890ff',
                                            fontFamily: "'SF Mono', 'Menlo', monospace"
                                        }}>
                                            {`{{${v.name}}}`}
                                        </code>
                                        <CopyOutlined style={{ fontSize: 12, color: '#bfbfbf' }} />
                                    </div>
                                    {v.description && (
                                        <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 4 }}>
                                            {v.description}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    // ==================== Main Render ====================

    // 初始加载时显示整页loading
    if (loading && templates.length === 0) {
        return (
            <StandardTable<any>
                tabs={[{ key: 'editor', label: '模板编辑器' }]}
                title="通知模板"
                description="管理通知模板，配置不同事件的通知内容和格式"
                headerIcon={
                    <svg viewBox="0 0 48 48" fill="none">
                        <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                        <path d="M16 14h16M16 22h16M16 30h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        <path d="M30 32l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                }
                searchFields={[
                    { key: 'search', label: '模板名称' },
                ]}
                columns={[
                    {
                        columnKey: 'event_type',
                        columnTitle: '事件类型',
                        dataIndex: 'event_type',
                        headerFilters: [
                            ...Object.keys(EVENT_TYPE_CONFIG).map(k => ({ label: EVENT_TYPE_CONFIG[k].label, value: k })),
                        ],
                    },
                    {
                        columnKey: 'status',
                        columnTitle: '状态',
                        dataIndex: 'is_active',
                        headerFilters: [
                            { label: '启用', value: 'active' },
                            { label: '禁用', value: 'inactive' },
                        ],
                    },
                    {
                        columnKey: 'format',
                        columnTitle: '格式',
                        dataIndex: 'format',
                        headerFilters: [
                            { label: '纯文本', value: 'text' },
                            { label: 'Markdown', value: 'markdown' },
                            { label: 'HTML', value: 'html' },
                        ],
                    },
                    {
                        columnKey: 'channel_type',
                        columnTitle: '渠道类型',
                        dataIndex: 'channel_type',
                        headerFilters: [
                            { label: 'Webhook', value: 'webhook' },
                            { label: 'Email', value: 'email' },
                            { label: 'DingTalk', value: 'dingtalk' },
                        ],
                    },
                ]}
                onSearch={handleSearchChange}
                primaryActionLabel="新建模板"
                primaryActionDisabled={!access.canCreateTemplate}
                onPrimaryAction={handleCreateNew}
                extraToolbarActions={
                    <Select
                        value={`${sortBy}_${sortOrder}`}
                        onChange={(v) => {
                            const i = v.lastIndexOf('_');
                            setSortBy(v.slice(0, i));
                            setSortOrder(v.slice(i + 1));
                        }}
                        style={{ width: 130 }}
                        variant="borderless"
                        popupMatchSelectWidth={false}
                        options={[
                            { label: '最近更新', value: 'updated_at_desc' },
                            { label: '最早更新', value: 'updated_at_asc' },
                            { label: '最近创建', value: 'created_at_desc' },
                            { label: '名称 A-Z', value: 'name_asc' },
                            { label: '名称 Z-A', value: 'name_desc' },
                        ]}
                    />
                }
            >
                <div className="templates-body" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                    <Spin size="large" tip="加载中..." />
                </div>
            </StandardTable>
        );
    }

    return (
        <StandardTable<any>
            tabs={[{ key: 'editor', label: '模板编辑器' }]}
            title="通知模板"
            description={`管理通知模板，配置不同事件的通知内容和格式，共 ${templates.length} 个模板`}
            headerIcon={
                <svg viewBox="0 0 48 48" fill="none">
                    <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
                    <path d="M16 14h16M16 22h16M16 30h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    <path d="M30 32l4 4 8-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            }
            searchFields={[
                { key: 'search', label: '模板名称' },
            ]}
            columns={[
                {
                    columnKey: 'event_type',
                    columnTitle: '事件类型',
                    dataIndex: 'event_type',
                    headerFilters: [
                        ...Object.keys(EVENT_TYPE_CONFIG).map(k => ({ label: EVENT_TYPE_CONFIG[k].label, value: k })),
                    ],
                },
                {
                    columnKey: 'status',
                    columnTitle: '状态',
                    dataIndex: 'is_active',
                    headerFilters: [
                        { label: '启用', value: 'active' },
                        { label: '禁用', value: 'inactive' },
                    ],
                },
                {
                    columnKey: 'format',
                    columnTitle: '格式',
                    dataIndex: 'format',
                    headerFilters: [
                        { label: '纯文本', value: 'text' },
                        { label: 'Markdown', value: 'markdown' },
                        { label: 'HTML', value: 'html' },
                    ],
                },
                {
                    columnKey: 'channel_type',
                    columnTitle: '渠道类型',
                    dataIndex: 'channel_type',
                    headerFilters: [
                        { label: 'Webhook', value: 'webhook' },
                        { label: 'Email', value: 'email' },
                        { label: 'DingTalk', value: 'dingtalk' },
                    ],
                },
            ]}
            onSearch={handleSearchChange}
            primaryActionLabel="新建模板"
            primaryActionDisabled={!access.canCreateTemplate}
            onPrimaryAction={handleCreateNew}
            extraToolbarActions={
                <Select
                    value={`${sortBy}_${sortOrder}`}
                    onChange={(v) => {
                        const i = v.lastIndexOf('_');
                        setSortBy(v.slice(0, i));
                        setSortOrder(v.slice(i + 1));
                    }}
                    style={{ width: 130 }}
                    variant="borderless"
                    popupMatchSelectWidth={false}
                    options={[
                        { label: '最近更新', value: 'updated_at_desc' },
                        { label: '最早更新', value: 'updated_at_asc' },
                        { label: '最近创建', value: 'created_at_desc' },
                        { label: '名称 A-Z', value: 'name_asc' },
                        { label: '名称 Z-A', value: 'name_desc' },
                    ]}
                />
            }
        >
            {/* 工作站主体 */}
            <div className="templates-body">
                {/* LEFT SIDEBAR: Navigation */}
                <div className="templates-sidebar" style={{ width: leftSidebarWidth, minWidth: leftSidebarWidth }}>
                    {/* List with Infinite Scroll */}
                    <div
                        className="templates-sidebar-list"
                        style={{ height: '100%' }}
                        onScroll={(e) => {
                            const target = e.target as HTMLDivElement;
                            if (target.scrollHeight - target.scrollTop - target.clientHeight < 100) {
                                loadMore();
                            }
                        }}
                    >
                        {loading ? <div style={{ padding: 20, textAlign: 'center' }}><Spin /></div> : (
                            templates.length > 0 ? (
                                <>
                                    <List
                                        dataSource={templates}
                                        renderItem={item => {
                                            const typeConfig = EVENT_TYPE_CONFIG[item.event_type] || {};
                                            const isSelected = item.id === selectedId;
                                            return (
                                                <div
                                                    onClick={() => handleSelect(item.id)}
                                                    className={`templates-sidebar-item ${isSelected ? 'templates-sidebar-item-selected' : ''}`}
                                                >
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                        <Text strong style={{ color: isSelected ? '#1890ff' : '#262626', maxWidth: 180 }} ellipsis>{item.name}</Text>
                                                        {item.is_active ?
                                                            <Badge status="processing" /> :
                                                            <Badge status="default" />
                                                        }
                                                    </div>
                                                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                                        {typeConfig.icon && <span style={{ color: typeConfig.color, fontSize: 12 }}>{typeConfig.icon}</span>}
                                                        <Tag bordered={false} style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                                                            {typeConfig.label || item.event_type}
                                                        </Tag>
                                                        <Tag bordered={false} color="default" style={{ margin: 0, fontSize: 10, padding: '0 4px' }}>
                                                            {item.format}
                                                        </Tag>
                                                    </div>
                                                </div>
                                            )
                                        }}
                                    />
                                    {loadingMore && <div style={{ padding: 12, textAlign: 'center' }}><Spin size="small" /></div>}
                                    {!hasMore && templates.length > 0 && (
                                        <div className="templates-sidebar-footer">
                                            已加载全部 {templates.length} 个模板
                                        </div>
                                    )}
                                </>
                            ) : (
                                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无匹配的模板" style={{ marginTop: 60 }} />
                            )
                        )}
                    </div>
                </div>

                {/* RIGHT MAIN: Editor Workstation */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minWidth: 350, overflow: 'hidden' }}>
                    {(!selectedId && !isCreating) ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                            {templates.length > 0 ? (
                                <Empty description={<Text type="secondary">从左侧选择一个模板或新建</Text>} />
                            ) : (
                                <Empty description={<Text type="secondary">请调整筛选条件或新建模板</Text>} />
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Editor Header */}
                            <div className="templates-editor-header">
                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                            {isCreating ? '新建模板' : `ID: ${selectedId}`}
                                        </Text>
                                        {selectedId && !isCreating && (
                                            <Tooltip title="复制 ID">
                                                <CopyOutlined
                                                    style={{ fontSize: 12, color: '#8c8c8c', cursor: 'pointer' }}
                                                    onClick={() => {
                                                        navigator.clipboard.writeText(selectedId);
                                                        message.success('ID 已复制');
                                                    }}
                                                />
                                            </Tooltip>
                                        )}
                                    </div>
                                    <Space>
                                        <Form
                                            form={form}
                                            component={false}
                                        >
                                            <Form.Item name="name" noStyle>
                                                <Input
                                                    variant="borderless"
                                                    style={{ fontSize: 18, fontWeight: 600, padding: 0, width: 300 }}
                                                    placeholder="请输入模板名称"
                                                    onChange={() => setIsDirty(true)}
                                                />
                                            </Form.Item>
                                        </Form>
                                        {isDirty && <Tag color="warning">未保存</Tag>}
                                    </Space>
                                </div>

                                <Space>
                                    <Button
                                        icon={showPreview ? <CodeOutlined /> : <EyeOutlined />}
                                        onClick={handlePreview}
                                        disabled={isDirty || isCreating}
                                    >
                                        {showPreview ? '返回编辑' : '预览效果'}
                                    </Button>
                                    <Button
                                        type="primary"
                                        icon={<SaveOutlined />}
                                        onClick={handleSave}
                                        loading={saving}
                                        disabled={!isDirty}
                                    >
                                        保存
                                    </Button>
                                    {selectedId && !isCreating && (
                                        <Popconfirm title="确认删除此模板?" onConfirm={() => handleDelete(selectedId)} okText="确认" cancelText="取消" okButtonProps={{ danger: true }}>
                                            <Button danger icon={<DeleteOutlined />} disabled={!access.canDeleteTemplate}>删除</Button>
                                        </Popconfirm>
                                    )}
                                </Space>
                            </div>

                            {/* Editor Body */}
                            <div className="templates-editor-body">

                                {/* Main Canvas */}
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflowY: 'hidden' }}>
                                    {showPreview ? (
                                        // PREVIEW MODE
                                        <div className="templates-preview-container">
                                            <div className="templates-preview-card">
                                                {previewLoading ? <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div> : (
                                                    previewData ? (
                                                        <div>
                                                            {previewData.subject && (
                                                                <div style={{ padding: '16px 24px', borderBottom: '1px solid #f0f0f0', background: '#fafafa' }}>
                                                                    <div style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 4 }}>邮件主题</div>
                                                                    <div style={{ fontSize: 16, fontWeight: 600 }}>{previewData.subject}</div>
                                                                </div>
                                                            )}
                                                            <div style={{ padding: 24 }}>
                                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                                                                    <Text type="secondary" style={{ fontSize: 12 }}>消息正文</Text>
                                                                    <Tag>{selectedTemplate?.format || 'text'}</Tag>
                                                                </div>
                                                                {/* Format-aware rendering */}
                                                                {(() => {
                                                                    const format = selectedTemplate?.format || 'text';
                                                                    const body = previewData.body || '';

                                                                    if (format === 'html') {
                                                                        return (
                                                                            <div
                                                                                className="html-preview"
                                                                                style={{
                                                                                    lineHeight: 1.6,
                                                                                    fontSize: 14
                                                                                }}
                                                                                dangerouslySetInnerHTML={{ __html: body }}
                                                                            />
                                                                        );
                                                                    } else if (format === 'markdown') {
                                                                        return (
                                                                            <div
                                                                                className="markdown-preview"
                                                                                style={{
                                                                                    lineHeight: 1.6,
                                                                                    fontSize: 14
                                                                                }}
                                                                                dangerouslySetInnerHTML={{ __html: marked(body) as string }}
                                                                            />
                                                                        );
                                                                    } else {
                                                                        // Plain text
                                                                        return (
                                                                            <pre style={{
                                                                                whiteSpace: 'pre-wrap',
                                                                                fontFamily: "'SF Mono', 'Menlo', monospace",
                                                                                fontSize: 14,
                                                                                lineHeight: 1.6,
                                                                                margin: 0,
                                                                                background: '#f9f9f9',
                                                                                padding: 16,
                                                                                borderRadius: 4
                                                                            }}>
                                                                                {body}
                                                                            </pre>
                                                                        );
                                                                    }
                                                                })()}
                                                            </div>
                                                        </div>
                                                    ) : <Empty description="无预览数据" />
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        // EDIT MODE
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, paddingBottom: 0 }}>
                                            <Form
                                                form={form}
                                                layout="vertical"
                                                onValuesChange={() => setIsDirty(true)}
                                                style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                                            >
                                                {/* Configuration Row - Responsive */}
                                                <div style={{ marginBottom: 16, flexShrink: 0 }}>
                                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                                                        <Form.Item label="事件类型" name="event_type" rules={[{ required: true, message: '请选择事件类型' }]} style={{ flex: '1 1 180px', marginBottom: 0 }}>
                                                            <Select options={Object.keys(EVENT_TYPE_CONFIG).map(k => ({ label: EVENT_TYPE_CONFIG[k].label, value: k }))} />
                                                        </Form.Item>
                                                        <Form.Item label="适用渠道" name="supported_channels" rules={[{ required: true, message: '请选择渠道' }]} style={{ flex: '2 1 280px', marginBottom: 0 }}>
                                                            <Select
                                                                mode="multiple"
                                                                maxTagCount="responsive"
                                                                options={[
                                                                    { label: 'Webhook', value: 'webhook' },
                                                                    { label: 'Email 邮件', value: 'email' },
                                                                    { label: 'DingTalk 钉钉', value: 'dingtalk' },
                                                                ]}
                                                            />
                                                        </Form.Item>
                                                        <Form.Item label="格式" name="format" rules={[{ required: true }]} style={{ flex: '0 0 100px', marginBottom: 0 }}>
                                                            <Select options={[
                                                                { label: '纯文本', value: 'text' },
                                                                { label: 'Markdown', value: 'markdown' },
                                                                { label: 'HTML', value: 'html' },
                                                            ]} />
                                                        </Form.Item>
                                                        <Form.Item label="状态" name="is_active" valuePropName="checked" style={{ flex: '0 0 80px', marginBottom: 0 }}>
                                                            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                                                        </Form.Item>
                                                    </div>
                                                </div>

                                                {/* Subject */}
                                                <Form.Item label="邮件主题模板（可选，仅用于 Email 渠道）" name="subject_template" style={{ flexShrink: 0 }}>
                                                    <Input placeholder="请输入邮件主题，可使用变量如 {{task.name}}" />
                                                </Form.Item>

                                                {/* Body - Monaco Editor */}
                                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 24, minHeight: 350 }}>
                                                    <div style={{
                                                        display: 'flex',
                                                        justifyContent: 'space-between',
                                                        alignItems: 'center',
                                                        marginBottom: 8
                                                    }}>
                                                        <Text strong>消息正文模板 <Text type="danger">*</Text></Text>
                                                        <Space size={8}>
                                                            <Tag>{form.getFieldValue('format') || 'text'}</Tag>
                                                            <Dropdown
                                                                menu={{
                                                                    items: availableVariables.map(v => ({
                                                                        key: v.name,
                                                                        label: (
                                                                            <div>
                                                                                <div style={{ fontWeight: 500 }}>{v.name}</div>
                                                                                {v.description && <div style={{ fontSize: 12, color: '#666' }}>{v.description}</div>}
                                                                            </div>
                                                                        ),
                                                                        onClick: () => {
                                                                            // Insert variable at cursor position
                                                                            const editor = editorRef.current;
                                                                            if (editor) {
                                                                                const position = editor.getPosition();
                                                                                editor.executeEdits('insert-variable', [{
                                                                                    range: {
                                                                                        startLineNumber: position?.lineNumber || 1,
                                                                                        startColumn: position?.column || 1,
                                                                                        endLineNumber: position?.lineNumber || 1,
                                                                                        endColumn: position?.column || 1
                                                                                    },
                                                                                    text: `{{${v.name}}}`
                                                                                }]);
                                                                                editor.focus();
                                                                            }
                                                                        }
                                                                    })),
                                                                }}
                                                                trigger={['click']}
                                                            >
                                                                <Button size="small" icon={<CodeOutlined />}>
                                                                    插入变量
                                                                </Button>
                                                            </Dropdown>
                                                        </Space>
                                                    </div>
                                                    <div className="templates-monaco-wrapper">
                                                        <Editor
                                                            key={`editor-${selectedId || 'new'}`}
                                                            height="100%"
                                                            value={editorContent}
                                                            onChange={(value) => {
                                                                setEditorContent(value || '');
                                                                form.setFieldsValue({ body_template: value });
                                                                setIsDirty(true);
                                                            }}
                                                            beforeMount={(monaco) => {
                                                                // Register custom language for syntax highlighting
                                                                const LANG_ID = 'template-vars';
                                                                if (!monaco.languages.getLanguages().some(lang => lang.id === LANG_ID)) {
                                                                    monaco.languages.register({ id: LANG_ID });

                                                                    // Define custom theme: {{}} blue, variable green
                                                                    monaco.editor.defineTheme('template-theme', {
                                                                        base: 'vs',
                                                                        inherit: true,
                                                                        rules: [
                                                                            { token: 'delimiter.template', foreground: '1677ff' },  // Blue for {{}}
                                                                            { token: 'variable.template', foreground: '16a34a' }   // Green for variable
                                                                        ],
                                                                        colors: {
                                                                            'editorBracketMatch.background': '#00000000',
                                                                            'editorBracketMatch.border': '#00000000'
                                                                        }
                                                                    });

                                                                    // Token provider: {{}} blue, variable green
                                                                    monaco.languages.setMonarchTokensProvider(LANG_ID, {
                                                                        tokenizer: {
                                                                            root: [
                                                                                [/\{\{/, 'delimiter.template', '@variable'],
                                                                                [/./, '']
                                                                            ],
                                                                            variable: [
                                                                                [/\}\}/, 'delimiter.template', '@pop'],
                                                                                [/[a-zA-Z_][\w.]*/, 'variable.template'],
                                                                                [/./, '']
                                                                            ]
                                                                        }
                                                                    });
                                                                    monaco.languages.setLanguageConfiguration(LANG_ID, {
                                                                        autoClosingPairs: [
                                                                            { open: '{', close: '}' },
                                                                            { open: '{{', close: '}}' }
                                                                        ]
                                                                    });

                                                                    // Register completion provider for variables
                                                                    monaco.languages.registerCompletionItemProvider(LANG_ID, {
                                                                        triggerCharacters: ['{'],
                                                                        provideCompletionItems: (model, position) => {
                                                                            const textUntilPosition = model.getValueInRange({
                                                                                startLineNumber: position.lineNumber,
                                                                                startColumn: 1,
                                                                                endLineNumber: position.lineNumber,
                                                                                endColumn: position.column
                                                                            });

                                                                            // Only provide suggestions after {{
                                                                            if (!textUntilPosition.match(/\{\{[a-z0-9_.]*$/i)) {
                                                                                return { suggestions: [] };
                                                                            }

                                                                            const word = model.getWordUntilPosition(position);
                                                                            const range = {
                                                                                startLineNumber: position.lineNumber,
                                                                                endLineNumber: position.lineNumber,
                                                                                startColumn: word.startColumn,
                                                                                endColumn: word.endColumn
                                                                            };

                                                                            const suggestions = availableVariables.map(v => ({
                                                                                label: v.name,
                                                                                kind: monaco.languages.CompletionItemKind.Variable,
                                                                                documentation: {
                                                                                    value: `**${v.name}**\n\n${v.description || '无描述'}\n\n分类: \`${v.category || 'variable'}\``,
                                                                                    isTrusted: true
                                                                                },
                                                                                insertText: v.name,
                                                                                range: range,
                                                                                detail: v.description || v.category || '模板变量'
                                                                            }));

                                                                            return { suggestions };
                                                                        }
                                                                    });
                                                                }
                                                            }}
                                                            language="template-vars"
                                                            theme="template-theme"
                                                            options={{
                                                                fontSize: 14,
                                                                fontFamily: "'SF Mono', 'Menlo', 'Monaco', 'Consolas', monospace",
                                                                lineNumbers: 'on',
                                                                minimap: { enabled: false },
                                                                wordWrap: 'on',
                                                                automaticLayout: true,
                                                                scrollBeyondLastLine: false,
                                                                padding: { top: 12, bottom: 12 },
                                                                tabSize: 2,
                                                                renderWhitespace: 'selection',
                                                                quickSuggestions: true,
                                                                suggestOnTriggerCharacters: true,
                                                                wordBasedSuggestions: 'off',
                                                                folding: true,
                                                                lineDecorationsWidth: 8,
                                                                lineNumbersMinChars: 3,
                                                                glyphMargin: false,
                                                                contextmenu: true,
                                                                autoClosingBrackets: 'always',
                                                                // Disable bracket pair colorization (rainbow brackets)
                                                                'bracketPairColorization.enabled': false,
                                                                matchBrackets: 'never',
                                                                scrollbar: {
                                                                    vertical: 'auto',
                                                                    horizontal: 'auto',
                                                                    verticalScrollbarSize: 10,
                                                                    horizontalScrollbarSize: 10
                                                                }
                                                            }}
                                                            onMount={(editor) => {
                                                                editorRef.current = editor;
                                                            }}
                                                        />
                                                    </div>
                                                    <Form.Item name="body_template" noStyle rules={[{ required: true, message: '请输入模板内容' }]}>
                                                        <input type="hidden" />
                                                    </Form.Item>
                                                </div>
                                            </Form>
                                        </div>
                                    )}
                                </div>

                                {/* Floating Variable Button */}
                                {(selectedId || isCreating) && !showPreview && (
                                    <Tooltip title="插入变量">
                                        <Button
                                            type="primary"
                                            shape="circle"
                                            size="large"
                                            icon={<CodeOutlined />}
                                            onClick={() => setVariablesDrawerOpen(true)}
                                            className="templates-fab-button"
                                        />
                                    </Tooltip>
                                )}

                            </div>
                        </>
                    )}
                </div>

                {/* Variables Drawer */}
                <Drawer
                    title="可用变量"
                    placement="right"
                    width={340}
                    onClose={() => setVariablesDrawerOpen(false)}
                    open={variablesDrawerOpen}
                    styles={{ body: { padding: 16 } }}
                >
                    <Alert
                        message="点击变量即可复制到剪贴板"
                        type="info"
                        showIcon
                        style={{ marginBottom: 16 }}
                    />
                    {renderVariableHints()}
                </Drawer>
            </div>
        </StandardTable>
    );
};

// Helper for Format Radio
const RadioGroupOption = ({ value, onChange }: any) => {
    return (
        <Segmented
            value={value}
            onChange={onChange}
            options={[
                { label: 'Text', value: 'text' },
                { label: 'Markdown', value: 'markdown' },
                { label: 'HTML', value: 'html' },
            ]}
        />
    )
}

export default NotificationTemplatesPage;
