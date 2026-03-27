import React from 'react';
import { Alert, Button, DatePicker, Input, Modal } from 'antd';
import { ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

type CMDBMaintenanceModalProps = {
    endAt?: string;
    onCancel: () => void;
    onConfirm: () => void;
    onEndAtChange: (value?: string) => void;
    onReasonChange: (value: string) => void;
    open: boolean;
    reason: string;
    selectedCount: number;
    target: AutoHealing.CMDBItem | null;
};

const QUICK_PICK_HOURS = [
    { label: '2小时后', hours: 2 },
    { label: '4小时后', hours: 4 },
    { label: '8小时后', hours: 8 },
    { label: '24小时后', hours: 24 },
    { label: '3天后', hours: 72 },
    { label: '7天后', hours: 168 },
];

export const CMDBMaintenanceModal: React.FC<CMDBMaintenanceModalProps> = ({
    endAt,
    onCancel,
    onConfirm,
    onEndAtChange,
    onReasonChange,
    open,
    reason,
    selectedCount,
    target,
}) => (
    <Modal
        title={(
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <ToolOutlined style={{ color: '#faad14' }} />
                <span>{target ? `进入维护模式 - ${target.name}` : `批量进入维护模式 (${selectedCount})`}</span>
            </div>
        )}
        open={open}
        onCancel={onCancel}
        okText="确认进入"
        okButtonProps={{ disabled: !reason, icon: <ToolOutlined /> }}
        onOk={onConfirm}
        destroyOnHidden
    >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <Alert
                type="info"
                showIcon
                message="批量维护操作说明"
                description={target
                    ? `${target.name} 将被标记为维护模式，暂时不参与自愈流程。`
                    : `选中的 ${selectedCount} 台主机将被标记为维护模式，暂时不参与自愈流程。`}
            />

            <div>
                <div style={{ marginBottom: 6, fontSize: 13 }}>维护原因（必填）：</div>
                <Input.TextArea
                    rows={3}
                    placeholder="例如：批量系统升级、机房断电维护..."
                    value={reason}
                    onChange={(event) => onReasonChange(event.target.value)}
                    maxLength={200}
                    showCount
                />
            </div>

            <div>
                <div style={{ marginBottom: 6, fontSize: 13 }}>计划结束时间（可选）：</div>
                <DatePicker
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY/MM/DD HH:mm"
                    placeholder="YYYY/MM/DD hh:mm"
                    style={{ width: '100%' }}
                    value={endAt ? dayjs(endAt) : undefined}
                    onChange={(value) => onEndAtChange(value ? value.toISOString() : undefined)}
                    disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}>
                    {QUICK_PICK_HOURS.map((item) => (
                        <Button
                            key={item.hours}
                            size="small"
                            onClick={() => onEndAtChange(dayjs().add(item.hours, 'hour').toISOString())}
                        >
                            {item.label}
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    </Modal>
);
