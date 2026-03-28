import { Col, Row, Tag, Typography } from 'antd';
import { RocketOutlined } from '@ant-design/icons';
import { getExecutorConfig } from '@/constants/executionDicts';
import HostList from '../execute/components/HostList';

const { Text } = Typography;

interface ScheduleSelectedTemplateCardProps {
    selectedTemplate: AutoHealing.ExecutionTask;
}

const ScheduleSelectedTemplateCard: React.FC<ScheduleSelectedTemplateCardProps> = ({
    selectedTemplate,
}) => {
    const executor = getExecutorConfig(selectedTemplate.executor_type);
    return (
        <div className="template-form-card">
            <h4 className="template-form-section-title">
                <RocketOutlined />
                任务模板
                <Tag color={executor.tagColor || executor.color} style={{ marginLeft: 8, fontWeight: 400 }}>
                    {executor.label}
                </Tag>
            </h4>
            <Row gutter={16}>
                <Col span={8}>
                    <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            模板名称
                        </Text>
                    </div>
                    <Text strong>{selectedTemplate.name}</Text>
                </Col>
                <Col span={8}>
                    <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            Playbook
                        </Text>
                    </div>
                    <Text>{selectedTemplate.playbook?.name || 'N/A'}</Text>
                </Col>
                <Col span={8}>
                    <div style={{ marginBottom: 4 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            默认主机
                        </Text>
                    </div>
                    <HostList hosts={selectedTemplate.target_hosts || ''} />
                </Col>
            </Row>
        </div>
    );
};

export default ScheduleSelectedTemplateCard;
