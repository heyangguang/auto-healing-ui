import { history } from '@umijs/max';
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Typography,
} from 'antd';
import React from 'react';
import { INCIDENT_STATUS_MAP as STATUS_MAP } from '@/constants/incidentDicts';
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
  template_vars?: Record<string, unknown>;
  work_notes?: string;
};

const closeStatusOptions = [
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];

const generatedTextareaAutoSize = { maxRows: 18, minRows: 8 };

const sidePanelStyle: React.CSSProperties = {
  background: '#fafafa',
  border: '1px solid #f0f0f0',
  borderRadius: 8,
  padding: 16,
};

const templatePanelStyle: React.CSSProperties = {
  background: '#f0f7ff',
  border: '1px solid #b7d9ff',
  borderRadius: 8,
  padding: 16,
};

const contextRowStyle: React.CSSProperties = {
  alignItems: 'baseline',
  display: 'grid',
  gap: 12,
  gridTemplateColumns: '72px minmax(0, 1fr)',
};

const SYSTEM_TEMPLATE_ROOTS = new Set([
  'close_code',
  'close_status',
  'incident',
  'operator',
  'system',
]);

function displayValue(value?: React.ReactNode) {
  return value || <Typography.Text type="secondary">-</Typography.Text>;
}

function compactTemplateVars(
  value?: unknown,
): AutoHealing.JsonObject | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const result: AutoHealing.JsonObject = {};
  Object.entries(value as Record<string, unknown>).forEach(([key, item]) => {
    if (typeof item === 'string') {
      const trimmed = item.trim();
      if (trimmed) {
        result[key] = trimmed;
      }
      return;
    }
    if (item && typeof item === 'object' && !Array.isArray(item)) {
      const nested = compactTemplateVars(item);
      if (nested && Object.keys(nested).length > 0) {
        result[key] = nested;
      }
    }
  });
  return Object.keys(result).length > 0 ? result : undefined;
}

function getIncidentSourceLabel(incident?: AutoHealing.Incident | null) {
  return incident?.source_plugin_name || incident?.plugin?.name || undefined;
}

function renderIncidentStatus(status?: AutoHealing.IncidentStatus) {
  if (!status) {
    return <Typography.Text type="secondary">-</Typography.Text>;
  }
  const info =
    STATUS_MAP[status] ||
    (status === 'new'
      ? {
          color: 'blue',
          text: '新建',
        }
      : {
          color: 'default',
          text: status,
        });
  return (
    <span style={{ justifySelf: 'start' }}>
      <Tag color={info.color} style={{ margin: 0 }}>
        {info.text}
      </Tag>
    </span>
  );
}

