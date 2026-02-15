/**
 * SecretsSourceSelector — 密钥源选择器 v2
 *
 * 高性能设计：
 *   - 虚拟滚动（@tanstack/react-virtual）支持 1000+ 密钥
 *   - 搜索 300ms 防抖，筛选即时响应
 *   - 独立状态，不触发父组件重渲染
 */
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Modal, Input, Select, Typography, Tag, Space, Alert, Badge } from 'antd';
import {
    SearchOutlined, SafetyCertificateOutlined, ApiOutlined,
    CheckCircleFilled, InboxOutlined,
} from '@ant-design/icons';
import { useVirtualizer } from '@tanstack/react-virtual';
import { createStyles } from 'antd-style';

const { Text } = Typography;

/* ========== 样式 ========== */
const useStyles = createStyles(({ token }) => ({
    filterBar: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
    },
    listContainer: {
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        overflow: 'hidden',
        background: '#fff',
    },
    listScroll: {
        maxHeight: 320,
        overflow: 'auto',
    },
    listEmpty: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 0',
        color: '#bfbfbf',
    },
    listEmptyIcon: {
        fontSize: 40,
        marginBottom: 8,
        color: '#d9d9d9',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        cursor: 'pointer',
        borderBottom: '1px solid #f5f5f5',
        transition: 'background 0.1s',
        userSelect: 'none' as const,
        '&:hover': {
            background: '#fafafa',
        },
    },
    rowSelected: {
        background: '#e6f7ff !important',
        borderLeft: `3px solid ${token.colorPrimary}`,
        paddingLeft: 11,
    },
    rowDefault: {
        /* 默认密钥微标 */
    },
    rowLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
        flex: 1,
    },
    rowRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    statusBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#fafafa',
        borderTop: '1px solid #f0f0f0',
        fontSize: 12,
        color: '#8c8c8c',
    },
    selectedBanner: {
        padding: '8px 12px',
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
    },
}));

/* ========== 常量 ========== */
const TYPE_MAP: Record<string, { label: string; color: string }> = {
    vault: { label: 'Vault', color: '#722ed1' },
    file: { label: '文件', color: '#1890ff' },
    webhook: { label: 'Webhook', color: '#13c2c2' },
};

const AUTH_MAP: Record<string, string> = {
    ssh_key: 'SSH Key',
    password: 'Password',
};

const ROW_HEIGHT = 44;

/* ========== 组件 ========== */
interface SecretsSourceSelectorProps {
    open: boolean;
    sources: AutoHealing.SecretsSource[];
    targetName?: string;
    batchCount?: number;
    loading?: boolean;
    onConfirm: (sourceId: string) => void;
    onCancel: () => void;
}

