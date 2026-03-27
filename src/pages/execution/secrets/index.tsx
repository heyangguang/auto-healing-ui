import React, { useMemo } from 'react';
import { CheckCircleOutlined, CloudOutlined, FileOutlined, GlobalOutlined, PlusOutlined, SafetyCertificateOutlined } from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import StandardTable from '@/components/StandardTable';
import SecretsSourceDetailDrawer from './SecretsSourceDetailDrawer';
import SecretsSourceTestModals from './SecretsSourceTestModals';
import { createSecretSourceColumns } from './secretSourceColumns';
import { advancedSearchFields, headerIcon, searchFields } from './secretSourcePageConfig';
import { useSecretsSourceListModel } from './useSecretsSourceListModel';
import './index.css';

const SecretsSourceList: React.FC = () => {
    const access = useAccess();
    const model = useSecretsSourceListModel();

    const columns = useMemo(() => createSecretSourceColumns({
        canDeleteSource: !!access.canDeletePlugin,
        canTestSource: !!access.canTestPlugin,
        canUpdateSource: !!access.canUpdateSecretsSource,
        onCancelDefault: model.handleCancelDefault,
        onDelete: model.handleDelete,
        onOpenDetail: model.openDetail,
        onOpenEdit: model.openEdit,
        onOpenTestQuery: model.handleOpenTestQuery,
        onSetDefault: model.handleSetDefault,
        onToggleStatus: model.handleToggleStatus,
        testingId: model.testingId,
    }), [
        access.canDeletePlugin,
        access.canTestPlugin,
        access.canUpdateSecretsSource,
        model.handleCancelDefault,
        model.handleDelete,
        model.handleOpenTestQuery,
        model.handleSetDefault,
        model.handleToggleStatus,
        model.openDetail,
        model.openEdit,
        model.testingId,
    ]);

    const statsBar = useMemo(() => (
        <div className="secrets-stats-bar">
            <div className="secrets-stat-item">
                <CloudOutlined className="secrets-stat-icon secrets-stat-icon-total" />
                <div className="secrets-stat-content"><div className="secrets-stat-value">{model.stats.total}</div><div className="secrets-stat-label">总密钥源</div></div>
            </div>
            <div className="secrets-stat-divider" />
            <div className="secrets-stat-item">
                <CheckCircleOutlined className="secrets-stat-icon secrets-stat-icon-active" />
                <div className="secrets-stat-content"><div className="secrets-stat-value">{model.stats.active}</div><div className="secrets-stat-label">已启用</div></div>
            </div>
            <div className="secrets-stat-divider" />
            <div className="secrets-stat-item">
                <FileOutlined className="secrets-stat-icon secrets-stat-icon-file" />
                <div className="secrets-stat-content"><div className="secrets-stat-value">{model.stats.file}</div><div className="secrets-stat-label">本地文件</div></div>
            </div>
            <div className="secrets-stat-divider" />
            <div className="secrets-stat-item">
                <SafetyCertificateOutlined className="secrets-stat-icon secrets-stat-icon-vault" />
                <div className="secrets-stat-content"><div className="secrets-stat-value">{model.stats.vault}</div><div className="secrets-stat-label">Vault</div></div>
            </div>
            <div className="secrets-stat-divider" />
            <div className="secrets-stat-item">
                <GlobalOutlined className="secrets-stat-icon secrets-stat-icon-webhook" />
                <div className="secrets-stat-content"><div className="secrets-stat-value">{model.stats.webhook}</div><div className="secrets-stat-label">Webhook</div></div>
            </div>
        </div>
    ), [model.stats]);

    return (
        <>
            <StandardTable
                refreshTrigger={model.refreshTrigger}
                tabs={[{ key: 'list', label: '密钥源列表' }]}
                title="密钥管理"
                description="管理 SSH 凭据来源，支持本地文件、HashiCorp Vault、Webhook 等多种方式获取凭据。"
                headerIcon={headerIcon}
                headerExtra={statsBar}
                searchFields={searchFields}
                advancedSearchFields={advancedSearchFields}
                primaryActionLabel="添加密钥源"
                primaryActionIcon={<PlusOutlined />}
                primaryActionDisabled={!access.canCreateSecretsSource}
                onPrimaryAction={model.openCreate}
                columns={columns}
                rowKey="id"
                onRowClick={model.openDetail}
                request={model.handleRequest}
                defaultPageSize={20}
                preferenceKey="secrets_v2"
            />

            <SecretsSourceDetailDrawer
                canTestSource={!!access.canTestPlugin}
                canUpdateSource={!!access.canUpdateSecretsSource}
                currentSource={model.currentSource}
                detailError={model.detailError}
                loading={model.detailLoading}
                onClose={model.closeDetail}
                onEdit={(source) => {
                    model.closeDetail();
                    model.openEdit(source);
                }}
                onOpenTestQuery={model.handleOpenTestQuery}
                open={model.drawerOpen}
            />

            <SecretsSourceTestModals
                onCloseResult={model.closeTestResultModal}
                onCloseTestQuery={model.closeTestQueryModal}
                onSubmitTestQuery={model.handleTestQuery}
                onUpdateHosts={model.setSelectedTestHosts}
                onUpdateIps={model.setSelectedTestHostIps}
                selectedTestHostIps={model.selectedTestHostIps}
                testQueryModalOpen={model.testQueryModalOpen}
                testQuerySource={model.testQuerySource}
                testResultModalOpen={model.testResultModalOpen}
                testResults={model.testResults}
                testingId={model.testingId}
            />
        </>
    );
};

export default SecretsSourceList;
