import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Form } from 'antd';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/zh-cn';
import '../../system/audit-logs/index.css';
import ImpersonationRequestModal, {
  type ImpersonationRequestFormValues,
} from './ImpersonationRequestModal';
import ImpersonationRequestsTable from './ImpersonationRequestsTable';
import useImpersonationActionRunner from './useImpersonationActionRunner';
import useImpersonationEnterAction from './useImpersonationEnterAction';
import useImpersonationRequestModal from './useImpersonationRequestModal';
import useImpersonationSessionActions from './useImpersonationSessionActions';
import useImpersonationStats from './useImpersonationStats';
import useRefreshTrigger from '@/pages/pending-center/useRefreshTrigger';

dayjs.extend(relativeTime);
dayjs.locale('zh-cn');

export default function ImpersonationPage() {
  const [form] = Form.useForm<ImpersonationRequestFormValues>();
  const { refreshTrigger, triggerRefresh } = useRefreshTrigger();
  const { statsData, statsError } = useImpersonationStats(refreshTrigger);
  const { actionLoading, runAction } = useImpersonationActionRunner();
  const handleEnter = useImpersonationEnterAction(runAction);
  const { handleExit, handleTerminate, handleCancel } = useImpersonationSessionActions(runAction, triggerRefresh);
  const {
    modalOpen,
    submitLoading,
    tenants,
    tenantLoadError,
    openModal,
    closeModal,
    handleSubmit,
  } = useImpersonationRequestModal(form, triggerRefresh);

  return (
    <>
      <ImpersonationRequestsTable
        actionLoading={actionLoading}
        refreshTrigger={refreshTrigger}
        statsData={statsData}
        statsError={statsError}
        onEnter={handleEnter}
        onExit={handleExit}
        onTerminate={handleTerminate}
        onCancel={handleCancel}
        onPrimaryAction={openModal}
      />

      <ImpersonationRequestModal
        open={modalOpen}
        confirmLoading={submitLoading}
        form={form}
        tenants={tenants}
        tenantLoadError={tenantLoadError}
        onCancel={closeModal}
        onSubmit={handleSubmit}
      />
    </>
  );
}
