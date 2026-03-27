import React, { useEffect, useMemo, useState } from 'react';
import TeamsAvatar from '@/components/TeamsAvatar';
import { AppstoreOutlined, CloseOutlined, CrownOutlined, EditOutlined, SafetyOutlined, SaveOutlined } from '@ant-design/icons';
import { Button, Card, Col, Descriptions, Divider, Form, Input, Row, Skeleton, Space, Tag, Typography, message } from 'antd';
import { history } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import SubPageHeader from '@/components/SubPageHeader';
import { USER_STATUS_MAP } from '@/constants/commonDicts';
import { changePassword, getProfile, getProfileActivities, getProfileLoginHistory, updateProfile } from '@/services/auto-healing/auth';
import PermissionGrid from './PermissionGrid';
import ProfileActivityCard from './ProfileActivityCard';
import ProfileLoginHistoryCard from './ProfileLoginHistoryCard';
import ProfilePasswordModal from './ProfilePasswordModal';
import { groupPermissions, loadProfileSidebarData, type ProfileActivityRecord, type ProfileLoginRecord } from './profileHelpers';
import './index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

const { Text } = Typography;

const hasErrorFields = (value: unknown): value is { errorFields?: unknown } =>
    typeof value === 'object' && value !== null && 'errorFields' in value;

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<AutoHealing.UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pwdOpen, setPwdOpen] = useState(false);
    const [loginLogs, setLoginLogs] = useState<ProfileLoginRecord[]>([]);
    const [opLogs, setOpLogs] = useState<ProfileActivityRecord[]>([]);
    const [opLogsUnavailable, setOpLogsUnavailable] = useState(false);
    const [editForm] = Form.useForm();
    const [pwdForm] = Form.useForm();

    const load = async () => {
        setLoading(true);
        try {
            setProfile(await getProfile());
        } catch {
            message.error('获取个人信息失败');
        } finally {
            setLoading(false);
        }
    };

    const loadSidebar = async () => {
        try {
            const { activitiesFailed, loginLogs, opLogs } = await loadProfileSidebarData({
                loadActivities: () => getProfileActivities(10),
                loadLoginHistory: () => getProfileLoginHistory(8),
            });
            setOpLogsUnavailable(activitiesFailed);
            setLoginLogs(loginLogs as ProfileLoginRecord[]);
            setOpLogs(opLogs as ProfileActivityRecord[]);
        } catch {
            // global error handler
        }
    };

    useEffect(() => {
        load();
        loadSidebar();
    }, []);

    const tenantName = useMemo(() => {
        if (!profile || profile.is_platform_admin) return '';
        try {
            const raw = localStorage.getItem('tenant-storage');
            if (!raw) return '';
            const { currentTenantId, tenants } = JSON.parse(raw);
            return tenants?.find((tenant: { id: string; name: string }) => tenant.id === currentTenantId)?.name || '';
        } catch {
            return '';
        }
    }, [profile]);

    const enterEdit = () => {
        if (!profile) return;
        editForm.setFieldsValue({
            display_name: profile.display_name || '',
            email: profile.email || '',
            phone: profile.phone || '',
        });
        setEditing(true);
    };

    const cancelEdit = () => {
        setEditing(false);
        editForm.resetFields();
    };

    const saveEdit = async () => {
        try {
            const values = await editForm.validateFields();
            setSaving(true);
            await updateProfile(values);
            message.success('更新成功');
            setEditing(false);
            load();
        } catch (error: unknown) {
            if (!hasErrorFields(error) || !error.errorFields) {
                // global error handler
            }
        } finally {
            setSaving(false);
        }
    };

    const handlePwd = async () => {
        try {
            const values = await pwdForm.validateFields();
            await changePassword({ old_password: values.old_password, new_password: values.new_password });
            message.success('密码修改成功');
            setPwdOpen(false);
        } catch (error: unknown) {
            if (!hasErrorFields(error) || !error.errorFields) {
                // global error handler
            }
        }
    };

    if (loading) {
        return (
            <div className="profile-page">
                <SubPageHeader title="个人中心" onBack={() => history.push('/workbench')} />
                <div className="profile-container">
                    <Card><Skeleton active avatar paragraph={{ rows: 4 }} /></Card>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="profile-page">
                <SubPageHeader title="个人中心" onBack={() => history.push('/workbench')} />
                <div className="profile-container"><Card>无法加载用户信息</Card></div>
            </div>
        );
    }

    const isSuperAdmin = profile.permissions.includes('*');
    const accountAge = dayjs().diff(dayjs(profile.created_at), 'day');
    const passwordAge = profile.password_changed_at ? dayjs().diff(dayjs(profile.password_changed_at), 'day') : null;
    const actorName = profile.display_name || profile.username;
    const permissionGroups = groupPermissions(profile.permissions);

    return (
        <div className="profile-page">
            <SubPageHeader title="个人中心" onBack={() => history.push('/workbench')} />
            <div className="profile-container">
                <Row gutter={16}>
                    <Col span={16}>
                        <Card style={{ marginBottom: 16 }} styles={{ body: { display: 'flex', alignItems: 'center', gap: 16 } }}>
                            <TeamsAvatar seed={profile.username || ''} name={actorName || '用户'} size={52} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h2 className="profile-hero-name">
                                    {actorName}
                                    <Tag color={(USER_STATUS_MAP[profile.status] || USER_STATUS_MAP.inactive).tagColor}>
                                        {(USER_STATUS_MAP[profile.status] || USER_STATUS_MAP.inactive).label}
                                    </Tag>
                                </h2>
                                <div className="profile-hero-meta">
                                    <span>@{profile.username}</span>
                                    <Divider orientation="vertical" style={{ margin: '0 4px' }} />
                                    {profile.roles.map((role) => (
                                        <Tag key={role.id} color={role.is_system ? 'blue' : 'default'} icon={role.is_system ? <CrownOutlined /> : undefined} style={{ marginInlineEnd: 0 }}>
                                            {role.display_name || role.name}
                                        </Tag>
                                    ))}
                                    <Divider orientation="vertical" style={{ margin: '0 4px' }} />
                                    <span>已加入 {accountAge} 天</span>
                                </div>
                            </div>
                            <Space>
                                <Button icon={<EditOutlined />} onClick={enterEdit}>编辑信息</Button>
                                <Button onClick={() => { pwdForm.resetFields(); setPwdOpen(true); }}>修改密码</Button>
                            </Space>
                        </Card>

                        <Card title="基本信息" style={{ marginBottom: 16 }}>
                            <Form form={editForm} component={false}>
                                <Descriptions column={2} colon={false} labelStyle={{ color: '#8c8c8c', width: 90 }}>
                                    <Descriptions.Item label="用户名"><Text copyable>{profile.username}</Text></Descriptions.Item>
                                    <Descriptions.Item label="邮箱">
                                        {editing
                                            ? <Form.Item name="email" noStyle rules={[{ type: 'email', message: '邮箱格式不正确' }]}><Input placeholder="请输入" style={{ maxWidth: 280 }} /></Form.Item>
                                            : profile.email || <Text type="secondary">未设置</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="显示名称">
                                        {editing
                                            ? <Form.Item name="display_name" noStyle><Input placeholder="请输入" style={{ maxWidth: 280 }} /></Form.Item>
                                            : profile.display_name || <Text type="secondary">未设置</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="手机号">
                                        {editing
                                            ? <Form.Item name="phone" noStyle><Input placeholder="请输入" style={{ maxWidth: 280 }} /></Form.Item>
                                            : profile.phone || <Text type="secondary">未设置</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="注册时间">{dayjs(profile.created_at).format('YYYY-MM-DD HH:mm')}</Descriptions.Item>
                                    <Descriptions.Item label="User ID"><Text type="secondary" copyable style={{ fontSize: 12, fontFamily: 'monospace' }}>{profile.id}</Text></Descriptions.Item>
                                </Descriptions>
                                {editing && (
                                    <div style={{ paddingTop: 12, marginTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10 }}>
                                        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveEdit}>保存</Button>
                                        <Button icon={<CloseOutlined />} onClick={cancelEdit}>取消</Button>
                                    </div>
                                )}
                            </Form>
                        </Card>

                        <Card title="登录安全" style={{ marginBottom: 16 }}>
                            <Descriptions column={2} colon={false} labelStyle={{ color: '#8c8c8c', width: 90 }}>
                                <Descriptions.Item label="上次登录">{profile.last_login_at ? dayjs(profile.last_login_at).format('YYYY-MM-DD HH:mm:ss') : '从未登录'}</Descriptions.Item>
                                <Descriptions.Item label="登录 IP">{profile.last_login_ip ? <Tag style={{ fontFamily: 'monospace' }}>{profile.last_login_ip}</Tag> : '-'}</Descriptions.Item>
                                <Descriptions.Item label="密码状态">
                                    {passwordAge !== null ? (
                                        <Space size={4}>
                                            <Tag color={passwordAge > 90 ? 'warning' : 'success'}>{passwordAge > 90 ? '建议更换' : '安全'}</Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{passwordAge} 天前修改</Text>
                                        </Space>
                                    ) : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="账户状态">
                                    <Tag color={(USER_STATUS_MAP[profile.status] || USER_STATUS_MAP.inactive).tagColor}>
                                        {(USER_STATUS_MAP[profile.status] || USER_STATUS_MAP.inactive).label}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        <Card title="角色与权限" styles={{ body: { padding: 0 } }}>
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                                <Descriptions column={2} colon={false} labelStyle={{ color: '#8c8c8c', width: 90 }}>
                                    <Descriptions.Item label="身份类型">
                                        {profile.is_platform_admin
                                            ? <Tag color="purple" icon={<CrownOutlined />}>平台用户</Tag>
                                            : <Tag color="blue" icon={<AppstoreOutlined />}>租户用户</Tag>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={profile.is_platform_admin ? '管理范围' : '所属租户'}>
                                        {profile.is_platform_admin
                                            ? <Text type="secondary">平台侧</Text>
                                            : tenantName
                                                ? <Tag>{tenantName}</Tag>
                                                : <Text type="secondary">-</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="角色" span={2}>
                                        <Space size={4} wrap>
                                            {profile.roles.map((role) => (
                                                <Tag key={role.id} color={role.is_system ? 'blue' : 'default'} icon={role.is_system ? <CrownOutlined /> : <SafetyOutlined />}>
                                                    {role.display_name || role.name}{role.is_system ? '（系统）' : ''}
                                                </Tag>
                                            ))}
                                        </Space>
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                            <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text strong style={{ fontSize: 13 }}>
                                        <SafetyOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />功能权限
                                    </Text>
                                    {!isSuperAdmin && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            共 {profile.permissions.length} 项 · {Object.keys(permissionGroups).length} 个模块
                                        </Text>
                                    )}
                                </div>
                                {isSuperAdmin ? (
                                    <div style={{ padding: '10px 14px', background: '#fffbe6', border: '1px solid #ffe58f' }}>
                                        <CrownOutlined style={{ color: '#faad14', marginRight: 8 }} />
                                        <Text style={{ color: '#ad6800', fontSize: 13 }}>超级管理员 · 拥有系统所有权限</Text>
                                    </div>
                                ) : profile.permissions.length > 0 ? (
                                    <PermissionGrid permissions={profile.permissions} />
                                ) : <Text type="secondary">暂无权限</Text>}
                            </div>
                        </Card>
                    </Col>

                    <Col span={8}>
                        <ProfileLoginHistoryCard loginLogs={loginLogs} />
                        <ProfileActivityCard actorName={actorName} opLogs={opLogs} unavailable={opLogsUnavailable} />
                    </Col>
                </Row>
            </div>

            <ProfilePasswordModal form={pwdForm} onCancel={() => setPwdOpen(false)} onSubmit={handlePwd} open={pwdOpen} />
        </div>
    );
};

export default ProfilePage;
