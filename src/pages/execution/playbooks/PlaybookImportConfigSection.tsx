import React from 'react';
import { AppstoreOutlined, CloudDownloadOutlined, CodeOutlined, FileTextOutlined } from '@ant-design/icons';
import { Button, Col, Divider, Input, Row, Select, Tooltip, Typography } from 'antd';
import type { PlaybookImportItem } from './playbookImportUtils';

const { Text, Title } = Typography;

type PlaybookImportConfigSectionProps = {
    access: { canImportPlaybook?: boolean };
    creating: boolean;
    playbooks: PlaybookImportItem[];
    onCreate: () => void;
    onCancel: () => void;
    onConfigModeChange: (index: number, value: 'auto' | 'enhanced') => void;
    onNameChange: (index: number, value: string) => void;
};

export default function PlaybookImportConfigSection(props: PlaybookImportConfigSectionProps) {
    const { access, creating, playbooks, onCancel, onConfigModeChange, onCreate, onNameChange } = props;
    if (playbooks.length === 0) {
        return null;
    }

    return (
        <>
            <Divider dashed />
            <Title level={5} style={{ marginBottom: 4, color: '#595959' }}>
                <AppstoreOutlined style={{ marginRight: 8 }} />Playbook 配置
            </Title>
            <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 16 }}>
                为每个 Playbook 设置名称和扫描模式。
                <Tooltip title="自动模式：基础变量扫描 | 增强模式：深度扫描（包括注释中的变量）">
                    <Text type="secondary" style={{ fontSize: 12, marginLeft: 4, cursor: 'help', textDecoration: 'underline dotted' }}>扫描模式说明</Text>
                </Tooltip>
            </Text>

            <div className="playbook-import-config-list">
                {playbooks.map((playbook, index) => (
                    <div key={playbook.file} className="playbook-import-config-item">
                        <div className="playbook-import-config-file">
                            <FileTextOutlined style={{ color: '#1890ff', marginRight: 6 }} />
                            <code>{playbook.file}</code>
                        </div>
                        <Row gutter={12} style={{ marginTop: 8 }}>
                            <Col flex="1">
                                <Input placeholder="Playbook 名称" value={playbook.name} prefix={<CodeOutlined style={{ color: '#bfbfbf' }} />} onChange={(event) => onNameChange(index, event.target.value)} disabled={creating} />
                            </Col>
                            <Col>
                                <Select value={playbook.config_mode} onChange={(value) => onConfigModeChange(index, value)} style={{ width: 100 }} options={[{ value: 'auto', label: '自动' }, { value: 'enhanced', label: '增强' }]} disabled={creating} />
                            </Col>
                        </Row>
                    </div>
                ))}
            </div>

            <Divider dashed />
            <div className="plugin-form-actions">
                <Button onClick={onCancel} disabled={creating}>取消</Button>
                <Button type="primary" onClick={onCreate} loading={creating} disabled={playbooks.some((item) => !item.name) || !access.canImportPlaybook} icon={<CloudDownloadOutlined />}>
                    导入 {playbooks.length} 个 Playbook
                </Button>
            </div>
        </>
    );
}
