import { Form, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  createIncidentSolutionTemplate,
  deleteIncidentSolutionTemplate,
  getIncidentSolutionTemplates,
  updateIncidentSolutionTemplate,
} from '@/services/auto-healing/incidentSolutionTemplates';
import { extractErrorMsg } from '@/utils/errorMsg';
import {
  buildSolutionTemplatePreview,
  buildTemplateEditorValues,
  buildTemplatePayload,
  classifySolutionTemplateVariables,
  DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES,
  filterSolutionTemplates,
  parseSolutionTemplateSearchParams,
  type SolutionTemplateFormValues,
  type SolutionTemplateSearchParams,
  type SolutionTemplateSortField,
  type SolutionTemplateSortOrder,
  solutionTemplateSummary,
  sortSolutionTemplates,
} from './solutionTemplateHelpers';

export const useSolutionTemplatesPage = () => {
  const [form] = Form.useForm<SolutionTemplateFormValues>();
  const [templates, setTemplates] = useState<
    AutoHealing.IncidentSolutionTemplate[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formRevision, setFormRevision] = useState(0);
  const [searchField, setSearchField] = useState('name');
  const [searchText, setSearchText] = useState('');
  const [closeStatus, setCloseStatus] = useState('all');
  const [stepsMode, setStepsMode] = useState('all');
  const [sortBy, setSortBy] = useState<SolutionTemplateSortField>('updated_at');
  const [sortOrder, setSortOrder] = useState<SolutionTemplateSortOrder>('desc');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getIncidentSolutionTemplates();
      setTemplates(data);
      setSelectedId((current) => current || data[0]?.id || null);
    } catch (error: unknown) {
      message.error(
        extractErrorMsg(
          error as Parameters<typeof extractErrorMsg>[0],
          '加载解决方案模板失败，请稍后重试',
        ),
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTemplates();
  }, [loadTemplates]);

  const visibleTemplates = useMemo(
    () =>
      sortSolutionTemplates(
        filterSolutionTemplates(templates, {
          searchField,
          searchText,
          closeStatus,
          stepsMode,
        }),
        sortBy,
        sortOrder,
      ),
    [
      closeStatus,
      searchField,
      searchText,
      sortBy,
      sortOrder,
      stepsMode,
      templates,
    ],
  );

  useEffect(() => {
    if (isCreating) {
      return;
    }
    if (visibleTemplates.some((item) => item.id === selectedId)) {
      return;
    }
    setSelectedId(visibleTemplates[0]?.id || null);
  }, [isCreating, selectedId, visibleTemplates]);

  const selectedTemplate = useMemo(
    () => templates.find((item) => item.id === selectedId) || null,
    [selectedId, templates],
  );

  useEffect(() => {
    if (isCreating) {
      form.setFieldsValue(DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES);
      setIsDirty(false);
      return;
    }
    form.setFieldsValue(buildTemplateEditorValues(selectedTemplate));
    setIsDirty(false);
  }, [form, isCreating, selectedTemplate]);

  const previewSections = useMemo(
    () => buildSolutionTemplatePreview(form.getFieldsValue(true)),
    [form, formRevision, isCreating, selectedId],
  );
  const variableUsage = useMemo(
    () => classifySolutionTemplateVariables(form.getFieldsValue(true)),
    [form, formRevision, isCreating, selectedId],
  );

  const handleSearchChange = useCallback(
    (params: SolutionTemplateSearchParams) => {
      const next = parseSolutionTemplateSearchParams(params);
      setSearchField(next.searchField);
      setSearchText(next.searchText);
      setCloseStatus(next.closeStatus);
      setStepsMode(next.stepsMode);
    },
    [],
  );

  const handleCreate = useCallback(() => {
    setIsCreating(true);
    setSelectedId(null);
    setShowPreview(false);
    form.setFieldsValue(DEFAULT_SOLUTION_TEMPLATE_FORM_VALUES);
  }, [form]);

  const handleSelect = useCallback((id: string) => {
    setIsCreating(false);
    setSelectedId(id);
    setShowPreview(false);
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      if (isCreating) {
        const created = await createIncidentSolutionTemplate(
          buildTemplatePayload(values),
        );
        message.success('模板已创建');
        setIsCreating(false);
        setSelectedId(created.id);
      } else if (selectedTemplate) {
        await updateIncidentSolutionTemplate(
          selectedTemplate.id,
          buildTemplatePayload(values),
        );
        message.success('模板已更新');
      }
      setIsDirty(false);
      await loadTemplates();
    } catch (error: unknown) {
      if (
        !(typeof error === 'object' && error !== null && 'errorFields' in error)
      ) {
        message.error(
          extractErrorMsg(
            error as Parameters<typeof extractErrorMsg>[0],
            isCreating ? '创建解决方案模板失败' : '更新解决方案模板失败',
          ),
        );
      }
    } finally {
      setSaving(false);
    }
  }, [form, isCreating, loadTemplates, selectedTemplate]);

  const handleDelete = useCallback(async () => {
    if (!selectedTemplate) {
      return;
    }
    try {
      await deleteIncidentSolutionTemplate(selectedTemplate.id);
      message.success('模板已删除');
      setSelectedId(null);
      await loadTemplates();
    } catch (error: unknown) {
      message.error(
        extractErrorMsg(
          error as Parameters<typeof extractErrorMsg>[0],
          '删除解决方案模板失败',
        ),
      );
    }
  }, [loadTemplates, selectedTemplate]);

  return {
    form,
    handleCreate,
    handleDelete,
    handleSave,
    handleSearchChange,
    handleSelect,
    handleValuesChange: () => {
      setIsDirty(true);
      setFormRevision((value) => value + 1);
    },
    isCreating,
    isDirty,
    loading,
    previewSections,
    saving,
    selectedId,
    selectedTemplate,
    setIsDirty,
    setShowPreview,
    setSortBy,
    setSortOrder,
    showPreview,
    solutionSummary: solutionTemplateSummary(selectedTemplate),
    sortBy,
    sortOrder,
    templates: visibleTemplates,
    totalTemplates: templates.length,
    variableUsage,
  };
};
