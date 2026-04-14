import React, { Suspense, lazy, useMemo, useRef } from 'react';
import { Button, Dropdown, Form, Input, Select, Space, Spin, Switch, Tag, Typography } from 'antd';
import { CodeOutlined } from '@ant-design/icons';
import type { FormInstance } from 'antd/es/form';
import type { CustomTagProps } from 'rc-select/lib/BaseSelect';
import type { OnMount } from '@monaco-editor/react';
import { getChannelTypeConfig } from '@/constants/notificationDicts';
import {
    CHANNEL_OPTIONS,
    EVENT_TYPE_OPTIONS,
    FORMAT_OPTIONS,
    getTemplateEventTypeConfig,
} from './notificationTemplateConstants';

const { Text } = Typography;
const TemplateBodyEditor = lazy(() => import('./TemplateBodyEditor'));

const CHANNEL_DESCRIPTIONS: Partial<Record<AutoHealing.ChannelType, string>> = {
    webhook: 'HTTP 回调或开放集成',
    email: '通过 SMTP 投递邮件',
    dingtalk: '钉钉机器人消息',
    wecom: '企业微信群机器人消息',
    slack: 'Slack Incoming Webhook',
    teams: 'Microsoft Teams 消息',
};

const EVENT_TYPE_DESCRIPTIONS: Record<AutoHealing.EventType, string> = {
    execution_started: '任务刚开始执行时使用',
    execution_result: '任务执行完成后的成功或失败通知',
    flow_result: '整个自愈流程结束后的结果通知',
    approval_required: '自愈流程进入人工审批时通知',
    manual_notification: '手动发送或通用场景使用',
};

type TemplateEditorFormProps = {
    availableVariables: AutoHealing.TemplateVariable[];
    editorContent: string;
    editorKey: string;
    form: FormInstance;
    isCreating: boolean;
    onDirty: () => void;
    onEditorChange: (value: string) => void;
};

const buildVariableMenuItems = (
    variables: AutoHealing.TemplateVariable[],
    insertVariable: (variableName: string) => void,
) => variables.map((variable) => ({
    key: variable.name,
    label: (
        <div>
            <div style={{ fontWeight: 500 }}>{variable.name}</div>
            {variable.description && (
                <div style={{ fontSize: 12, color: '#666' }}>{variable.description}</div>
            )}
        </div>
    ),
    onClick: () => insertVariable(variable.name),
}));

const renderOptionBadge = (icon: React.ReactNode, color: string, bg: string) => (
    <span className="templates-select-badge" style={{ color, background: bg }}>
        {React.cloneElement(icon as React.ReactElement<{ style?: React.CSSProperties }>, {
            style: { fontSize: 14 },
        })}
    </span>
);

const renderSelectOption = (options: {
    bg: string;
    color: string;
    description?: string;
    icon: React.ReactNode;
    label: string;
}) => (
    <div className="templates-select-option">
        {renderOptionBadge(options.icon, options.color, options.bg)}
        <div className="templates-select-option__content">
            <div className="templates-select-option__title">{options.label}</div>
            {options.description && (
                <div className="templates-select-option__desc">{options.description}</div>
            )}
        </div>
    </div>
);

const renderSelectTag = (options: {
    bg: string;
    closable: boolean;
    color: string;
    icon: React.ReactNode;
    label: string;
    onClose: CustomTagProps['onClose'];
}) => (
    <Tag
        closable={options.closable}
        onClose={options.onClose}
        className="templates-select-tag"
        style={{ color: options.color, background: options.bg, borderColor: 'transparent' }}
    >
        <span className="templates-select-tag__content">
            {React.cloneElement(options.icon as React.ReactElement<{ style?: React.CSSProperties }>, {
                style: { fontSize: 12 },
            })}
            <span>{options.label}</span>
        </span>
    </Tag>
);

