import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppstoreOutlined, GlobalOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Empty, Input, Modal, Space, Table, Tabs, Tree } from 'antd';
import type { TablePaginationConfig } from 'antd/es/table/interface';
import { useDebounceFn } from 'ahooks';
import { getCMDBItems, getCMDBStats } from '@/services/auto-healing/cmdb';
import { FIXED_PAGE_SIZE, envConfig } from './constants';
import { createHostColumns } from './tableColumns';
import type { CMDBItemsParams, HostSelectorModalProps } from './types';
import { createPlaceholderItem, getTotalFromListResponse, normalizeStatsResponse } from './utils';

const HostSelectorModal: React.FC<HostSelectorModalProps> = ({
    open,
    value = [],
    excludeHosts = [],
    onOk,
    onCancel,
}) => {
    const [loading, setLoading] = useState(false);
    const [hosts, setHosts] = useState<AutoHealing.CMDBItem[]>([]);
    const [searchText, setSearchText] = useState('');
    const [treeSearchText, setTreeSearchText] = useState('');
    const [selectedEnv, setSelectedEnv] = useState<string>('all');
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['all', ...Object.keys(envConfig)]);
    const [pagination, setPagination] = useState({ current: 1, pageSize: FIXED_PAGE_SIZE, total: 0 });
    const [selectedIps, setSelectedIps] = useState<string[]>([]);
    const [selectedMap, setSelectedMap] = useState<Map<string, AutoHealing.CMDBItem>>(new Map());
    const [envStats, setEnvStats] = useState<Record<string, number>>({ all: 0 });
    const prevOpenRef = useRef(open);

    useEffect(() => {
        if (!open || prevOpenRef.current) {
            prevOpenRef.current = open;
            return;
        }
        setSelectedIps(value);
        const nextMap = new Map<string, AutoHealing.CMDBItem>();
        value.forEach((ip) => {
            nextMap.set(ip, createPlaceholderItem(ip));
        });
        setSelectedMap(nextMap);
        setSearchText('');
        setTreeSearchText('');
        setSelectedEnv('all');
        setPagination({ current: 1, pageSize: FIXED_PAGE_SIZE, total: 0 });
        prevOpenRef.current = open;
    }, [open, value]);

    const loadHosts = useCallback(async (page: number, env: string, search: string) => {
        setLoading(true);
        try {
            const params: CMDBItemsParams = { status: 'active', type: 'server', page, page_size: FIXED_PAGE_SIZE };
            if (env !== 'all') params.environment = env as AutoHealing.CMDBEnvironment;
            if (search) params.keyword = search;
            const res = await getCMDBItems(params);
            setHosts(res.data || []);
            setPagination((prev) => ({ ...prev, current: page, total: getTotalFromListResponse(res) }));
        } catch {
            setHosts([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const { run: debouncedSearch } = useDebounceFn((search: string) => {
        loadHosts(1, selectedEnv, search);
    }, { wait: 400 });

    useEffect(() => {
        if (open) {
            loadHosts(1, selectedEnv, searchText);
        }
    }, [open, selectedEnv]);

    const handleTableChange = useCallback((newPagination: TablePaginationConfig) => {
        loadHosts(newPagination.current || 1, selectedEnv, searchText);
    }, [loadHosts, searchText, selectedEnv]);

    useEffect(() => {
        if (!open) return;
        getCMDBStats()
            .then((res) => {
                const data = normalizeStatsResponse(res);
                const stats: Record<string, number> = { all: data.total || 0 };
                (data.by_environment || []).forEach((item) => {
                    if (item.environment) {
                        stats[item.environment] = item.count || 0;
                    }
                });
                setEnvStats(stats);
            })
            .catch(() => {});
    }, [open]);

    useEffect(() => {
        const newMap = new Map(selectedMap);
        let changed = false;
        hosts.forEach((host) => {
            if (!host.ip_address || newMap.has(host.ip_address)) return;
            newMap.set(host.ip_address, host);
            changed = true;
        });
        if (changed) setSelectedMap(newMap);
    }, [hosts, selectedMap]);

    const handleOk = useCallback(() => {
        const uniqueIps = Array.from(new Set(selectedIps));
        const items = uniqueIps.map((ip) => selectedMap.get(ip) || createPlaceholderItem(ip));
        onOk(uniqueIps, items);
    }, [onOk, selectedIps, selectedMap]);

    const selectedRowKeys = useMemo(() => {
        return hosts
            .filter((host) => host.ip_address && selectedIps.includes(host.ip_address))
            .map((host) => host.id);
    }, [hosts, selectedIps]);

    const updateSelectionFromCurrentPage = useCallback((selectedRows: AutoHealing.CMDBItem[]) => {
        const currentPageIps = hosts.map((host) => host.ip_address).filter(Boolean) as string[];
        const selectedOnPageIps = selectedRows.map((host) => host.ip_address).filter(Boolean) as string[];
        setSelectedIps((prev) => {
            const preserved = prev.filter((ip) => !currentPageIps.includes(ip));
            return Array.from(new Set([...preserved, ...selectedOnPageIps]));
        });
    }, [hosts]);

    const treeData = useMemo(() => {
        const nodes = Object.entries(envConfig).map(([key, cfg]) => ({
            key,
            title: <span style={{ fontSize: 13 }}>{cfg.label} <span style={{ color: '#999' }}>({envStats[key] || 0})</span></span>,
            icon: <AppstoreOutlined style={{ color: cfg.color }} />,
            isLeaf: true,
            _label: cfg.label,
        }));
        const filtered = treeSearchText ? nodes.filter((node) => node._label.includes(treeSearchText)) : nodes;
        return [{
            key: 'all',
            title: <span style={{ fontSize: 13 }}>全部主机 <span style={{ color: '#999' }}>({envStats.all || 0})</span></span>,
            icon: <GlobalOutlined />,
            children: filtered,
        }];
    }, [envStats, treeSearchText]);

    const columns = useMemo(() => createHostColumns(), []);

    return (
        <Modal
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            width={1000}
            style={{ top: 20 }}
            styles={{ body: { padding: 0, height: 600, overflow: 'hidden' } }}
            closable={false}
            footer={(
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 14 }}>
                        已选择 <span style={{ color: '#3a84ff', fontWeight: 600, margin: '0 4px' }}>{selectedIps.length}</span> 台主机
                        {excludeHosts.length > 0 && <span style={{ color: '#999', marginLeft: 8 }}>(已排除 {excludeHosts.length} 台模板预设主机)</span>}
                    </div>
                    <Space size={12}>
                        <Button onClick={onCancel} style={{ borderRadius: 0 }}>取消</Button>
                        <Button type="primary" onClick={handleOk} style={{ borderRadius: 0, background: '#3a84ff', borderColor: '#3a84ff' }}>确定</Button>
                    </Space>
                </div>
            )}
            title={null}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <div style={{ height: 48, background: '#fff', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                    <Tabs
                        items={[{ key: 'static', label: '静态 - IP 选择' }, { key: 'topo', label: '动态 - 拓扑选择', disabled: true }, { key: 'group', label: '动态 - 分组选择', disabled: true }]}
                        defaultActiveKey="static"
                        tabBarStyle={{ marginBottom: 0, border: 'none' }}
                        size="small"
                    />
                </div>
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
                    <div style={{ width: 240, borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                        <div style={{ padding: 12 }}>
                            <Input
                                placeholder="搜索环境/节点"
                                prefix={<SearchOutlined style={{ color: '#c4c6cc' }} />}
                                style={{ borderRadius: 0 }}
                                value={treeSearchText}
                                onChange={(e) => setTreeSearchText(e.target.value)}
                            />
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
                            <Tree
                                blockNode
                                showLine={{ showLeafIcon: false }}
                                defaultExpandAll
                                expandedKeys={expandedKeys}
                                onExpand={(keys) => setExpandedKeys(keys)}
                                selectedKeys={[selectedEnv]}
                                onSelect={(keys) => keys[0] && setSelectedEnv(keys[0] as string)}
                                treeData={treeData}
                                showIcon
                            />
                        </div>
                    </div>
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                        <div style={{ padding: 16 }}>
                            <Input
                                placeholder="输入 IP、主机名搜索..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                value={searchText}
                                onChange={(e) => {
                                    setSearchText(e.target.value);
                                    debouncedSearch(e.target.value);
                                }}
                                allowClear
                                style={{ width: 300, borderRadius: 0 }}
                            />
                        </div>
                        <div style={{ flex: 1, overflow: 'hidden', padding: '0 16px' }}>
                            <Table
                                dataSource={hosts}
                                columns={columns}
                                rowKey="id"
                                size="small"
                                rowSelection={{
                                    selectedRowKeys,
                                    onChange: (_keys, selectedRows) => updateSelectionFromCurrentPage(selectedRows),
                                    preserveSelectedRowKeys: true,
                                    columnWidth: 40,
                                    getCheckboxProps: (record: AutoHealing.CMDBItem) => ({
                                        disabled: excludeHosts.includes(record.ip_address || ''),
                                        title: excludeHosts.includes(record.ip_address || '') ? '该主机已在模板预设中' : undefined,
                                    }),
                                }}
                                pagination={{
                                    current: pagination.current,
                                    pageSize: pagination.pageSize,
                                    total: pagination.total,
                                    size: 'small',
                                    showTotal: (count) => `共计 ${count} 条`,
                                    showSizeChanger: false,
                                    style: { marginTop: 16 },
                                }}
                                onChange={handleTableChange}
                                loading={loading}
                                scroll={{ y: 380 }}
                                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> }}
                                onRow={(record) => ({
                                    onClick: () => {
                                        const ip = record.ip_address || '';
                                        if (!ip || excludeHosts.includes(ip)) return;
                                        setSelectedIps((prev) => {
                                            const current = new Set(prev);
                                            if (current.has(ip)) current.delete(ip);
                                            else current.add(ip);
                                            return Array.from(current);
                                        });
                                    },
                                    style: { cursor: 'pointer' },
                                })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default HostSelectorModal;
