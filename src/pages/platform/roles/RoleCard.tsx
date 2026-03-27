import React from 'react';
import { Button, Col, Popconfirm, Space, Tooltip } from 'antd';
import {
    ClockCircleOutlined,
    DeleteOutlined,
    SafetyCertificateOutlined,
    SecurityScanOutlined,
    TeamOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import type { PlatformRoleRecord } from './types';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

type RoleCardProps = {
    role: PlatformRoleRecord;
    canManagePlatformRoles: boolean;
    onOpen: (role: PlatformRoleRecord) => void;
    onDelete: (id: string) => void;
};

const RoleCard: React.FC<RoleCardProps> = ({ role, canManagePlatformRoles, onOpen, onDelete }) => {
    const isSystem = role.is_system;
    const cardClass = `role-card ${isSystem ? 'role-card-system' : 'role-card-custom'}`;

    return (
        <Col key={role.id} xs={24} sm={12} md={8} lg={6} xl={6} xxl={4}>
            <div className={cardClass} onClick={() => onOpen(role)}>
                <div className="role-card-body">
                    <div className="role-card-header">
                        <div className="role-card-title-area">
                            <div className="role-card-icon">
                                <SafetyCertificateOutlined />
                            </div>
                            <span className="role-card-title">{role.display_name || role.name}</span>
                        </div>
                        <span className={isSystem ? 'role-card-type-system' : 'role-card-type-custom'}>
                            {isSystem ? '系统' : '自定义'}
                        </span>
                    </div>

                    <div className="role-card-desc">{role.description || '暂无描述'}</div>

                    <div className="role-card-stats">
                        <div className="role-card-stat-item">
                            <TeamOutlined />
                            <span>用户</span>
                            <span className="role-card-stat-value">{role.user_count ?? 0}</span>
                        </div>
                        <div className="role-card-stat-item">
                            <SecurityScanOutlined />
                            <span>权限</span>
                            <span className="role-card-stat-value">{role.permission_count ?? 0}</span>
                        </div>
                    </div>

                    <div className="role-card-footer">
                        <div className="role-card-footer-left">
                            <ClockCircleOutlined style={{ fontSize: 10 }} />
                            {role.created_at ? dayjs(role.created_at).fromNow() : '-'}
                        </div>
                        <Space size={0}>
                            {!isSystem && canManagePlatformRoles && (
                                <Popconfirm
                                    title="确定要删除此角色吗？"
                                    description="删除后不可恢复"
                                    onConfirm={(event) => {
                                        event?.stopPropagation();
                                        onDelete(role.id);
                                    }}
                                    onCancel={(event) => event?.stopPropagation()}
                                >
                                    <Tooltip title="删除">
                                        <Button
                                            type="link"
                                            size="small"
                                            danger
                                            icon={<DeleteOutlined />}
                                            onClick={(event) => event.stopPropagation()}
                                        />
                                    </Tooltip>
                                </Popconfirm>
                            )}
                        </Space>
                    </div>
                </div>
            </div>
        </Col>
    );
};

export default RoleCard;
