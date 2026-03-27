export type RoleFormValues = {
  name: string;
  display_name: string;
  description?: string;
};

export type AssignableUser = {
  id: string;
  username: string;
  display_name?: string;
  status?: string;
};

export type WorkspaceSummary = {
  id: string;
  name: string;
  description?: string;
  is_default?: boolean;
};

export type RoleWorkspaceAssignment = {
  workspace_ids?: string[];
};

export type RoleUserAssignmentFailure = {
  userId: string;
  op: 'assign' | 'remove';
};

export type RoleTransferItem = {
  key: string;
  title: string;
  description: string;
  disabled: false;
};
