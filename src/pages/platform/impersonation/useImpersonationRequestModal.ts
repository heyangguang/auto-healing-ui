import { useCallback, useState, type Dispatch, type SetStateAction } from 'react';
import { message } from 'antd';
import type { PlatformTenantRecord } from '@/services/auto-healing/platform/tenants';
import { createImpersonationRequest } from '@/services/auto-healing/platform/impersonation';
import { getTenants } from '@/services/auto-healing/platform/tenants';
import { extractErrorMsg } from '@/utils/errorMsg';
import { fetchAllPages } from '@/utils/fetchAllPages';
import type {
  ImpersonationRequestFormValues,
  PlatformTenantOption,
} from './ImpersonationRequestModal';

function useImpersonationRequestModalState(
  form: { resetFields: () => void },
) {
  const [modalOpen, setModalOpen] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [tenants, setTenants] = useState<PlatformTenantOption[]>([]);
  const [tenantLoadError, setTenantLoadError] = useState<string | null>(null);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    form.resetFields();
  }, [form]);

  return {
    modalOpen,
    setModalOpen,
    submitLoading,
    setSubmitLoading,
    tenants,
    setTenants,
    tenantLoadError,
    setTenantLoadError,
    closeModal,
  };
}

function useTenantLoader({
  setTenants,
  setTenantLoadError,
}: {
  setTenants: Dispatch<SetStateAction<PlatformTenantOption[]>>;
  setTenantLoadError: Dispatch<SetStateAction<string | null>>;
}) {
  return useCallback(async () => {
    try {
      const items = await fetchAllPages<PlatformTenantRecord>((page, pageSize) => getTenants({ page, page_size: pageSize }));
      setTenants(items.map((tenant) => ({ id: tenant.id, name: tenant.name })));
      setTenantLoadError(null);
    } catch (error) {
      setTenantLoadError(extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], '租户列表加载失败'));
      throw error;
    }
  }, [setTenantLoadError, setTenants]);
}

function useImpersonationRequestSubmit({
  form,
  closeModal,
  triggerRefresh,
  setSubmitLoading,
}: {
  form: { validateFields: () => Promise<ImpersonationRequestFormValues> };
  closeModal: () => void;
  triggerRefresh: () => void;
  setSubmitLoading: Dispatch<SetStateAction<boolean>>;
}) {
  return useCallback(async () => {
    const values = await form.validateFields();
    setSubmitLoading(true);
    try {
      await createImpersonationRequest(values);
      message.success('申请已提交，等待租户管理员审批');
      closeModal();
      triggerRefresh();
    } finally {
      setSubmitLoading(false);
    }
  }, [closeModal, form, setSubmitLoading, triggerRefresh]);
}

export default function useImpersonationRequestModal(
  form: { resetFields: () => void; validateFields: () => Promise<ImpersonationRequestFormValues> },
  triggerRefresh: () => void,
) {
  const state = useImpersonationRequestModalState(form);
  const loadTenants = useTenantLoader({
    setTenants: state.setTenants,
    setTenantLoadError: state.setTenantLoadError,
  });
  const handleSubmit = useImpersonationRequestSubmit({
    form,
    closeModal: state.closeModal,
    triggerRefresh,
    setSubmitLoading: state.setSubmitLoading,
  });

  const handleOpenModal = useCallback(async () => {
    state.setModalOpen(true);
    await loadTenants();
  }, [loadTenants, state]);

  return {
    modalOpen: state.modalOpen,
    submitLoading: state.submitLoading,
    tenants: state.tenants,
    tenantLoadError: state.tenantLoadError,
    openModal: handleOpenModal,
    closeModal: state.closeModal,
    handleSubmit,
  };
}
