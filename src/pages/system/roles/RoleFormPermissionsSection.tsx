import React from 'react';
import { Checkbox, Tag } from 'antd';
import { PERMISSION_MODULE_LABELS as MODULE_LABELS } from '@/constants/permissionDicts';

type RoleFormPermissionsSectionProps = {
  permissionTree: AutoHealing.PermissionTree;
  checkedKeys: string[];
  allPermissionIds: string[];
  onSelectAll: () => void;
  onClear: () => void;
  onModuleToggle: (module: string, checked: boolean) => void;
  onPermissionToggle: (permissionId: string, checked: boolean) => void;
};

const RoleFormPermissionsSection: React.FC<RoleFormPermissionsSectionProps> = ({
  permissionTree,
  checkedKeys,
  allPermissionIds,
  onSelectAll,
  onClear,
  onModuleToggle,
  onPermissionToggle,
}) => (
  <>
    <div className="role-form-divider" />
    <div className="role-form-section-title">
      权限分配
      <span className="role-form-section-count">
        已选择 {checkedKeys.length} / {allPermissionIds.length} 个权限
      </span>
    </div>

    <div className="role-form-perm-actions">
      <a onClick={onSelectAll}>全选</a>
      <a onClick={onClear}>清空</a>
    </div>

    <div className="role-form-perm-container">
      {Object.entries(permissionTree).map(([module, permissions]) => {
        const moduleIds = permissions.map((permission) => permission.id);
        const checkedCount = moduleIds.filter((id) => checkedKeys.includes(id)).length;
        const allChecked = checkedCount === moduleIds.length;
        const indeterminate = checkedCount > 0 && checkedCount < moduleIds.length;

        return (
          <div key={module} className="role-form-perm-module">
            <div className="role-form-perm-module-header">
              <Checkbox
                checked={allChecked}
                indeterminate={indeterminate}
                onChange={(event) => onModuleToggle(module, event.target.checked)}
              >
                <span className="role-form-perm-module-name">
                  {MODULE_LABELS[module] || module}
                </span>
              </Checkbox>
              <Tag className="role-form-perm-module-tag">{module}</Tag>
            </div>
            <div className="role-form-perm-items">
              {permissions.map((permission) => (
                <Checkbox
                  key={permission.id}
                  checked={checkedKeys.includes(permission.id)}
                  onChange={(event) => onPermissionToggle(permission.id, event.target.checked)}
                  className="role-form-perm-checkbox"
                >
                  <span className="role-form-perm-label">
                    {permission.name}
                    <span className="role-form-perm-code">({permission.code})</span>
                  </span>
                </Checkbox>
              ))}
            </div>
          </div>
        );
      })}
      {Object.keys(permissionTree).length === 0 && (
        <div style={{ color: '#bfbfbf', textAlign: 'center', padding: 40 }}>
          暂无权限数据
        </div>
      )}
    </div>
  </>
);

export default RoleFormPermissionsSection;
