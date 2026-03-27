import { Tooltip } from 'antd';
import {
    CodeOutlined,
    ContainerOutlined,
    ExclamationCircleOutlined,
    ThunderboltOutlined,
} from '@ant-design/icons';
import React from 'react';
import { TemplateStatItem, TemplateStats } from './templateListHelpers';

type TemplateStatsBarProps = {
    stats: TemplateStats;
};

const TemplateStatsBar: React.FC<TemplateStatsBarProps> = ({ stats }) => {
    const items: TemplateStatItem[] = [
        { icon: <ThunderboltOutlined />, cls: 'total', val: stats.total, lbl: '全部模板' },
        { icon: <ContainerOutlined />, cls: 'docker', val: stats.docker, lbl: 'Docker' },
        { icon: <CodeOutlined />, cls: 'local', val: stats.local, lbl: 'Local / SSH' },
        {
            icon: <ExclamationCircleOutlined />,
            cls: 'review',
            val: stats.needsReview,
            lbl: '待审核模板',
            tip: stats.needsReview > 0 ? `${stats.needsReview} 个模板需审核（涉及 ${stats.changedPlaybooks} 个 Playbook 变更）` : undefined,
        },
    ];

    return (
        <div className="template-stats-bar">
            {items.map((item, index) => (
                <React.Fragment key={item.cls}>
                    {index > 0 && <div className="template-stat-divider" />}
                    <Tooltip title={item.tip} placement="bottom">
                        <div className="template-stat-item" style={{ cursor: item.tip ? 'help' : undefined }}>
                            <span className={`template-stat-icon template-stat-icon-${item.cls}`}>{item.icon}</span>
                            <div className="template-stat-content">
                                <div className="template-stat-value">{item.val}</div>
                                <div className="template-stat-label">{item.lbl}</div>
                            </div>
                        </div>
                    </Tooltip>
                </React.Fragment>
            ))}
        </div>
    );
};

export default TemplateStatsBar;
