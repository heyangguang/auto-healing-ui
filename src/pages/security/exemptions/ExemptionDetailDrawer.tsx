import React from 'react';
import { Drawer, Space, Tag, Typography } from 'antd';
import type { ExemptionRecord } from '@/services/auto-healing/blacklistExemption';
import { getBlacklistSeverityMeta } from '@/constants/securityDicts';
import { formatTime, getExemptionSeverityTagColor, getExemptionStatusConfig } from './exemptionListConfig';

const { Text } = Typography;

interface ExemptionDetailDrawerProps {
    detail: ExemptionRecord | null;
    open: boolean;
    onClose: () => void;
}

const ExemptionDetailDrawer: React.FC<ExemptionDetailDrawerProps> = ({ detail, open, onClose }) => {
    return (
        <Drawer
            title="豁免详情"
            open={open}
            onClose={onClose}
            width={560}
        >
            {detail && (() => {
                const statusConfig = getExemptionStatusConfig(detail.status);
                const labelStyle: React.CSSProperties = { fontSize: 12, color: '#8c8c8c', marginBottom: 4 };
                const valueStyle: React.CSSProperties = { fontSize: 13, color: '#262626' };

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div
                            style={{
                                padding: '14px 16px',
                                background: '#f8fafc',
                                border: '1px solid #e8e8e8',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                            }}
                        >
                            <span style={{ fontSize: 18, color: statusConfig.color }}>{statusConfig.icon}</span>
                            <div>
                                <Tag color={statusConfig.tagColor} style={{ margin: 0 }}>{statusConfig.label}</Tag>
                                {detail.expires_at && detail.status === 'approved' && (
                                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 12 }}>
                                        到期 {formatTime(detail.expires_at)}
                                    </Text>
                                )}
                            </div>
                        </div>

                        <div style={{ background: '#fafafa', padding: '16px 20px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 14, paddingBottom: 8, borderBottom: '1px dashed #e8e8e8' }}>
                                申请信息
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                                <div style={{ gridColumn: '1 / -1' }}>
                                    <div style={labelStyle}>任务模板</div>
                                    <Text strong style={{ fontSize: 14 }}>{detail.task_name}</Text>
                                </div>
                                <div>
                                    <div style={labelStyle}>豁免规则</div>
                                    <Space size={6}>
                                        <Text style={valueStyle}>{detail.rule_name}</Text>
                                        <Tag color={getExemptionSeverityTagColor(detail.rule_severity)} style={{ margin: 0, fontSize: 11 }}>
                                            {getBlacklistSeverityMeta(detail.rule_severity).label}
                                        </Tag>
                                    </Space>
                                </div>
                                <div>
                                    <div style={labelStyle}>匹配模式</div>
                                    <Text code style={{ fontSize: 12, color: '#cf1322' }}>{detail.rule_pattern}</Text>
                                </div>
                                <div>
                                    <div style={labelStyle}>申请人</div>
                                    <Text style={valueStyle}>{detail.requester_name}</Text>
                                </div>
                                <div>
                                    <div style={labelStyle}>有效期</div>
                                    <Text style={valueStyle}>{detail.validity_days} 天</Text>
                                </div>
                                <div>
                                    <div style={labelStyle}>申请时间</div>
                                    <Text style={valueStyle}>{formatTime(detail.created_at)}</Text>
                                </div>
                            </div>
                        </div>

                        <div style={{ background: '#fafafa', padding: '16px 20px' }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 10, paddingBottom: 8, borderBottom: '1px dashed #e8e8e8' }}>
                                豁免原因
                            </div>
                            <div
                                style={{
                                    padding: '12px 16px',
                                    background: '#fff',
                                    border: '1px solid #f0f0f0',
                                    fontSize: 13,
                                    lineHeight: 1.7,
                                    color: '#434343',
                                    whiteSpace: 'pre-wrap',
                                }}
                            >
                                {detail.reason || '—'}
                            </div>
                        </div>

                        {detail.status !== 'pending' && (
                            <div style={{ background: '#fafafa', padding: '16px 20px' }}>
                                <div style={{ fontSize: 13, fontWeight: 600, color: '#262626', marginBottom: 14, paddingBottom: 8, borderBottom: '1px dashed #e8e8e8' }}>
                                    审批信息
                                </div>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px 24px' }}>
                                    <div>
                                        <div style={labelStyle}>审批人</div>
                                        <Text style={valueStyle}>{detail.approver_name || '—'}</Text>
                                    </div>
                                    <div>
                                        <div style={labelStyle}>审批时间</div>
                                        <Text style={valueStyle}>{formatTime(detail.approved_at)}</Text>
                                    </div>
                                    {detail.expires_at && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={labelStyle}>到期时间</div>
                                            <Text style={valueStyle}>{formatTime(detail.expires_at)}</Text>
                                        </div>
                                    )}
                                    {detail.reject_reason && (
                                        <div style={{ gridColumn: '1 / -1' }}>
                                            <div style={labelStyle}>拒绝原因</div>
                                            <div
                                                style={{
                                                    padding: '10px 14px',
                                                    background: '#fff1f0',
                                                    border: '1px solid #ffccc7',
                                                    fontSize: 13,
                                                    color: '#cf1322',
                                                    whiteSpace: 'pre-wrap',
                                                }}
                                            >
                                                {detail.reject_reason}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        <div style={{ borderTop: '1px solid #f0f0f0', paddingTop: 8 }}>
                            <Text type="secondary" style={{ fontSize: 11, fontFamily: 'SFMono-Regular, Consolas, monospace' }}>
                                ID: {detail.id}
                            </Text>
                        </div>
                    </div>
                );
            })()}
        </Drawer>
    );
};

export default ExemptionDetailDrawer;
