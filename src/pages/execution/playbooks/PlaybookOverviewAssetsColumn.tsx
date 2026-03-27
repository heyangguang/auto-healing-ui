import React from 'react';
import { FileTextOutlined } from '@ant-design/icons';
import { Card, Space, Tag, Typography } from 'antd';
import { variableTypeConfig } from './playbookVariableHelpers';

const { Text } = Typography;

type PlaybookOverviewAssetsColumnProps = {
    playbook: AutoHealing.Playbook;
    playbookFiles: AutoHealing.PlaybookFile[];
};

const buildVariableTypeCounts = (playbook: AutoHealing.Playbook) =>
    (playbook.variables || []).reduce<Record<string, number>>((counts, variable) => {
        counts[variable.type] = (counts[variable.type] || 0) + 1;
        return counts;
    }, {});

export default function PlaybookOverviewAssetsColumn(props: PlaybookOverviewAssetsColumnProps) {
    const { playbook, playbookFiles } = props;
    const variableTypeCounts = buildVariableTypeCounts(playbook);

    return (
        <>
            <Card title={`文件列表 (${playbookFiles.length})`} size="small" style={{ marginBottom: 16 }}>
                {playbookFiles.length > 0 ? (
                    <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                        {playbookFiles.map((file, index) => (
                            <div key={`${file.path}-${index}`} style={{ padding: '4px 0', borderBottom: index < playbookFiles.length - 1 ? '1px solid #f0f0f0' : 'none' }}>
                                <Space>
                                    <FileTextOutlined style={{ color: file.type === 'entry' ? '#1890ff' : '#8c8c8c' }} />
                                    <Text code style={{ fontSize: 12 }}>{file.path}</Text>
                                    <Tag color={file.type === 'entry' ? 'blue' : file.type === 'task' ? 'green' : 'default'} style={{ fontSize: 10 }}>
                                        {file.type}
                                    </Tag>
                                </Space>
                            </div>
                        ))}
                    </div>
                ) : <Text type="secondary">暂无文件信息，请先扫描</Text>}
            </Card>

            {playbook.variables && playbook.variables.length > 0 && (
                <Card title="变量类型分布" size="small">
                    <Space wrap>
                        {Object.entries(variableTypeCounts).map(([type, count]) => {
                            const config = variableTypeConfig[type] || variableTypeConfig.string;
                            return (
                                <Tag key={type} color={config.color}>
                                    {config.text}: {count}
                                </Tag>
                            );
                        })}
                    </Space>
                </Card>
            )}
        </>
    );
}
