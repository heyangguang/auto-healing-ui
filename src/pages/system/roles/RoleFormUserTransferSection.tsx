import React, { useMemo } from 'react';
import { Transfer } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { toRoleTransferItems } from './roleFormHelpers';
import type { AssignableUser } from './roleFormTypes';

type RoleFormUserTransferSectionProps = {
  allUsers: AssignableUser[];
  selectedUserIds: string[];
  onChange: (nextUserIds: string[]) => void;
};

const RoleFormUserTransferSection: React.FC<RoleFormUserTransferSectionProps> = ({
  allUsers,
  selectedUserIds,
  onChange,
}) => {
  const transferItems = useMemo(() => toRoleTransferItems(allUsers), [allUsers]);

  return (
    <>
      <div className="role-form-divider" />
      <div className="role-form-section-title">
        <UserOutlined style={{ marginRight: 6 }} />
        分配用户
        <span className="role-form-section-count">
          已选择 {selectedUserIds.length} / {allUsers.length} 个用户
        </span>
      </div>
      <div style={{ marginBottom: 12, color: '#8c8c8c', fontSize: 12 }}>
        当前租户用户为单角色模型。这里仅支持把用户赋予到当前角色；如需移出，请到用户编辑页改成其他角色。
      </div>
      <div className="role-form-transfer-wrap">
        <Transfer
          dataSource={transferItems}
          targetKeys={selectedUserIds}
          onChange={(targetKeys) => onChange(targetKeys as string[])}
          oneWay
          showSearch
          showSelectAll
          filterOption={(input, item) => {
            const query = input.toLowerCase();
            return (
              (item.title || '').toLowerCase().includes(query)
              || (item.description || '').toLowerCase().includes(query)
            );
          }}
          titles={['可选用户', '将赋予当前角色']}
          locale={{
            itemUnit: '人',
            itemsUnit: '人',
            searchPlaceholder: '搜索用户名或姓名',
          }}
          listStyle={{ width: 320, height: 320 }}
          render={(item) => (
            <span className="role-form-transfer-item">
              <span className="role-form-transfer-name">{item.title}</span>
              <span className="role-form-transfer-username">{item.description}</span>
            </span>
          )}
        />
      </div>
    </>
  );
};

export default RoleFormUserTransferSection;
