import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
    Card, Tag, Space, Input, Collapse, Badge, Typography, Row, Col, Statistic, Empty,
} from 'antd';
import {
    SafetyOutlined, SearchOutlined,
    UserOutlined, ApiOutlined, DatabaseOutlined,
    ThunderboltOutlined, BellOutlined, ToolOutlined,
    SettingOutlined, DashboardOutlined, BranchesOutlined,
} from '@ant-design/icons';
import { getPermissionTree, getPermissions } from '@/services/auto-healing/permissions';

const { Text } = Typography;

// 模块图标和颜色映射
const moduleConfig: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
    user: { icon: <UserOutlined />, color: '#1890ff', label: '用户管理' },
    role: { icon: <SafetyOutlined />, color: '#722ed1', label: '角色管理' },
    plugin: { icon: <ApiOutlined />, color: '#13c2c2', label: '插件管理' },
    execution: { icon: <ThunderboltOutlined />, color: '#fa8c16', label: '执行管理' },
    notification: { icon: <BellOutlined />, color: '#eb2f96', label: '通知管理' },
    healing: { icon: <ToolOutlined />, color: '#52c41a', label: '自愈引擎' },
    workflow: { icon: <BranchesOutlined />, color: '#2f54eb', label: '工作流' },
    system: { icon: <SettingOutlined />, color: '#595959', label: '系统管理' },
    dashboard: { icon: <DashboardOutlined />, color: '#fa541c', label: '仪表板' },
};

// 操作类型颜色
const actionColors: Record<string, string> = {
    read: 'blue',
    create: 'green',
    update: 'orange',
    delete: 'red',
    execute: 'purple',
    manage: 'magenta',
    export: 'cyan',
};

const PermissionsPage: React.FC = () => {
    const [permTree, setPermTree] = useState<AutoHealing.PermissionTree>({});
    const [allPerms, setAllPerms] = useState<AutoHealing.Permission[]>([]);
    const [searchText, setSearchText] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const [treeRes, listRes] = await Promise.all([
                getPermissionTree(),
                getPermissions(),
            ]);
            setPermTree(treeRes?.data || {});
            setAllPerms(listRes?.data || []);
        } catch {
            // ignore
        }
        setLoading(false);
    };

    // 过滤权限
    const filteredTree = (() => {
        if (!searchText) return permTree;
        const result: AutoHealing.PermissionTree = {};
        Object.entries(permTree).forEach(([module, perms]) => {
            const filtered = perms.filter(p =>
                p.code.toLowerCase().includes(searchText.toLowerCase()) ||
                p.name.toLowerCase().includes(searchText.toLowerCase()) ||
                p.module.toLowerCase().includes(searchText.toLowerCase())
            );
            if (filtered.length > 0) result[module] = filtered;
        });
        return result;
    })();

    const totalPermissions = allPerms.length;
    const totalModules = Object.keys(permTree).length;

    return (
        <PageContainer
            ghost
            header={{
                title: <><SafetyOutlined /> 权限目录 / PERMISSIONS</>,
                subTitle: '查看系统所有权限定义和分类',
            }}
            loading={loading}
        >
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
                <Col span={6}>
                    <Card>
                        <Statistic title="权限总数" value={totalPermissions} prefix={<SafetyOutlined />} />
                    </Card>
                </Col>
                <Col span={6}>
                    <Card>
                        <Statistic title="模块数量" value={totalModules} prefix={<DatabaseOutlined />} />
                    </Card>
                </Col>
                <Col span={12}>
                    <Card style={{ height: '100%', display: 'flex', alignItems: 'center' }}>
                        <Input
                            placeholder="搜索权限码、名称..."
                            prefix={<SearchOutlined />}
                            allowClear
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            size="large"
                            style={{ width: '100%' }}
                        />
                    </Card>
                </Col>
            </Row>

            {Object.keys(filteredTree).length === 0 ? (
                <Card><Empty description="没有找到匹配的权限" /></Card>
            ) : (
                <Collapse
                    defaultActiveKey={Object.keys(filteredTree)}
                    items={Object.entries(filteredTree).map(([module, perms]) => {
                        const config = moduleConfig[module] || { icon: <SettingOutlined />, color: '#8c8c8c', label: module };
                        return {
                            key: module,
                            label: (
                                <Space>
                                    <span style={{ color: config.color }}>{config.icon}</span>
                                    <Text strong>{config.label}</Text>
                                    <Badge count={perms.length} style={{ backgroundColor: config.color }} />
                                </Space>
                            ),
                            children: (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 8 }}>
                                    {perms.map(perm => (
                                        <Card
                                            key={perm.id}
                                            size="small"
                                            style={{ borderLeft: `3px solid ${actionColors[perm.action] ? `var(--ant-color-${actionColors[perm.action]})` : config.color}` }}
                                        >
                                            <Space direction="vertical" size={2} style={{ width: '100%' }}>
                                                <Space>
                                                    <Text strong>{perm.name}</Text>
                                                    <Tag color={actionColors[perm.action] || 'default'}>{perm.action}</Tag>
                                                </Space>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    <code>{perm.code}</code>
                                                </Text>
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    资源: {perm.resource}
                                                </Text>
                                            </Space>
                                        </Card>
                                    ))}
                                </div>
                            ),
                        };
                    })}
                />
            )}
        </PageContainer>
    );
};

export default PermissionsPage;
