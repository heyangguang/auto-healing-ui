import React from 'react';
import { Tag, Typography } from 'antd';
import type { PlaybookStatusSummary } from './playbookTypes';
import PlaybookOverviewAssetsColumn from './PlaybookOverviewAssetsColumn';
import PlaybookOverviewInfoColumn from './PlaybookOverviewInfoColumn';
import PlaybookStatusAlert from './PlaybookStatusAlert';

const { Text } = Typography;

type ProviderInfo = {
    icon: React.ReactNode;
    color: string;
    label: string;
};

type PlaybookOverviewPanelProps = {
    getProviderInfo: (url: string) => ProviderInfo;
    playbook: AutoHealing.Playbook;
    repos: AutoHealing.GitRepository[];
    scanLogs: AutoHealing.PlaybookScanLog[];
    statusInfo: PlaybookStatusSummary;
};

const hasDefaultValue = (value: unknown) => value !== undefined && value !== null;

function PlaybookOverviewSummaryTags(props: { playbook: AutoHealing.Playbook; scanLogs: AutoHealing.PlaybookScanLog[] }) {
    const { playbook, scanLogs } = props;
    return (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <Tag style={{ padding: '2px 10px', fontSize: 13, borderRadius: 4, margin: 0 }}>
                变量 <Text strong>{playbook.variables?.length || 0}</Text>
            </Tag>
            <Tag color="error" style={{ padding: '2px 10px', fontSize: 13, borderRadius: 4, margin: 0 }}>
                必填 <Text strong style={{ color: '#ff4d4f' }}>{playbook.variables?.filter((variable) => variable.required).length || 0}</Text>
            </Tag>
            <Tag color="success" style={{ padding: '2px 10px', fontSize: 13, borderRadius: 4, margin: 0 }}>
                默认值 <Text strong style={{ color: '#52c41a' }}>{playbook.variables?.filter((variable) => hasDefaultValue(variable.default)).length || 0}</Text>
            </Tag>
            <Tag style={{ padding: '2px 10px', fontSize: 13, borderRadius: 4, margin: 0 }}>
                扫描 <Text strong>{scanLogs.length}</Text> 次
            </Tag>
        </div>
    );
}

export default function PlaybookOverviewPanel(props: PlaybookOverviewPanelProps) {
    const { getProviderInfo, playbook, repos, scanLogs, statusInfo } = props;
    const repo = repos.find((item) => item.id === playbook.repository_id);

    return (
        <div className="pb-overview-panel">
            <PlaybookOverviewSummaryTags playbook={playbook} scanLogs={scanLogs} />
            <div className="pb-overview-stack">
                <PlaybookOverviewInfoColumn getProviderInfo={getProviderInfo} playbook={playbook} repo={repo || undefined} statusInfo={statusInfo} />
                <PlaybookOverviewAssetsColumn playbook={playbook} />
            </div>
            <PlaybookStatusAlert playbook={playbook} />
        </div>
    );
}
