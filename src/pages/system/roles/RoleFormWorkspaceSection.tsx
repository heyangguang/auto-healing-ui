import React from 'react';
import { Checkbox, Tag } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import type { WorkspaceSummary } from './roleFormTypes';

type RoleFormWorkspaceSectionProps = {
  allWorkspaces: WorkspaceSummary[];
  selectedWorkspaceIds: string[];
  onToggle: (workspaceId: string, checked: boolean) => void;
};

const RoleFormWorkspaceSection: React.FC<RoleFormWorkspaceSectionProps> = ({
  allWorkspaces,
  selectedWorkspaceIds,
  onToggle,
}) => (
  <>
    <div className="role-form-divider" />
    <div className="role-form-section-title">
      <AppstoreOutlined style={{ marginRight: 6 }} />
      分配工作区
      <span className="role-form-section-count">
        已选择 {selectedWorkspaceIds.length} / {allWorkspaces.length} 个工作区
      </span>
    </div>
    <div className="role-form-ws-container">
      {allWorkspaces.length === 0 && (
        <div style={{ color: '#bfbfbf', textAlign: 'center', padding: 40 }}>
          暂无系统工作区
        </div>
      )}
      {allWorkspaces.map((workspace) => {
        const isDefault = Boolean(workspace.is_default);
        const isChecked = selectedWorkspaceIds.includes(workspace.id);
        return (
          <div key={workspace.id} className="role-form-ws-item">
            <Checkbox
              checked={isChecked || isDefault}
              disabled={isDefault}
              onChange={(event) => onToggle(workspace.id, event.target.checked)}
            >
              <span className="role-form-ws-name">{workspace.name}</span>
              {isDefault && <Tag className="role-form-ws-default-tag">默认</Tag>}
            </Checkbox>
            {workspace.description && (
              <span className="role-form-ws-desc">{workspace.description}</span>
            )}
          </div>
        );
      })}
    </div>
  </>
);

export default RoleFormWorkspaceSection;
