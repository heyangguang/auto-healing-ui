import React, { useState, useEffect, useMemo } from 'react';
import TeamsAvatar from '@/components/TeamsAvatar';
import {
    Tag, Space, Button, Form, Input, message, Row, Col,
    Modal, Typography, Avatar, Skeleton, Divider,
    Card, Descriptions,
} from 'antd';
import {
    UserOutlined, EditOutlined, CrownOutlined,
    SafetyOutlined, SaveOutlined, CloseOutlined,
    HistoryOutlined, LoginOutlined,
    MobileOutlined, DesktopOutlined,
    AppstoreOutlined, ApartmentOutlined,
} from '@ant-design/icons';
import SubPageHeader from '@/components/SubPageHeader';
import { getProfile, updateProfile, changePassword, getProfileLoginHistory, getProfileActivities } from '@/services/auto-healing/auth';
import { history } from '@umijs/max';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import './index.css';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

import {
    ALL_RESOURCE_LABELS as RESOURCE_MAP,
    ACTION_LABELS,
    ACTION_COLORS,
    ACTION_VERBS as ACTION_VERB,
} from '@/constants/auditDicts';
import { PERMISSION_MODULE_META } from '@/constants/permissionDicts';
import { USER_STATUS_MAP } from '@/constants/commonDicts';

const { Text } = Typography;

const ACTION_MAP: Record<string, { label: string; color: string }> = Object.fromEntries(
    Object.entries(ACTION_LABELS).map(([k, label]) => [k, { label, color: ACTION_COLORS[k] || 'default' }]),
);

/** 将 permissions 按模块分组, e.g. "healing:rules:view" → module="healing", action="rules:view" */
function groupPermissions(permissions: string[]): Record<string, string[]> {
    const groups: Record<string, string[]> = {};
    for (const p of permissions) {
        const idx = p.indexOf(':');
        const module = idx > 0 ? p.slice(0, idx) : 'other';
        const action = idx > 0 ? p.slice(idx + 1) : p;
        if (!groups[module]) groups[module] = [];
        groups[module].push(action);
    }
    return groups;
}

function describeActivity(log: any): { action: string; resource: string; color: string } {
    const act = log.action || '';
    const name = log.resource_name || '';
    const rType = RESOURCE_MAP[log.resource_type] || log.resource_type || '';
    const v = ACTION_VERB[act] || { verb: act || 'GET', color: '#8c8c8c' };
    const actionText = rType ? `${v.verb} ${rType}` : v.verb;
    return { action: actionText, resource: name, color: v.color };
}

/* 简单解析 User-Agent */
function parseUA(ua: string): string {
    if (!ua) return '未知设备';
    if (ua.startsWith('curl')) return 'curl 命令行';
    const browser =
        /Edg\//.test(ua) ? 'Edge' :
            /Chrome\//.test(ua) ? 'Chrome' :
                /Firefox\//.test(ua) ? 'Firefox' :
                    /Safari\//.test(ua) ? 'Safari' : '';
    const os =
        /Windows/.test(ua) ? 'Windows' :
            /Mac OS/.test(ua) ? 'macOS' :
                /Linux/.test(ua) ? 'Linux' :
                    /Android/.test(ua) ? 'Android' :
                        /iPhone|iPad/.test(ua) ? 'iOS' : '';
    if (browser && os) return `${browser} · ${os}`;
    if (browser) return browser;
    if (os) return os;
    return '未知设备';
}

