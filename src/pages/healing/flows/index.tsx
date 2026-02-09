import React, { useRef, useState, useCallback, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
    Button, message, Popconfirm, Switch, Typography, Space,
    Input, Row, Col, Spin, Empty, Tooltip
} from 'antd';
import {
    PlusOutlined,
    PartitionOutlined,
    EditOutlined,
    DeleteOutlined,
    CodeOutlined,
    BellOutlined,
    AuditOutlined,
    CloudServerOutlined,
    SafetyCertificateOutlined,
    FunctionOutlined,
    SearchOutlined,
    ReloadOutlined,
    DeploymentUnitOutlined
} from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import { getFlows, deleteFlow, updateFlow } from '@/services/auto-healing/healing';
import dayjs from 'dayjs';

const { Text } = Typography;

const HealingFlows: React.FC = () => {
    const access = useAccess();
    const [flows, setFlows] = useState<AutoHealing.HealingFlow[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [searchText, setSearchText] = useState('');

    const loadFlows = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getFlows({ page: 1, page_size: 100 });
            let data = res.data || [];
            if (searchText) {
                const lower = searchText.toLowerCase();
                data = data.filter(f => f.name.toLowerCase().includes(lower) || f.description?.toLowerCase().includes(lower));
            }
            setFlows(data);
        } catch (error) {
            message.error('加载流程失败');
        } finally {
            setLoading(false);
        }
    }, [searchText]);

    useEffect(() => {
        loadFlows();
    }, [loadFlows]);

    const handleDelete = async (id: string) => {
        setActionLoading(id);
        try {
            await deleteFlow(id);
            message.success('删除成功');
            setFlows(prev => prev.filter(f => f.id !== id));
        } catch (error) {
            message.error('删除失败');
        } finally {
            setActionLoading(null);
        }
    };

    const handleToggleActive = async (record: AutoHealing.HealingFlow) => {
        const originalState = record.is_active;
        setFlows(prev => prev.map(f => f.id === record.id ? { ...f, is_active: !originalState } : f));

        setActionLoading(record.id);
        try {
            await updateFlow(record.id, { is_active: !record.is_active });
            message.success('状态更新成功');
        } catch (error) {
            setFlows(prev => prev.map(f => f.id === record.id ? { ...f, is_active: originalState } : f));
            message.error('状态更新失败');
        } finally {
            setActionLoading(null);
        }
    };

    const getNodeIcon = (type: string) => {
        const style = { fontSize: 14, color: '#595959' };
        switch (type) {
            case 'execution': return <CodeOutlined style={{ ...style, color: '#fa8c16' }} />;
            case 'approval': return <AuditOutlined style={{ ...style, color: '#faad14' }} />;
            case 'notification': return <BellOutlined style={{ ...style, color: '#52c41a' }} />;
            case 'host_extractor': return <CloudServerOutlined style={{ ...style, color: '#13c2c2' }} />;
            case 'cmdb_validator': return <SafetyCertificateOutlined style={{ ...style, color: '#722ed1' }} />;
            default: return <FunctionOutlined style={style} />;
        }
    };

    const renderNodePreview = (nodes: AutoHealing.FlowNode[]) => {
        const allNodes = (nodes || []).filter(n => n.type !== 'start' && n.type !== 'end');

        let displayNodes = allNodes;
        let hiddenCount = 0;

        if (allNodes.length > 5) {
            displayNodes = [...allNodes.slice(0, 3), ...allNodes.slice(-1)];
            hiddenCount = allNodes.length - 4;
        }

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                {displayNodes.map((node, idx) => (
                    <React.Fragment key={idx}>
                        <Tooltip title={node.name}>
                            <div style={{
                                width: 24, height: 24,
                                background: '#fff',
                                border: '1px solid #e0e0e0',
                                display: 'flex', alignItems: 'center', justifyContent: 'center'
                            }}>
                                {getNodeIcon(node.type)}
                            </div>
                        </Tooltip>
                        {idx === 2 && hiddenCount > 0 && (
                            <>
                                <span style={{ fontSize: 11, color: '#bfbfbf', margin: '0 2px' }}>+{hiddenCount}</span>
                            </>
                        )}
                        {idx < displayNodes.length - 1 && idx !== 2 && (
                            <div style={{ width: 8, height: 1, background: '#d9d9d9' }} />
                        )}
                    </React.Fragment>
                ))}
                {allNodes.length === 0 && <Text type="secondary" style={{ fontSize: 12 }}>暂无节点</Text>}
            </div>
        );
    };

    return (
        <PageContainer
            header={{
                title: <><DeploymentUnitOutlined /> 自愈流程 / FLOWS</>,
                subTitle: '可视化编排自动化修复流程',
                breadcrumb: {}
            }}
        >
            <div style={{ height: 'auto', overflow: 'visible' }}>
                {/* Toolbar */}
                <div style={{
                    marginBottom: 16,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: 12,
                    background: '#fff',
                    padding: '16px 24px',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                }}>
                    <Space size="middle">
                        <Input
                            placeholder="搜索流程名称..."
                            prefix={<SearchOutlined style={{ color: '#bfbfbf' }} />}
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            allowClear
                            style={{ width: 240 }}
                        />
                        <Button icon={<ReloadOutlined />} onClick={loadFlows} loading={loading}>刷新</Button>
                    </Space>
                    <Button type="primary" icon={<PlusOutlined />} disabled={!access.canCreateFlow} onClick={() => history.push('/healing/flows/editor')}>
                        新建流程
                    </Button>
                </div>

                {/* Content Grid */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 100 }}><Spin size="large" /></div>
                ) : flows.length === 0 ? (
                    <Empty
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        description={<Text type="secondary">暂无自愈流程</Text>}
                    >
                        <Button type="dashed" onClick={() => history.push('/healing/flows/editor')}>创建第一个流程</Button>
                    </Empty>
                ) : (
                    <Row gutter={[16, 16]}>
                        {flows.map(flow => {
                            const isActive = flow.is_active;
                            const nodeCount = (flow.nodes || []).filter(n => n.type !== 'start' && n.type !== 'end').length;

                            return (
                                <Col key={flow.id} xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
                                    <div
                                        onClick={() => history.push(`/healing/flows/editor/${flow.id}`)}
                                        style={{
                                            display: 'flex',
                                            height: 140,
                                            border: '1px solid #e0e0e0',
                                            overflow: 'hidden',
                                            background: '#fff',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                                            transition: 'all 0.2s',
                                            cursor: 'pointer'
                                        }}
                                        onMouseEnter={(e) => {
                                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)';
                                            e.currentTarget.style.borderColor = '#bfbfbf';
                                        }}
                                        onMouseLeave={(e) => {
                                            e.currentTarget.style.boxShadow = '0 1px 2px rgba(0,0,0,0.03)';
                                            e.currentTarget.style.borderColor = '#e0e0e0';
                                        }}
                                    >
                                        {/* Left Stub */}
                                        <div style={{
                                            width: 48,
                                            background: isActive ? '#f0f9ff' : '#fafafa',
                                            borderRight: '1px solid #f0f0f0',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: 8,
                                            flexShrink: 0,
                                            borderLeft: `3px solid ${isActive ? '#1890ff' : '#d9d9d9'}`
                                        }}>
                                            <PartitionOutlined style={{ fontSize: 20, color: isActive ? '#1890ff' : '#bfbfbf' }} />
                                            <Text style={{ fontSize: 10, color: '#8c8c8c' }}>{nodeCount}节点</Text>
                                        </div>

                                        {/* Right Section */}
                                        <div style={{
                                            flex: 1,
                                            padding: '12px 16px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'space-between',
                                            minWidth: 0
                                        }}>
                                            {/* Top */}
                                            <div>
                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, minWidth: 0, opacity: isActive ? 1 : 0.6 }}>
                                                        <Text strong style={{ fontSize: 14, color: '#262626' }} ellipsis>
                                                            {flow.name}
                                                        </Text>
                                                    </div>
                                                    <div onClick={e => e.stopPropagation()}>
                                                        <Switch
                                                            size="small"
                                                            checked={isActive}
                                                            onChange={() => handleToggleActive(flow)}
                                                            loading={actionLoading === flow.id}
                                                            disabled={!access.canUpdateFlow}
                                                        />
                                                    </div>
                                                </div>
                                                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }} ellipsis>
                                                    {flow.description || '暂无描述'}
                                                </Text>
                                            </div>

                                            {/* Node Preview */}
                                            <div style={{ marginBottom: 8 }}>
                                                {renderNodePreview(flow.nodes || [])}
                                            </div>

                                            {/* Bottom */}
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {dayjs(flow.updated_at).format('MM-DD HH:mm')}
                                                </Text>

                                                <div style={{ display: 'flex', gap: 4 }} onClick={e => e.stopPropagation()}>
                                                    <Button type="text" size="small" icon={<EditOutlined />} disabled={!access.canUpdateFlow} onClick={() => history.push(`/healing/flows/editor/${flow.id}`)} />
                                                    <Popconfirm title="确定删除?" onConfirm={() => handleDelete(flow.id)}>
                                                        <Button type="text" danger size="small" disabled={!access.canDeleteFlow} icon={<DeleteOutlined />} />
                                                    </Popconfirm>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </div>
        </PageContainer>
    );
};

export default HealingFlows;
