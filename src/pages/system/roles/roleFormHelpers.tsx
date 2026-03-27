import React from 'react';
import { Modal } from 'antd';
import type {
  AssignableUser,
  RoleTransferItem,
  RoleUserAssignmentFailure,
  WorkspaceSummary,
} from './roleFormTypes';

export const isFormValidationError = (error: unknown): error is { errorFields: unknown } =>
  typeof error === 'object' && error !== null && 'errorFields' in error;

export const toRoleTransferItems = (users: AssignableUser[]): RoleTransferItem[] =>
  users.map((user) => ({
    key: user.id,
    title: user.display_name || user.username,
    description: user.username,
    disabled: false,
  }));

export const getDefaultWorkspaceIds = (workspaces: WorkspaceSummary[]) =>
  workspaces
    .filter((workspace) => workspace.is_default)
    .map((workspace) => workspace.id);

export const getNonDefaultWorkspaceIds = (
  selectedWorkspaceIds: string[],
  allWorkspaces: WorkspaceSummary[],
) =>
  selectedWorkspaceIds.filter(
    (id) => !allWorkspaces.some((workspace) => workspace.id === id && workspace.is_default),
  );

type UserAssignmentWarningOptions = {
  title: string;
  description: string;
  failures: RoleUserAssignmentFailure[];
  users: AssignableUser[];
  onOk?: () => void;
};

export const showUserAssignmentWarning = ({
  title,
  description,
  failures,
  users,
  onOk,
}: UserAssignmentWarningOptions) => {
  const userById = new Map(users.map((user) => [user.id, user]));
  const preview = failures.slice(0, 10).map((failure) => {
    const user = userById.get(failure.userId);
    const name = user?.display_name || user?.username || failure.userId;
    const operation = failure.op === 'assign' ? '赋予角色失败' : '取消分配失败';
    return `${name}（${operation}）`;
  });

  Modal.warning({
    title,
    content: (
      <div>
        <div style={{ marginBottom: 8 }}>{description}</div>
        {preview.length > 0 && (
          <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {preview.join('\n')}
            {failures.length > preview.length ? '\n…' : ''}
          </div>
        )}
      </div>
    ),
    onOk,
  });
};
