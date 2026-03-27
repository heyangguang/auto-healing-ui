/**
 * ConnectionTestResultModal — 密钥连接测试结果弹窗
 *
 * 功能：
 *   - 顶部统计卡片（总数 / 成功 / 失败 / 成功率）
 *   - 按结果分组：成功组 + 按错误信息聚合的失败组
 *   - 展示丰富主机信息：IP、主机名、OS、类型、环境
 *   - 失败主机一键复制（antd copyable）
 */
import React, { useMemo, useState } from 'react';
import { Modal, Button, Typography, Tag, Progress, Space, Tooltip, Table } from 'antd';
import type { TableColumnsType } from 'antd';
import {
    CheckCircleFilled, CloseCircleFilled, DownOutlined,
    RightOutlined, DesktopOutlined, CopyOutlined,
    LinuxOutlined, WindowsOutlined, CloudOutlined,
    AppstoreOutlined, GlobalOutlined, HddOutlined,
} from '@ant-design/icons';
import { createStyles } from 'antd-style';

const { Text, Paragraph } = Typography;

/* ========== OS 图标映射 ========== */
const getOSIcon = (os?: string) => {
    if (!os) return <CloudOutlined style={{ color: '#8c8c8c' }} />;
    const lower = os.toLowerCase();
    if (lower.includes('linux') || lower.includes('ubuntu') || lower.includes('centos') || lower.includes('rhel') || lower.includes('debian'))
        return <LinuxOutlined style={{ color: '#1890ff' }} />;
    if (lower.includes('windows') || lower.includes('win'))
        return <WindowsOutlined style={{ color: '#0078d4' }} />;
    return <CloudOutlined style={{ color: '#8c8c8c' }} />;
};

/* 类型映射 */
const TYPE_LABELS: Record<string, { text: string; icon: React.ReactNode }> = {
    server: { text: '服务器', icon: <DesktopOutlined /> },
    application: { text: '应用', icon: <AppstoreOutlined /> },
    network: { text: '网络', icon: <GlobalOutlined /> },
    database: { text: '数据库', icon: <HddOutlined /> },
};

/* 环境颜色 */
const ENV_COLORS: Record<string, string> = {
    production: 'red',
    staging: 'orange',
    dev: 'blue',
    test: 'green',
};

/* ========== 样式 ========== */
const useStyles = createStyles(({ token }) => ({
    summary: {
        display: 'flex',
        gap: 1,
        background: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
        background: '#fff',
        padding: '14px 0',
        textAlign: 'center' as const,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 600,
        lineHeight: 1.2,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 2,
    },
    groupContainer: {
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    groupHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        cursor: 'pointer',
        userSelect: 'none' as const,
        transition: 'background 0.15s',
        borderBottom: '1px solid #f0f0f0',
        '&:hover': {
            background: '#fafafa',
        },
    },
    groupHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 0,
    },
    groupHeaderRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    groupBody: {
        maxHeight: 280,
        overflow: 'auto',
        background: '#fafafa',
    },
    errorGroupDivider: {
        borderTop: '1px solid #f0f0f0',
    },
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    copyWrapper: {
        display: 'inline-flex',
        alignItems: 'center',
        '& .ant-typography': {
            marginBottom: '0 !important',
        },
        '& .ant-typography-copy': {
            marginInlineStart: '0 !important',
        },
    },
}));

/* ========== 类型 ========== */
interface ConnectionTestResultModalProps {
    open: boolean;
    results: AutoHealing.CMDBBatchConnectionTestResult | null;
    /** 传入 CMDB 资产列表（selectedRows 或 [singleTestTarget]），用于关联展示丰富信息 */
    cmdbItems?: Array<{
        id: string;
        name?: string;
        hostname?: string;
        ip_address?: string;
        status?: string;
        os?: string;
        os_version?: string;
        type?: string;
        environment?: string;
    }>;
    onClose: () => void;
}

type CMDBItemLike = NonNullable<ConnectionTestResultModalProps['cmdbItems']>[number];

interface HostInfo {
    host: string;
    cmdb_id: string;
    latency_ms?: number;
    message: string;
    // 来自 CMDB 关联
    hostname?: string;
    os?: string;
    os_version?: string;
    type?: string;
    environment?: string;
    name?: string;
}

interface AggregatedGroup {
    key: string;
    type: 'success' | 'error';
    label: string;
    count: number;
    hosts: HostInfo[];
}

