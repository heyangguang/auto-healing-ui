import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
    createTemplate,
    deleteTemplate,
    getTemplates,
    previewTemplate,
    updateTemplate,
} from '@/services/auto-healing/notification';
import {
    buildPreviewTemplateVariables,
    buildTemplateFilterParams,
    DEFAULT_TEMPLATE_FORM_VALUES,
    hasFormErrorFields,
    parseTemplateSearchParams,
    type NotificationTemplateSearchParams,
} from './notificationTemplateHelpers';
import {
    useConfirmNavigation,
    useTemplateVariables,
    useTemplateWindowWidth,
} from './useNotificationTemplateUi';
import {
    applyTemplateToForm,
    buildCreateTemplatePayload,
    buildUpdateTemplatePayload,
    type NotificationTemplateFormValues,
} from './notificationTemplateMutation';
import { extractErrorMsg } from '@/utils/errorMsg';

const PAGE_SIZE = 20;

export const useNotificationTemplatesPage = () => {
    const [form] = Form.useForm<NotificationTemplateFormValues>();
    const [templates, setTemplates] = useState<AutoHealing.NotificationTemplate[]>([]);
    const [totalTemplates, setTotalTemplates] = useState(0);
    const [loading, setLoading] = useState(true);
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const [isDirty, setIsDirty] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editorContent, setEditorContent] = useState('');
    const [searchText, setSearchText] = useState('');
    const [filterEventType, setFilterEventType] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterFormat, setFilterFormat] = useState('all');
    const [filterChannel, setFilterChannel] = useState('all');
    const [sortBy, setSortBy] = useState('updated_at');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState<AutoHealing.PreviewTemplateResponse | null>(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [variablesDrawerOpen, setVariablesDrawerOpen] = useState(false);
    const loadingMoreRef = useRef(false);
    const sortMountedRef = useRef(false);
    const pageRef = useRef(1);
    const selectedIdRef = useRef<string | null>(null);
    const isCreatingRef = useRef(false);
    const queryRef = useRef(buildTemplateFilterParams({
        filterChannel: 'all',
        filterEventType: 'all',
        filterFormat: 'all',
        filterStatus: 'all',
        searchText: '',
        sortBy: 'updated_at',
        sortOrder: 'desc',
        pageSize: PAGE_SIZE,
    }));
    const availableVariables = useTemplateVariables();
    const windowWidth = useTemplateWindowWidth();

    const handleSearchChange = useCallback((params: NotificationTemplateSearchParams) => {
        const nextFilters = parseTemplateSearchParams(params);
        setSearchText(nextFilters.searchText);
        setFilterEventType(nextFilters.filterEventType);
        setFilterStatus(nextFilters.filterStatus);
        setFilterFormat(nextFilters.filterFormat);
        setFilterChannel(nextFilters.filterChannel);
    }, []);

    const leftSidebarWidth = windowWidth < 768 ? 220 : 280;

    queryRef.current = buildTemplateFilterParams({
        filterChannel,
        filterEventType,
        filterFormat,
        filterStatus,
        searchText,
        sortBy,
        sortOrder,
        pageSize: PAGE_SIZE,
    });

    useEffect(() => {
        pageRef.current = page;
        selectedIdRef.current = selectedId;
        isCreatingRef.current = isCreating;
    }, [isCreating, page, selectedId]);

    const loadTemplates = useCallback(async (resetPage = true, silent = false, pageOverride?: number) => {
        if (resetPage) {
            if (!silent) {
                setLoading(true);
            }
            setPage(1);
        } else {
            setLoadingMore(true);
            loadingMoreRef.current = true;
        }

        try {
            const currentPage = pageOverride ?? (resetPage ? 1 : pageRef.current);
            const response = await getTemplates({ ...queryRef.current, page: currentPage });
            const nextTemplates = response.data || [];
            const total = response.total || 0;

            setTotalTemplates(total);
            setTemplates((previous) => (resetPage ? nextTemplates : [...previous, ...nextTemplates]));
            if (resetPage && !isCreatingRef.current) {
                const currentSelectedId = selectedIdRef.current;
                const hasSelectedTemplate = nextTemplates.some((template) => template.id === currentSelectedId);
                if (!currentSelectedId && nextTemplates.length > 0) {
                    setSelectedId(nextTemplates[0].id);
                } else if (currentSelectedId && !hasSelectedTemplate) {
                    setSelectedId(nextTemplates[0]?.id ?? null);
                    setShowPreview(false);
                } else if (nextTemplates.length === 0) {
                    setSelectedId(null);
                    setShowPreview(false);
                }
            }
            setHasMore(currentPage * PAGE_SIZE < total);
        } catch {
            if (resetPage) {
                setTemplates([]);
                setTotalTemplates(0);
                setSelectedId(null);
            }
            message.error('加载通知模板失败，请稍后重试');
        } finally {
            if (!silent) {
                setLoading(false);
            }
            setLoadingMore(false);
            loadingMoreRef.current = false;
        }
    }, []);

    const loadMore = useCallback(() => {
        if (loadingMoreRef.current || !hasMore || loading) {
            return;
        }
        const nextPage = page + 1;
        setPage(nextPage);
        void loadTemplates(false, false, nextPage);
    }, [hasMore, loadTemplates, loading, page]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void loadTemplates(true);
        }, 300);
        return () => clearTimeout(timer);
    }, [filterChannel, filterEventType, filterFormat, filterStatus, loadTemplates, searchText]);

    useEffect(() => {
        if (!sortMountedRef.current) {
            sortMountedRef.current = true;
            return;
        }
        void loadTemplates(true, true);
    }, [loadTemplates, sortBy, sortOrder]);

    const selectedTemplate = useMemo(() => {
        if (isCreating) {
            return null;
        }
        return templates.find((template) => template.id === selectedId);
    }, [isCreating, selectedId, templates]);

    useEffect(() => {
        if (isCreating) {
            form.resetFields();
            form.setFieldsValue(DEFAULT_TEMPLATE_FORM_VALUES);
            setEditorContent('');
            setIsDirty(false);
            return;
        }

        if (!selectedTemplate) {
            return;
        }

        applyTemplateToForm(form, selectedTemplate);
        setEditorContent(selectedTemplate.body_template || '');
        setIsDirty(false);
    }, [form, isCreating, selectedTemplate]);

    const confirmNavigation = useConfirmNavigation(isDirty);

    const handleSelect = useCallback((id: string) => {
        confirmNavigation(() => {
            setSelectedId(id);
            setIsCreating(false);
            setShowPreview(false);
        });
    }, [confirmNavigation]);

    const handleCreateNew = useCallback(() => {
        confirmNavigation(() => {
            setIsCreating(true);
            setSelectedId(null);
            setShowPreview(false);
        });
    }, [confirmNavigation]);

    const handleSave = useCallback(async () => {
        try {
            setSaving(true);
            const values = await form.validateFields();

            if (isCreating) {
                const response = await createTemplate(buildCreateTemplatePayload(values, editorContent));
                message.success('模板已创建');
                setIsCreating(false);
                setSelectedId(response.id || null);
                void loadTemplates(true, true);
            } else if (selectedId) {
                await updateTemplate(selectedId, buildUpdateTemplatePayload(values, editorContent));
                message.success('模板已更新');
                void loadTemplates(true, true);
            }
            setIsDirty(false);
        } catch (error: unknown) {
            if (!hasFormErrorFields(error)) {
                message.error(extractErrorMsg(
                    error as Parameters<typeof extractErrorMsg>[0],
                    isCreating ? '创建通知模板失败，请稍后重试' : '更新通知模板失败，请稍后重试',
                ));
            }
        } finally {
            setSaving(false);
        }
    }, [editorContent, form, isCreating, loadTemplates, selectedId]);

    const handleDelete = useCallback(async () => {
        if (!selectedId) {
            return;
        }
        try {
            await deleteTemplate(selectedId);
            message.success('模板已删除');
            setSelectedId((current) => (current === selectedId ? null : current));
            setIsCreating(false);
            void loadTemplates();
        } catch (error: unknown) {
            message.error(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '删除通知模板失败，请稍后重试'));
        }
    }, [loadTemplates, selectedId]);

    const handlePreview = useCallback(async () => {
        if (!selectedId && !isCreating) {
            return;
        }
        if (showPreview) {
            setShowPreview(false);
            return;
        }
        if (isDirty || isCreating) {
            message.warning('预览功能仅支持已保存的模板内容，请先保存您的更改。');
            return;
        }

        setPreviewLoading(true);
        setShowPreview(true);
        setPreviewData(null);

        try {
            const previewResult = await previewTemplate(selectedId!, {
                variables: buildPreviewTemplateVariables(),
            });
            setPreviewData(previewResult);
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : '未知错误';
            message.error(`预览失败: ${errorMessage}`);
            setShowPreview(false);
        } finally {
            setPreviewLoading(false);
        }
    }, [isCreating, isDirty, selectedId, showPreview]);
    return {
        availableVariables, editorContent, form, handleCreateNew, handleDelete, handlePreview, handleSave,
        handleSearchChange, handleSelect, hasMore, isCreating, isDirty, leftSidebarWidth, loading, loadingMore,
        loadMore, previewData, previewLoading, saving, selectedId, selectedTemplate,
        setEditorContent, setIsDirty, setSortBy, setSortOrder, setVariablesDrawerOpen, showPreview,
        sortBy, sortOrder, templates, totalTemplates, variablesDrawerOpen,
    };
};
