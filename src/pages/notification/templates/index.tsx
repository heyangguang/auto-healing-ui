import React from 'react';
import { useAccess } from '@umijs/max';
import { Button, Empty, Spin, Tooltip, Typography } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import SortToolbar from '@/components/SortToolbar';
import TemplateEditorForm from './TemplateEditorForm';
import TemplateEditorHeader from './TemplateEditorHeader';
import TemplatePreviewPane from './TemplatePreviewPane';
import TemplateSidebar from './TemplateSidebar';
import TemplateVariableHints from './TemplateVariableHints';
import TemplateVariablesDrawer from './TemplateVariablesDrawer';
import {
    EVENT_TYPE_CONFIG,
    NOTIFICATION_TEMPLATE_COLUMNS,
    NOTIFICATION_TEMPLATE_HEADER_ICON,
    NOTIFICATION_TEMPLATE_SEARCH_FIELDS,
    TEMPLATE_SORT_OPTIONS,
} from './notificationTemplateConstants';
import { useNotificationTemplatesPage } from './useNotificationTemplatesPage';
import './index.css';

const { Text } = Typography;

const NotificationTemplatesPage: React.FC = () => {
    const access = useAccess();
    const {
        availableVariables,
        editorContent,
        form,
        handleCreateNew,
        handleDelete,
        handlePreview,
        handleSave,
        handleSearchChange,
        handleSelect,
        hasMore,
        isCreating,
        isDirty,
        leftSidebarWidth,
        loading,
        loadingMore,
        loadMore,
        previewData,
        previewLoading,
        saving,
        selectedId,
        selectedTemplate,
        setEditorContent,
        setIsDirty,
        setSortBy,
        setSortOrder,
        setVariablesDrawerOpen,
        showPreview,
        sortBy,
        sortOrder,
        templates,
        totalTemplates,
        variablesDrawerOpen,
    } = useNotificationTemplatesPage();

    if (loading && templates.length === 0) {
        return (
            <StandardTable<AutoHealing.NotificationTemplate>
                columns={NOTIFICATION_TEMPLATE_COLUMNS}
                description="管理通知模板，配置不同事件的通知内容和格式"
                extraToolbarActions={(
                    <SortToolbar
                        onSortByChange={setSortBy}
                        onSortOrderChange={setSortOrder}
                        options={TEMPLATE_SORT_OPTIONS}
                        sortBy={sortBy}
                        sortOrder={sortOrder}
                        width={110}
                    />
                )}
                headerIcon={NOTIFICATION_TEMPLATE_HEADER_ICON}
                onPrimaryAction={handleCreateNew}
                onSearch={handleSearchChange}
                primaryActionDisabled={!access.canCreateTemplate}
                primaryActionLabel="新建模板"
                searchFields={NOTIFICATION_TEMPLATE_SEARCH_FIELDS}
                tabs={[{ key: 'editor', label: '模板编辑器' }]}
                title="通知模板"
            >
                <div className="templates-body" style={{ alignItems: 'center', justifyContent: 'center', minHeight: 400 }}>
                    <Spin size="large" tip="加载中..."><div /></Spin>
                </div>
            </StandardTable>
        );
    }

    return (
        <StandardTable<AutoHealing.NotificationTemplate>
            columns={NOTIFICATION_TEMPLATE_COLUMNS}
            description={`管理通知模板，配置不同事件的通知内容和格式，共 ${totalTemplates} 个模板`}
            extraToolbarActions={(
                <SortToolbar
                    onSortByChange={setSortBy}
                    onSortOrderChange={setSortOrder}
                    options={TEMPLATE_SORT_OPTIONS}
                    sortBy={sortBy}
                    sortOrder={sortOrder}
                    width={110}
                />
            )}
            headerIcon={NOTIFICATION_TEMPLATE_HEADER_ICON}
            onPrimaryAction={handleCreateNew}
            onSearch={handleSearchChange}
            primaryActionDisabled={!access.canCreateTemplate}
            primaryActionLabel="新建模板"
            searchFields={NOTIFICATION_TEMPLATE_SEARCH_FIELDS}
            tabs={[{ key: 'editor', label: '模板编辑器' }]}
            title="通知模板"
        >
            <div className="templates-body">
                <TemplateSidebar
                    hasMore={hasMore}
                    loading={loading}
                    loadingMore={loadingMore}
                    onLoadMore={loadMore}
                    onSelect={handleSelect}
                    selectedId={selectedId}
                    templates={templates}
                    width={leftSidebarWidth}
                />

                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff', minWidth: 350, overflow: 'hidden' }}>
                    {!selectedId && !isCreating ? (
                        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fafafa' }}>
                            {templates.length > 0 ? (
                                <Empty description={<Text type="secondary">从左侧选择一个模板或新建</Text>} />
                            ) : (
                                <Empty description={<Text type="secondary">请调整筛选条件或新建模板</Text>} />
                            )}
                        </div>
                    ) : (
                        <>
                            <TemplateEditorHeader
                                canDelete={access.canDeleteTemplate}
                                canSave={isDirty && (isCreating ? access.canCreateTemplate : access.canUpdateTemplate)}
                                form={form}
                                isCreating={isCreating}
                                isDirty={isDirty}
                                onDelete={handleDelete}
                                onNameChange={() => setIsDirty(true)}
                                onPreview={handlePreview}
                                onSave={handleSave}
                                saving={saving}
                                selectedId={selectedId}
                                showPreview={showPreview}
                            />

                            <div className="templates-editor-body">
                                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 0, overflowY: 'hidden' }}>
                                    {showPreview ? (
                                        <TemplatePreviewPane
                                            format={selectedTemplate?.format}
                                            previewData={previewData}
                                            previewLoading={previewLoading}
                                        />
                                    ) : (
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 24, paddingBottom: 0 }}>
                                            <TemplateEditorForm
                                                availableVariables={availableVariables}
                                                editorContent={editorContent}
                                                editorKey={`editor-${selectedId || 'new'}`}
                                                form={form}
                                                isCreating={isCreating}
                                                onDirty={() => setIsDirty(true)}
                                                onEditorChange={setEditorContent}
                                            />
                                        </div>
                                    )}
                                </div>

                                {(selectedId || isCreating) && !showPreview && (
                                    <Tooltip title="插入变量">
                                        <Button
                                            className="templates-fab-button"
                                            icon={<CodeOutlined />}
                                            onClick={() => setVariablesDrawerOpen(true)}
                                            shape="circle"
                                            size="large"
                                            type="primary"
                                        />
                                    </Tooltip>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <TemplateVariablesDrawer onClose={() => setVariablesDrawerOpen(false)} open={variablesDrawerOpen}>
                    <TemplateVariableHints variables={availableVariables} />
                </TemplateVariablesDrawer>
            </div>
        </StandardTable>
    );
};

export default NotificationTemplatesPage;
