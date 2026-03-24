import React, { useState, useEffect } from 'react';
import { useAccess } from '@umijs/max';
import { Form, Input, Button, Select, Radio, message, Space, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import RichTextEditor from '@/components/RichTextEditor';
import {
    getSiteMessageCategories,
    createSiteMessage,
} from '@/services/auto-healing/platform/messages';
import { getTenants } from '@/services/auto-healing/platform/tenants';
import type { SiteMessageCategory } from '@/services/auto-healing/platform/messages';
import { fetchAllPages } from '@/utils/fetchAllPages';
const { Text } = Typography;

/**
 * 平台站内信发送页面
 * 平台管理员专用 - 发送全平台站内信
 */
const PlatformMessagesPage: React.FC = () => {
    const access = useAccess();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<SiteMessageCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [sendTarget, setSendTarget] = useState<'all' | 'selected'>('all');
    const [tenants, setTenants] = useState<{ label: string; value: string }[]>([]);
    const [tenantsLoading, setTenantsLoading] = useState(false);

    // 加载分类枚举
    useEffect(() => {
        setCategoriesLoading(true);
        getSiteMessageCategories()
            .then((res) => {
                const cats = res?.data || [];
                setCategories(cats);
            })
            .catch(() => {
                /* global error handler */
            })
            .finally(() => setCategoriesLoading(false));
    }, []);

    // 加载租户列表
    useEffect(() => {
        setTenantsLoading(true);
        fetchAllPages<any>((page, pageSize) => getTenants({ page, page_size: pageSize }))
            .then((items) => {
                setTenants(items.map((t: any) => ({ label: t.name, value: t.id })));
            })
            .catch(() => { })
            .finally(() => setTenantsLoading(false));
    }, []);

    // 提交表单
    const handleSubmit = async (values: any) => {
        setSubmitting(true);
        try {
            const params: any = {
                category: values.category,
                title: values.title,
                content: values.content,
            };
            if (sendTarget === 'selected' && values.target_tenant_ids?.length) {
                params.target_tenant_ids = values.target_tenant_ids;
            }
            await createSiteMessage(params);
            message.success('消息发送成功');
            form.resetFields();
            setSendTarget('all');
            window.dispatchEvent(new Event('site-messages:new'));
        } catch {
            /* global error handler */
        } finally {
            setSubmitting(false);
        }
    };

    const headerIcon = (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M6 10h36v24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M6 10l18 14L42 10" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );

    return (
        <StandardTable<any>
            title="平台消息"
            description="向全平台用户发送站内信通知，支持系统更新、故障通知、安全公告等分类。当前前端仅暴露后端已支持的发送能力。"
            headerIcon={headerIcon}
        >
            <div style={{ padding: '24px', maxWidth: 800 }}>
                <div style={{ marginBottom: 20 }}>
                    <Text type="secondary" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
                        发送新消息
                    </Text>
                </div>

                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                >
                    <Form.Item name="category" label="消息分类" rules={[{ required: true, message: '请选择消息分类' }]}>
                        <Select
                            placeholder="请选择消息分类"
                            loading={categoriesLoading}
                            options={categories.map((c) => ({ label: c.label, value: c.value }))}
                            style={{ width: 240 }}
                        />
                    </Form.Item>

                    <Form.Item label="发送范围">
                        <Radio.Group
                            value={sendTarget}
                            onChange={(e) => {
                                setSendTarget(e.target.value);
                                if (e.target.value === 'all') {
                                    form.setFieldValue('target_tenant_ids', undefined);
                                }
                            }}
                        >
                            <Radio value="all">全部租户</Radio>
                            <Radio value="selected">指定租户</Radio>
                        </Radio.Group>
                    </Form.Item>

                    {sendTarget === 'selected' && (
                        <Form.Item
                            name="target_tenant_ids"
                            label="选择租户"
                            rules={[{ required: true, message: '请选择至少一个租户' }]}
                        >
                            <Select
                                mode="multiple"
                                placeholder="请选择目标租户"
                                loading={tenantsLoading}
                                options={tenants}
                                optionFilterProp="label"
                                style={{ maxWidth: 500 }}
                            />
                        </Form.Item>
                    )}

                    <Form.Item
                        name="title"
                        label="消息标题"
                        rules={[{ required: true, message: '请输入消息标题' }]}
                    >
                        <Input placeholder="请输入消息标题" />
                    </Form.Item>

                    <Form.Item
                        name="content"
                        label="消息内容"
                        rules={[{ required: true, message: '请输入消息内容' }]}
                    >
                        <RichTextEditor placeholder="请输入消息内容，支持富文本格式…" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0 }}>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                icon={<SendOutlined />}
                                loading={submitting}
                                disabled={!access.canSendPlatformMessage}
                            >
                                发送消息
                            </Button>
                            <Button onClick={() => form.resetFields()}>重置</Button>
                            {!access.canSendPlatformMessage && (
                                <Text type="warning" style={{ fontSize: 12 }}>您没有发送站内信的权限</Text>
                            )}
                        </Space>
                    </Form.Item>
                </Form>
            </div>
        </StandardTable>
    );
};

export default PlatformMessagesPage;
