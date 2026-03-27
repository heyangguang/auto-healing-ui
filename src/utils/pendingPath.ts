type PendingPathAccess = Partial<{
  canViewPendingTrigger: boolean;
  canViewApprovals: boolean;
  canViewImpersonationApprovals: boolean;
  canApproveExemption: boolean;
}>;

export function getPendingHomePath(access: PendingPathAccess): string {
  if (access?.canViewPendingTrigger) return '/pending/triggers';
  if (access?.canViewApprovals) return '/pending/approvals';
  if (access?.canViewImpersonationApprovals) return '/pending/impersonation';
  if (access?.canApproveExemption) return '/pending/exemptions';
  return '/pending';
}
