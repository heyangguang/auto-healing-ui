import { Alert, DatePicker, Form, Modal } from 'antd';
import dayjs from 'dayjs';

interface ScheduleEnableOnceModalProps {
    confirmLoading: boolean;
    state: {
        visible: boolean;
        schedule: AutoHealing.ExecutionSchedule | null;
        newScheduledAt: dayjs.Dayjs | null;
    };
    onConfirm: () => void;
    onScheduledAtChange: (value: dayjs.Dayjs | null) => void;
    onClose: () => void;
}

const ScheduleEnableOnceModal: React.FC<ScheduleEnableOnceModalProps> = ({
    confirmLoading,
    state,
    onConfirm,
    onScheduledAtChange,
    onClose,
}) => (
    <Modal
        title="设置执行时间"
        open={state.visible}
        onCancel={onClose}
        onOk={onConfirm}
        okText="启用调度"
        cancelText="取消"
        confirmLoading={confirmLoading}
    >
        <Alert
            type="info"
            message="单次执行调度需要设置新的执行时间才能启用"
            style={{ marginBottom: 16 }}
            showIcon
        />
        <Form.Item label="执行时间" required>
            <DatePicker
                showTime
                format="YYYY-MM-DD HH:mm:ss"
                placeholder="选择新的执行时间"
                style={{ width: '100%' }}
                value={state.newScheduledAt}
                onChange={onScheduledAtChange}
            />
        </Form.Item>
    </Modal>
);

export default ScheduleEnableOnceModal;
