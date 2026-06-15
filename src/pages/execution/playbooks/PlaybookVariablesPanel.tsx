import { Empty, Input, Select, Switch, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import React from 'react';
import PlaybookVariableDefaultCell from './PlaybookVariableDefaultCell';
import PlaybookVariableValidationButton from './PlaybookVariableValidationButton';
import {
  normalizeVariableEditorType,
  updateVariableList,
  variableTypeOptions,
} from './playbookVariableHelpers';

const { Text } = Typography;

const PlaybookVariablesPanel: React.FC<{
  canManage: boolean;
  deferredVariables: AutoHealing.PlaybookVariable[];
  editedVariables: AutoHealing.PlaybookVariable[];
  isVariablesStale: boolean;
  onAutoSave: (variables: AutoHealing.PlaybookVariable[]) => void;
}> = ({
  canManage,
  deferredVariables,
  editedVariables,
  isVariablesStale,
  onAutoSave,
}) => {
  const columns: ColumnsType<AutoHealing.PlaybookVariable> = [
    {
      title: '变量名',
      dataIndex: 'name',
      width: 220,
      render: (value: string, record) => (
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14 }}>
            {record.description || value}
          </div>
          {record.description ? (
            <Text
              type="secondary"
              style={{ fontSize: 12, fontFamily: 'monospace' }}
            >
              {value}
            </Text>
          ) : null}
        </div>
      ),
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 100,
      render: (value: string, record) => {
        const normalizedType = normalizeVariableEditorType(value);
        return (
          <Select
            variant="borderless"
            value={normalizedType}
            popupMatchSelectWidth={false}
            disabled={!canManage}
            style={{ width: 90, fontWeight: 500 }}
            onChange={(nextValue) => {
              onAutoSave(
                updateVariableList(editedVariables, record.name, (current) => ({
                  ...current,
                  type: nextValue as AutoHealing.PlaybookVariableType,
                })),
              );
            }}
            options={variableTypeOptions}
          />
        );
      },
    },
    {
      title: '必填',
      dataIndex: 'required',
      width: 70,
      align: 'center',
      render: (value: boolean, record) => (
        <Switch
          size="small"
          checked={value}
          disabled={!canManage}
          onChange={(nextValue) => {
            onAutoSave(
              updateVariableList(editedVariables, record.name, (current) => ({
                ...current,
                required: nextValue,
              })),
            );
          }}
        />
      ),
    },
    {
      title: '默认值',
      dataIndex: 'default',
      width: 180,
      render: (_value, record) => (
        <PlaybookVariableDefaultCell
          canManage={canManage}
          editedVariables={editedVariables}
          onAutoSave={onAutoSave}
          key={`${record.name}-default-${record.type}-${JSON.stringify(record.default ?? null)}`}
          variable={record}
        />
      ),
    },
    {
      title: '描述',
      dataIndex: 'description',
      width: 220,
      ellipsis: true,
      render: (value: string | undefined, record) => (
        <Input
          key={`${record.name}-desc-${value || ''}`}
          variant="borderless"
          defaultValue={value || ''}
          placeholder="-"
          disabled={!canManage}
          style={{ width: '100%' }}
          onBlur={(event) => {
            const nextValue = event.target.value;
            if (nextValue !== (value || '')) {
              onAutoSave(
                updateVariableList(editedVariables, record.name, (current) => ({
                  ...current,
                  description: nextValue,
                })),
              );
            }
          }}
          onPressEnter={(event) => (event.target as HTMLInputElement).blur()}
        />
      ),
    },
    {
      title: '验证',
      width: 60,
      align: 'center',
      render: (_, record) => (
        <PlaybookVariableValidationButton
          canManage={canManage}
          editedVariables={editedVariables}
          onAutoSave={onAutoSave}
          key={`${record.name}-validation-${record.type}-${record.pattern || ''}-${record.min ?? ''}-${record.max ?? ''}-${(record.enum || []).join('|')}`}
          variable={record}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24, overflowY: 'auto', flex: 1 }}>
      {editedVariables.length > 0 ? (
        <>
          <div style={{ marginBottom: 16 }}>
            <Text type="secondary">
              共 {editedVariables.length} 个变量
              {canManage ? '，修改后自动保存' : '（只读）'}
            </Text>
          </div>
          <Table
            size="middle"
            rowKey="name"
            dataSource={deferredVariables}
            pagination={false}
            style={{
              opacity: isVariablesStale ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
            columns={columns}
          />
        </>
      ) : (
        <Empty
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          description="暂无变量，请先扫描"
        />
      )}
    </div>
  );
};

export default PlaybookVariablesPanel;
