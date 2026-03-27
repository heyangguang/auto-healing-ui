import React from 'react';
import { useAccess } from '@umijs/max';
import { Form } from 'antd';
import StandardTable from '@/components/StandardTable';
import PlatformMessageComposer, { type PlatformMessageFormValues } from './PlatformMessageComposer';
import usePlatformMessageForm from './usePlatformMessageForm';
import usePlatformMessageOptions from './usePlatformMessageOptions';

/**
 * 平台站内信发送页面
 * 平台管理员专用 - 发送全平台站内信
 */
const PlatformMessagesPage: React.FC = () => {
  const access = useAccess();
  const [form] = Form.useForm<PlatformMessageFormValues>();
  const {
    categories,
    categoriesLoading,
    categoriesError,
    tenants,
    tenantsLoading,
    tenantsError,
  } = usePlatformMessageOptions();
  const { submitting, sendTarget, setSendTarget, resetForm, handleSubmit } = usePlatformMessageForm(form);
  const headerIcon = (
    <svg viewBox="0 0 48 48" fill="none">
      <path d="M6 10h36v24a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V10z" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M6 10l18 14L42 10" stroke="currentColor" strokeWidth="2" fill="none" />
    </svg>
  );

  return (
    <StandardTable<Record<string, never>>
      title="平台消息"
      description="向全平台用户发送站内信通知，支持系统更新、故障通知、安全公告等分类。当前前端仅暴露后端已支持的发送能力。"
      headerIcon={headerIcon}
    >
      <PlatformMessageComposer
        form={form}
        canSend={access.canSendPlatformMessage}
        categories={categories}
        categoriesLoading={categoriesLoading}
        categoriesError={categoriesError}
        tenants={tenants}
        tenantsLoading={tenantsLoading}
        tenantsError={tenantsError}
        sendTarget={sendTarget}
        submitting={submitting}
        setSendTarget={setSendTarget}
        onSubmit={handleSubmit}
        onReset={resetForm}
      />
    </StandardTable>
  );
};

export default PlatformMessagesPage;
