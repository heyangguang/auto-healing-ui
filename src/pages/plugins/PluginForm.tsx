import React, { useState, useEffect, useCallback, useRef } from 'react';
import { history, useParams, useAccess } from '@umijs/max';
import { Form, Button, message, Spin, Divider } from 'antd';
import { SaveOutlined } from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import { getPlugin, createPlugin, type PluginRecord, updatePlugin } from '@/services/auto-healing/plugins';
import PluginConnectionSection from './PluginConnectionSection';
import PluginFieldMappingSection from './PluginFieldMappingSection';
import PluginSyncSettingsSection from './PluginSyncSettingsSection';
import {
    buildPluginPayload,
    DEFAULT_PLUGIN_MAX_FAILURES,
    DEFAULT_PLUGIN_SYNC_INTERVAL_MINUTES,
    getPluginEditInitialValues,
    hasIncompletePluginFilter,
    type EditablePluginExtraParam,
    type EditablePluginFilter,
    type EditablePluginMapping,
    type PluginFormValues,
} from './pluginFormHelpers';
import './PluginForm.css';

const PluginFormPage: React.FC = () => {
    const access = useAccess();
    const params = useParams<{ id?: string }>();
    const isEdit = !!params.id;
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const originalConfigRef = useRef<Partial<AutoHealing.PluginConfig> | undefined>(undefined);
    const [loadedAuthType, setLoadedAuthType] = useState<string | undefined>(undefined);

    // Dynamic arrays
    const [mappings, setMappings] = useState<EditablePluginMapping[]>([]);
    const [filters, setFilters] = useState<EditablePluginFilter[]>([]);
    const [extraParams, setExtraParams] = useState<EditablePluginExtraParam[]>([]);

    const currentType = Form.useWatch('type', form) || 'itsm';
    const authType = Form.useWatch('auth_type', form) || 'basic';
    const syncEnabled = Form.useWatch('sync_enabled', form);

    useEffect(() => {
        if (!isEdit || !params.id) {
            originalConfigRef.current = undefined;
            setLoadedAuthType(undefined);
            form.setFieldsValue({
                type: 'itsm',
                auth_type: 'basic',
                sync_enabled: true,
                sync_interval_minutes: DEFAULT_PLUGIN_SYNC_INTERVAL_MINUTES,
                max_failures: DEFAULT_PLUGIN_MAX_FAILURES,
            });
            return;
        }

        setLoading(true);
        (async () => {
            try {
                const plugin = await getPlugin(params.id!);
                originalConfigRef.current = plugin.config || undefined;
                setLoadedAuthType(plugin.config?.auth_type || 'basic');
                form.setFieldsValue(getPluginEditInitialValues(plugin as PluginRecord));
                const mapping = plugin.type === 'cmdb'
                    ? plugin.field_mapping?.cmdb_mapping
                    : plugin.field_mapping?.incident_mapping;
                setMappings(mapping
                    ? Object.entries(mapping).map(([k, v]) => ({ standard: k, external: v as string }))
                    : []);

                // Filters
                setFilters(plugin.sync_filter?.rules?.map((rule) => ({
                    field: rule.field || '',
                    operator: rule.operator,
                    value: Array.isArray(rule.value) ? rule.value.join(',') : String(rule.value || ''),
                })) || []);

                const extraParamEntries = plugin.config?.extra_params;
                setExtraParams(extraParamEntries
                    ? Object.entries(extraParamEntries).map(([key, value]) => ({ key, value: String(value) }))
                    : []);
            } catch {
                /* global error handler */
            } finally {
                setLoading(false);
            }
        })();
    }, [form, isEdit, params.id]);

    const addMapping = useCallback(() => setMappings((prev) => [...prev, { standard: '', external: '' }]), []);
    const removeMapping = useCallback((index: number) => setMappings((prev) => prev.filter((_, idx) => idx !== index)), []);
    const updateMapping = useCallback((index: number, field: 'standard' | 'external', value: string) => {
        setMappings((prev) => prev.map((mapping, idx) => (
            idx === index ? { ...mapping, [field]: value } : mapping
        )));
    }, []);

    const addFilter = useCallback(() => setFilters((prev) => [...prev, { field: '', operator: 'equals', value: '' }]), []);
    const removeFilter = useCallback((index: number) => setFilters((prev) => prev.filter((_, idx) => idx !== index)), []);
    const updateFilter = useCallback((index: number, field: 'field' | 'operator' | 'value', value: EditablePluginFilter['operator'] | string) => {
        setFilters((prev) => prev.map((filter, idx) => (
            idx === index ? { ...filter, [field]: value } as EditablePluginFilter : filter
        )));
    }, []);

    const addExtraParam = useCallback(() => setExtraParams((prev) => [...prev, { key: '', value: '' }]), []);
    const removeExtraParam = useCallback((index: number) => setExtraParams((prev) => prev.filter((_, idx) => idx !== index)), []);
    const updateExtraParam = useCallback((index: number, field: 'key' | 'value', value: string) => {
        setExtraParams((prev) => prev.map((param, idx) => (
            idx === index ? { ...param, [field]: value } : param
        )));
    }, []);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields() as PluginFormValues;
            if (hasIncompletePluginFilter(filters)) {
                message.error('过滤规则的字段和匹配值必须同时填写');
                return;
            }
            setSubmitting(true);
            const payload = buildPluginPayload({
                values,
                extraParams,
                filters,
                mappings,
                originalConfig: originalConfigRef.current,
            });

            if (isEdit && params.id) {
                await updatePlugin(params.id, payload);
                message.success('更新成功');
            } else {
                await createPlugin(payload);
                message.success('创建成功');
            }
            history.push('/resources/plugins');
        } catch (error) {
            if (!(error as { errorFields?: unknown }).errorFields) {
                /* global error handler */
            }
        } finally {
            setSubmitting(false);
        }
    };

    // ==================== Render ====================
    return (
        <div className="plugin-form-page">
            <SubPageHeader
                title={isEdit ? '编辑插件' : '新建插件'}
                onBack={() => history.push('/resources/plugins')}
            />

            <div className="plugin-form-card">
                <Spin spinning={loading}>
                    <Form form={form} layout="vertical" className="plugin-form-content">
                        <PluginConnectionSection
                            authType={authType}
                            currentType={currentType}
                            extraParams={extraParams}
                            isEdit={isEdit}
                            loadedAuthType={loadedAuthType}
                            onAddExtraParam={addExtraParam}
                            onRemoveExtraParam={removeExtraParam}
                            onUpdateExtraParam={updateExtraParam}
                        />

                        <PluginSyncSettingsSection
                            filters={filters}
                            onAddFilter={addFilter}
                            onRemoveFilter={removeFilter}
                            onUpdateFilter={updateFilter}
                            syncEnabled={syncEnabled}
                        />

                        <PluginFieldMappingSection
                            currentType={currentType}
                            mappings={mappings}
                            onAddMapping={addMapping}
                            onRemoveMapping={removeMapping}
                            onUpdateMapping={updateMapping}
                        />

                        <Divider style={{ margin: '16px 0 24px' }} />
                        <div className="plugin-form-actions">
                            <Button type="primary" icon={<SaveOutlined />} loading={submitting} disabled={isEdit ? !access.canUpdatePlugin : !access.canCreatePlugin} onClick={handleSubmit}>
                                {isEdit ? '保存修改' : '创建插件'}
                            </Button>
                            <Button onClick={() => history.push('/resources/plugins')}>取消</Button>
                        </div>
                    </Form>
                </Spin>
            </div>
        </div>
    );
};

export default PluginFormPage;
