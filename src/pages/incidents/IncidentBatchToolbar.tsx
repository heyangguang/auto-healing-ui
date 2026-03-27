import React from 'react';
import { UndoOutlined } from '@ant-design/icons';
import { Button } from 'antd';

type IncidentBatchToolbarProps = {
  canTriggerHealing: boolean;
  onClearSelection: () => void;
  onResetScan: () => void;
  selectedCount: number;
};

export const IncidentBatchToolbar: React.FC<IncidentBatchToolbarProps> = ({
  canTriggerHealing,
  onClearSelection,
  onResetScan,
  selectedCount,
}) => {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className="incidents-batch-bar" style={{ gap: 6 }}>
      <span style={{ fontSize: 13, color: '#1677ff', fontWeight: 500 }}>
        已选 {selectedCount} 项
      </span>
      <Button
        size="small"
        icon={<UndoOutlined />}
        disabled={!canTriggerHealing}
        onClick={onResetScan}
      >
        重置扫描
      </Button>
      <Button type="link" style={{ color: '#8c8c8c' }} onClick={onClearSelection}>
        取消选择
      </Button>
    </div>
  );
};
