import React from 'react';
import { history } from '@umijs/max';
import { Alert, Button, Form, Input, Modal, Select, Space, Typography } from 'antd';
import { getIncidentSolutionTemplates } from '@/services/auto-healing/incidentSolutionTemplates';
import { solutionTemplateSummary } from '@/pages/incidents/solution-templates/solutionTemplateHelpers';

type FlowClosePolicyModalProps = {
  onCancel: () => void;
  onSubmit: (value: AutoHealing.FlowClosePolicy) => void;
  open: boolean;
  value?: AutoHealing.FlowClosePolicy;
};

type ClosePolicyFormValues = {
  default_close_code?: string;
  default_close_status?: 'closed' | 'resolved';
  solution_template_id?: string;
  trigger_on?: 'flow_success';
};

const statusOptions = [
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];

const triggerOptions = [
  { value: 'flow_success', label: '流程成功完成后' },
];

const FlowClosePolicyModal: React.FC<FlowClosePolicyModalProps> = ({
  onCancel,
  onSubmit,
  open,
  value,
}) => {
  const [form] = Form.useForm<ClosePolicyFormValues>();
  const [templates, setTemplates] = React.useState<AutoHealing.IncidentSolutionTemplate[]>([]);
  const [loading, setLoading] = React.useState(false);
  const selectedTemplateId = Form.useWatch('solution_template_id', form);
  const selectedTemplate = React.useMemo(
    () => templates.find((item) => item.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    setLoading(true);
    form.setFieldsValue({
      default_close_code: value?.default_close_code || 'auto_healed',
      default_close_status: value?.default_close_status || 'resolved',
      solution_template_id: value?.solution_template_id,
      trigger_on: value?.trigger_on || 'flow_success',
    });
    void getIncidentSolutionTemplates()
      .then((items) => {
        if (active) {
          setTemplates(items);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [form, open, value?.default_close_code, value?.default_close_status, value?.solution_template_id, value?.trigger_on]);

  return (
    <Modal
      title="自动关单策略"
      open={open}
      onCancel={onCancel}
      okText="应用配置"
      cancelText="取消"
      destroyOnHidden
      width={720}
      onOk={async () => {
        const values = await form.validateFields();
        onSubmit({
          default_close_code: values.default_close_code,
          default_close_status: values.default_close_status,
          enabled: true,
          solution_template_id: values.solution_template_id,
          trigger_on: values.trigger_on,
        });
      }}
    >
      <Form form={form} layout="vertical" initialValues={{ trigger_on: 'flow_success', default_close_status: 'resolved', default_close_code: 'auto_healed' }}>
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
          message="自动关单会在 Flow 成功收口后统一触发"
          description="流程中的执行节点只负责产出运行事实，真正写回源工单的内容由这里绑定的解决方案模板统一生成。"
        />
        <Form.Item
          name="solution_template_id"
          label="解决方案模板"
          rules={[{ required: true, message: '请选择解决方案模板' }]}
          extra={(
            <Space size={8}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                推荐为每个自动关单流程绑定一个明确的模板，避免不同执行路径下语义不一致。
              </Typography.Text>
              <Button type="link" size="small" style={{ paddingInline: 0 }} onClick={() => history.push('/resources/incident-solution-templates')}>
                管理模板
              </Button>
            </Space>
          )}
        >
          <Select
            showSearch
            loading={loading}
            options={templates.map((template) => ({
              label: template.name,
              value: template.id,
            }))}
            optionFilterProp="label"
            placeholder="选择自动关单使用的解决方案模板"
            onChange={(templateId) => {
              const template = templates.find((item) => item.id === templateId);
              if (!template) {
                return;
              }
              form.setFieldsValue({
                default_close_code: template.default_close_code || form.getFieldValue('default_close_code'),
                default_close_status: (template.default_close_status as 'resolved' | 'closed' | undefined) || form.getFieldValue('default_close_status'),
              });
            }}
          />
        </Form.Item>
        {selectedTemplate ? (
          <Alert
            type="success"
            showIcon
            style={{ marginBottom: 16 }}
            message={selectedTemplate.name}
            description={selectedTemplate.description || solutionTemplateSummary(selectedTemplate) || '该模板会使用 flow.*、execution.*、incident.* 等上下文变量自动生成回写内容。'}
          />
        ) : null}
        <Space size={16} style={{ display: 'flex' }} align="start">
          <Form.Item name="trigger_on" label="触发时机" style={{ flex: 1 }}>
            <Select options={triggerOptions} />
          </Form.Item>
          <Form.Item name="default_close_status" label="默认关闭状态" style={{ flex: 1 }}>
            <Select options={statusOptions} />
          </Form.Item>
        </Space>
        <Form.Item name="default_close_code" label="默认关闭码">
          <Input placeholder="例如：auto_healed" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default FlowClosePolicyModal;
