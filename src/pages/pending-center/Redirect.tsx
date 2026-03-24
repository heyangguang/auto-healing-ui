import React, { useEffect } from 'react';
import { history, useAccess } from '@umijs/max';
import { Spin } from 'antd';
import { getPendingHomePath } from '@/utils/pendingPath';

const PendingCenterRedirect: React.FC = () => {
  const access = useAccess();

  useEffect(() => {
    const target = getPendingHomePath(access);
    history.replace(target === '/pending' ? '/workbench' : target);
  }, [access]);

  return (
    <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );
};

export default PendingCenterRedirect;
