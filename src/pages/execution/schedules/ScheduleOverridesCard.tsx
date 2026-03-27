import { Alert, Col, Form, Row, Tag } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
import HostSelector from '@/components/HostSelector';
import SecretsSelector from '@/components/SecretsSelector';

interface ScheduleOverridesCardProps {
    secretsSourceIds: string[];
    secretsSources: AutoHealing.SecretsSource[];
    targetHostsOverride: string[];
    onSecretsSourceIdsChange: (ids: string[]) => void;
    onTargetHostsOverrideChange: (hosts: string[]) => void;
}

const ScheduleOverridesCard: React.FC<ScheduleOverridesCardProps> = ({
    secretsSourceIds,
    secretsSources,
    targetHostsOverride,
    onSecretsSourceIdsChange,
    onTargetHostsOverrideChange,
}) => (
    <div className="template-form-card">
        <h4 className="template-form-section-title">
            <SettingOutlined />执行参数覆盖
            <Tag color="orange" style={{ marginLeft: 8, fontWeight: 400 }}>覆盖模式</Tag>
            <span style={{ marginLeft: 'auto', fontSize: 12, fontWeight: 400, color: '#8c8c8c' }}>
                留空则使用模板默认值
            </span>
        </h4>
        <Alert
            message="调度执行时，以下参数将覆盖任务模板的默认配置"
            type="info"
            showIcon
            style={{ marginBottom: 20 }}
        />
        <Row gutter={16}>
            <Col span={12}>
                <Form.Item
                    label="目标主机覆盖"
                    extra="留空则使用模板的默认目标主机"
                    tooltip="选择后将覆盖任务模板中配置的目标主机"
                >
                    <HostSelector
                        value={targetHostsOverride}
                        onChange={onTargetHostsOverrideChange}
                    />
                </Form.Item>
            </Col>
            <Col span={12}>
                <Form.Item
                    label="密钥源覆盖"
                    extra="可选，选择后将覆盖模板的默认凭据"
                    tooltip="选择用于 SSH 连接的凭据"
                >
                    <SecretsSelector
                        value={secretsSourceIds}
                        onChange={onSecretsSourceIdsChange}
                        dataSource={secretsSources}
                    />
                </Form.Item>
            </Col>
        </Row>
    </div>
);

export default ScheduleOverridesCard;
