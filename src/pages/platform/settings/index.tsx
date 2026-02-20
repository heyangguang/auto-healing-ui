import React, { useState, useEffect, useCallback } from 'react';
import { useAccess } from '@umijs/max';
import { Card, Input, InputNumber, Switch, Button, message, Spin, Typography, Space, Tag, Divider } from 'antd';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import { getPlatformSettings, updatePlatformSetting } from '@/services/auto-healing/platform/settings';
import type { PlatformSettingModule } from '@/services/auto-healing/platform/settings';

const { Text } = Typography;

const MODULE_LABELS: Record<string, string> = {
    site_message: '站内信设置',
    security: '安全设置',
    system: '系统设置',
};

const PlatformSettingsPage: React.FC = () => {
    const access = useAccess();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState<Record<string, boolean>>({});
    const [modules, setModules] = useState<PlatformSettingModule[]>([]);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPlatformSettings();
            setModules(res?.data || []);
        } catch {
            message.error('加载平台设置失败');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadSettings();
    }, [loadSettings]);

    const handleSave = async (moduleKey: string, settingKey: string, value: any) => {
        const saveKey = `${moduleKey}_${settingKey}`;
        setSaving(prev => ({ ...prev, [saveKey]: true }));
        try {
            await updatePlatformSetting(settingKey, String(value));
            message.success('设置已保存');
            loadSettings();
        } catch {
            message.error('保存失败');
        } finally {
            setSaving(prev => ({ ...prev, [saveKey]: false }));
        }
    };

    const renderInput = (setting: any, moduleKey: string) => {
        const saveKey = `${moduleKey}_${setting.key}`;
        const isSaving = saving[saveKey];

        if (setting.type === 'bool') {
            const currentVal = setting.value === 'true';
            return (
                <Space>
                    <Switch
                        checked={currentVal}
                        loading={isSaving}
                        disabled={!access.canManagePlatformSettings}
                        onChange={(checked) => handleSave(moduleKey, setting.key, checked)}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {currentVal ? '已启用' : '已禁用'}
                    </Text>
                </Space>
            );
        }

        if (setting.type === 'int') {
            return (
                <Space>
                    <InputNumber
                        defaultValue={Number(setting.value)}
                        min={0}
                        style={{ width: 120 }}
                        disabled={!access.canManagePlatformSettings}
                        onBlur={(e) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val) && String(val) !== setting.value) {
                                handleSave(moduleKey, setting.key, val);
                            }
                        }}
                        onPressEnter={(e: any) => {
                            const val = Number(e.target.value);
                            if (!isNaN(val)) handleSave(moduleKey, setting.key, val);
                        }}
                        addonAfter={isSaving ? <Spin size="small" /> : undefined}
                    />
                    {setting.default_value && (
                        <Text type="secondary" style={{ fontSize: 12 }}>默认值：{setting.default_value}</Text>
                    )}
                </Space>
            );
        }

        // string type
        return (
            <Space.Compact style={{ width: 320 }}>
                <Input
                    defaultValue={setting.value}
                    readOnly={!access.canManagePlatformSettings}
                    onBlur={(e) => {
                        if (e.target.value !== setting.value) {
                            handleSave(moduleKey, setting.key, e.target.value);
                        }
                    }}
                />
                <Button
                    icon={<SaveOutlined />}
                    loading={isSaving}
                    onClick={(e) => {
                        const input = (e.currentTarget.closest('.ant-space-compact') as HTMLElement)?.querySelector('input') as HTMLInputElement;
                        if (input) handleSave(moduleKey, setting.key, input.value);
                    }}
                />
            </Space.Compact>
        );
    };

    const headerIcon = (
        <svg viewBox="0 0 48 48" fill="none">
            <circle cx="24" cy="24" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M24 4v4M24 40v4M4 24h4M40 24h4M8.686 8.686l2.828 2.828M36.486 36.486l2.828 2.828M8.686 39.314l2.828-2.828M36.486 11.514l2.828-2.828"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
        </svg>
    );

    return (
        <StandardTable<any>
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
                    {modules.map((mod, idx) => (
                        <Card
                            key={mod.module}
                            title={
                                <Space>
                                    <SettingOutlined />
                                    {MODULE_LABELS[mod.module] || mod.module}
                                    <Tag color="blue" style={{ fontFamily: 'monospace', fontSize: 11 }}>{mod.module}</Tag>
                                </Space>
                            }
                            style={{ marginBottom: idx < modules.length - 1 ? 16 : 0 }}
                        >
                            {mod.settings.map((setting, sIdx) => (
                                <div key={setting.key}>
                                    {sIdx > 0 && <Divider style={{ margin: '16px 0' }} />}
                                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 24 }}>
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ fontWeight: 500, marginBottom: 4 }}>{setting.label}</div>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{setting.description}</Text>
                                            <div style={{ marginTop: 4 }}>
                                                <Text style={{ fontSize: 11, fontFamily: 'monospace', color: '#8c8c8c' }}>
                                                    {setting.key}
                                                </Text>
                                            </div>
                                        </div>
                                        <div style={{ flexShrink: 0, paddingTop: 2 }}>
                                            {renderInput(setting, mod.module)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </Card>
                    ))}
                </Spin>
            </div>
        </StandardTable>
    );
};

export default PlatformSettingsPage;
