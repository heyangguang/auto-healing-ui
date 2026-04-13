import { extractErrorMsg } from '@/utils/errorMsg';

type RoleWorkspaceErrorLike = {
  response?: {
    status?: number;
  };
};

export const ROLE_WORKSPACE_VIEW_DENIED_MESSAGE = '你没有权限查看工作区分配';
export const ROLE_WORKSPACE_MANAGE_DENIED_MESSAGE = '你没有权限管理工作区分配';

export function isRoleWorkspaceForbiddenError(error: unknown): boolean {
  return typeof error === 'object'
    && error !== null
    && (error as RoleWorkspaceErrorLike).response?.status === 403;
}

export function getRoleWorkspaceErrorMessage(error: unknown, fallback: string): string {
  return extractErrorMsg(error as Parameters<typeof extractErrorMsg>[0], fallback);
}
