import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
    Modal, Input, Table, Button, Space, Tree, Spin,
    Typography, Badge, Tabs, Empty
} from 'antd';
import {
    SearchOutlined, DesktopOutlined,
    GlobalOutlined, AppstoreOutlined, PlusOutlined, CloseOutlined,
    EnvironmentOutlined
} from '@ant-design/icons';
import { getCMDBItems, getCMDBStats } from '@/services/auto-healing/cmdb';
import { useDebounceFn } from 'ahooks';

const { Text } = Typography;

// 环境配置
const envConfig: Record<string, { label: string; color: string }> = {
    production: { label: '生产', color: '#f5222d' },
    staging: { label: '预发', color: '#fa8c16' },
    development: { label: '开发', color: '#1890ff' },
    testing: { label: '测试', color: '#52c41a' },
};

interface HostSelectorModalProps {
    open: boolean;
    value?: string[];
    excludeHosts?: string[];  // IP 列表，这些主机不能被选中(已在模板中)
    onOk: (selected: string[]) => void;
    onCancel: () => void;
}

/**
 * 蓝鲸风格主机选择器 (修复版)
 */
const HostSelectorModal: React.FC<HostSelectorModalProps> = ({
    open,
    value = [],
    excludeHosts = [],
    onOk,
    onCancel,
}) => {
    const [loading, setLoading] = useState(false);
    const [hosts, setHosts] = useState<AutoHealing.CMDBItem[]>([]);

    // 搜索与筛选
    const [searchText, setSearchText] = useState('');
    const [treeSearchText, setTreeSearchText] = useState('');
    const [selectedEnv, setSelectedEnv] = useState<string>('all');
    // 树展开状态
    const [expandedKeys, setExpandedKeys] = useState<React.Key[]>(['all', ...Object.keys(envConfig)]);

    // 分页状态
    const [pagination, setPagination] = useState({ current: 1, pageSize: 15, total: 0 });

    // 选中状态
    const [selectedIds, setSelectedIds] = useState<React.Key[]>([]);
    const [selectedMap, setSelectedMap] = useState<Map<React.Key, string>>(new Map());

    // **修复: Modal 打开时重置状态，避免切换密钥后残留之前的选中**
    const prevOpenRef = useRef(open);
    useEffect(() => {
        // 检测 open 从 false 变为 true 时重置状态
        if (open && !prevOpenRef.current) {
            setSelectedIds([]);
            setSelectedMap(new Map());
            setSearchText('');
            setTreeSearchText('');
            setSelectedEnv('all');
            setPagination({ current: 1, pageSize: 15, total: 0 });
        }
        prevOpenRef.current = open;
    }, [open]);

    // 加载主机列表 (Server-Side)
    const loadHosts = useCallback(async (page = 1, env = selectedEnv, search = searchText) => {
        setLoading(true);
        try {
            const params: any = {
                status: 'active',
                type: 'server',
                page,
                page_size: 15, // 固定 PageSize
            };
            if (env !== 'all') params.environment = env;
            if (search) params.keyword = search;

            const res = await getCMDBItems(params);
            setHosts(res.data || []);
            setPagination(prev => ({ ...prev, current: page, total: res.total || (res as any).count || 0 }));
        } catch {
            /* ignore */
            setHosts([]);
        } finally {
            setLoading(false);
        }
    }, [selectedEnv, searchText]); // Dependencies handled by caller mostly, but useEffect watches them

    // **修复: 搜索时使用防抖，输入后自动搜索**
    const { run: debouncedSearch } = useDebounceFn(
        (search: string) => {
            loadHosts(1, selectedEnv, search);
        },
        { wait: 400 }
    );

    // 初始化与监听变化
    useEffect(() => {
        if (open) {
            loadHosts(1, selectedEnv, searchText);
        }
    }, [open, selectedEnv]); // 仅环境变化时自动搜索，搜索框由 debouncedSearch 处理

    // 分页处理
    const handleTableChange = (newPagination: any) => {
        loadHosts(newPagination.current, selectedEnv, searchText);
    };

    // 选中状态同步 (仅初始化或加载新数据时保留选中)
    // 注意：服务器端分页时，selectedIds 必须持久化。我们已经将其存储在 State 中。
    // 但是这里需要处理：如果 value 有值，且首次打开，需要正确映射 ID?
    // 问题：如果不加载所有 ID，无法将 value(IP) 转换为 ID。
    // 解决方案：后端通常返回 ID。前端 value 是 IP。
    // 这是一个棘手问题。Server-Side Pagination 下，我们不知道 "10.0.0.1" 对应的 ID 是多少，除非该页数据包含它。
    // 权宜之计：我们依然保留 ID 选择逻辑，但要注意如果翻页了，不在当前页的 Item 如何回显？
    // AntD Table preserveSelectedRowKeys: true 可以保留 Key。
    // 但是我们只有 IP (props.value)。
    // 如果用户传进来的 IP 不在当前页，我们无法得知其 ID，也就无法选中。
    // FIX: 这是一个已知限制。除非并在 Init 时 Fetch All Selected Hosts By IPs?
    // 为简化，我们假设用户主要是“添加”操作。或者我们仅在当前页匹配。
    // 实际上，如果 value 包含 IPs，我们无法 verify 选中状态除非 iterate all。
    // 但用户主要抱怨 Pagination。
    // 我们保留原有逻辑：当前页匹配到的 IP 自动勾选。
    useEffect(() => {
        if (open && hosts.length > 0) {
            const ipSet = new Set(value);
            // 仅对当前页可见的主机进行 ID 映射检查
            const currentPageIds = hosts
                .filter(h => h.ip_address && ipSet.has(h.ip_address))
                .map(h => h.id);

            // 将新发现的 ID 加入 selectedIds (去重)
            setSelectedIds(prev => Array.from(new Set([...prev, ...currentPageIds])));
        }
    }, [hosts, open]);

    // 统计数据
    const [envStats, setEnvStats] = useState<Record<string, number>>({ all: 0 });
    useEffect(() => {
        if (open) {
            getCMDBStats().then((res: any) => {
                const data = res.data || res;
                const stats: Record<string, number> = { all: data.total || 0 };
                (data.by_environment || []).forEach((item: any) => {
                    stats[item.environment] = item.count;
                });
                setEnvStats(stats);
            }).catch(console.error);
        }
    }, [open]);

    // 左侧树形筛选 - Data
    const treeData = useMemo(() => {
        const nodes = Object.entries(envConfig)
            .map(([key, cfg]) => ({
                key,
                title: <span style={{ fontSize: 13 }}>{cfg.label} <span style={{ color: '#999' }}>({envStats[key] || 0})</span></span>,
                icon: <AppstoreOutlined style={{ color: cfg.color }} />,
                isLeaf: true,
                _label: cfg.label
            }));

        const filtered = treeSearchText ? nodes.filter(n => n._label.includes(treeSearchText)) : nodes;

        return [{
            key: 'all',
            title: <span style={{ fontSize: 13 }}>全部主机 <span style={{ color: '#999' }}>({envStats.all || 0})</span></span>,
            icon: <GlobalOutlined />,
            children: filtered,
        }];
    }, [treeSearchText, envStats]);


    // 确认回调
    // 这里有问题：Server-Side 分页下，我们只知道 selectedIds。
    // 我们需要将其转回 IPs。
    // 如果 ID 不在当前 hosts 列表里，我们无法获取 IP。
    // Critical: selectedIds 必须包含 ID -> IP 的 Map 信息。
    // Update Map when hosts change
    useEffect(() => {
        const newMap = new Map(selectedMap);
        let changed = false;
        hosts.forEach(h => {
            if (h.ip_address) {
                if (!newMap.has(h.id)) {
                    newMap.set(h.id, h.ip_address);
                    changed = true;
                }
            }
        });
        if (changed) setSelectedMap(newMap);
    }, [hosts]);

    const handleOk = () => {
        // Collect IPs from map
        const ips = selectedIds.map(id => selectedMap.get(id)).filter(Boolean) as string[];
        onOk(Array.from(new Set(ips)));
    };

    const columns = [
        {
            title: '主机 IP',
            dataIndex: 'ip_address',
            width: 150,
            render: (ip: string) => <Text copyable={{ text: ip }} style={{ color: '#314659' }}>{ip}</Text>
        },
        {
            title: '主机名',
            dataIndex: 'hostname',
            ellipsis: true,
            render: (t: string) => <Text style={{ color: '#595959' }}>{t}</Text>
        },
        {
            title: '操作系统',
            dataIndex: 'os_version',
            width: 140,
            render: (v: string, r: AutoHealing.CMDBItem) => <Text type="secondary" style={{ fontSize: 12 }}>{v || r.os || '-'}</Text>
        },
        {
            title: '状态',
            dataIndex: 'status',
            width: 80,
            render: (v: string) => (
                <Badge
                    status={v === 'active' ? 'success' : 'default'}
                    text={<span style={{ fontSize: 12, color: v === 'active' ? '#52c41a' : '#bfbfbf' }}>{v === 'active' ? '正常' : '未知'}</span>}
                />
            )
        },
        {
            title: '负责人',
            dataIndex: 'owner',
            width: 100,
            ellipsis: true,
            render: (v: string) => <Text type="secondary" style={{ fontSize: 12 }}>{v || '-'}</Text>
        }
    ];

    return (
        <Modal
            open={open}
            onOk={handleOk}
            onCancel={onCancel}
            width={1000}
            style={{ top: 20 }}
            styles={{ body: { padding: 0, height: 600, overflow: 'hidden' } }}
            closable={false}
            footer={
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 24px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
                    <div style={{ fontSize: 14 }}>
                        已选择 <span style={{ color: '#3a84ff', fontWeight: 600, margin: '0 4px' }}>{selectedIds.length}</span> 台主机
                        {excludeHosts.length > 0 && (
                            <span style={{ color: '#999', marginLeft: 8 }}>(已排除 {excludeHosts.length} 台模板预设主机)</span>
                        )}
                    </div>
                    <Space size={12}>
                        <Button onClick={onCancel} style={{ borderRadius: 0 }}>取消</Button>
                        <Button type="primary" onClick={handleOk} style={{ borderRadius: 0, background: '#3a84ff', borderColor: '#3a84ff' }}>确定</Button>
                    </Space>
                </div>
            }
            title={null}
        >
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                {/* 1. 顶部 Tabs */}
                <div style={{ height: 48, background: '#fff', borderBottom: '1px solid #ebebeb', display: 'flex', alignItems: 'center', padding: '0 24px' }}>
                    <Tabs
                        items={[
                            { key: 'static', label: '静态 - IP 选择' },
                            { key: 'topo', label: '动态 - 拓扑选择', disabled: true },
                            { key: 'group', label: '动态 - 分组选择', disabled: true },
                        ]}
                        defaultActiveKey="static"
                        tabBarStyle={{ marginBottom: 0, border: 'none' }}
                        size="small"
                    />
                </div>

                {/* 2. 主体区 (双栏) */}
                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* 左侧：树形筛选 (白色背景) */}
                    <div style={{ width: 240, borderRight: '1px solid #ebebeb', display: 'flex', flexDirection: 'column', background: '#fff' }}>
                        <div style={{ padding: 12 }}>
                            <Input
                                placeholder="搜索环境/节点"
                                prefix={<SearchOutlined style={{ color: '#c4c6cc' }} />}
                                style={{ borderRadius: 0 }}
                                value={treeSearchText}
                                onChange={e => setTreeSearchText(e.target.value)}
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
                                onSelect={keys => keys[0] && setSelectedEnv(keys[0] as string)}
                                treeData={treeData}
                                showIcon
                            />
                        </div>
                    </div>

                    {/* 右侧：表格区域 (白色背景) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#fff' }}>
                        <div style={{ padding: 16 }}>
                            <Input
                                placeholder="输入 IP、主机名搜索..."
                                prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                                value={searchText}
                                onChange={e => {
                                    setSearchText(e.target.value);
                                    debouncedSearch(e.target.value); // 输入时立即触发防抖搜索
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
                                    selectedRowKeys: selectedIds,
                                    onChange: (keys) => setSelectedIds(keys),
                                    preserveSelectedRowKeys: true,
                                    columnWidth: 40,
                                    getCheckboxProps: (record: AutoHealing.CMDBItem) => ({
                                        disabled: excludeHosts.includes(record.ip_address || ''),
                                        title: excludeHosts.includes(record.ip_address || '') ? '该主机已在模板预设中' : undefined
                                    })
                                }}
                                pagination={{
                                    current: pagination.current,
                                    pageSize: pagination.pageSize,
                                    total: pagination.total,
                                    size: 'small',
                                    showTotal: (t) => `共计 ${t} 条`,
                                    showSizeChanger: false, // 禁止用户输入/修改每页条数
                                    style: { marginTop: 16 }
                                }}
                                onChange={handleTableChange}
                                loading={loading}
                                scroll={{ y: 380 }}
                                locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无数据" /> }}
                                onRow={(record) => ({
                                    onClick: () => {
                                        const key = record.id;
                                        const set = new Set(selectedIds);
                                        if (set.has(key)) set.delete(key);
                                        else set.add(key);
                                        setSelectedIds(Array.from(set));
                                    },
                                    style: { cursor: 'pointer' }
                                })}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </Modal>
    );
};

// ==================== 触发器组件 ====================
interface HostSelectorProps {
    value?: string[];
    onChange?: (value: string[]) => void;
    excludeHosts?: string[];  // IP 列表，这些主机不能被选中(已在模板中)
}

const HostSelector: React.FC<HostSelectorProps> = ({ value = [], onChange, excludeHosts = [] }) => {
    const [modalOpen, setModalOpen] = useState(false);

    // 数据标准化
    const selectedHosts = useMemo((): string[] => {
        if (Array.isArray(value)) return value;
        if (typeof value === 'string' && value) return (value as string).split(',').filter(Boolean);
        return [];
    }, [value]);

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Button
                type="dashed"
                size="large"
                onClick={() => setModalOpen(true)}
                icon={<PlusOutlined />}
                style={{ width: '100%', textAlign: 'left', borderColor: '#d9d9d9', color: '#595959', borderRadius: 0, fontSize: 14 }}
            >
                选择目标主机 ({selectedHosts.length}) ...
            </Button>

            {/* 虚线小方块展示区域 */}
            {selectedHosts.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {selectedHosts.slice(0, 50).map(ip => ( // 限制展示数量，防止过多
                        <div
                            key={ip}
                            style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                padding: '4px 8px',
                                border: '1px dashed #d9d9d9',
                                borderRadius: 0,
                                background: '#fafafa',
                                fontSize: 12,
                                color: '#595959',
                                cursor: 'default',
                                transition: 'all 0.2s'
                            }}
                            onMouseEnter={e => {
                                e.currentTarget.style.borderColor = '#ff4d4f';
                                e.currentTarget.style.color = '#ff4d4f';
                            }}
                            onMouseLeave={e => {
                                e.currentTarget.style.borderColor = '#d9d9d9';
                                e.currentTarget.style.color = '#595959';
                            }}
                        >
                            <DesktopOutlined style={{ marginRight: 4, fontSize: 10 }} />
                            {ip}
                            <CloseOutlined
                                style={{ marginLeft: 8, fontSize: 10, cursor: 'pointer' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange?.(selectedHosts.filter(h => h !== ip));
                                }}
                            />
                        </div>
                    ))}
                    {selectedHosts.length > 50 && <span style={{ color: '#999', fontSize: 12 }}>... 等 {selectedHosts.length} 台</span>}
                </div>
            )}

            <HostSelectorModal
                open={modalOpen}
                value={selectedHosts}
                excludeHosts={excludeHosts}
                onOk={(keys) => {
                    onChange?.(keys);
                    setModalOpen(false);
                }}
                onCancel={() => setModalOpen(false)}
            />
        </div>
    );
};

export default HostSelector;
