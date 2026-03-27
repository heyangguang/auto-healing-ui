import { useCallback, useState } from 'react';
import type { FormInstance } from 'antd';
import { message } from 'antd';
import {
  createSiteMessage,
  type CreateSiteMessageParams,
} from '@/services/auto-healing/platform/messages';
import type { PlatformMessageFormValues } from './PlatformMessageComposer';

export default function usePlatformMessageForm(form: FormInstance<PlatformMessageFormValues>) {
  const [submitting, setSubmitting] = useState(false);
  const [sendTarget, setSendTarget] = useState<'all' | 'selected'>('all');

  const resetForm = useCallback(() => {
    form.resetFields();
    setSendTarget('all');
  }, [form]);

  const handleSubmit = useCallback(async (values: PlatformMessageFormValues) => {
    setSubmitting(true);
    try {
      const params: CreateSiteMessageParams = {
        category: values.category,
        title: values.title,
        content: values.content,
      };
      if (sendTarget === 'selected' && values.target_tenant_ids?.length) {
        params.target_tenant_ids = values.target_tenant_ids;
      }
      await createSiteMessage(params);
      message.success('消息发送成功');
      resetForm();
      window.dispatchEvent(new Event('site-messages:new'));
    } finally {
      setSubmitting(false);
    }
  }, [resetForm, sendTarget]);

  return { submitting, sendTarget, setSendTarget, resetForm, handleSubmit };
}
