import React from 'react';
import {
    ApiOutlined,
    CheckCircleOutlined,
    CloudServerOutlined,
    ToolOutlined,
} from '@ant-design/icons';
import { Alert, Badge, Button, Divider, Drawer, Space, Tag, Typography } from 'antd';
import dayjs from 'dayjs';
import { ENV_MAP, getOSIcon, STATUS_MAP, TYPE_MAP } from './cmdbPageConfig';

const { Text } = Typography;

type CMDBDetailDrawerProps = {
    canTestPlugin: boolean;
    canUpdatePlugin: boolean;
    item: AutoHealing.CMDBItem | null;
    loading: boolean;
    maintenanceLogs: AutoHealing.CMDBMaintenanceLog[];
    onClose: () => void;
    onOpenMaintenance: (record: AutoHealing.CMDBItem) => void;
    onOpenTestModal: (record: AutoHealing.CMDBItem) => void;
    onResumeMaintenance: (record: AutoHealing.CMDBItem) => Promise<boolean> | boolean;
    open: boolean;
};

export const CMDBDetailDrawer: React.FC<CMDBDetailDrawerProps> = ({
    canTestPlugin,
    canUpdatePlugin,
    item,
    loading,
    maintenanceLogs,
    onClose,
    onOpenMaintenance,
    onOpenTestModal,
    onResumeMaintenance,
    open,
}) => (
    <Drawer
        title={null}
        size={560}
        open={open}
        onClose={onClose}
        styles={{ header: { display: 'none' }, body: { padding: 0 } }}
        loading={loading}
        destroyOnHidden
    >
        {item && (
            <>
                <div className="cmdb-detail-header">
                    <div className="cmdb-detail-header-top">
                        <div className="cmdb-detail-header-icon">
                            {(TYPE_MAP[item.type] || { icon: <CloudServerOutlined /> }).icon}
                        </div>
                        <div className="cmdb-detail-header-info">
                            <div className="cmdb-detail-title">{item.name}</div>
                            <div className="cmdb-detail-sub">{item.ip_address}</div>
                        </div>
                        <Badge
                            status={(STATUS_MAP[item.status] || { badge: 'default' as const }).badge}
                            text={(STATUS_MAP[item.status] || { text: item.status }).text}
                        />
                    </div>
                    <Space size={8}>
                        <Button
                            size="small"
                            icon={<ApiOutlined />}
                            disabled={!canTestPlugin}
                            onClick={() => onOpenTestModal(item)}
                        >
                            密钥测试
                        </Button>
                        {item.status === 'maintenance' ? (
                            <Button
                                size="small"
                                icon={<CheckCircleOutlined />}
                                disabled={!canUpdatePlugin}
                                onClick={async () => {
                                    const success = await onResumeMaintenance(item);
                                    if (success) {
                                        onClose();
                                    }
                                }}
                            >
                                退出维护
                            </Button>
                        ) : (
                            <Button
                                size="small"
                                icon={<ToolOutlined />}
                                disabled={!canUpdatePlugin}
                                onClick={() => onOpenMaintenance(item)}
                            >
                                进入维护
                            </Button>
                        )}
                    </Space>
                </div>

                {item.status === 'maintenance' && (
                    <Alert
                        type="warning"
                        showIcon
                        icon={<ToolOutlined />}
                        message="维护模式"
                        description={(
                            <div>
                                <div>原因：{item.maintenance_reason || '-'}</div>
                                {item.maintenance_end_at && (
                                    <div>计划结束：{dayjs(item.maintenance_end_at).format('YYYY-MM-DD HH:mm')}</div>
                                )}
                            </div>
                        )}
                        style={{ margin: '16px 24px 0', borderRadius: 0 }}
                    />
                )}

                <div className="cmdb-detail-body">
                    <div className="cmdb-detail-section">
                        <div className="cmdb-detail-section-title">基本信息</div>
                        <div className="cmdb-detail-grid">
                            <div>
                                <Text className="cmdb-detail-field-label">名称</Text>
                                <Text className="cmdb-detail-field-value">{item.name}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">主机名</Text>
                                <Text className="cmdb-detail-field-value">{item.hostname || '—'}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">IP 地址</Text>
                                <Text copyable className="cmdb-detail-field-value" style={{ fontFamily: 'monospace' }}>
                                    {item.ip_address}
                                </Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">类型</Text>
                                <Tag color={(TYPE_MAP[item.type] || { color: 'default' }).color}>
                                    {(TYPE_MAP[item.type] || { text: item.type }).text}
                                </Tag>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">环境</Text>
                                <Tag color={(ENV_MAP[item.environment] || { color: 'default' }).color}>
                                    {(ENV_MAP[item.environment] || { text: item.environment }).text}
                                </Tag>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">负责人</Text>
                                <Text className="cmdb-detail-field-value">{item.owner || '—'}</Text>
                            </div>
                        </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div className="cmdb-detail-section">
                        <div className="cmdb-detail-section-title">硬件 / 系统</div>
                        <div className="cmdb-detail-grid">
                            <div>
                                <Text className="cmdb-detail-field-label">操作系统</Text>
                                <Space size={4}>
                                    {getOSIcon(item.os)}
                                    <Text className="cmdb-detail-field-value">{item.os || '—'}</Text>
                                </Space>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">系统版本</Text>
                                <Text className="cmdb-detail-field-value">{item.os_version || '—'}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">CPU</Text>
                                <Text className="cmdb-detail-field-value">{item.cpu || '—'}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">内存</Text>
                                <Text className="cmdb-detail-field-value">{item.memory || '—'}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">磁盘</Text>
                                <Text className="cmdb-detail-field-value">{item.disk || '—'}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">位置</Text>
                                <Text className="cmdb-detail-field-value">{item.location || '—'}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">厂商</Text>
                                <Text className="cmdb-detail-field-value">{item.manufacturer || '—'}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">型号</Text>
                                <Text className="cmdb-detail-field-value">{item.model || '—'}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">序列号</Text>
                                <Text copyable className="cmdb-detail-field-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                    {item.serial_number || '—'}
                                </Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">部门</Text>
                                <Text className="cmdb-detail-field-value">{item.department || '—'}</Text>
                            </div>
                        </div>
                    </div>

                    <Divider style={{ margin: '12px 0' }} />

                    <div className="cmdb-detail-section">
                        <div className="cmdb-detail-section-title">来源 / 时间</div>
                        <div className="cmdb-detail-grid">
                            <div>
                                <Text className="cmdb-detail-field-label">数据来源</Text>
                                <Text className="cmdb-detail-field-value">{item.source_plugin_name || '手动录入'}</Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">外部 ID</Text>
                                <Text className="cmdb-detail-field-value" style={{ fontFamily: 'monospace', fontSize: 12 }}>
                                    {item.external_id || '—'}
                                </Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">创建时间</Text>
                                <Text style={{ fontSize: 13 }}>
                                    {item.created_at ? dayjs(item.created_at).format('YYYY-MM-DD HH:mm') : '—'}
                                </Text>
                            </div>
                            <div>
                                <Text className="cmdb-detail-field-label">更新时间</Text>
                                <Text style={{ fontSize: 13 }}>
                                    {item.updated_at ? dayjs(item.updated_at).format('YYYY-MM-DD HH:mm') : '—'}
                                </Text>
                            </div>
                        </div>
                    </div>

                    {maintenanceLogs.length > 0 && (
                        <>
                            <Divider style={{ margin: '12px 0' }} />
                            <div className="cmdb-detail-section">
                                <div className="cmdb-detail-section-title">维护日志</div>
                                <div className="cmdb-maintenance-log">
                                    {maintenanceLogs.map((log) => (
                                        <div key={log.id} className="cmdb-maintenance-log-item">
                                            <Tag color={log.action === 'enter' ? 'orange' : 'green'} style={{ margin: 0 }}>
                                                {log.action === 'enter' ? '进入' : '退出'}
                                            </Tag>
                                            <div style={{ flex: 1 }}>
                                                <div style={{ fontSize: 13 }}>{log.reason || '—'}</div>
                                                <Text type="secondary" style={{ fontSize: 11 }}>
                                                    {log.operator} · {dayjs(log.created_at).format('YYYY-MM-DD HH:mm')}
                                                </Text>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}

                    <div style={{ paddingTop: 12, borderTop: '1px solid #f0f0f0', marginTop: 12 }}>
                        <Text type="secondary" style={{ fontSize: 11, fontFamily: 'monospace' }}>
                            ID: {item.id}
                        </Text>
                    </div>
                </div>
            </>
        )}
    </Drawer>
);
