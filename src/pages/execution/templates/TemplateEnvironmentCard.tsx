import { Col, Form, Row, Select } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import HostSelector from '@/components/HostSelector';
import { DockerExecIcon, LocalExecIcon } from './TemplateIcons';

const TemplateEnvironmentCard: React.FC = () => (
    <div className="template-form-card">
        <h4 className="template-form-section-title">
            <GlobalOutlined />执行环境
        </h4>

        <Row gutter={16}>
            <Col span={8}>
                <Form.Item
                    name="executor_type"
                    label="执行器类型"
                    tooltip="本地进程：通过 SSH 连接远程主机执行；容器环境：在 Docker 容器内执行"
                >
                    <Select
                        options={[
                            {
                                label: (
                                    <span>
                                        <LocalExecIcon size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                                        本地进程 (SSH)
                                    </span>
                                ),
                                value: 'local',
                            },
                            {
                                label: (
                                    <span>
                                        <DockerExecIcon size={14} style={{ marginRight: 6, verticalAlign: '-2px' }} />
                                        容器 (Docker)
                                    </span>
                                ),
                                value: 'docker',
                            },
                        ]}
                    />
                </Form.Item>
            </Col>
        </Row>

        <Form.Item
            name="target_hosts"
            label="目标主机"
            rules={[{ required: true, message: '请至少选择一台目标主机' }]}
            extra="从 CMDB 资产库选择目标主机，支持多选"
            tooltip="选择该模板执行时的目标主机列表"
        >
            <HostSelector />
        </Form.Item>
    </div>
);

export default TemplateEnvironmentCard;