function extractTemplateVariablePaths(
  template?: AutoHealing.IncidentSolutionTemplate | null,
) {
  if (!template) {
    return [];
  }
  const paths: string[] = [];
  const seen = new Set<string>();
  const collect = (content?: string) => {
    for (const match of content?.matchAll(/{{\s*([a-zA-Z0-9_.-]+)\s*}}/g) ||
      []) {
      const rawPath = match[1];
      const segments = rawPath.split('.').filter(Boolean);
      const root = segments[0];
      let extraPath = '';
      if (!root || SYSTEM_TEMPLATE_ROOTS.has(root)) {
        return;
      }
      if (root === 'input') {
        extraPath = segments.slice(1).join('.');
      } else {
        extraPath = segments.join('.');
      }
      if (extraPath && !seen.has(extraPath)) {
        seen.add(extraPath);
        paths.push(extraPath);
      }
    }
  };
  collect(template.problem_template);
  collect(template.solution_template);
  collect(template.verification_template);
  collect(template.conclusion_template);
  return paths;
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
  const templateVarsValue = Form.useWatch('template_vars', form);
  const selectedTemplate = React.useMemo(
    () => templates.find((template) => template.id === selectedTemplateId),
    [selectedTemplateId, templates],
  );
  const selectedTemplateExtraVariablePaths = React.useMemo(
    () => extractTemplateVariablePaths(selectedTemplate),
    [selectedTemplate],
  );
  const selectedTemplateDescription = React.useMemo(() => {
    if (!selectedTemplate) {
      return '';
    }
    return (
      selectedTemplate.description ||
      solutionTemplateSummary(selectedTemplate) ||
      '使用 incident / operator / system 内置变量生成关单内容。'
    );
  }, [selectedTemplate]);

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
    async (
      templateId?: string | null,
      templateVarsValue?: Record<string, unknown>,
    ) => {
      if (!open || !templateId) {
        return;
      }
      const requestId = templateApplyRequestRef.current + 1;
      templateApplyRequestRef.current = requestId;
      const templateVars = compactTemplateVars(templateVarsValue);
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
    void applySelectedTemplate(selectedTemplateId, templateVarsValue);
  }, [applySelectedTemplate, open, selectedTemplateId, templateVarsValue]);

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
        const templateVars = compactTemplateVars(values.template_vars);
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
            <Space orientation="vertical" size={16} style={{ width: '100%' }}>
              <Form.Item
                name="solution_template_id"
                label="解决方案模板"
                style={{ marginBottom: 0 }}
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
                      form.setFieldValue('template_vars', undefined);
                      return;
                    }
                    selectedTemplateIdRef.current = templateId;
                    void applySelectedTemplate(templateId, templateVarsValue);
                  }}
                />
              </Form.Item>
              {selectedTemplate ? (
                <div style={templatePanelStyle}>
                  <Space align="start" size={12}>
                    <Tag color="blue" style={{ marginInlineEnd: 0 }}>
                      已选模板
                    </Tag>
                    <div style={{ minWidth: 0 }}>
                      <Typography.Text strong>
                        {selectedTemplate.name}
                      </Typography.Text>
                      <Typography.Paragraph
                        type="secondary"
                        style={{ marginBottom: 0, marginTop: 8 }}
                        ellipsis={{ rows: 2, expandable: false }}
                      >
                        {selectedTemplateDescription}
                      </Typography.Paragraph>
                    </div>
                  </Space>
                </div>
              ) : null}
              <div style={sidePanelStyle}>
                <Typography.Text strong>回写参数</Typography.Text>
                <Row
                  gutter={[12, 0]}
                  style={{ marginInline: 0, marginTop: 12 }}
                >
                  <Col xs={24} sm={12} lg={24} xl={12}>
                    <Form.Item
                      name="close_status"
                      label="关闭状态"
                      rules={[{ required: true, message: '请选择关闭状态' }]}
                      style={{ marginBottom: 0 }}
                    >
                      <Select options={closeStatusOptions} />
                    </Form.Item>
                  </Col>
                  <Col xs={24} sm={12} lg={24} xl={12}>
                    <Form.Item
                      name="close_code"
                      label="关闭码"
                      style={{ marginBottom: 0 }}
                    >
                      <Input placeholder="例如：auto_healed" />
                    </Form.Item>
                  </Col>
                </Row>
              </div>
              <div style={sidePanelStyle}>
                <Typography.Text strong>工单上下文</Typography.Text>
                <Space
                  orientation="vertical"
                  size={10}
                  style={{ marginTop: 12, width: '100%' }}
                >
                  <div style={contextRowStyle}>
                    <Typography.Text type="secondary">源工单</Typography.Text>
                    <Typography.Text copyable={Boolean(incident?.external_id)}>
                      {displayValue(incident?.external_id)}
                    </Typography.Text>
                  </div>
                  <div style={contextRowStyle}>
                    <Typography.Text type="secondary">当前状态</Typography.Text>
                    {renderIncidentStatus(incident?.status)}
                  </div>
                  <div style={contextRowStyle}>
                    <Typography.Text type="secondary">影响资产</Typography.Text>
                    <Typography.Text ellipsis>
                      {displayValue(incident?.affected_ci)}
                    </Typography.Text>
                  </div>
                  <div style={contextRowStyle}>
                    <Typography.Text type="secondary">来源</Typography.Text>
                    <Typography.Text ellipsis>
                      {displayValue(getIncidentSourceLabel(incident))}
                    </Typography.Text>
                  </div>
                </Space>
              </div>
              <div style={sidePanelStyle}>
                <Space
                  orientation="vertical"
                  size={12}
                  style={{ width: '100%' }}
                >
                  <Space align="center" size={8} wrap>
                    <Typography.Text strong>模板额外变量</Typography.Text>
                    {selectedTemplateExtraVariablePaths.length > 0 ? (
                      <Tag color="processing" style={{ margin: 0 }}>
                        自动识别
                      </Tag>
                    ) : null}
                  </Space>
                  <Typography.Text type="secondary">
                    系统已提供 incident / operator /
                    system；只需补充模板里额外出现的占位符。
                  </Typography.Text>
                  {selectedTemplate ? (
                    selectedTemplateExtraVariablePaths.length > 0 ? (
                      selectedTemplateExtraVariablePaths.map((path) => (
                        <Form.Item
                          key={path}
                          name={['template_vars', ...path.split('.')]}
                          label={path}
                          style={{ marginBottom: 0 }}
                        >
                          <Input allowClear placeholder={`请输入 ${path}`} />
                        </Form.Item>
                      ))
                    ) : (
                      <Typography.Text type="secondary">
                        当前模板无需人工补充变量。
                      </Typography.Text>
                    )
                  ) : (
                    <Typography.Text type="secondary">
                      选择模板后自动识别需要补充的变量。
                    </Typography.Text>
                  )}
                </Space>
              </div>
            </Space>
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
                autoSize={generatedTextareaAutoSize}
                placeholder="例如：已完成修复并验证恢复正常"
                style={{ resize: 'none' }}
              />
            </Form.Item>
            <Form.Item name="work_notes" label="处理备注">
              <Input.TextArea
                autoSize={generatedTextareaAutoSize}
                placeholder="写给源工单系统的处理过程说明"
                style={{ resize: 'none' }}
              />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};
