import React, { useMemo, useState } from 'react';
import { Button, Modal, Progress, Space, Typography } from 'antd';
import { CopyOutlined, DesktopOutlined } from '@ant-design/icons';
import GroupedResultList from './GroupedResultList';
import { useStyles } from './styles';
import type {
    AggregatedGroup,
    ConnectionTestResultModalProps,
    HostInfo,
} from './types';

const ConnectionTestResultModal: React.FC<ConnectionTestResultModalProps> = ({
    open,
    results,
    cmdbItems = [],
    onClose,
}) => {
    const { styles } = useStyles();
    const { Paragraph } = Typography;
    const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set());

    const cmdbMap = useMemo(() => {
        const map = new Map<string, (typeof cmdbItems)[number]>();
        for (const item of cmdbItems) map.set(item.id, item);
        return map;
    }, [cmdbItems]);

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
                continue;
            }
            const errKey = r.message || '未知错误';
            const list = errorMap.get(errKey) || [];
            list.push(item);
            errorMap.set(errKey, list);
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

    React.useEffect(() => {
        if (!open || groups.length === 0) return;
        const defaultExpanded = new Set<string>();
        for (const group of groups) {
            if (group.type === 'error') defaultExpanded.add(group.key);
        }
        if (defaultExpanded.size === 0) defaultExpanded.add(groups[0].key);
        setExpandedKeys(defaultExpanded);
    }, [open, groups]);

    const failedHostsText = useMemo(() => {
        if (!results) return '';
        return results.results.filter((r) => !r.success).map((r) => r.host).join('\n');
    }, [results]);

    const toggleExpand = (key: string) => {
        setExpandedKeys((prev) => {
            const next = new Set(prev);
            if (next.has(key)) next.delete(key);
            else next.add(key);
            return next;
        });
    };

    if (!results) return null;

    const successRate = results.total > 0 ? Math.round((results.success / results.total) * 100) : 0;

    return (
        <Modal
            title={<Space><DesktopOutlined style={{ color: '#1677ff' }} />密钥连接测试结果</Space>}
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
            <div className={styles.summary}>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue}>{results.total}</div>
                    <div className={styles.summaryLabel}>总数</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: '#52c41a' }}>{results.success}</div>
                    <div className={styles.summaryLabel}>成功</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: results.failed > 0 ? '#ff4d4f' : '#8c8c8c' }}>{results.failed}</div>
                    <div className={styles.summaryLabel}>失败</div>
                </div>
                <div className={styles.summaryCard}>
                    <div className={styles.summaryValue} style={{ color: successRate === 100 ? '#52c41a' : successRate >= 80 ? '#faad14' : '#ff4d4f' }}>{successRate}%</div>
                    <div className={styles.summaryLabel}>成功率</div>
                </div>
            </div>
            {results.total > 1 && (
                <Progress
                    percent={successRate}
                    size="small"
                    status={results.failed > 0 ? 'exception' : 'success'}
                    style={{ marginBottom: 16 }}
                />
            )}
            <GroupedResultList
                groups={groups}
                expandedKeys={expandedKeys}
                onToggleExpand={toggleExpand}
                styles={styles}
            />
        </Modal>
    );
};

export default React.memo(ConnectionTestResultModal);
