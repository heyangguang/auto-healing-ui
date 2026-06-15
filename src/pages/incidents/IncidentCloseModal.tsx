import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Form,
  Input,
  Modal,
  Select,
  Space,
  Typography,
} from 'antd';
import React from 'react';
import { getIncidentSolutionTemplates } from '@/services/auto-healing/incidentSolutionTemplates';
import {
  renderTemplate,
  solutionTemplateSummary,
} from './solution-templates/solutionTemplateHelpers';

type IncidentCloseModalProps = {
  incident?: AutoHealing.Incident | null;
  loading: boolean;
  onCancel: () => void;
  onSubmit: (values: AutoHealing.CloseIncidentRequest) => Promise<void>;
  open: boolean;
};

type CloseModalFormValues = {
  close_code?: string;
  close_status?: 'closed' | 'resolved';
  resolution?: string;
  solution_template_id?: string;
  template_vars_text?: string;
  work_notes?: string;
};

const closeStatusOptions = [
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];

function buildTemplateContext(incident?: AutoHealing.Incident | null) {
  return {
    close_code: 'auto_healed',
    close_status: 'resolved',
    incident: incident || {},
    operator: {
      name: 'manual-close',
    },
    system: {
      timestamp: new Date().toISOString(),
      trigger_source: 'manual_close',
    },
  };
}

function appendTemplateSection(
  lines: string[],
  title: string,
  content?: string,
) {
  if (!content?.trim()) {
    return;
  }
  lines.push(`【${title}】\n${content.trim()}`);
}

export function buildCloseModalTemplateValues(
  template: AutoHealing.IncidentSolutionTemplate,
  incident?: AutoHealing.Incident | null,
): Partial<CloseModalFormValues> {
  const context = buildTemplateContext(incident);
  const resolutionParts: string[] = [];
  const problem = renderTemplate(template.problem_template, context);

  appendTemplateSection(
    resolutionParts,
    '解决方案',
    renderTemplate(template.solution_template, context),
  );
  appendTemplateSection(
    resolutionParts,
    '验证结果',
    renderTemplate(template.verification_template, context),
  );
  appendTemplateSection(
    resolutionParts,
    '最终结论',
    renderTemplate(template.conclusion_template, context),
  );

  return {
    close_code: template.default_close_code || undefined,
    close_status: template.default_close_status as
      | 'resolved'
      | 'closed'
      | undefined,
    resolution: resolutionParts.join('\n\n') || undefined,
    work_notes: problem ? `【问题说明】\n${problem}` : undefined,
  };
}

