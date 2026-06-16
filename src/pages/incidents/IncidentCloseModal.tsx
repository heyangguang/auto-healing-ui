import { history } from '@umijs/max';
import {
  Alert,
  Button,
  Col,
  Collapse,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Typography,
} from 'antd';
import React from 'react';
import {
  getIncidentSolutionTemplate,
  getIncidentSolutionTemplates,
} from '@/services/auto-healing/incidentSolutionTemplates';
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

function parseTemplateVarsText(
  text?: string,
): AutoHealing.JsonObject | undefined {
  if (!text?.trim()) {
    return undefined;
  }
  const parsed = JSON.parse(text);
  if (!parsed || Array.isArray(parsed) || typeof parsed !== 'object') {
    throw new Error('模板变量必须是 JSON 对象');
  }
  return parsed as AutoHealing.JsonObject;
}

function buildTemplateContext(
  incident?: AutoHealing.Incident | null,
  templateVars?: AutoHealing.JsonObject,
) {
  const context: Record<string, unknown> = {
    close_code: 'auto_healed',
    close_status: 'resolved',
    incident: incident || {},
    input: {},
    operator: {
      name: 'manual-close',
    },
    system: {
      timestamp: new Date().toISOString(),
      trigger_source: 'manual_close',
    },
  };
  if (templateVars) {
    const input = context.input as Record<string, unknown>;
    Object.entries(templateVars).forEach(([key, value]) => {
      input[key] = value;
      if (!(key in context)) {
        context[key] = value;
      }
    });
  }
  return context;
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

function hasTemplateBody(template?: AutoHealing.IncidentSolutionTemplate) {
  return Boolean(
    template?.problem_template?.trim() ||
      template?.solution_template?.trim() ||
      template?.verification_template?.trim() ||
      template?.conclusion_template?.trim(),
  );
}

export function buildCloseModalTemplateValues(
  template: AutoHealing.IncidentSolutionTemplate,
  incident?: AutoHealing.Incident | null,
  templateVars?: AutoHealing.JsonObject,
): Partial<CloseModalFormValues> {
  const context = buildTemplateContext(incident, templateVars);
  const resolutionParts: string[] = [];
  const workNoteParts: string[] = [];
  const problem = renderTemplate(template.problem_template, context);
  const solution = renderTemplate(template.solution_template, context);
  const verification = renderTemplate(template.verification_template, context);
  const conclusion = renderTemplate(template.conclusion_template, context);

  appendTemplateSection(workNoteParts, '问题说明', problem);
  appendTemplateSection(workNoteParts, '处理动作', solution);
  appendTemplateSection(workNoteParts, '验证结果', verification);

  appendTemplateSection(resolutionParts, '解决方案', solution);
  appendTemplateSection(resolutionParts, '验证结果', verification);
  appendTemplateSection(resolutionParts, '最终结论', conclusion);

  return {
    close_code: template.default_close_code || undefined,
    close_status: template.default_close_status as
      | 'resolved'
      | 'closed'
      | undefined,
    resolution: resolutionParts.join('\n\n') || undefined,
    work_notes: workNoteParts.join('\n\n') || undefined,
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
  const [templateDetailLoadingId, setTemplateDetailLoadingId] = React.useState<
    string | null
  >(null);
  const isApplyingTemplateValuesRef = React.useRef(false);
  const manuallyEditedTemplateFieldsRef = React.useRef<
    Set<keyof CloseModalFormValues>
  >(new Set());
  const templateApplyRequestRef = React.useRef(0);
  const selectedTemplateIdRef = React.useRef<string | null>(null);
  const selectedTemplateId = Form.useWatch('solution_template_id', form);
  const templateVarsText = Form.useWatch('template_vars_text', form);
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
    (
      template: AutoHealing.IncidentSolutionTemplate,
      templateVars?: AutoHealing.JsonObject,
    ) => {
      const nextValues = buildCloseModalTemplateValues(
        template,
        incident,
        templateVars,
      );
      const patch: Partial<CloseModalFormValues> = {};
      const shouldPatchGeneratedValue = (
        field: keyof CloseModalFormValues,
        nextValue?: string,
      ) => {
        return Boolean(
          nextValue && !manuallyEditedTemplateFieldsRef.current.has(field),
        );
      };

      if (shouldPatchGeneratedValue('close_code', nextValues.close_code)) {
        patch.close_code = nextValues.close_code;
      }
      if (shouldPatchGeneratedValue('close_status', nextValues.close_status)) {
        patch.close_status = nextValues.close_status;
      }
      if (shouldPatchGeneratedValue('resolution', nextValues.resolution)) {
        patch.resolution = nextValues.resolution;
      }
      if (shouldPatchGeneratedValue('work_notes', nextValues.work_notes)) {
        patch.work_notes = nextValues.work_notes;
      }

      if (Object.keys(patch).length > 0) {
        isApplyingTemplateValuesRef.current = true;
        try {
          form.setFieldsValue(patch);
        } finally {
          isApplyingTemplateValuesRef.current = false;
        }
      }
    },
    [form, incident],
  );

  const applySelectedTemplate = React.useCallback(
    async (templateId?: string | null, templateVarsTextValue?: string) => {
      if (!open || !templateId) {
        return;
      }
      const requestId = templateApplyRequestRef.current + 1;
      templateApplyRequestRef.current = requestId;
      let templateVars: AutoHealing.JsonObject | undefined;
      try {
        templateVars = parseTemplateVarsText(templateVarsTextValue);
      } catch {
        return;
      }
      const isCurrentTemplateSelection = () =>
        selectedTemplateIdRef.current === templateId;
      if (!isCurrentTemplateSelection()) {
        return;
      }
      let templateToApply = templates.find(
        (template) => template.id === templateId,
      );
      if (!templateToApply) {
        return;
      }
      if (!hasTemplateBody(templateToApply)) {
        setTemplateDetailLoadingId(templateId);
        try {
          const detail = await getIncidentSolutionTemplate(templateId);
          if (
            templateApplyRequestRef.current !== requestId ||
            !isCurrentTemplateSelection()
          ) {
            return;
          }
          templateToApply = detail;
          setTemplates((current) =>
            current.map((item) =>
              item.id === detail.id ? { ...item, ...detail } : item,
            ),
          );
        } catch {
          // Keep the list item as a fallback so default status/code can still apply.
        } finally {
          if (templateApplyRequestRef.current === requestId) {
            setTemplateDetailLoadingId(null);
          }
        }
      }
      if (
        templateApplyRequestRef.current === requestId &&
        isCurrentTemplateSelection()
      ) {
        applyTemplateValues(templateToApply, templateVars);
      }
    },
    [applyTemplateValues, open, templates],
  );

  React.useEffect(() => {
    if (!open || !selectedTemplateId) {
      return;
    }

    selectedTemplateIdRef.current = selectedTemplateId;
    void applySelectedTemplate(selectedTemplateId, templateVarsText);
  }, [applySelectedTemplate, open, selectedTemplateId, templateVarsText]);

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
        try {
          templateVars = parseTemplateVarsText(values.template_vars_text);
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
          manuallyEditedTemplateFieldsRef.current = new Set();
          templateApplyRequestRef.current += 1;
          selectedTemplateIdRef.current = null;
          form.setFieldsValue({
            close_status: 'resolved',
            close_code: 'auto_healed',
          });
          return;
        }
        manuallyEditedTemplateFieldsRef.current = new Set();
        templateApplyRequestRef.current += 1;
        selectedTemplateIdRef.current = null;
        form.resetFields();
      }}
      width={960}
      styles={{
        body: {
          maxHeight: 'calc(100vh - 220px)',
          overflowX: 'hidden',
          overflowY: 'auto',
          paddingTop: 12,
        },
      }}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ close_status: 'resolved', close_code: 'auto_healed' }}
        onValuesChange={(changedValues) => {
          if (isApplyingTemplateValuesRef.current) {
            return;
          }
          (
            ['close_code', 'close_status', 'resolution', 'work_notes'] as const
          ).forEach((field) => {
            if (Object.hasOwn(changedValues, field)) {
              manuallyEditedTemplateFieldsRef.current.add(field);
            }
          });
        }}
      >
        <Row gutter={[24, 0]} align="top" style={{ marginInline: 0 }}>
          <Col xs={24} lg={10}>
            <Form.Item
              name="solution_template_id"
              label="解决方案模板"
              extra={
                <Space size={8} wrap>
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    选择后自动生成说明和备注
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
                loading={
                  templatesLoading ||
                  templateDetailLoadingId === selectedTemplateId
                }
                options={templates.map((template) => ({
                  label: template.name,
                  value: template.id,
                }))}
                optionFilterProp="label"
                placeholder="可选：选择一个关单模板"
                onChange={(templateId) => {
                  if (!templateId) {
                    templateApplyRequestRef.current += 1;
                    selectedTemplateIdRef.current = null;
                    setTemplateDetailLoadingId(null);
                    return;
                  }
                  selectedTemplateIdRef.current = templateId;
                  void applySelectedTemplate(templateId, templateVarsText);
                }}
              />
            </Form.Item>
            {selectedTemplate ? (
              <Alert
                style={{ marginBottom: 16 }}
                type="info"
                showIcon
                title={selectedTemplate.name}
                description={
                  selectedTemplate.description ||
                  solutionTemplateSummary(selectedTemplate) ||
                  '使用 incident / operator / system 内置变量生成关单内容。'
                }
              />
            ) : null}
            <Row gutter={[12, 0]} style={{ marginInline: 0 }}>
              <Col xs={24} sm={12} lg={24} xl={12}>
                <Form.Item
                  name="close_status"
                  label="关闭状态"
                  rules={[{ required: true, message: '请选择关闭状态' }]}
                >
                  <Select options={closeStatusOptions} />
                </Form.Item>
              </Col>
              <Col xs={24} sm={12} lg={24} xl={12}>
                <Form.Item name="close_code" label="关闭码">
                  <Input placeholder="例如：auto_healed" />
                </Form.Item>
              </Col>
            </Row>
            <Collapse
              ghost
              size="small"
              style={{ marginTop: -4 }}
              items={[
                {
                  key: 'template-vars',
                  label: '高级变量',
                  children: (
                    <Form.Item
                      name="template_vars_text"
                      label="补充模板变量（JSON，可选）"
                      extra={
                        '通常不用填。只有模板包含 execution.run_id 这类额外占位符时，才在这里补充对应 JSON；系统已自动提供 incident / operator / system。'
                      }
                      style={{ marginBottom: 0 }}
                    >
                      <Input.TextArea
                        rows={4}
                        placeholder='例如：{"execution":{"run_id":"run-1","message":"人工确认恢复正常"}}'
                      />
                    </Form.Item>
                  ),
                },
              ]}
            />
          </Col>
          <Col xs={24} lg={14}>
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
                rows={8}
                placeholder="例如：已完成修复并验证恢复正常"
              />
            </Form.Item>
            <Form.Item name="work_notes" label="处理备注">
              <Input.TextArea
                rows={8}
                placeholder="写给源工单系统的处理过程说明"
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
