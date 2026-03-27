import { useCallback, useState } from 'react';

export default function useRejectModalState<TRecord>() {
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectTarget, setRejectTarget] = useState<TRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const openReject = useCallback((record: TRecord) => {
    setRejectTarget(record);
    setRejectReason('');
    setRejectModalOpen(true);
  }, []);

  const closeRejectModal = useCallback(() => {
    setRejectModalOpen(false);
  }, []);

  return {
    rejectModalOpen,
    rejectTarget,
    rejectReason,
    setRejectReason,
    openReject,
    closeRejectModal,
  };
}