const SecretsSourceSelector: React.FC<SecretsSourceSelectorProps> = ({
    open,
    sources,
    targetName,
    batchCount,
    loading,
    onConfirm,
    onCancel,
}) => {
    const { styles, cx } = useStyles();
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [filterType, setFilterType] = useState<string>('all');
    const [filterAuth, setFilterAuth] = useState<string>('all');
    const [selectedId, setSelectedId] = useState<string>();
    const [scrollEl, setScrollEl] = useState<HTMLDivElement | null>(null);

    /* 搜索防抖 300ms */
    useEffect(() => {
        const t = setTimeout(() => setDebouncedSearch(search), 300);
        return () => clearTimeout(t);
    }, [search]);

    /* 打开时重置状态（不自动选中任何密钥源） */
    useEffect(() => {
        if (open) {
            setSelectedId(undefined);
            setSearch('');
            setDebouncedSearch('');
            setFilterType('all');
            setFilterAuth('all');
        }
    }, [open]);

    /* 筛选 */
    const filtered = useMemo(() => {
        const q = debouncedSearch.toLowerCase();
        return sources.filter(s => {
            if (q && !s.name.toLowerCase().includes(q)) return false;
            if (filterType !== 'all' && s.type !== filterType) return false;
            if (filterAuth !== 'all' && s.auth_type !== filterAuth) return false;
            return true;
        });
    }, [sources, debouncedSearch, filterType, filterAuth]);

    /* 虚拟滚动 */
    const virtualizer = useVirtualizer({
        count: filtered.length,
        getScrollElement: () => scrollEl,
        estimateSize: () => ROW_HEIGHT,
        overscan: 8,
    });

    const handleConfirm = useCallback(() => {
        if (selectedId) onConfirm(selectedId);
    }, [selectedId, onConfirm]);

    const title = targetName
        ? `密钥测试 - ${targetName}`
        : `批量密钥测试 (${batchCount || 0} 台)`;

    const selectedSource = selectedId ? sources.find(s => s.id === selectedId) : null;

    return (
        <Modal
            title={
                <Space>
                    <SafetyCertificateOutlined style={{ color: '#1677ff' }} />
                    {title}
                </Space>
            }
            open={open}
            onCancel={onCancel}
            onOk={handleConfirm}
            okText="开始测试"
            okButtonProps={{ disabled: !selectedId, loading, icon: <ApiOutlined /> }}
            width={560}
            destroyOnClose
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 4 }}>
                {/* ─── 搜索 + 筛选 ─── */}
                <div className={styles.filterBar}>
                    <Input
                        prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                        placeholder="搜索密钥源名称..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        allowClear
                        style={{ flex: 1 }}
                    />
                    <Select
                        value={filterType}
                        onChange={v => { setFilterType(v); }}
                        style={{ width: 100 }}
                        options={[
                            { label: '全部类型', value: 'all' },
                            { label: 'Vault', value: 'vault' },
                            { label: '文件', value: 'file' },
                            { label: 'Webhook', value: 'webhook' },
                        ]}
                    />
                    <Select
                        value={filterAuth}
                        onChange={v => { setFilterAuth(v); }}
                        style={{ width: 110 }}
                        options={[
                            { label: '全部认证', value: 'all' },
                            { label: 'SSH Key', value: 'ssh_key' },
                            { label: 'Password', value: 'password' },
                        ]}
                    />
                </div>

                {/* ─── 密钥源列表（虚拟滚动） ─── */}
                <div className={styles.listContainer}>
                    <div ref={setScrollEl} className={styles.listScroll}>
                        {filtered.length === 0 ? (
                            <div className={styles.listEmpty}>
                                <InboxOutlined className={styles.listEmptyIcon} />
                                <Text type="secondary">没有匹配的密钥源</Text>
                            </div>
                        ) : (
                            <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                                {virtualizer.getVirtualItems().map(virtualRow => {
                                    const s = filtered[virtualRow.index];
                                    const isSelected = selectedId === s.id;
                                    const typeInfo = TYPE_MAP[s.type] || { label: s.type, color: '#8c8c8c' };
                                    const authLabel = AUTH_MAP[s.auth_type] || s.auth_type;

                                    return (
                                        <div
                                            key={s.id}
                                            className={cx(styles.row, isSelected && styles.rowSelected)}
                                            style={{
                                                position: 'absolute',
                                                top: 0,
                                                left: 0,
                                                width: '100%',
                                                height: ROW_HEIGHT,
                                                transform: `translateY(${virtualRow.start}px)`,
                                            }}
                                            onClick={() => setSelectedId(s.id)}
                                        >
                                            <div className={styles.rowLeft}>
                                                <Text
                                                    strong={isSelected}
                                                    style={{ fontSize: 13 }}
                                                    ellipsis={{ tooltip: s.name }}
                                                >
                                                    {s.name}
                                                </Text>
                                                {s.is_default && (
                                                    <Tag color="blue" style={{ fontSize: 10, lineHeight: '16px', padding: '0 4px', margin: 0 }}>
                                                        默认
                                                    </Tag>
                                                )}
                                                {s.status === 'inactive' && (
                                                    <Badge status="error" text={<Text type="secondary" style={{ fontSize: 11 }}>停用</Text>} />
                                                )}
                                            </div>
                                            <div className={styles.rowRight}>
                                                <Tag
                                                    style={{
                                                        margin: 0, fontSize: 10, lineHeight: '16px',
                                                        padding: '0 4px', color: typeInfo.color,
                                                        borderColor: typeInfo.color, background: 'transparent',
                                                    }}
                                                >
                                                    {typeInfo.label}
                                                </Tag>
                                                <Text type="secondary" style={{ fontSize: 11 }}>{authLabel}</Text>
                                                {isSelected && <CheckCircleFilled style={{ color: '#1890ff', fontSize: 14 }} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    {/* 底部状态栏 */}
                    <div className={styles.statusBar}>
                        <span>
                            共 {sources.length} 个密钥源
                            {filtered.length !== sources.length && `，已筛选 ${filtered.length} 个`}
                        </span>
                        {selectedSource && (
                            <span style={{ color: '#1890ff' }}>
                                <CheckCircleFilled style={{ marginRight: 4 }} />
                                已选: {selectedSource.name}
                            </span>
                        )}
                    </div>
                </div>

                {/* ─── 已选择提示（仅选择后显示） ─── */}
                {selectedSource && (() => {
                    const typeInfo = TYPE_MAP[selectedSource.type] || { label: selectedSource.type, color: '#8c8c8c' };
                    return (
                        <div className={styles.selectedBanner}>
                            <CheckCircleFilled style={{ color: '#1890ff' }} />
                            <Text strong style={{ fontSize: 12 }}>已选择：</Text>
                            <Text style={{ fontSize: 12 }}>{selectedSource.name}</Text>
                            <Tag style={{
                                margin: 0, fontSize: 10, lineHeight: '16px', padding: '0 4px',
                                color: typeInfo.color, borderColor: typeInfo.color, background: 'transparent',
                            }}>
                                {typeInfo.label}
                            </Tag>
                        </div>
                    );
                })()}

                {/* ─── 批量提示 ─── */}
                {batchCount && batchCount > 0 && (
                    <Alert
                        type="info"
                        showIcon
                        message={`将对 ${batchCount} 台主机执行连接测试`}
                        style={{ fontSize: 12 }}
                    />
                )}
            </div>
        </Modal>
    );
};

export default React.memo(SecretsSourceSelector);
