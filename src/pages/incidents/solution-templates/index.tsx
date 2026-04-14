import React, { useCallback, useMemo, useState } from 'react';
import { DeleteOutlined, EditOutlined, FileTextOutlined, PlusOutlined } from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import { Button, Form, Input, message, Modal, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import StandardTable, { type StandardColumnDef } from '@/components/StandardTable';
import {
  createIncidentSolutionTemplate,
  deleteIncidentSolutionTemplate,
  getIncidentSolutionTemplates,
  updateIncidentSolutionTemplate,
} from '@/services/auto-healing/incidentSolutionTemplates';

type TemplateFormValues = AutoHealing.CreateIncidentSolutionTemplateRequest;

const statusOptions = [
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];

const headerIcon = <FileTextOutlined style={{ color: '#1677ff' }} />;

const SolutionTemplatePage: React.FC = () => {
  const access = useAccess();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [editingTemplate, setEditingTemplate] = useState<AutoHealing.IncidentSolutionTemplate | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form] = Form.useForm<TemplateFormValues>();

  const triggerRefresh = useCallback(() => setRefreshTrigger((value) => value + 1), []);

  const handleCreate = useCallback(() => {
    setEditingTemplate(null);
    form.resetFields();
    form.setFieldsValue({ default_close_status: 'resolved', default_close_code: 'auto_healed' });
    setModalOpen(true);
  }, [form]);

  const handleEdit = useCallback((record: AutoHealing.IncidentSolutionTemplate) => {
    setEditingTemplate(record);
    form.setFieldsValue({
      name: record.name,
      description: record.description,
      resolution_template: record.resolution_template,
      work_notes_template: record.work_notes_template,
      default_close_code: record.default_close_code,
      default_close_status: (record.default_close_status as 'resolved' | 'closed' | undefined) || 'resolved',
    });
    setModalOpen(true);
  }, [form]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteIncidentSolutionTemplate(id);
    message.success('模板已删除');
    triggerRefresh();
  }, [triggerRefresh]);

  const columns = useMemo<StandardColumnDef<AutoHealing.IncidentSolutionTemplate>[]>(() => [
    {
      columnKey: 'name',
      columnTitle: '模板名称',
      title: '模板名称',
      dataIndex: 'name',
      width: 220,
      render: (value: string, record) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Typography.Text strong>{value}</Typography.Text>
          {record.description ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {record.description}
            </Typography.Text>
          ) : null}
        </div>
      ),
    },
    {
      columnKey: 'defaults',
      columnTitle: '默认关单策略',
      title: '默认关单策略',
      key: 'defaults',
      width: 220,
      render: (_, record) => (
        <Space size={[6, 6]} wrap>
          <Tag color="blue">{record.default_close_status || 'resolved'}</Tag>
          {record.default_close_code ? <Tag>{record.default_close_code}</Tag> : null}
        </Space>
      ),
    },
    {
      columnKey: 'resolution_template',
      columnTitle: '解决结论模板',
      title: '解决结论模板',
      dataIndex: 'resolution_template',
      ellipsis: true,
    },
    {
      columnKey: 'work_notes_template',
      columnTitle: '回写过程模板',
      title: '回写过程模板',
      dataIndex: 'work_notes_template',
      ellipsis: true,
    },
    {
      columnKey: 'actions',
      columnTitle: '操作',
      title: '操作',
      key: 'actions',
      width: 140,
      render: (_value, record) => (
        <Space size={8}>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
            disabled={!access.canUpdatePlugin}
          >
            编辑
          </Button>
          <Popconfirm
            title="删除模板"
            description="删除后将无法继续被 Flow 或手动关单引用。"
            okText="删除"
            cancelText="取消"
            onConfirm={() => void handleDelete(record.id)}
            disabled={!access.canDeletePlugin}
          >
            <Button size="small" danger icon={<DeleteOutlined />} disabled={!access.canDeletePlugin}>
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ], [access.canDeletePlugin, access.canUpdatePlugin, handleDelete, handleEdit]);

  const handleRequest = useCallback(async () => {
    const data = await getIncidentSolutionTemplates();
    return {
      data,
      total: data.length,
    };
  }, []);

  return (
    <>
      <StandardTable<AutoHealing.IncidentSolutionTemplate>
        refreshTrigger={refreshTrigger}
        tabs={[{ key: 'templates', label: '关单模板' }]}
        title="关单模板"
        description="统一管理工单关闭回写的解决方案模板，供手动关单和 Flow 自动关单复用。"
        headerIcon={headerIcon}
        columns={columns}
        rowKey="id"
        request={handleRequest}
        defaultPageSize={20}
        primaryActionLabel="新建模板"
        primaryActionIcon={<PlusOutlined />}
        primaryActionDisabled={!access.canCreatePlugin}
        onPrimaryAction={handleCreate}
        preferenceKey="incident_solution_templates_v1"
      />

      <Modal
        title={editingTemplate ? '编辑关单模板' : '新建关单模板'}
        open={modalOpen}
        onCancel={() => {
          setModalOpen(false);
          setEditingTemplate(null);
          form.resetFields();
        }}
        okText={editingTemplate ? '保存' : '创建'}
        cancelText="取消"
        confirmLoading={saving}
        destroyOnHidden
        width={760}
        onOk={async () => {
          const values = await form.validateFields();
          setSaving(true);
          try {
            if (editingTemplate) {
              await updateIncidentSolutionTemplate(editingTemplate.id, values);
              message.success('模板已更新');
            } else {
              await createIncidentSolutionTemplate(values);
              message.success('模板已创建');
            }
            setModalOpen(false);
            setEditingTemplate(null);
            form.resetFields();
            triggerRefresh();
          } finally {
            setSaving(false);
          }
        }}
      >
        <Form form={form} layout="vertical" initialValues={{ default_close_status: 'resolved', default_close_code: 'auto_healed' }}>
          <Form.Item
            name="name"
            label="模板名称"
            rules={[{ required: true, message: '请输入模板名称' }]}
          >
            <Input placeholder="例如：自动修复成功关闭模板" />
          </Form.Item>
          <Form.Item name="description" label="模板描述">
            <Input.TextArea rows={2} placeholder="简要说明该模板适用于什么场景" />
          </Form.Item>
          <Space size={16} style={{ display: 'flex' }} align="start">
            <Form.Item name="default_close_status" label="默认关闭状态" style={{ flex: 1 }}>
              <Select options={statusOptions} />
            </Form.Item>
            <Form.Item name="default_close_code" label="默认关闭码" style={{ flex: 1 }}>
              <Input placeholder="例如：auto_healed" />
            </Form.Item>
          </Space>
          <Form.Item
            name="resolution_template"
            label="解决结论模板"
            extra="支持 {{ incident.title }}、{{ flow.name }}、{{ execution.run_id }} 这类变量。"
            rules={[{ required: true, message: '请输入解决结论模板' }]}
          >
            <Input.TextArea rows={4} placeholder="例如：AHS 已完成处理：{{ incident.title }}" />
          </Form.Item>
          <Form.Item
            name="work_notes_template"
            label="回写过程模板"
            extra="建议描述处理动作、执行结果和验证结果。"
            rules={[{ required: true, message: '请输入回写过程模板' }]}
          >
            <Input.TextArea rows={6} placeholder="例如：流程={{ flow.name }}；run={{ execution.run_id }}；结果={{ execution.message }}" />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default SolutionTemplatePage;
