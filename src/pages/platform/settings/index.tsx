import React, { useState, useEffect, useCallback } from 'react';
import { useAccess } from '@umijs/max';
import { message, Spin } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import { getPlatformSettings, updatePlatformSetting } from '@/services/auto-healing/platform/settings';
import type { PlatformSettingModule } from '@/services/auto-healing/platform/settings';
import PlatformSettingsModuleCard from './PlatformSettingsModuleCard';
import {
    buildModuleSettingChanges,
    createModuleEditValues,
    type PlatformSettingEditableValue,
    type PlatformSettingEditValues,
} from './platformSettingsUtils';

type SettingSaveError = {
    key: string;
    message: string;
};

const toSettingSaveErrorLabel = (error: SettingSaveError) => `${error.key}(${error.message})`;

const resolveSettingSaveError = (
    key: string,
    result: PromiseSettledResult<Awaited<ReturnType<typeof updatePlatformSetting>>>,
): SettingSaveError | null => {
    if (result.status === 'rejected') {
        return { key, message: '请求失败' };
    }
    if (result.value.success === false) {
        return { key, message: result.value.message || '保存失败' };
    }
    return null;
};

const PlatformSettingsPage: React.FC = () => {
    const access = useAccess();
    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState<PlatformSettingModule[]>([]);

    // 编辑态
    const [editingModule, setEditingModule] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<PlatformSettingEditValues>({});
    const [saving, setSaving] = useState(false);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPlatformSettings();
            setModules(res);
        } catch {
            /* global error handler */
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    // 进入编辑模式
    const enterEdit = (module: PlatformSettingModule) => {
        setEditValues(createModuleEditValues(module));
        setEditingModule(module.module);
    };

    // 取消编辑
    const cancelEdit = () => {
        setEditingModule(null);
        setEditValues({});
    };

    const handleEditValueChange = useCallback((key: string, value: PlatformSettingEditableValue) => {
        setEditValues(prev => ({ ...prev, [key]: value }));
    }, []);

    // 保存整个模块
    const handleSaveModule = async (module: PlatformSettingModule) => {
        setSaving(true);
        try {
            const changes = buildModuleSettingChanges(module, editValues);

            if (changes.length === 0) {
                message.info('没有修改');
                cancelEdit();
                return;
            }

            const results = await Promise.allSettled(
                changes.map((change) => updatePlatformSetting(change.key, change.value)),
            );
            const failedItems: SettingSaveError[] = [];
            let okCount = 0;
            results.forEach((r, idx) => {
                const failedItem = resolveSettingSaveError(changes[idx].key, r);
                if (failedItem) {
                    failedItems.push(failedItem);
                    return;
                }
                okCount += 1;
            });

            // 无论是否部分成功，都刷新一次，以避免“部分保存成功但页面仍显示旧值”的错觉。
            await loadSettings();

            if (failedItems.length === 0) {
                message.success(`已保存 ${okCount} 项设置`);
                cancelEdit();
                return;
            }
            const failedLabels = failedItems.slice(0, 6).map(toSettingSaveErrorLabel).join(', ');
            message.error(`已保存 ${okCount} 项，失败 ${failedItems.length} 项：${failedLabels}${failedItems.length > 6 ? '…' : ''}`);
        } catch {
            /* global error handler */
        } finally {
            setSaving(false);
        }
    };

    const headerIcon = (
        <svg viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M24 4v4M24 40v4M4 24h4M40 24h4M8.686 8.686l2.828 2.828M36.486 36.486l2.828 2.828M8.686 39.314l2.828-2.828M36.486 11.514l2.828-2.828"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    return (
        <StandardTable<PlatformSettingModule>
            tabs={[{ key: 'settings', label: '平台设置' }]}
            title="平台设置"
            description="配置平台级别的系统参数，包括站内信、安全策略、系统行为等全局设置。"
            headerIcon={headerIcon}
        >
            <div style={{ padding: '24px', maxWidth: 800 }}>
                <Spin spinning={loading}>
                    {modules.length === 0 && !loading && (
                        <div style={{ textAlign: 'center', padding: '60px 0', color: '#8c8c8c' }}>
                            <SettingOutlined style={{ fontSize: 48, marginBottom: 12, display: 'block' }} />
                            <div>暂无可配置的平台设置</div>
                        </div>
                    )}
                    {modules.map((mod, idx) => {
                        const isEditing = editingModule === mod.module;
                        return (
                            <PlatformSettingsModuleCard
                                key={mod.module}
                                module={mod}
                                isEditing={isEditing}
                                isSaving={saving}
                                canManage={Boolean(access.canManagePlatformSettings)}
                                hasActiveEditor={editingModule !== null}
                                editValues={editValues}
                                isLast={idx === modules.length - 1}
                                onEnterEdit={enterEdit}
                                onCancel={cancelEdit}
                                onSave={handleSaveModule}
                                onValueChange={handleEditValueChange}
                            />
                        );
                    })}
                </Spin>
            </div>
        </StandardTable>
    );
};

export default PlatformSettingsPage;
