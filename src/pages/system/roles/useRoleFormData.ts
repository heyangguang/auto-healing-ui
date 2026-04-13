import { useEffect, useState } from 'react';
import type { FormInstance } from 'antd';
import { getRole } from '@/services/auto-healing/roles';
import { getPermissionTree } from '@/services/auto-healing/permissions';
import { getUsers, getSimpleUsers } from '@/services/auto-healing/users';
import { getRoleWorkspaces, listSystemWorkspaces } from '@/services/auto-healing/dashboard';
import { getDefaultWorkspaceIds } from './roleFormHelpers';
import {
  getRoleWorkspaceErrorMessage,
  isRoleWorkspaceForbiddenError,
  ROLE_WORKSPACE_MANAGE_DENIED_MESSAGE,
} from './roleWorkspaceFeedback';
import type {
  AssignableUser,
  RoleFormValues,
  RoleWorkspaceAssignment,
  RoleWorkspaceState,
  WorkspaceSummary,
} from './roleFormTypes';

type UseRoleFormDataOptions = {
  canManageWorkspace: boolean;
  form: FormInstance<RoleFormValues>;
  isEdit: boolean;
  roleId?: string;
};

export const useRoleFormData = ({
  canManageWorkspace,
  form,
  isEdit,
  roleId,
}: UseRoleFormDataOptions) => {
  const [isSystemRole, setIsSystemRole] = useState(false);
  const [permLoading, setPermLoading] = useState(true);
  const [roleLoading, setRoleLoading] = useState(isEdit);
  const [wsLoading, setWsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [permissionTree, setPermissionTree] = useState<AutoHealing.PermissionTree>({});
  const [checkedKeys, setCheckedKeys] = useState<string[]>([]);
  const [allUsers, setAllUsers] = useState<AssignableUser[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [originalUserIds, setOriginalUserIds] = useState<string[]>([]);
  const [allWorkspaces, setAllWorkspaces] = useState<WorkspaceSummary[]>([]);
  const [selectedWsIds, setSelectedWsIds] = useState<string[]>([]);
  const [workspaceState, setWorkspaceState] = useState<RoleWorkspaceState>({ status: 'loaded' });

  useEffect(() => {
    (async () => {
      try {
        const tree = await getPermissionTree();
        setPermissionTree(tree || {});
      } catch {
        /* ignore */
      } finally {
        setPermLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!canManageWorkspace) {
      setWorkspaceState({ errorMessage: ROLE_WORKSPACE_MANAGE_DENIED_MESSAGE, status: 'forbidden' });
      setWsLoading(false);
      return;
    }
    (async () => {
      try {
        const workspaces = await listSystemWorkspaces({
          skipErrorHandler: true,
          suppressForbiddenError: true,
        }) as WorkspaceSummary[];
        setAllWorkspaces(workspaces);
        setWorkspaceState({ status: 'loaded' });
        if (!isEdit) {
          setSelectedWsIds(getDefaultWorkspaceIds(workspaces));
        }
      } catch (error) {
        if (isRoleWorkspaceForbiddenError(error)) {
          setWorkspaceState({ errorMessage: ROLE_WORKSPACE_MANAGE_DENIED_MESSAGE, status: 'forbidden' });
        } else {
          setWorkspaceState({
            errorMessage: getRoleWorkspaceErrorMessage(error, '工作区列表加载失败，请稍后重试'),
            status: 'error',
          });
        }
      } finally {
        setWsLoading(false);
      }
    })();
  }, [canManageWorkspace, isEdit]);

  useEffect(() => {
    (async () => {
      try {
        const users = await getSimpleUsers();
        setAllUsers(users);
      } catch {
        /* ignore */
      } finally {
        setUsersLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!isEdit || !roleId) {
      setRoleLoading(false);
      return;
    }
    (async () => {
      try {
        const role = await getRole(roleId);
        form.setFieldsValue({
          name: role.name,
          display_name: role.display_name,
          description: role.description || '',
        });
        setIsSystemRole(Boolean(role.is_system));
        setCheckedKeys((role.permissions || []).map((permission) => permission.id));
      } catch {
        /* global error handler */
      } finally {
        setRoleLoading(false);
      }
    })();
  }, [form, isEdit, roleId]);

  useEffect(() => {
    if (!isEdit || !roleId) return;
    (async () => {
      try {
        const users: AutoHealing.User[] = [];
        let page = 1;
        const pageSize = 200;
        while (true) {
          const response = await getUsers({ role_id: roleId, page, page_size: pageSize });
          const batch = response.data ?? [];
          const total = response.total ?? batch.length;
          users.push(...batch);
          if (users.length >= total || batch.length === 0) break;
          page += 1;
        }
        const assignedIds = users.map((user) => user.id);
        setSelectedUserIds(assignedIds);
        setOriginalUserIds(assignedIds);
      } catch {
        /* ignore */
      }
    })();
  }, [isEdit, roleId]);

  useEffect(() => {
    if (!canManageWorkspace || !isEdit || !roleId) return;
    (async () => {
      try {
        const data = await getRoleWorkspaces(roleId, {
          skipErrorHandler: true,
          suppressForbiddenError: true,
        }) as RoleWorkspaceAssignment;
        setSelectedWsIds(data.workspace_ids || []);
      } catch (error) {
        if (isRoleWorkspaceForbiddenError(error)) {
          setWorkspaceState({ errorMessage: ROLE_WORKSPACE_MANAGE_DENIED_MESSAGE, status: 'forbidden' });
          return;
        }
        setWorkspaceState({
          errorMessage: getRoleWorkspaceErrorMessage(error, '工作区分配加载失败，请稍后重试'),
          status: 'error',
        });
      }
    })();
  }, [canManageWorkspace, isEdit, roleId]);

  return {
    pageLoading: permLoading || roleLoading || usersLoading || wsLoading,
    isSystemRole,
    permissionTree,
    checkedKeys,
    setCheckedKeys,
    allUsers,
    selectedUserIds,
    setSelectedUserIds,
    originalUserIds,
    allWorkspaces,
    selectedWsIds,
    setSelectedWsIds,
    workspaceState,
  };
};