/* ========== 组内 Table 列定义 ========== */
const getGroupColumns = (isSuccess: boolean) => {
    const cols: TableColumnsType<HostInfo> = [
        {
            title: 'IP',
            dataIndex: 'host',
            key: 'host',
            width: 120,
            render: (v: string) => (
                <Text style={{ fontFamily: 'monospace', fontSize: 12 }}>{v}</Text>
            ),
        },
        {
            title: '主机名',
            dataIndex: 'hostname',
            key: 'hostname',
            width: 120,
            ellipsis: { showTitle: true },
            render: (v: string) => v || '-',
        },
        {
            title: 'OS',
            dataIndex: 'os',
            key: 'os',
            width: 90,
            render: (v: string, r: HostInfo) => (
                <Space size={4}>
                    {getOSIcon(v)}
                    <span style={{ fontSize: 12 }}>{v || '-'}</span>
                </Space>
            ),
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            width: 80,
            render: (v: string) => {
                const info = TYPE_LABELS[v];
                return info ? (
                    <Space size={4}>
                        {info.icon}
                        <span style={{ fontSize: 12 }}>{info.text}</span>
                    </Space>
                ) : '-';
            },
        },
        {
            title: '环境',
            dataIndex: 'environment',
            key: 'environment',
            width: 70,
            render: (v: string) => v ? (
                <Tag color={ENV_COLORS[v] || 'default'} style={{ margin: 0, fontSize: 11 }}>
                    {v}
                </Tag>
            ) : '-',
        },
    ];

    if (isSuccess) {
        cols.push({
            title: '延迟',
            dataIndex: 'latency_ms',
            key: 'latency_ms',
            width: 60,
            align: 'right',
            render: (v: number) => v != null && v > 0
                ? <Text type="secondary" style={{ fontSize: 11 }}>{v}ms</Text>
                : '-',
        });
    }

    return cols;
};

