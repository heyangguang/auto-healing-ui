import React, { useEffect } from 'react';
import { history, useAccess, useLocation } from '@umijs/max';
import { Spin } from 'antd';
import { canAccessPath } from '@/utils/pathAccess';

const REDIRECT_CANDIDATES: Record<string, string[]> = {
  '/resources': [
    '/resources/cmdb',
    '/resources/incidents',
    '/resources/secrets',
    '/resources/plugins',
  ],
  '/execution': [
    '/execution/templates',
    '/execution/execute',
    '/execution/schedules',
    '/execution/logs',
    '/execution/git-repos',
    '/execution/playbooks',
  ],
  '/notification': [
    '/notification/channels',
    '/notification/templates',
    '/notification/records',
  ],
  '/healing': [
    '/healing/flows',
    '/healing/rules',
    '/healing/instances',
  ],
  '/platform': [
    '/platform/tenant-overview',
    '/platform/tenants',
    '/platform/users',
    '/platform/roles',
    '/platform/audit-logs',
    '/platform/messages',
    '/platform/settings',
    '/platform/impersonation',
  ],
  '/system': [
    '/system/users',
    '/system/roles',
    '/system/permissions',
    '/system/audit-logs',
    '/system/messages',
  ],
  '/security': [
    '/security/command-blacklist',
    '/security/exemptions',
  ],
};

const AccessRedirect: React.FC = () => {
  const access = useAccess();
  const location = useLocation();

  useEffect(() => {
    const candidates = REDIRECT_CANDIDATES[location.pathname] || [];
    const target = candidates.find((path) => canAccessPath(path, access)) || '/workbench';
    history.replace(target);
  }, [access, location.pathname]);

  return (
    <div style={{ minHeight: 240, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Spin size="large" />
    </div>
  );
};

export default AccessRedirect;
