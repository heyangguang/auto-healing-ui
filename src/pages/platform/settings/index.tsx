import React, { useState, useEffect, useCallback } from 'react';
import { useAccess } from '@umijs/max';
import { Card, Input, InputNumber, Switch, Button, message, Spin, Typography, Space, Tag, Divider } from 'antd';
import { SaveOutlined, SettingOutlined, EditOutlined, CloseOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import { getPlatformSettings, updatePlatformSetting } from '@/services/auto-healing/platform/settings';
import type { PlatformSettingModule } from '@/services/auto-healing/platform/settings';

const { Text } = Typography;

const MODULE_LABELS: Record<string, string> = {
    site: '站点配置',
    site_message: '站内信设置',
    security: '安全设置',
    system: '系统设置',
    email: '邮件服务',
};

const PlatformSettingsPage: React.FC = () => {
    const access = useAccess();
    const [loading, setLoading] = useState(true);
    const [modules, setModules] = useState<PlatformSettingModule[]>([]);

    // 编辑态
    const [editingModule, setEditingModule] = useState<string | null>(null);
    const [editValues, setEditValues] = useState<Record<string, any>>({});
    const [saving, setSaving] = useState(false);

    const loadSettings = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPlatformSettings();
            setModules(res?.data || []);
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
    const enterEdit = (mod: PlatformSettingModule) => {
        const values: Record<string, any> = {};
        mod.settings.forEach(s => {
            if (s.type === 'bool') values[s.key] = s.value === 'true';
            else if (s.type === 'int') values[s.key] = Number(s.value) || 0;
            else values[s.key] = s.value || '';
        });
        setEditValues(values);
        setEditingModule(mod.module);
    };

    // 取消编辑
    const cancelEdit = () => {
        setEditingModule(null);
        setEditValues({});
    };

    // 保存整个模块
    const handleSaveModule = async (mod: PlatformSettingModule) => {
        setSaving(true);
        try {
            const changes: { key: string; value: string }[] = [];
            mod.settings.forEach(s => {
                const newVal = String(editValues[s.key] ?? '');
                if (newVal !== s.value) {
                    changes.push({ key: s.key, value: newVal });
                }
            });

            if (changes.length === 0) {
                message.info('没有修改');
                cancelEdit();
                return;
            }

            for (const c of changes) {
                await updatePlatformSetting(c.key, c.value);
            }

            message.success(`已保存 ${changes.length} 项设置`);
            cancelEdit();
            loadSettings();
        } catch {
            /* global error handler */
        } finally {
            setSaving(false);
        }
    };

    // 渲染只读值
    const renderReadOnly = (setting: any) => {
        if (setting.type === 'bool') {
            const val = setting.value === 'true';
            return (
                <Space>
                    <Tag color={val ? 'green' : 'default'} style={{ margin: 0 }}>
                        {val ? '已启用' : '已禁用'}
                    </Tag>
                </Space>
            );
        }
        if (setting.type === 'int') {
            return (
                <Space>
                    <span style={{ fontSize: 13, color: '#262626', fontVariantNumeric: 'tabular-nums' }}>
                        {setting.value || setting.default_value || '0'}
                    </span>
                    {setting.default_value && (
                        <Text type="secondary" style={{ fontSize: 12 }}>默认值：{setting.default_value}</Text>
                    )}
                </Space>
            );
        }
        // string
        if (!setting.value) {
            return <Text type="secondary" style={{ fontSize: 12, fontStyle: 'italic' }}>未设置</Text>;
        }
        if (setting.key?.includes('password')) {
            return <span style={{ fontSize: 13, color: '#262626' }}>{'••••••••'}</span>;
        }
        return <span style={{ fontSize: 13, color: '#262626' }}>{setting.value}</span>;
    };

    // 渲染编辑控件
    const renderEditInput = (setting: any) => {
        const val = editValues[setting.key];
        const onChange = (newVal: any) => {
            setEditValues(prev => ({ ...prev, [setting.key]: newVal }));
        };

        if (setting.type === 'bool') {
            return (
                <Space>
                    <Switch
                        checked={val}
                        onChange={onChange}
                    />
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {val ? '已启用' : '已禁用'}
                    </Text>
                </Space>
            );
        }

        if (setting.type === 'int') {
            return (
                <Space>
                    <InputNumber
                        value={val}
                        min={0}
                        style={{ width: 120 }}
                        onChange={(v) => onChange(v ?? 0)}
                    />
                    {setting.default_value && (
                        <Text type="secondary" style={{ fontSize: 12 }}>默认值：{setting.default_value}</Text>
                    )}
                </Space>
            );
        }

        // string — 密码用 Password
        if (setting.key?.includes('password')) {
            return (
                <Input.Password
                    value={val}
                    placeholder={setting.description || '请输入'}
                    style={{ width: 320 }}
                    onChange={(e) => onChange(e.target.value)}
                />
            );
        }
        return (
            <Input
                value={val}
                placeholder={setting.description || '请输入'}
                style={{ width: 320 }}
                onChange={(e) => onChange(e.target.value)}
            />
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
                    {modules.map((mod, idx) => {
                        const isEditing = editingModule === mod.module;
                        return (
                            <Card
                                key={mod.module}
                                title={
                                    <Space>
                                        <SettingOutlined />
                                        {MODULE_LABELS[mod.module] || mod.module}
                                        <Tag color="blue" style={{ fontSize: 11 }}>{mod.module}</Tag>
                                    </Space>
                                }
                                extra={
                                    isEditing ? (
                                        <Space size={8}>
                                            <Button
                                                size="small"
                                                icon={<CloseOutlined />}
                                                onClick={cancelEdit}
                                                disabled={saving}
                                            >
                                                取消
                                            </Button>
                                            <Button
                                                type="primary" size="small"
                                                icon={<SaveOutlined />}
                                                loading={saving}
                                                onClick={() => handleSaveModule(mod)}
                                            >
                                                保存
                                            </Button>
                                        </Space>
                                    ) : (
                                        <Button
                                            type="link" size="small"
                                            icon={<EditOutlined />}
                                            disabled={!access.canManagePlatformSettings || editingModule !== null}
                                            onClick={() => enterEdit(mod)}
                                            style={{ padding: 0 }}
                                        >
                                            编辑
                                        </Button>
                                    )
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
                                                    <Text style={{ fontSize: 11, color: '#8c8c8c' }}>
                                                        {setting.key}
                                                    </Text>
                                                </div>
                                            </div>
                                            <div style={{ flexShrink: 0, paddingTop: 2 }}>
                                                {isEditing ? renderEditInput(setting) : renderReadOnly(setting)}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </Card>
                        );
                    })}
                </Spin>
            </div>
        </StandardTable>
    );
};

export default PlatformSettingsPage;
