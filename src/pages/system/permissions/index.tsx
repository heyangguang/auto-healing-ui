import React, { useState, useEffect, useCallback } from 'react';
import { Tag } from 'antd';
import { getPermissions } from '@/services/auto-healing/permissions';
import StandardTable from '@/components/StandardTable';
import GroupedCardList from '@/components/GroupedCardList';

/* 权限模块中文映射 & 颜色 */
import { PERMISSION_MODULE_META as MODULE_META } from '@/constants/permissionDicts';

/* action 标签颜色 */
const ACTION_COLORS: Record<string, string> = {
    read: 'blue',
    create: 'green',
    update: 'orange',
    delete: 'red',
    execute: 'purple',
    export: 'cyan',
    manage: 'geekblue',
    sync: 'lime',
    test: 'gold',
};

const PermissionsPage: React.FC = () => {
    const [data, setData] = useState<AutoHealing.Permission[]>([]);
    const [loading, setLoading] = useState(true);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getPermissions();
            setData((res as any)?.data || []);
        } catch { /* ignore */ } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    /* 头部图标 */
    const headerIcon = (
        <svg viewBox="0 0 48 48" fill="none">
            <rect x="8" y="6" width="32" height="36" rx="2" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M16 18h16M16 26h12M16 34h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <circle cx="36" cy="36" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M34 36l2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
    );

    return (
        <StandardTable<any>
            tabs={[{ key: 'list', label: '权限列表' }]}
            title="权限列表"
            description="系统所有权限码一览。权限按功能模块分组展示，通过角色分配给用户。"
            headerIcon={headerIcon}
        >
            <GroupedCardList<AutoHealing.Permission>
                data={data}
                loading={loading}
                groupBy="module"
                groupMeta={MODULE_META}
                itemKey="id"
                searchPlaceholder="搜索权限码、名称、模块..."
                searchFilter={(item, kw) =>
                    item.code.toLowerCase().includes(kw) ||
                    item.name.toLowerCase().includes(kw) ||
                    item.module.toLowerCase().includes(kw) ||
                    item.resource.toLowerCase().includes(kw) ||
                    item.action.toLowerCase().includes(kw)
                }
                statsRender={(count, groups) => (
                    <span className="grouped-card-stats">
                        共 <b>{count}</b> 项权限，<b>{groups}</b> 个模块
                    </span>
                )}
                emptyText="暂无权限数据"
                emptySearchText="未找到匹配的权限"
                onRefresh={loadData}
                renderItem={(p) => (
                    <>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: '#262626' }}>{p.name}</span>
                            <Tag
                                color={ACTION_COLORS[p.action] || 'default'}
                                style={{ margin: 0, fontSize: 11, lineHeight: '18px', padding: '0 4px' }}
                            >
                                {p.action}
                            </Tag>
                        </div>
                        <span style={{ fontSize: 11, fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace", color: '#8590a6', letterSpacing: '0.02em' }}>
                            {p.code}
                        </span>
                    </>
                )}
            />
        </StandardTable>
    );
};

export default PermissionsPage;
