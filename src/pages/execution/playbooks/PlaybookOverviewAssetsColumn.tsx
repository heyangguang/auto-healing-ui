import React from 'react';
import { Card, Space, Tag } from 'antd';
import { variableTypeConfig } from './playbookVariableHelpers';

type PlaybookOverviewAssetsColumnProps = {
    playbook: AutoHealing.Playbook;
};

const buildVariableTypeCounts = (playbook: AutoHealing.Playbook) =>
    (playbook.variables || []).reduce<Record<string, number>>((counts, variable) => {
        counts[variable.type] = (counts[variable.type] || 0) + 1;
        return counts;
    }, {});

export default function PlaybookOverviewAssetsColumn(props: PlaybookOverviewAssetsColumnProps) {
    const { playbook } = props;
    if (!playbook.variables || playbook.variables.length === 0) {
        return null;
    }

    const variableTypeCounts = buildVariableTypeCounts(playbook);

    return (
        <div className="pb-overview-assets-column">
            <Card title="变量类型分布" size="small" className="pb-overview-section-card">
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
        </div>
    );
}
