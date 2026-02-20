import React, { useState, useEffect, useCallback } from 'react';
import { useAccess } from '@umijs/max';
import { Form, Input, Button, Select, Radio, message, Space, Tag, Typography } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import StandardTable from '@/components/StandardTable';
import type { StandardColumnDef } from '@/components/StandardTable';
import RichTextEditor from '@/components/RichTextEditor';
import {
    getSiteMessageCategories,
    createSiteMessage,
} from '@/services/auto-healing/platform/messages';
import { getTenants } from '@/services/auto-healing/platform/tenants';
import { getSiteMessages } from '@/services/auto-healing/siteMessage';
import type { SiteMessageCategory } from '@/services/auto-healing/platform/messages';
import type { SiteMessage } from '@/services/auto-healing/siteMessage';
import dayjs from 'dayjs';
const { Text } = Typography;

/**
 * 平台站内信发送页面
 * 平台管理员专用 - 发送全平台站内信 + 历史消息管理
 */
const PlatformMessagesPage: React.FC = () => {
    const access = useAccess();
    const [form] = Form.useForm();
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<SiteMessageCategory[]>([]);
    const [categoriesLoading, setCategoriesLoading] = useState(true);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [activeTab, setActiveTab] = useState('send');
    const [sendTarget, setSendTarget] = useState<'all' | 'selected'>('all');
    const [tenants, setTenants] = useState<{ label: string; value: string }[]>([]);
    const [tenantsLoading, setTenantsLoading] = useState(false);

    // 分类 value → label 映射
    const [categoryMap, setCategoryMap] = useState<Record<string, string>>({});

    // 加载分类枚举
    useEffect(() => {
        setCategoriesLoading(true);
        getSiteMessageCategories()
            .then((res) => {
                const cats = res?.data || [];
                setCategories(cats);
                const map: Record<string, string> = {};
                cats.forEach((c) => { map[c.value] = c.label; });
                setCategoryMap(map);
            })
            .catch(() => {
                message.error('加载消息分类失败');
            })
            .finally(() => setCategoriesLoading(false));
    }, []);

    // 加载租户列表
    useEffect(() => {
        setTenantsLoading(true);
        getTenants({ page: 1, page_size: 200 })
            .then((res) => {
                const items = res?.data || [];
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
            setRefreshTrigger((n) => n + 1);
            window.dispatchEvent(new Event('site-messages:new'));
        } catch {
            message.error('消息发送失败');
        } finally {
            setSubmitting(false);
        }
    };

    // 消息列表请求
    const handleRequest = useCallback(async (params: {
        page: number;
        pageSize: number;
        searchField?: string;
        searchValue?: string;
        advancedSearch?: Record<string, any>;
        sorter?: { field: string; order: 'ascend' | 'descend' };
    }) => {
        const apiParams: any = {
            page: params.page,
            page_size: params.pageSize,
        };
        if (params.searchValue) {
            apiParams.keyword = params.searchValue;
        }
        if (params.advancedSearch) {
            if (params.advancedSearch.category) {
                apiParams.category = params.advancedSearch.category;
            }
        }
        if (params.sorter) {
            apiParams.sort = params.sorter.field;
            apiParams.order = params.sorter.order === 'ascend' ? 'asc' : 'desc';
        }
        const res = await getSiteMessages(apiParams);
        return { data: res?.data || [], total: res?.total ?? 0 };
    }, []);

    // 消息列表列定义
    const columns: StandardColumnDef<SiteMessage>[] = [
        {
            columnKey: 'category',
            columnTitle: '分类',
            dataIndex: 'category',
            width: 120,
            render: (_: any, record: SiteMessage) => (
                <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>
                    {categoryMap[record.category] || record.category}
                </Tag>
            ),
        },
        {
            columnKey: 'title',
            columnTitle: '标题',
            dataIndex: 'title',
            fixedColumn: true,
            width: 200,
            ellipsis: true,
        },
        {
            columnKey: 'content',
            columnTitle: '内容摘要',
            dataIndex: 'content',
            ellipsis: true,
            render: (_: any, record: SiteMessage) => {
                const text = record.content.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
                return (
                    <Text type="secondary" style={{ fontSize: 12 }}>
                        {text.length > 50 ? text.substring(0, 50) + '…' : text}
                    </Text>
                );
            },
        },
        {
            columnKey: 'created_at',
            columnTitle: '发送时间',
            dataIndex: 'created_at',
            width: 160,
            sorter: true,
            render: (_: any, record: SiteMessage) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {dayjs(record.created_at).format('YYYY-MM-DD HH:mm')}
                </Text>
            ),
        },
        {
            columnKey: 'expires_at',
            columnTitle: '过期时间',
            dataIndex: 'expires_at',
            width: 120,
            render: (_: any, record: SiteMessage) => (
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {record.expires_at ? dayjs(record.expires_at).format('YYYY-MM-DD') : '-'}
                </Text>
            ),
        },
    ];

    const headerIcon = (
        <svg viewBox="0 0 48 48" fill="none">
            <path d="M6 10h36v24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10z" stroke="currentColor" strokeWidth="2" fill="none" />
            <path d="M6 10l18 14L42 10" stroke="currentColor" strokeWidth="2" fill="none" />
        </svg>
    );

    // "发送消息" tab → 用 StandardTable children 模式
    if (activeTab === 'send') {
        return (
            <StandardTable<any>
                key="send"
                tabs={[
                    { key: 'send', label: '发送消息' },
                    { key: 'history', label: '历史消息' },
                ]}
                activeTab={activeTab}
                onTabChange={setActiveTab}
                title="平台消息"
                description="向全平台用户发送站内信通知，支持系统更新、故障通知、安全公告等分类。"
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
    }

    // "历史消息" tab → 用 StandardTable request 模式（完整表格 + 后端分页）
    return (
        <StandardTable<SiteMessage>
            key="history"
            tabs={[
                { key: 'send', label: '发送消息' },
                { key: 'history', label: '历史消息' },
            ]}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            title="平台消息"
            description="向全平台用户发送站内信通知，支持系统更新、故障通知、安全公告等分类。"
            headerIcon={headerIcon}
            columns={columns}
            rowKey="id"
            request={handleRequest}
            defaultPageSize={20}
            preferenceKey="platform_messages"
            refreshTrigger={refreshTrigger}
            searchFields={[
                { key: 'keyword', label: '关键字' },
                { key: '__enum__category', label: '分类', options: categories.map(c => ({ label: c.label, value: c.value })) },
            ]}
        />
    );
};

export default PlatformMessagesPage;
