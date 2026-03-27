import type { FormInstance } from 'antd';

export type NotificationTemplateFormValues = {
    name: string;
    description?: string;
    event_type: AutoHealing.EventType;
    supported_channels?: ReadonlyArray<AutoHealing.ChannelType>;
    subject_template?: string;
    body_template?: string;
    format?: AutoHealing.TemplateFormat;
    is_active?: boolean;
};

export const applyTemplateToForm = (
    form: FormInstance<NotificationTemplateFormValues>,
    template: AutoHealing.NotificationTemplate,
) => {
    form.setFieldsValue({
        name: template.name,
        description: template.description,
        event_type: template.event_type,
        supported_channels: template.supported_channels || [],
        subject_template: template.subject_template,
        body_template: template.body_template,
        format: template.format,
        is_active: template.is_active,
    });
};

const buildTemplatePayloadBase = (
    values: NotificationTemplateFormValues,
    editorContent: string,
) => ({
    name: values.name,
    description: values.description,
    event_type: values.event_type,
    supported_channels: Array.from(values.supported_channels || []),
    subject_template: values.subject_template ?? '',
    body_template: editorContent,
    format: values.format,
});

export const buildCreateTemplatePayload = (
    values: NotificationTemplateFormValues,
    editorContent: string,
): AutoHealing.CreateTemplateRequest => buildTemplatePayloadBase(values, editorContent);

export const buildUpdateTemplatePayload = (
    values: NotificationTemplateFormValues,
    editorContent: string,
): AutoHealing.UpdateTemplateRequest => ({
    ...buildTemplatePayloadBase(values, editorContent),
    is_active: values.is_active,
});
