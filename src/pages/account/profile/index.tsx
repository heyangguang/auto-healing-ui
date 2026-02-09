import React, { useState, useEffect } from 'react';
import { PageContainer } from '@ant-design/pro-components';
import {
    Card, Descriptions, Tag, Space, Button, Form, Input, message,
    Modal, Typography, Row, Col, Skeleton, Divider, Avatar,
} from 'antd';
import {
    UserOutlined, MailOutlined, PhoneOutlined, KeyOutlined,
    ClockCircleOutlined, SafetyOutlined, EditOutlined,
    EnvironmentOutlined,
} from '@ant-design/icons';
import { getProfile, updateProfile, changePassword } from '@/services/auto-healing/auth';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ProfilePage: React.FC = () => {
    const [profile, setProfile] = useState<AutoHealing.UserProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [editInfoOpen, setEditInfoOpen] = useState(false);
    const [changePwdOpen, setChangePwdOpen] = useState(false);
    const [editForm] = Form.useForm();
    const [pwdForm] = Form.useForm();

    const loadProfile = async () => {
        setLoading(true);
        try {
            const res = await getProfile();
            setProfile(res?.data);
        } catch {
            message.error('获取个人信息失败');
        }
        setLoading(false);
    };

    useEffect(() => {
        loadProfile();
    }, []);

    if (loading) {
        return (
            <PageContainer title="个人中心">
                <Card><Skeleton active paragraph={{ rows: 8 }} /></Card>
            </PageContainer>
        );
    }

    if (!profile) {
        return (
            <PageContainer title="个人中心">
                <Card>无法加载用户信息</Card>
            </PageContainer>
        );
    }

    return (
        <PageContainer title="个人中心" subTitle="查看和管理您的个人信息">
            <Row gutter={[16, 16]}>
                {/* 左侧 - 用户信息卡片 */}
                <Col xs={24} md={8}>
                    <Card>
                        <div style={{ textAlign: 'center', marginBottom: 24 }}>
                            <Avatar
                                size={80}
                                icon={<UserOutlined />}
                                src={profile.avatar_url || undefined}
                                style={{ backgroundColor: '#1890ff', marginBottom: 12 }}
                            />
                            <Title level={4} style={{ marginBottom: 4 }}>{profile.display_name || profile.username}</Title>
                            <Text type="secondary">@{profile.username}</Text>
                            <div style={{ marginTop: 12 }}>
                                <Space wrap>
                                    {profile.roles.map(role => (
                                        <Tag key={role.id} color={role.is_system ? 'blue' : 'default'} icon={<SafetyOutlined />}>
                                            {role.display_name || role.name}
                                        </Tag>
                                    ))}
                                </Space>
                            </div>
                        </div>
                        <Divider />
                        <Space direction="vertical" size={12} style={{ width: '100%' }}>
                            <Space>
                                <MailOutlined style={{ color: '#8c8c8c' }} />
                                <Text>{profile.email || '未设置'}</Text>
                            </Space>
                            <Space>
                                <PhoneOutlined style={{ color: '#8c8c8c' }} />
                                <Text>{profile.phone || '未设置'}</Text>
                            </Space>
                            <Space>
                                <ClockCircleOutlined style={{ color: '#8c8c8c' }} />
                                <Text>注册于 {dayjs(profile.created_at).format('YYYY-MM-DD')}</Text>
                            </Space>
                            {profile.last_login_at && (
                                <Space>
                                    <EnvironmentOutlined style={{ color: '#8c8c8c' }} />
                                    <Text type="secondary">
                                        上次登录: {dayjs(profile.last_login_at).format('MM-DD HH:mm')}
                                        {profile.last_login_ip && ` (${profile.last_login_ip})`}
                                    </Text>
                                </Space>
                            )}
                        </Space>
                        <Divider dashed />
                        <Space style={{ width: '100%', justifyContent: 'center' }}>
                            <Button
                                icon={<EditOutlined />}
                                onClick={() => {
                                    editForm.setFieldsValue({
                                        display_name: profile.display_name,
                                        email: profile.email,
                                        phone: profile.phone,
                                    });
                                    setEditInfoOpen(true);
                                }}
                            >
                                编辑信息
                            </Button>
                            <Button
                                icon={<KeyOutlined />}
                                onClick={() => {
                                    pwdForm.resetFields();
                                    setChangePwdOpen(true);
                                }}
                            >
                                修改密码
                            </Button>
                        </Space>
                    </Card>
                </Col>

                {/* 右侧 - 详细信息 */}
                <Col xs={24} md={16}>
                    <Card title="账户信息" style={{ marginBottom: 16 }}>
                        <Descriptions column={{ xs: 1, sm: 2 }} bordered size="small">
                            <Descriptions.Item label="用户名">{profile.username}</Descriptions.Item>
                            <Descriptions.Item label="状态">
                                <Tag color={profile.status === 'active' ? 'green' : 'default'}>
                                    {profile.status === 'active' ? '启用' : '禁用'}
                                </Tag>
                            </Descriptions.Item>
                            <Descriptions.Item label="邮箱">{profile.email}</Descriptions.Item>
                            <Descriptions.Item label="手机">{profile.phone || '-'}</Descriptions.Item>
                            <Descriptions.Item label="注册时间">
                                {dayjs(profile.created_at).format('YYYY-MM-DD HH:mm:ss')}
                            </Descriptions.Item>
                            <Descriptions.Item label="密码更新时间">
                                {profile.password_changed_at
                                    ? dayjs(profile.password_changed_at).format('YYYY-MM-DD HH:mm')
                                    : '-'}
                            </Descriptions.Item>
                            <Descriptions.Item label="上次登录">
                                {profile.last_login_at
                                    ? dayjs(profile.last_login_at).format('YYYY-MM-DD HH:mm:ss')
                                    : '从未登录'}
                            </Descriptions.Item>
                            <Descriptions.Item label="登录IP">
                                {profile.last_login_ip || '-'}
                            </Descriptions.Item>
                        </Descriptions>
                    </Card>

                    <Card title="角色与权限">
                        <div style={{ marginBottom: 16 }}>
                            <Text strong>角色：</Text>
                            <Space wrap style={{ marginLeft: 8 }}>
                                {profile.roles.map(role => (
                                    <Tag key={role.id} color="blue">{role.display_name || role.name}</Tag>
                                ))}
                            </Space>
                        </div>
                        <Divider dashed style={{ margin: '12px 0' }} />
                        <div>
                            <Text strong>权限：</Text>
                            {profile.permissions.includes('*') ? (
                                <Tag color="gold" style={{ marginLeft: 8 }}>超级管理员（所有权限）</Tag>
                            ) : (
                                <div style={{ marginTop: 8 }}>
                                    <Space size={[4, 4]} wrap>
                                        {profile.permissions.map(perm => (
                                            <Tag key={perm} color="green">{perm}</Tag>
                                        ))}
                                    </Space>
                                </div>
                            )}
                        </div>
                    </Card>
                </Col>
            </Row>

            {/* 编辑信息弹窗 */}
            <Modal
                title="编辑个人信息"
                open={editInfoOpen}
                onCancel={() => setEditInfoOpen(false)}
                onOk={async () => {
                    const values = await editForm.validateFields();
                    try {
                        await updateProfile(values);
                        message.success('更新成功');
                        setEditInfoOpen(false);
                        loadProfile();
                    } catch {
                        message.error('更新失败');
                    }
                }}
                destroyOnClose
            >
                <Form form={editForm} layout="vertical">
                    <Form.Item name="display_name" label="显示名称">
                        <Input placeholder="请输入显示名称" />
                    </Form.Item>
                    <Form.Item name="email" label="邮箱" rules={[{ type: 'email', message: '请输入有效邮箱' }]}>
                        <Input placeholder="请输入邮箱" />
                    </Form.Item>
                    <Form.Item name="phone" label="手机号">
                        <Input placeholder="请输入手机号" />
                    </Form.Item>
                </Form>
            </Modal>

            {/* 修改密码弹窗 */}
            <Modal
                title="修改密码"
                open={changePwdOpen}
                onCancel={() => setChangePwdOpen(false)}
                onOk={async () => {
                    const values = await pwdForm.validateFields();
                    try {
                        await changePassword(values);
                        message.success('密码修改成功');
                        setChangePwdOpen(false);
                    } catch (e: any) {
                        message.error(e?.message || '修改失败');
                    }
                }}
                destroyOnClose
            >
                <Form form={pwdForm} layout="vertical">
                    <Form.Item name="old_password" label="当前密码" rules={[{ required: true, message: '请输入当前密码' }]}>
                        <Input.Password placeholder="请输入当前密码" />
                    </Form.Item>
                    <Form.Item name="new_password" label="新密码" rules={[{ required: true, min: 8, message: '密码至少8位' }]}>
                        <Input.Password placeholder="请输入新密码（至少8位）" />
                    </Form.Item>
                    <Form.Item
                        name="confirm_password"
                        label="确认密码"
                        dependencies={['new_password']}
                        rules={[
                            { required: true, message: '请确认新密码' },
                            ({ getFieldValue }) => ({
                                validator(_, value) {
                                    if (!value || getFieldValue('new_password') === value) {
                                        return Promise.resolve();
                                    }
                                    return Promise.reject(new Error('两次密码不一致'));
                                },
                            }),
                        ]}
                    >
                        <Input.Password placeholder="请再次输入新密码" />
                    </Form.Item>
                </Form>
            </Modal>
        </PageContainer>
    );
};

export default ProfilePage;
