import React from 'react';
import { Badge, Button, Descriptions, Divider, Drawer, Space, Tag, Typography } from 'antd';
import { EditOutlined, ExclamationCircleOutlined, LockOutlined, SecurityScanOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import type { CommandBlacklistRule } from '@/services/auto-healing/commandBlacklist';
import { CATEGORY_CONFIG, MATCH_TYPE_CONFIG, SEVERITY_CONFIG } from './commandBlacklistPageConfig';

const { Text } = Typography;

interface CommandBlacklistDetailDrawerProps {
    canManage: boolean;
    rule: CommandBlacklistRule | null;
    onClose: () => void;
    onEdit: (rule: CommandBlacklistRule) => void;
}

const CommandBlacklistDetailDrawer: React.FC<CommandBlacklistDetailDrawerProps> = ({
    canManage,
    rule,
    onClose,
    onEdit,
}) => {
    return (
        <Drawer
            title={
                <Space>
                    <SecurityScanOutlined />
                    <span>规则详情</span>
                    {rule && (
                        <>
                            <Tag color={SEVERITY_CONFIG[rule.severity]?.tagColor || 'default'} icon={SEVERITY_CONFIG[rule.severity]?.icon}>
                                {SEVERITY_CONFIG[rule.severity]?.label || rule.severity}
                            </Tag>
                            {rule.is_system && <Tag><LockOutlined /> 内置</Tag>}
                        </>
                    )}
                </Space>
            }
            open={!!rule}
            onClose={onClose}
            width={560}
            extra={rule && !rule.is_system && (
                <Button
                    type="primary"
                    icon={<EditOutlined />}
                    disabled={!canManage}
                    onClick={() => onEdit(rule)}
                >
                    编辑规则
                </Button>
            )}
        >
            {rule && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                    <Descriptions title="基本信息" column={2} bordered size="small">
                        <Descriptions.Item label="规则名称" span={2}>
                            <Text style={{ fontWeight: 500 }}>{rule.name}</Text>
                        </Descriptions.Item>
                        <Descriptions.Item label="严重级别">
                            <Tag color={SEVERITY_CONFIG[rule.severity]?.tagColor || 'default'} icon={SEVERITY_CONFIG[rule.severity]?.icon}>
                                {SEVERITY_CONFIG[rule.severity]?.label || rule.severity}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="分类">
                            {CATEGORY_CONFIG[rule.category]?.label || rule.category || '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="状态">
                            <Badge status={rule.is_active ? 'success' : 'default'} text={rule.is_active ? '启用' : '禁用'} />
                        </Descriptions.Item>
                        <Descriptions.Item label="类型">
                            {rule.is_system ? <Tag><LockOutlined /> 系统内置</Tag> : <Text type="secondary">自定义</Text>}
                        </Descriptions.Item>
                    </Descriptions>

                    <Divider style={{ margin: 0 }} />

                    <Descriptions title="匹配配置" column={1} bordered size="small">
                        <Descriptions.Item label="匹配类型">
                            <Tag>{MATCH_TYPE_CONFIG[rule.match_type]?.label || rule.match_type}</Tag>
                            <Text type="secondary" style={{ fontSize: 12, marginLeft: 8 }}>
                                {MATCH_TYPE_CONFIG[rule.match_type]?.desc}
                            </Text>
                        </Descriptions.Item>
                    </Descriptions>

                    <div>
                        <Text strong style={{ display: 'block', marginBottom: 8 }}>匹配模式</Text>
                        <div
                            style={{
                                padding: 16,
                                background: '#1e1e1e',
                                color: '#e06c75',
                                fontFamily: "Consolas, Monaco, 'Courier New', monospace",
                                fontSize: 14,
                                lineHeight: 1.6,
                                wordBreak: 'break-all',
                                whiteSpace: 'pre-wrap',
                            }}
                        >
                            {rule.pattern}
                        </div>
                    </div>

                    {rule.description && (
                        <>
                            <Divider style={{ margin: 0 }} />
                            <div>
                                <Text strong style={{ display: 'block', marginBottom: 8 }}>风险说明</Text>
                                <div style={{ padding: '12px 16px', background: '#fffbe6', border: '1px solid #ffe58f', lineHeight: 1.6 }}>
                                    <Space align="start">
                                        <ExclamationCircleOutlined style={{ color: '#faad14', marginTop: 3 }} />
                                        <Text>{rule.description}</Text>
                                    </Space>
                                </div>
                            </div>
                        </>
                    )}

                    <Divider style={{ margin: 0 }} />

                    <Descriptions column={2} bordered size="small">
                        <Descriptions.Item label="创建时间">
                            {rule.created_at ? dayjs(rule.created_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </Descriptions.Item>
                        <Descriptions.Item label="更新时间">
                            {rule.updated_at ? dayjs(rule.updated_at).format('YYYY-MM-DD HH:mm:ss') : '-'}
                        </Descriptions.Item>
                    </Descriptions>
                </div>
            )}
        </Drawer>
    );
};

export default CommandBlacklistDetailDrawer;
