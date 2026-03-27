import { Col, Form, Input, Row } from 'antd';
import { ThunderboltOutlined } from '@ant-design/icons';
import PlaybookSelector from '@/components/PlaybookSelector';

interface TemplateBasicInfoCardProps {
    form: ReturnType<typeof Form.useForm>[0];
    playbooks: AutoHealing.Playbook[];
    onSelectPlaybook: (playbookId: string) => void;
}

const TemplateBasicInfoCard: React.FC<TemplateBasicInfoCardProps> = ({
    form,
    playbooks,
    onSelectPlaybook,
}) => (
    <div className="template-form-card">
        <h4 className="template-form-section-title">
            <ThunderboltOutlined />基础信息
        </h4>

        <Row gutter={16}>
            <Col span={12}>
                <Form.Item
                    name="name"
                    label="模板名称"
                    rules={[{ required: true, message: '请输入模板名称' }]}
                    extra="简短描述该模板的用途，例如「日志轮转」「安全补丁」"
                >
                    <Input placeholder="例如：生产环境 Nginx 日志轮转" />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    name="playbook_id"
                    label="关联 Playbook"
                    rules={[{ required: true, message: '请选择 Playbook' }]}
                    tooltip="选择要执行的自动化脚本蓝图，关联后将自动载入变量定义"
                    extra="选择后将自动加载变量配置"
                >
                    <PlaybookSelector
                        playbooks={playbooks}
                        value={form.getFieldValue('playbook_id')}
                        onChange={onSelectPlaybook}
                    />
                </Form.Item>
            </Col>
        </Row>

        <Form.Item
            name="description"
            label="任务描述"
            extra="可选，用于记录该模板的详细说明或注意事项"
        >
            <Input.TextArea
                placeholder="例如：每日凌晨 2 点执行日志轮转，保留 7 天..."
                rows={3}
                showCount
                maxLength={500}
            />
        </Form.Item>
    </div>
);

export default TemplateBasicInfoCard;
