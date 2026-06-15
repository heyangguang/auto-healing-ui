import {
  DeleteOutlined,
  EyeOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
import { useAccess } from '@umijs/max';
import {
  Alert,
  Button,
  Empty,
  Form,
  Input,
  InputNumber,
  Popconfirm,
  Select,
  Space,
  Spin,
  Tag,
  Typography,
} from 'antd';
import React from 'react';
import SortToolbar from '@/components/SortToolbar';
import StandardTable from '@/components/StandardTable';
import {
  getSolutionTemplateCloseStatusMeta,
  getSolutionTemplateStepsModeMeta,
  SOLUTION_TEMPLATE_COLUMNS,
  SOLUTION_TEMPLATE_SEARCH_FIELDS,
  SOLUTION_TEMPLATE_SORT_OPTIONS,
} from './solutionTemplateHelpers';
import { useSolutionTemplatesPage } from './useSolutionTemplatesPage';
import './index.css';

const statusOptions = [
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
];

const stepsModeOptions = [
  { value: 'summary', label: '摘要步骤' },
  { value: 'detailed', label: '详细步骤' },
];

const solutionTemplateHeaderIcon = (
  <svg viewBox="0 0 48 48" fill="none">
    <title>解决方案库图标</title>
    <rect
      x="8"
      y="8"
      width="32"
      height="32"
      rx="6"
      stroke="currentColor"
      strokeWidth="2"
    />
    <path
      d="M16 18h16M16 24h12M16 30h8"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    />
    <path
      d="M31 31l3 3 6-7"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SolutionTemplatePage: React.FC = () => {
  const access = useAccess();
  const {
    form,
    handleCreate,
    handleDelete,
    handleSave,
    handleSearchChange,
    handleSelect,
    handleValuesChange,
    isCreating,
    isDirty,
    loading,
    previewSections,
    saving,
    selectedId,
    selectedTemplate,
    setShowPreview,
    setSortBy,
    setSortOrder,
    showPreview,
    solutionSummary,
    sortBy,
    sortOrder,
    templates,
    totalTemplates,
  } = useSolutionTemplatesPage();
  const canCreateSolutionTemplate = access.canCreateSolutionTemplate;
  const canUpdateSolutionTemplate = access.canUpdateSolutionTemplate;
  const canDeleteSolutionTemplate = access.canDeleteSolutionTemplate;

  return (
    <StandardTable<AutoHealing.IncidentSolutionTemplate>
      columns={SOLUTION_TEMPLATE_COLUMNS}
      description={`集中管理工单回写的标准解决方案模板，共 ${totalTemplates} 个模板`}
      extraToolbarActions={
        <SortToolbar
          onSortByChange={(value) =>
            setSortBy(value as 'created_at' | 'name' | 'updated_at')
          }
          onSortOrderChange={(value) => setSortOrder(value as 'asc' | 'desc')}
          options={SOLUTION_TEMPLATE_SORT_OPTIONS}
          sortBy={sortBy}
          sortOrder={sortOrder}
          width={110}
        />
      }
      headerIcon={solutionTemplateHeaderIcon}
      onPrimaryAction={handleCreate}
      onSearch={handleSearchChange}
      primaryActionDisabled={!canCreateSolutionTemplate}
      primaryActionIcon={<PlusOutlined />}
      primaryActionLabel="新建模板"
      searchFields={SOLUTION_TEMPLATE_SEARCH_FIELDS}
      tabs={[{ key: 'editor', label: '解决方案库' }]}
      title="解决方案库"
    >
      <div className="solution-templates-body">
        <div className="solution-templates-sidebar">
          <div className="solution-templates-sidebar-list">
            {loading ? (
              <div className="solution-templates-sidebar-empty">
                <Spin />
              </div>
            ) : templates.length === 0 ? (
              <div className="solution-templates-sidebar-empty">
                <Empty description="没有匹配的模板" />
              </div>
            ) : (
              templates.map((template) => {
                const closeStatus = getSolutionTemplateCloseStatusMeta(
                  template.default_close_status,
                );
                const stepsMode = getSolutionTemplateStepsModeMeta(
                  template.steps_render_mode,
                );
                return (
                  <button
                    type="button"
                    key={template.id}
                    className={`solution-templates-sidebar-item${template.id === selectedId ? ' solution-templates-sidebar-item--active' : ''}`}
                    onClick={() => handleSelect(template.id)}
                  >
                    <Space
                      direction="vertical"
                      size={6}
                      style={{ width: '100%' }}
                    >
                      <Typography.Text strong ellipsis title={template.name}>
                        {template.name}
                      </Typography.Text>
                      <Space wrap size={[6, 6]}>
                        <Tag color={closeStatus.color}>{closeStatus.label}</Tag>
                        <Tag color={stepsMode.color}>{stepsMode.label}</Tag>
                      </Space>
                      {template.description ? (
                        <Typography.Text
                          type="secondary"
                          className="solution-templates-sidebar-description"
                        >
                          {template.description}
                        </Typography.Text>
                      ) : null}
                    </Space>
                  </button>
                );
              })
            )}
          </div>
        </div>

        <div className="solution-templates-editor">
          {!selectedTemplate && !isCreating ? (
            <div className="solution-templates-empty-pane">
              <Empty description="从左侧选择模板，或创建新模板" />
            </div>
          ) : (
            <>
              <div className="solution-templates-editor-header">
                <div style={{ minWidth: 0 }}>
                  <Typography.Title level={5} style={{ margin: 0 }}>
                    {isCreating ? '新建解决方案模板' : selectedTemplate?.name}
                  </Typography.Title>
                  <Typography.Text type="secondary" ellipsis>
                    {solutionSummary ||
                      '按照“问题说明 / 解决方案 / 执行步骤 / 验证结果 / 最终结论”生成标准回写内容'}
                  </Typography.Text>
                </div>
                <Space>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => setShowPreview(!showPreview)}
                  >
                    {showPreview ? '返回编辑' : '预览'}
                  </Button>
                  {!isCreating && selectedTemplate ? (
                    <Popconfirm
                      title="删除模板"
                      description="删除后将无法继续在 Flow 或手动关单中使用。"
                      onConfirm={() => void handleDelete()}
                    >
                      <Button
                        danger
                        icon={<DeleteOutlined />}
                        disabled={!canDeleteSolutionTemplate}
                      >
                        删除
                      </Button>
                    </Popconfirm>
                  ) : null}
                  <Button
                    type="primary"
                    icon={<SaveOutlined />}
                    loading={saving}
                    disabled={
                      !isDirty ||
                      !(isCreating
                        ? canCreateSolutionTemplate
                        : canUpdateSolutionTemplate)
                    }
                    onClick={() => void handleSave()}
                  >
                    {isCreating ? '创建' : '保存'}
                  </Button>
                </Space>
              </div>

              <div className="solution-templates-editor-body">
                {showPreview ? (
                  <div className="solution-templates-preview">
                    {previewSections.sections.map((section) => (
                      <div
                        key={section.key}
                        className="solution-templates-preview-section"
                      >
                        <Typography.Title level={5}>
                          {section.title}
                        </Typography.Title>
                        <div className="solution-templates-preview-content">
                          {section.content}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="solution-templates-form-shell">
                    <Alert
                      showIcon
                      type="info"
                      className="solution-templates-info"
                      message="解决方案模板采用“静态方案 + 动态步骤”模式"
                      description="问题说明、解决方案、验证结果和最终结论由模板定义，执行步骤由系统根据真实运行过程自动生成。"
                    />
                    <Form
                      form={form}
                      layout="vertical"
                      initialValues={{
                        default_close_status: 'resolved',
                        default_close_code: 'auto_healed',
                        steps_render_mode: 'summary',
                        steps_max_count: 6,
                        step_output_max_length: 240,
                      }}
                      onValuesChange={handleValuesChange}
                    >
                      <Form.Item
                        name="name"
                        label="模板名称"
                        rules={[
                          {
                            required: true,
                            message: '请输入模板名称',
                            whitespace: true,
                          },
                        ]}
                      >
                        <Input placeholder="例如：服务恢复自动关单模板" />
                      </Form.Item>
                      <Form.Item name="description" label="模板描述">
                        <Input.TextArea
                          rows={2}
                          placeholder="简要描述该模板适用的故障场景和回写目的"
                        />
                      </Form.Item>
                      <Space
                        size={16}
                        className="solution-templates-form-row"
                        align="start"
                      >
                        <Form.Item
                          name="default_close_status"
                          label="默认关闭状态"
                          style={{ flex: 1 }}
                        >
                          <Select options={statusOptions} />
                        </Form.Item>
                        <Form.Item
                          name="default_close_code"
                          label="默认关闭码"
                          style={{ flex: 1 }}
                        >
                          <Input placeholder="例如：auto_healed" />
                        </Form.Item>
                      </Space>
                      <Space
                        size={16}
                        className="solution-templates-form-row"
                        align="start"
                      >
                        <Form.Item
                          name="steps_render_mode"
                          label="步骤渲染模式"
                          style={{ flex: 1 }}
                        >
                          <Select options={stepsModeOptions} />
                        </Form.Item>
                        <Form.Item
                          name="steps_max_count"
                          label="最多展示步骤数"
                          style={{ flex: 1 }}
                        >
                          <InputNumber
                            min={1}
                            max={20}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                        <Form.Item
                          name="step_output_max_length"
                          label="单步输出摘要长度"
                          style={{ flex: 1 }}
                        >
                          <InputNumber
                            min={60}
                            max={1000}
                            step={20}
                            style={{ width: '100%' }}
                          />
                        </Form.Item>
                      </Space>
                      <Form.Item name="problem_template" label="问题说明模板">
                        <Input.TextArea
                          rows={4}
                          placeholder="例如：告警名称：{{ incident.title }}&#10;影响对象：{{ incident.affected_ci }}"
                        />
                      </Form.Item>
                      <Form.Item
                        name="solution_template"
                        label="解决方案模板"
                        rules={[
                          { required: true, message: '请输入解决方案模板' },
                        ]}
                        extra="这里写标准处理方案说明，不是实时执行日志。"
                      >
                        <Input.TextArea
                          rows={5}
                          placeholder="例如：AHS 将按标准服务恢复方案执行：先检查服务状态，再恢复服务并复查健康检查。"
                        />
                      </Form.Item>
                      <Form.Item
                        name="verification_template"
                        label="验证结果模板"
                      >
                        <Input.TextArea
                          rows={4}
                          placeholder="例如：执行状态：{{ execution.status }}&#10;执行说明：{{ execution.message }}"
                        />
                      </Form.Item>
                      <Form.Item
                        name="conclusion_template"
                        label="最终结论模板"
                        rules={[
                          { required: true, message: '请输入最终结论模板' },
                        ]}
                      >
                        <Input.TextArea
                          rows={3}
                          placeholder="例如：AHS 已完成自动修复，源工单已自动关闭。"
                        />
                      </Form.Item>
                    </Form>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </StandardTable>
  );
};

export default SolutionTemplatePage;