export const IncidentCloseModal: React.FC<IncidentCloseModalProps> = ({
  incident,
  loading,
  onCancel,
  onSubmit,
  open,
}) => {
  const [form] = Form.useForm<CloseModalFormValues>();
  const [templates, setTemplates] = React.useState<
    AutoHealing.IncidentSolutionTemplate[]
  >([]);
  const [templatesLoading, setTemplatesLoading] = React.useState(false);
  const lastAppliedTemplateValuesRef = React.useRef<
    Partial<CloseModalFormValues>
  >({});
  const selectedTemplateId = Form.useWatch('solution_template_id', form);
  const selectedTemplate = React.useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );

  React.useEffect(() => {
    if (!open) {
      return;
    }
    form.setFieldsValue({
      close_status: form.getFieldValue('close_status') || 'resolved',
      close_code: form.getFieldValue('close_code') || 'auto_healed',
    });
  }, [form, open]);

  React.useEffect(() => {
    if (!open) {
      return;
    }
    let active = true;
    setTemplatesLoading(true);
    void getIncidentSolutionTemplates()
      .then((items) => {
        if (active) {
          setTemplates(items);
        }
      })
      .finally(() => {
        if (active) {
          setTemplatesLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [open]);

  const applyTemplateValues = React.useCallback(
    (template: AutoHealing.IncidentSolutionTemplate) => {
      const nextValues = buildCloseModalTemplateValues(template, incident);
      const previousValues = lastAppliedTemplateValuesRef.current;
      const currentValues = form.getFieldsValue([
        'close_code',
        'close_status',
        'resolution',
        'work_notes',
      ]);
      const patch: Partial<CloseModalFormValues> = {};

      if (
        nextValues.close_code &&
        (!currentValues.close_code ||
          currentValues.close_code === previousValues.close_code)
      ) {
        patch.close_code = nextValues.close_code;
      }
      if (
        nextValues.close_status &&
        (!currentValues.close_status ||
          currentValues.close_status === previousValues.close_status)
      ) {
        patch.close_status = nextValues.close_status;
      }
      if (
        nextValues.resolution &&
        (!currentValues.resolution ||
          currentValues.resolution === previousValues.resolution)
      ) {
        patch.resolution = nextValues.resolution;
      }
      if (
        nextValues.work_notes &&
        (!currentValues.work_notes ||
          currentValues.work_notes === previousValues.work_notes)
      ) {
        patch.work_notes = nextValues.work_notes;
      }

      if (Object.keys(patch).length > 0) {
        form.setFieldsValue(patch);
      }
      lastAppliedTemplateValuesRef.current = nextValues;
    },
    [form, incident],
  );

  return (
    <Modal
      title="关闭工单"
      open={open}
      onCancel={onCancel}
      okText="关闭并回写"
      cancelText="取消"
      confirmLoading={loading}
      destroyOnHidden
      onOk={async () => {
        const values = await form.validateFields();
        let templateVars: AutoHealing.JsonObject | undefined;
        if (values.template_vars_text?.trim()) {
          try {
            const parsed = JSON.parse(values.template_vars_text);
            if (
              !parsed ||
              Array.isArray(parsed) ||
              typeof parsed !== 'object'
            ) {
              throw new Error('模板变量必须是 JSON 对象');
            }
            templateVars = parsed as AutoHealing.JsonObject;
          } catch {
            form.setFields([
              {
                name: 'template_vars_text',
                errors: [
                  '请输入合法的 JSON 对象，例如 {"execution":{"run_id":"run-1"}}',
                ],
              },
            ]);
            return;
          }
        }
        await onSubmit({
          close_code: values.close_code,
          close_status: values.close_status,
          resolution: values.resolution,
          solution_template_id: values.solution_template_id,
          template_vars: templateVars,
          work_notes: values.work_notes,
        });
        form.resetFields();
      }}
      afterOpenChange={(visible) => {
        if (visible) {
          lastAppliedTemplateValuesRef.current = {};
          form.setFieldsValue({
            close_status: 'resolved',
            close_code: 'auto_healed',
          });
          return;
        }
        lastAppliedTemplateValuesRef.current = {};
        form.resetFields();
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ close_status: 'resolved', close_code: 'auto_healed' }}
      >
        <Form.Item
          name="solution_template_id"
          label="解决方案模板"
          extra={
            <Space size={8}>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                选择模板后，未填写的解决说明和处理备注会按模板自动生成
              </Typography.Text>
              <Button
                type="link"
                size="small"
                style={{ paddingInline: 0 }}
                onClick={() =>
                  history.push('/resources/incident-solution-templates')
                }
              >
                管理模板
              </Button>
            </Space>
          }
        >
          <Select
            allowClear
            showSearch
            loading={templatesLoading}
            options={templates.map((template) => ({
              label: template.name,
              value: template.id,
            }))}
            optionFilterProp="label"
            placeholder="可选：选择一个关单模板"
            onChange={(templateId) => {
              const template = templates.find((item) => item.id === templateId);
              if (!template) {
                lastAppliedTemplateValuesRef.current = {};
                return;
              }
              applyTemplateValues(template);
            }}
          />
        </Form.Item>
        {selectedTemplate ? (
          <Alert
            style={{ marginBottom: 16 }}
            type="info"
            showIcon
            message={selectedTemplate.name}
            description={
              selectedTemplate.description ||
              solutionTemplateSummary(selectedTemplate) ||
              '当前模板会使用系统自动注入的 incident / operator / system 变量，并允许你通过模板变量补充自定义字段。'
            }
          />
        ) : null}
        <Form.Item
          name="close_status"
          label="关闭状态"
          rules={[{ required: true, message: '请选择关闭状态' }]}
        >
          <Select options={closeStatusOptions} />
        </Form.Item>
        <Form.Item
          name="resolution"
          label="解决说明"
          rules={[
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (getFieldValue('solution_template_id') || value) {
                  return Promise.resolve();
                }
                return Promise.reject(
                  new Error('请输入解决说明，或选择解决方案模板'),
                );
              },
            }),
          ]}
        >
          <Input.TextArea
            rows={3}
            placeholder="例如：已完成修复并验证恢复正常"
          />
        </Form.Item>
        <Form.Item name="work_notes" label="处理备注">
          <Input.TextArea rows={3} placeholder="写给源工单系统的处理过程说明" />
        </Form.Item>
        <Form.Item name="close_code" label="关闭码">
          <Input placeholder="例如：auto_healed" />
        </Form.Item>
        <Form.Item
          name="template_vars_text"
          label="模板变量（JSON）"
          extra={
            '仅在模板需要额外变量时填写，例如 {"execution":{"run_id":"run-1"}}。'
          }
        >
          <Input.TextArea
            rows={4}
            placeholder='例如：{"execution":{"run_id":"run-1","message":"人工确认恢复正常"}}'
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
