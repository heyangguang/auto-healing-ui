import { Form, Input, Radio, DatePicker } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import CronEditor from '@/components/CronEditor';

const ScheduleInfoCard: React.FC = () => (
    <div className="template-form-card">
        <h4 className="template-form-section-title">
            <ClockCircleOutlined />调度信息
        </h4>
        <Form.Item name="task_id" hidden>
            <Input />
        </Form.Item>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Form.Item
                name="name"
                label="调度名称"
                rules={[{ required: true, message: '请输入调度名称' }]}
                extra="简短描述该调度的用途，例如「每日数据库备份」"
            >
                <Input placeholder="例如：每日数据库备份" />
            </Form.Item>
            <Form.Item
                name="schedule_type"
                label="调度类型"
                rules={[{ required: true, message: '请选择调度类型' }]}
                tooltip="循环执行：按 Cron 表达式周期性触发；单次执行：在指定时间执行一次"
            >
                <Radio.Group>
                    <Radio.Button value="cron">循环执行 (Cron)</Radio.Button>
                    <Radio.Button value="once">单次执行</Radio.Button>
                </Radio.Group>
            </Form.Item>
        </div>
        <Form.Item noStyle shouldUpdate={(prev, curr) => prev.schedule_type !== curr.schedule_type}>
            {({ getFieldValue }) => {
                const scheduleType = getFieldValue('schedule_type');
                if (scheduleType === 'once') {
                    return (
                        <Form.Item
                            label="执行时间"
                            name="scheduled_at"
                            rules={[{ required: true, message: '请选择执行时间' }]}
                            extra="选择具体的日期和时间"
                        >
                            <DatePicker
                                showTime
                                format="YYYY-MM-DD HH:mm:ss"
                                placeholder="选择执行时间"
                                style={{ width: '100%' }}
                            />
                        </Form.Item>
                    );
                }
                return (
                    <Form.Item
                        label="Cron 表达式"
                        name="schedule_expr"
                        rules={[{ required: scheduleType === 'cron', message: '请设置 Cron 表达式' }]}
                        extra="定义调度的执行周期"
                    >
                        <CronEditor size="middle" />
                    </Form.Item>
                );
            }}
        </Form.Item>
        <Form.Item
            name="description"
            label="备注描述"
            extra="可选，用于记录该调度的详细说明或注意事项"
        >
            <Input.TextArea rows={3} placeholder="可选：任务用途说明..." showCount maxLength={500} />
        </Form.Item>
    </div>
);

export default ScheduleInfoCard;