/* ========== 组件 ========== */
const ConnectionTestResultModal: React.FC<ConnectionTestResultModalProps> = ({
    open,
    results,
    cmdbItems = [],
    onClose,
}) => {
    const { styles } = useStyles();
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    /* 构建 cmdb_id -> CMDBItem 查找表 */
    const cmdbMap = useMemo(() => {
        const m = new Map<string, CMDBItemLike>();
        for (const item of cmdbItems) {
            m.set(item.id, item);
        }
        return m;
    }, [cmdbItems]);

    /* 聚合计算 */
    const groups = useMemo<AggregatedGroup[]>(() => {
        if (!results?.results?.length) return [];

        const successItems: HostInfo[] = [];
        const errorMap = new Map<string, HostInfo[]>();

        for (const r of results.results) {
            const cmdb = cmdbMap.get(r.cmdb_id);
            const item: HostInfo = {
                host: r.host,
                cmdb_id: r.cmdb_id,
                latency_ms: r.latency_ms,
                message: r.message,
                hostname: cmdb?.hostname,
                os: cmdb?.os,
                os_version: cmdb?.os_version,
                type: cmdb?.type,
                environment: cmdb?.environment,
                name: cmdb?.name,
            };
            if (r.success) {
                successItems.push(item);
            } else {
                const errKey = r.message || '未知错误';
                if (!errorMap.has(errKey)) errorMap.set(errKey, []);
                errorMap.get(errKey)!.push(item);
            }
        }

        const grouped: AggregatedGroup[] = [];

        if (successItems.length > 0) {
            grouped.push({
                key: '__success__',
                type: 'success',
                label: '连接成功',
                count: successItems.length,
                hosts: successItems.sort((a, b) => a.host.localeCompare(b.host)),
            });
        }

        const errorEntries = Array.from(errorMap.entries()).sort((a, b) => b[1].length - a[1].length);
        for (const [errMsg, items] of errorEntries) {
            grouped.push({
                key: errMsg,
                type: 'error',
                label: errMsg,
                count: items.length,
                hosts: items.sort((a, b) => a.host.localeCompare(b.host)),
            });
        }

        return grouped;
    }, [results, cmdbMap]);

    /* 默认展开：失败组全展开 */
    React.useEffect(() => {
        if (open && groups.length > 0) {
            const defaultExpanded = new Set<string>();
            for (const g of groups) {
                if (g.type === 'error') defaultExpanded.add(g.key);
            }
            if (defaultExpanded.size === 0 && groups.length > 0) {
                defaultExpanded.add(groups[0].key);
            }
            setExpandedKeys(defaultExpanded);
        }
    }, [open, groups]);

    const toggleExpand = (key: string) => {
        setExpandedKeys(prev => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    /* 失败主机文本 */
    const failedHostsText = useMemo(() => {
        if (!results) return '';
        return results.results
            .filter(r => !r.success)
            .map(r => r.host)
            .join('\n');
    }, [results]);

    if (!results) return null;

    const successRate = results.total > 0
        ? Math.round((results.success / results.total) * 100)
        : 0;

    return (
        <Modal
            title={
                <Space>
                    <DesktopOutlined style={{ color: '#1677ff' }} />
                    密钥连接测试结果
                </Space>
            }
            open={open}
            onCancel={onClose}
            width={780}
            destroyOnHidden
            footer={
                <div className={styles.footer}>
                    <div>
                        {results.failed > 0 && (
                            <span className={styles.copyWrapper}>
                                <CopyOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />
                                <Paragraph
                                    copyable={{
                                        text: failedHostsText,
                                        tooltips: ['复制失败主机', '已复制'],
                                        icon: [
                                            <Button size="small" key="copy">复制失败主机 ({results.failed}台)</Button>,
                                            <Button size="small" type="primary" key="copied">已复制 ✓</Button>,
                                        ],
                                    }}
                                    style={{ marginBottom: 0, display: 'inline' }}
                                />
                            </span>
                        )}
                    </div>
                    <Button onClick={onClose}>关闭</Button>
                </div>
            }
        >
            {/* ─── 统计摘要 ─── */}
            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{results.total}</div>
                    <div className={styles.summaryLabel}>总数</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: '#52c41a' }}>
                        {results.success}
                    </div>
                    <div className={styles.summaryLabel}>成功</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: results.failed > 0 ? '#ff4d4f' : '#8c8c8c' }}>
                        {results.failed}
                    </div>
                    <div className={styles.summaryLabel}>失败</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: successRate === 100 ? '#52c41a' : successRate >= 80 ? '#faad14' : '#ff4d4f' }}>
                        {successRate}%
                    </div>
                    <div className={styles.summaryLabel}>成功率</div>
                </div>
            </div>

            {/* 进度条 */}
            {results.total > 1 && (
                <Progress
                    percent={successRate}
                    size="small"
                    status={results.failed > 0 ? 'exception' : 'success'}
                    style={{ marginBottom: 16 }}
                />
            )}

            {/* ─── 分组聚合列表 ─── */}
            <div className={styles.groupContainer} style={{ maxHeight: 420, overflow: 'auto' }}>
                {groups.map((group, idx) => {
                    const expanded = expandedKeys.has(group.key);
                    const isSuccess = group.type === 'success';

                    return (
                        <div key={group.key} className={idx > 0 ? styles.errorGroupDivider : ''}>
                            {/* 组标题 */}
                            <div
                                className={styles.groupHeader}
                                onClick={() => toggleExpand(group.key)}
                                style={{
                                    background: expanded
                                        ? (isSuccess ? '#f6ffed' : '#fff2f0')
                                        : undefined,
                                }}
                            >
                                <div className={styles.groupHeaderLeft}>
                                    {expanded
                                        ? <DownOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                                        : <RightOutlined style={{ fontSize: 10, color: '#8c8c8c' }} />
                                    }
                                    {isSuccess
                                        ? <CheckCircleFilled style={{ color: '#52c41a', fontSize: 14 }} />
                                        : <CloseCircleFilled style={{ color: '#ff4d4f', fontSize: 14 }} />
                                    }
                                    <Text
                                        ellipsis={{ tooltip: group.label }}
                                        style={{
                                            fontSize: 13,
                                            fontWeight: 500,
                                            color: isSuccess ? '#389e0d' : '#cf1322',
                                        }}
                                    >
                                        {group.label}
                                    </Text>
                                </div>
                                <div className={styles.groupHeaderRight}>
                                    <Tag
                                        color={isSuccess ? 'green' : 'red'}
                                        style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 6px' }}
                                    >
                                        {group.count} 台
                                    </Tag>
                                </div>
                            </div>

                            {/* 组内主机表格 */}
                            {expanded && (
                                <div className={styles.groupBody}>
                                    <Table
                                        dataSource={group.hosts}
                                        columns={getGroupColumns(isSuccess)}
                                        rowKey={(r) => `${r.cmdb_id}-${r.host}`}
                                        pagination={false}
                                        size="small"
                                        showHeader={true}
                                        scroll={{ y: 240 }}
                                        style={{ background: '#fafafa' }}
                                    />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </Modal>
    );
};

export default React.memo(ConnectionTestResultModal);
