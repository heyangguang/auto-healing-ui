import { Form } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import NotificationSelector from '@/components/NotificationSelector';

interface TemplateNotificationCardProps {
    notifyChannels: AutoHealing.NotificationChannel[];
    notifyTemplates: AutoHealing.NotificationTemplate[];
}

const TemplateNotificationCard: React.FC<TemplateNotificationCardProps> = ({
    notifyChannels,
    notifyTemplates,
}) => (
    <div className="template-form-card">
        <h4 className="template-form-section-title">
            <BellOutlined />通知配置
        </h4>

        <Form.Item name="notification_config" noStyle>
            <NotificationSelector
                channels={notifyChannels}
                templates={notifyTemplates}
            />
        </Form.Item>
    </div>
);

export default TemplateNotificationCard;
