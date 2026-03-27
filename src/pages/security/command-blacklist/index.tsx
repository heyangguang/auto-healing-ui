import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import {
    CheckCircleOutlined,
    PlusOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { useAccess, history } from '@umijs/max';
import { Button, message, Typography } from 'antd';
import StandardTable from '@/components/StandardTable';
import { extractErrorMsg } from '@/utils/errorMsg';
import {
    getCommandBlacklist,
    deleteCommandBlacklistRule,
    toggleCommandBlacklistRule,
    batchToggleCommandBlacklistRules,
} from '@/services/auto-healing/commandBlacklist';
import type { CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';
import CommandBlacklistDetailDrawer from './CommandBlacklistDetailDrawer';
import {
    buildStatsBar,
    headerIcon,
    searchFields,
} from './commandBlacklistPageConfig';
import { buildCommandBlacklistColumns } from './commandBlacklistColumns';
import {
    buildCommandBlacklistQuery,
    buildCommandBlacklistRequestSignature,
    type CommandBlacklistRequestParams,
} from './commandBlacklistQuery';
import './index.css';

const { Text } = Typography;

/* ========== 主组件 ========== */
const CommandBlacklistPage: React.FC = () => {
    const access = useAccess();
    const canManage = !!access.canManageBlacklist;
    const canDelete = !!access.canDeleteBlacklist;

    const [refreshTrigger, setRefreshTrigger] = useState(0);

    /* ---- 统计 ---- */
    const [stats, setStats] = useState({ total: 0, active: 0, critical: 0, high: 0, medium: 0 });

    useEffect(() => {
        void (async () => {
            try {
                const [allRes, activeRes, criticalRes, highRes, mediumRes] = await Promise.all([
                    getCommandBlacklist({ page: 1, page_size: 1 }),
                    getCommandBlacklist({ page: 1, page_size: 1, is_active: true }),
                    getCommandBlacklist({ page: 1, page_size: 1, severity: 'critical' }),
                    getCommandBlacklist({ page: 1, page_size: 1, severity: 'high' }),
                    getCommandBlacklist({ page: 1, page_size: 1, severity: 'medium' }),
                ]);
                setStats({
                    total: Number(allRes?.total ?? 0),
                    active: Number(activeRes?.total ?? 0),
                    critical: Number(criticalRes?.total ?? 0),
                    high: Number(highRes?.total ?? 0),
                    medium: Number(mediumRes?.total ?? 0),
                });
            } catch {
                setStats({ total: 0, active: 0, critical: 0, high: 0, medium: 0 });
                message.error('加载黑名单统计失败，请稍后重试');
            }
        })();
    }, [refreshTrigger]);

    /* ---- 详情抽屉 ---- */
    const [drawerRule, setDrawerRule] = useState<CommandBlacklistRule | null>(null);

    /* ---- 批量操作 ---- */
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
    const [batchLoading, setBatchLoading] = useState(false);
    const requestSignatureRef = useRef<string | null>(null);
    const triggerRefresh = useCallback(() => {
        setSelectedRowKeys([]);
        setRefreshTrigger(n => n + 1);
    }, []);

    const handleBatchToggle = useCallback(async (isActive: boolean) => {
        if (selectedRowKeys.length === 0) return;
        setBatchLoading(true);
        try {
            const res = await batchToggleCommandBlacklistRules(selectedRowKeys as string[], isActive);
            message.success(res.message || `已${isActive ? '启用' : '禁用'} ${res.count} 条规则`);
            setSelectedRowKeys([]);
            triggerRefresh();
        } catch (error: unknown) {
            message.error(extractErrorMsg(
                error as Parameters<typeof extractErrorMsg>[0],
                `批量${isActive ? '启用' : '禁用'}规则失败，请稍后重试`,
            ));
        }
        finally { setBatchLoading(false); }
    }, [selectedRowKeys, triggerRefresh]);

    /* ======= 操作回调 ======= */
    const openCreate = useCallback(() => {
        history.push('/security/command-blacklist/create');
    }, []);

    const openEdit = useCallback((rule: CommandBlacklistRule) => {
        history.push(`/security/command-blacklist/${rule.id}/edit`);
    }, []);

    const handleDelete = useCallback(async (id: string) => {
        try {
            await deleteCommandBlacklistRule(id);
            message.success('已删除');
            triggerRefresh();
        } catch (error: unknown) {
            message.error(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '删除黑名单规则失败，请稍后重试'));
        }
    }, [triggerRefresh]);

    const handleToggle = useCallback(async (rule: CommandBlacklistRule) => {
        try {
            await toggleCommandBlacklistRule(rule.id);
            message.success(rule.is_active ? '已禁用' : '已启用');
            triggerRefresh();
        } catch (error: unknown) {
            message.error(extractErrorMsg(
                error as Parameters<typeof extractErrorMsg>[0],
                rule.is_active ? '禁用黑名单规则失败，请稍后重试' : '启用黑名单规则失败，请稍后重试',
            ));
        }
    }, [triggerRefresh]);

    const columns = useMemo(() => buildCommandBlacklistColumns({
        canDelete,
        canManage,
        onDelete: handleDelete,
        onEdit: openEdit,
        onOpenDetail: setDrawerRule,
        onToggle: handleToggle,
    }), [canDelete, canManage, handleDelete, handleToggle, openEdit]);

    /* ========== 数据请求 ========== */
    const handleRequest = useCallback(async (params: CommandBlacklistRequestParams) => {
        const requestSignature = buildCommandBlacklistRequestSignature(params);
        if (requestSignatureRef.current !== requestSignature) {
            requestSignatureRef.current = requestSignature;
            setSelectedRowKeys([]);
        }

        const res = await getCommandBlacklist(buildCommandBlacklistQuery(params));
        return { data: res.data || [], total: res.total || 0 };
    }, []);

    const statsBar = useMemo(() => buildStatsBar(stats), [stats]);

    return (<>
        <StandardTable<CommandBlacklistRule>
            refreshTrigger={refreshTrigger}
            tabs={[{ key: 'list', label: '黑名单规则' }]}
            title="高危指令黑名单"
            description="Ansible 执行前自动扫描 Playbook 工作空间中的所有文件，检测并拦截高危指令，保障系统安全。"
            headerIcon={headerIcon}
            headerExtra={statsBar}
            searchFields={searchFields}
            searchSchemaUrl="/api/v1/tenant/command-blacklist/search-schema"
            primaryActionLabel="添加规则"
            primaryActionIcon={<PlusOutlined />}
            primaryActionDisabled={!canManage}
            onPrimaryAction={openCreate}
            columns={columns}
            rowKey="id"
            onRowClick={(record) => setDrawerRule(record)}
            request={handleRequest}
            defaultPageSize={20}
            preferenceKey="command_blacklist_v1"
            rowSelection={{
                selectedRowKeys,
                onChange: (keys) => setSelectedRowKeys(keys),
            }}
        />

        {/* ========== 批量操作栏 ========== */}
        {selectedRowKeys.length > 0 && (
            <div style={{
                position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
                background: '#fff', padding: '12px 24px', boxShadow: '0 6px 24px rgba(0,0,0,0.15)',
                border: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 16,
                zIndex: 1000, minWidth: 360,
            }}>
                <Text strong>已选 {selectedRowKeys.length} 条</Text>
                <Button
                    type="primary" size="small"
                    icon={<CheckCircleOutlined />}
                    loading={batchLoading}
                    disabled={!canManage}
                    onClick={() => handleBatchToggle(true)}
                >
                    批量启用
                </Button>
                <Button
                    size="small" danger
                    icon={<StopOutlined />}
                    loading={batchLoading}
                    disabled={!canManage}
                    onClick={() => handleBatchToggle(false)}
                >
                    批量禁用
                </Button>
                <Button size="small" type="text" onClick={() => setSelectedRowKeys([])}>
                    取消选择
                </Button>
            </div>
        )}

        <CommandBlacklistDetailDrawer
            canManage={canManage}
            rule={drawerRule}
            onClose={() => setDrawerRule(null)}
            onEdit={(rule) => {
                setDrawerRule(null);
                openEdit(rule);
            }}
        />
    </>);
};

export default CommandBlacklistPage;