const TemplateEditorForm: React.FC<TemplateEditorFormProps> = ({
    availableVariables,
    editorContent,
    editorKey,
    form,
    isCreating,
    onDirty,
    onEditorChange,
}) => {
    const bodyFormat = Form.useWatch('format', form) || 'text';
    const selectedEventType = Form.useWatch('event_type', form) as AutoHealing.EventType | undefined;
    const editorRef = useRef<Parameters<OnMount>[0] | null>(null);

    const insertVariable = (variableName: string) => {
        const editor = editorRef.current;
        if (!editor) {
            return;
        }
        const position = editor.getPosition();
        editor.executeEdits('insert-variable', [{
            range: {
                startLineNumber: position?.lineNumber || 1,
                startColumn: position?.column || 1,
                endLineNumber: position?.lineNumber || 1,
                endColumn: position?.column || 1,
            },
            text: `{{${variableName}}}`,
        }]);
        editor.focus();
    };

    const variableMenuItems = useMemo(
        () => buildVariableMenuItems(availableVariables, insertVariable),
        [availableVariables],
    );

    return (
        <Form
            form={form}
            layout="vertical"
            onValuesChange={onDirty}
            style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
        >
            <div style={{ marginBottom: 16, flexShrink: 0 }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginBottom: 16 }}>
                    <Form.Item label="事件类型" name="event_type" rules={[{ required: true, message: '请选择事件类型' }]} style={{ flex: '1 1 180px', marginBottom: 0 }}>
                        <Select
                            optionFilterProp="label"
                            options={EVENT_TYPE_OPTIONS}
                            optionRender={(option) => {
                                const eventType = String(option.value) as AutoHealing.EventType;
                                const config = getTemplateEventTypeConfig(eventType);
                                return renderSelectOption({
                                    bg: config.bg,
                                    color: config.color,
                                    description: EVENT_TYPE_DESCRIPTIONS[eventType],
                                    icon: config.icon,
                                    label: String(option.label),
                                });
                            }}
                            labelRender={(option) => {
                                const eventType = String(option.value) as AutoHealing.EventType;
                                const config = getTemplateEventTypeConfig(eventType);
                                return (
                                    <div className="templates-select-label">
                                        {renderOptionBadge(config.icon, config.color, config.bg)}
                                        <span>{option.label}</span>
                                    </div>
                                );
                            }}
                        />
                    </Form.Item>
                    <Form.Item label="适用渠道" name="supported_channels" rules={[{ required: true, message: '请选择渠道' }]} style={{ flex: '2 1 280px', marginBottom: 0 }}>
                        <Select
                            maxTagCount="responsive"
                            mode="multiple"
                            optionFilterProp="label"
                            options={CHANNEL_OPTIONS}
                            optionRender={(option) => {
                                const channelType = String(option.value) as AutoHealing.ChannelType;
                                const config = getChannelTypeConfig(channelType);
                                return renderSelectOption({
                                    bg: config.bg,
                                    color: config.color,
                                    description: CHANNEL_DESCRIPTIONS[channelType],
                                    icon: config.icon,
                                    label: String(option.label),
                                });
                            }}
                            tagRender={(tagProps) => {
                                const channelType = String(tagProps.value) as AutoHealing.ChannelType;
                                const config = getChannelTypeConfig(channelType);
                                return renderSelectTag({
                                    bg: config.bg,
                                    closable: tagProps.closable,
                                    color: config.color,
                                    icon: config.icon,
                                    label: String(tagProps.label),
                                    onClose: tagProps.onClose,
                                });
                            }}
                        />
                    </Form.Item>
                    <Form.Item label="格式" name="format" rules={[{ required: true }]} style={{ flex: '0 0 100px', marginBottom: 0 }}>
                        <Select options={FORMAT_OPTIONS} />
                    </Form.Item>
                    {!isCreating && (
                        <Form.Item label="状态" name="is_active" style={{ flex: '0 0 80px', marginBottom: 0 }} valuePropName="checked">
                            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
                        </Form.Item>
                    )}
                </div>
                {selectedEventType && (
                    <div className="templates-event-hint">
                        <span className="templates-event-hint__label">用途说明</span>
                        <span>{EVENT_TYPE_DESCRIPTIONS[selectedEventType]}</span>
                    </div>
                )}
            </div>

            <Form.Item label="邮件主题模板（可选，仅用于 Email 渠道）" name="subject_template" style={{ flexShrink: 0 }}>
                <Input placeholder="请输入邮件主题，可使用变量如 {{task.name}}" />
            </Form.Item>

            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: 24, minHeight: 350 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text strong>消息正文模板 <Text type="danger">*</Text></Text>
                    <Space size={8}>
                        <Tag>{bodyFormat}</Tag>
                        <Dropdown menu={{ items: variableMenuItems }} trigger={['click']}>
                            <Button icon={<CodeOutlined />} size="small">插入变量</Button>
                        </Dropdown>
                    </Space>
                </div>
                <div className="templates-monaco-wrapper">
                    <Suspense fallback={<div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Spin /></div>}>
                        <TemplateBodyEditor
                            availableVariables={availableVariables}
                            editorKey={editorKey}
                            editorRef={editorRef}
                            onChange={(value) => {
                                onEditorChange(value);
                                form.setFieldsValue({ body_template: value });
                                onDirty();
                            }}
                            value={editorContent}
                        />
                    </Suspense>
                </div>
                <Form.Item name="body_template" noStyle rules={[{ required: true, message: '请输入模板内容' }]}>
                    <input type="hidden" />
                </Form.Item>
            </div>
        </Form>
    );
};

export default TemplateEditorForm;
