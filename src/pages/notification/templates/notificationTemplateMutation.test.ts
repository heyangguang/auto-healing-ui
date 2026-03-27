import {
  applyTemplateToForm,
  buildCreateTemplatePayload,
  buildUpdateTemplatePayload,
} from './notificationTemplateMutation';

describe('notificationTemplateMutation helpers', () => {
  it('builds create payloads without update-only fields and with normalized subject', () => {
    expect(buildCreateTemplatePayload({
      name: '执行结果通知',
      description: '默认模板',
      event_type: 'execution_result',
      supported_channels: ['email'],
      format: 'markdown',
      is_active: false,
    }, '任务 {{task.name}} 执行完成')).toEqual({
      name: '执行结果通知',
      description: '默认模板',
      event_type: 'execution_result',
      supported_channels: ['email'],
      subject_template: '',
      body_template: '任务 {{task.name}} 执行完成',
      format: 'markdown',
    });
  });

  it('builds update payloads with status field preserved', () => {
    expect(buildUpdateTemplatePayload({
      name: '执行结果通知',
      event_type: 'execution_result',
      supported_channels: ['email', 'webhook'],
      subject_template: '任务结果',
      format: 'text',
      is_active: true,
    }, 'done')).toEqual({
      name: '执行结果通知',
      description: undefined,
      event_type: 'execution_result',
      supported_channels: ['email', 'webhook'],
      subject_template: '任务结果',
      body_template: 'done',
      format: 'text',
      is_active: true,
    });
  });

  it('applies template detail to the form instance', () => {
    const setFieldsValue = jest.fn();

    applyTemplateToForm(
      { setFieldsValue } as unknown as Parameters<typeof applyTemplateToForm>[0],
      {
        id: 'tpl-1',
        name: '执行结果通知',
        description: '默认模板',
        event_type: 'execution_result',
        supported_channels: ['email'],
        subject_template: '任务结果',
        body_template: 'done',
        format: 'markdown',
        available_variables: [],
        is_active: true,
        created_at: '2026-03-27T00:00:00Z',
        updated_at: '2026-03-27T00:00:00Z',
      },
    );

    expect(setFieldsValue).toHaveBeenCalledWith({
      name: '执行结果通知',
      description: '默认模板',
      event_type: 'execution_result',
      supported_channels: ['email'],
      subject_template: '任务结果',
      body_template: 'done',
      format: 'markdown',
      is_active: true,
    });
  });
});
