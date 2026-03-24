export function getPendingHomePath(access: any): string {
  if (access?.canViewPendingTrigger) return '/pending/triggers';
  if (access?.canViewApprovals) return '/pending/approvals';
  if (access?.canViewImpersonationApprovals) return '/pending/impersonation';
  if (access?.canApproveExemption) return '/pending/exemptions';
  return '/pending';
}