/** 权限网格：按模块分组卡片式展示 */
const PermissionGrid: React.FC<{ permissions: string[] }> = ({ permissions }) => {
    const groups = useMemo(() => {
        const g = groupPermissions(permissions);
        return Object.entries(g)
            .sort((a, b) => b[1].length - a[1].length);
    }, [permissions]);

    return (
        <div className="perm-grid">
            {groups.map(([module, actions]) => {
                const meta = PERMISSION_MODULE_META[module] || { label: module, color: '#8c8c8c' };
                return (
                    <div key={module} className="perm-grid-card">
                        <div className="perm-grid-header">
                            <span className="perm-module-dot" style={{ background: meta.color }} />
                            <span className="perm-grid-label">{meta.label}</span>
                            <span className="perm-module-count">{actions.length}</span>
                        </div>
                        <div className="perm-grid-body">
                            {actions.sort().map(a => (
                                <span key={a} className="perm-chip">{a}</span>
                            ))}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<AutoHealing.UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [pwdOpen, setPwdOpen] = useState(false);
    const [editForm] = Form.useForm();
    const [pwdForm] = Form.useForm();
    const [loginLogs, setLoginLogs] = useState<any[]>([]);
    const [opLogs, setOpLogs] = useState<any[]>([]);

    const load = async () => {
        setLoading(true);
        try { setProfile((await getProfile())?.data); }
        catch { message.error('获取个人信息失败'); }
        setLoading(false);
    };

    const loadSidebar = async () => {
        try {
            const [loginRes, opRes] = await Promise.all([
                getProfileLoginHistory(8),
                getProfileActivities(10),
            ]);
            setLoginLogs(loginRes?.data?.items || []);
            setOpLogs(opRes?.data?.items || []);
        } catch { /* silent */ }
    };

    useEffect(() => { load(); loadSidebar(); }, []);

    // 获取当前租户名（必须在所有条件 return 之前调用）
    const tenantName = useMemo(() => {
        if (!profile || profile.is_platform_admin) return '';
        try {
            const raw = localStorage.getItem('tenant-storage');
            if (!raw) return '';
            const { currentTenantId, tenants } = JSON.parse(raw);
            return tenants?.find((t: any) => t.id === currentTenantId)?.name || '';
        } catch { return ''; }
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
    const cancelEdit = () => { setEditing(false); editForm.resetFields(); };
    const saveEdit = async () => {
        try {
            const v = await editForm.validateFields();
            setSaving(true);
            await updateProfile(v);
            message.success('更新成功');
            setEditing(false);
            load();
        } catch (e: any) {
            if (e?.errorFields) return;
            message.error('更新失败');
        } finally { setSaving(false); }
    };
    const handlePwd = async () => {
        try {
            const v = await pwdForm.validateFields();
            await changePassword(v);
            message.success('密码修改成功');
            setPwdOpen(false);
        } catch (e: any) {
            if (e?.errorFields) return;
            message.error(e?.message || '修改失败');
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
    const pwdAge = profile.password_changed_at ? dayjs().diff(dayjs(profile.password_changed_at), 'day') : null;


    return (
        <div className="profile-page">
            <SubPageHeader title="个人中心" onBack={() => history.push('/workbench')} />

            <div className="profile-container">
                <Row gutter={16}>
                    {/* 左列 */}
                    <Col span={16}>
                        {/* Hero */}
                        <Card style={{ marginBottom: 16 }} styles={{ body: { display: 'flex', alignItems: 'center', gap: 16 } }}>
                            <TeamsAvatar seed={profile.username || ''} name={profile.display_name || profile.username || '用户'} size={52} />
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <h2 className="profile-hero-name">
                                    {profile.display_name || profile.username}
                                    <Tag color={(USER_STATUS_MAP[profile.status] || USER_STATUS_MAP['inactive']).tagColor}>
                                        {(USER_STATUS_MAP[profile.status] || USER_STATUS_MAP['inactive']).label}
                                    </Tag>
                                </h2>
                                <div className="profile-hero-meta">
                                    <span>@{profile.username}</span>
                                    <Divider orientation="vertical" style={{ margin: '0 4px' }} />
                                    {profile.roles.map(r => (
                                        <Tag key={r.id} color={r.is_system ? 'blue' : 'default'}
                                            icon={r.is_system ? <CrownOutlined /> : undefined}
                                            style={{ marginInlineEnd: 0 }}>
                                            {r.display_name || r.name}
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

                        {/* 基本信息 */}
                        <Card title="基本信息" style={{ marginBottom: 16 }}>
                            <Form form={editForm} component={false}>
                                <Descriptions column={2} colon={false}
                                    labelStyle={{ color: '#8c8c8c', width: 90 }}>
                                    <Descriptions.Item label="用户名">
                                        <Text copyable>{profile.username}</Text>
                                    </Descriptions.Item>
                                    <Descriptions.Item label="邮箱">
                                        {editing ? (
                                            <Form.Item name="email" noStyle rules={[{ type: 'email', message: '邮箱格式不正确' }]}>
                                                <Input placeholder="请输入" style={{ maxWidth: 280 }} />
                                            </Form.Item>
                                        ) : profile.email || <Text type="secondary">未设置</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="显示名称">
                                        {editing ? (
                                            <Form.Item name="display_name" noStyle>
                                                <Input placeholder="请输入" style={{ maxWidth: 280 }} />
                                            </Form.Item>
                                        ) : profile.display_name || <Text type="secondary">未设置</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="手机号">
                                        {editing ? (
                                            <Form.Item name="phone" noStyle>
                                                <Input placeholder="请输入" style={{ maxWidth: 280 }} />
                                            </Form.Item>
                                        ) : profile.phone || <Text type="secondary">未设置</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="注册时间">
                                        {dayjs(profile.created_at).format('YYYY-MM-DD HH:mm')}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="User ID">
                                        <Text type="secondary" copyable style={{ fontSize: 12, fontFamily: 'monospace' }}>{profile.id}</Text>
                                    </Descriptions.Item>
                                </Descriptions>
                                {editing && (
                                    <div style={{ paddingTop: 12, marginTop: 12, borderTop: '1px solid #f0f0f0', display: 'flex', gap: 10 }}>
                                        <Button type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveEdit}>保存</Button>
                                        <Button icon={<CloseOutlined />} onClick={cancelEdit}>取消</Button>
                                    </div>
                                )}
                            </Form>
                        </Card>

                        {/* 登录安全 */}
                        <Card title="登录安全" style={{ marginBottom: 16 }}>
                            <Descriptions column={2} colon={false}
                                labelStyle={{ color: '#8c8c8c', width: 90 }}>
                                <Descriptions.Item label="上次登录">
                                    {profile.last_login_at ? dayjs(profile.last_login_at).format('YYYY-MM-DD HH:mm:ss') : '从未登录'}
                                </Descriptions.Item>
                                <Descriptions.Item label="登录 IP">
                                    {profile.last_login_ip ? <Tag style={{ fontFamily: 'monospace' }}>{profile.last_login_ip}</Tag> : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="密码状态">
                                    {pwdAge !== null ? (
                                        <Space size={4}>
                                            <Tag color={pwdAge > 90 ? 'warning' : 'success'}>{pwdAge > 90 ? '建议更换' : '安全'}</Tag>
                                            <Text type="secondary" style={{ fontSize: 12 }}>{pwdAge} 天前修改</Text>
                                        </Space>
                                    ) : '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label="账户状态">
                                    <Tag color={(USER_STATUS_MAP[profile.status] || USER_STATUS_MAP['inactive']).tagColor}>
                                        {(USER_STATUS_MAP[profile.status] || USER_STATUS_MAP['inactive']).label}
                                    </Tag>
                                </Descriptions.Item>
                            </Descriptions>
                        </Card>

                        {/* 角色与权限 */}
                        <Card title="角色与权限" styles={{ body: { padding: 0 } }}>
                            {/* ── 身份信息 ── */}
                            <div style={{ padding: '16px 20px', borderBottom: '1px solid #f0f0f0' }}>
                                <Descriptions column={2} colon={false}
                                    labelStyle={{ color: '#8c8c8c', width: 90 }}>
                                    <Descriptions.Item label="身份类型">
                                        {profile.is_platform_admin
                                            ? <Tag color="purple" icon={<CrownOutlined />}>平台管理员</Tag>
                                            : <Tag color="blue" icon={<AppstoreOutlined />}>租户用户</Tag>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={profile.is_platform_admin ? '管理范围' : '所属租户'}>
                                        {profile.is_platform_admin
                                            ? <Text type="secondary">全局平台</Text>
                                            : tenantName
                                                ? <Tag>{tenantName}</Tag>
                                                : <Text type="secondary">-</Text>}
                                    </Descriptions.Item>
                                    <Descriptions.Item label="角色" span={2}>
                                        <Space size={4} wrap>
                                            {profile.roles.map(r => (
                                                <Tag key={r.id} color={r.is_system ? 'blue' : 'default'}
                                                    icon={r.is_system ? <CrownOutlined /> : <SafetyOutlined />}>
                                                    {r.display_name || r.name}{r.is_system ? '（系统）' : ''}
                                                </Tag>
                                            ))}
                                        </Space>
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>

                            {/* ── 功能权限 ── */}
                            <div style={{ padding: '16px 20px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                                    <Text strong style={{ fontSize: 13 }}>
                                        <SafetyOutlined style={{ marginRight: 6, color: '#8c8c8c' }} />功能权限
                                    </Text>
                                    {!isSuperAdmin && (
                                        <Text type="secondary" style={{ fontSize: 12 }}>
                                            共 {profile.permissions.length} 项 · {Object.keys(groupPermissions(profile.permissions)).length} 个模块
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

                    {/* 右列 */}
                    <Col span={8}>
                        {/* 最近登录 */}
                        <Card title={<><LoginOutlined style={{ marginRight: 6 }} />最近登录</>} style={{ marginBottom: 16 }}
                            styles={{ body: { padding: '4px 16px' } }}>
                            {loginLogs.length > 0 ? (
                                <table className="login-table">
                                    <tbody>
                                        {loginLogs.map((log: any) => {
                                            const isSuccess = log.status === 'success';
                                            const ua = log.user_agent || '';
                                            let DeviceIcon = DesktopOutlined;
                                            if (ua.includes('Mobile') || ua.includes('Android') || ua.includes('iPhone')) DeviceIcon = MobileOutlined;
                                            const isCurl = ua.startsWith('curl');

                                            return (
                                                <tr key={log.id}>
                                                    <td>
                                                        <div className="login-device-icon" style={{
                                                            background: isSuccess ? '#f6ffed' : '#fff1f0',
                                                            color: isSuccess ? '#52c41a' : '#f5222d',
                                                            border: isSuccess ? '1px solid #b7eb8f' : '1px solid #ffa39e'
                                                        }}>
                                                            {isCurl ? <span style={{ fontSize: 8, fontWeight: 700 }}>CMD</span> : <DeviceIcon />}
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <span className="login-device-text">{parseUA(ua)}</span>
                                                    </td>
                                                    <td>
                                                        <span className="login-ip">{log.ip_address}</span>
                                                        <span className="login-result" style={{
                                                            color: isSuccess ? '#52c41a' : '#f5222d',
                                                            marginLeft: 4,
                                                        }}>
                                                            · {isSuccess ? '成功' : '失败'}
                                                        </span>
                                                    </td>
                                                    <td className="login-time">
                                                        {dayjs(log.created_at).format('MM-DD HH:mm')}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            ) : <div className="empty-state">暂无登录记录</div>}
                        </Card>

                        {/* 操作日志 */}
                        <Card title={<><HistoryOutlined style={{ marginRight: 6 }} />操作日志</>}
                            styles={{ body: { padding: '4px 16px' } }}>
                            {opLogs.length > 0 ? (
                                <ul className="op-timeline">
                                    {opLogs.map((log: any) => {
                                        const { action, resource, color } = describeActivity(log);
                                        return (
                                            <li key={log.id}>
                                                <span className="op-dot" style={{ background: color }} />
                                                <span className="op-main">
                                                    <strong style={{ marginRight: 4 }}>{profile.display_name || profile.username}</strong>
                                                    <span className="op-action">{action}</span>
                                                    {resource && <span className="op-resource">{resource}</span>}
                                                </span>
                                                <span className="op-time">{dayjs(log.created_at).format('MM-DD HH:mm')}</span>
                                            </li>
                                        );
                                    })}
                                </ul>
                            ) : <div className="empty-state">暂无操作记录</div>}
                        </Card>
                    </Col>
                </Row >
            </div >

            {/* ── 修改密码弹窗 ── */}
            < Modal title="修改密码" open={pwdOpen} onCancel={() => setPwdOpen(false)} onOk={handlePwd} destroyOnHidden >
                <Form form={pwdForm} layout="vertical" style={{ marginTop: 16 }}>
                    <Form.Item name="old_password" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
                        <Input.Password placeholder="请输入当前密码" />
                    </Form.Item>
                    <Form.Item name="new_password" label="新密码" rules={[{ required: true, min: 8, message: '密码至少8位' }]}>
                        <Input.Password placeholder="请输入新密码（至少8位）" />
                    </Form.Item>
                    <Form.Item name="confirm_password" label="确认密码" dependencies={['new_password']}
                        rules={[{ required: true, message: '请确认新密码' },
                        ({ getFieldValue }) => ({ validator(_, v) { return !v || getFieldValue('new_password') === v ? Promise.resolve() : Promise.reject(new Error('两次密码不一致')); } }),
                        ]}>
                        <Input.Password placeholder="请再次输入新密码" />
                    </Form.Item>
                </Form>
            </Modal >
        </div >
    );
};

export default ProfilePage;
