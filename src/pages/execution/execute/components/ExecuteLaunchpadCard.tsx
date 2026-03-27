import React from 'react';
import { CheckCircleOutlined, ClockCircleOutlined, KeyOutlined, WarningOutlined, BellOutlined, ProjectOutlined, DesktopOutlined, SettingOutlined } from '@ant-design/icons';
import { Col } from 'antd';
import { hasEffectiveNotificationConfig } from '@/utils/notificationConfig';
import { splitTargetHosts } from './HostList';

interface ExecuteLaunchpadCardProps {
    template: AutoHealing.ExecutionTask;
    onSelect: (template: AutoHealing.ExecutionTask) => void;
}

const ExecuteLaunchpadCard: React.FC<ExecuteLaunchpadCardProps> = ({
    template,
    onSelect,
}) => {
    const hosts = splitTargetHosts(template.target_hosts);
    const varCount = template.playbook_variables_snapshot?.length || 0;
    const configuredCount = Object.keys(template.extra_vars || {}).length;
    const secretCount = template.secrets_source_ids?.length || 0;
    const playbookKnownOffline = !!template.playbook && template.playbook.status !== 'ready';
    const disabled = !!template.needs_review || playbookKnownOffline;
    const isDocker = template.executor_type === 'docker';
    const hasNotify = hasEffectiveNotificationConfig(template.notification_config as never);

    const cardClass = [
        'launchpad-card',
        disabled ? 'launchpad-card-disabled' : '',
        template.needs_review ? 'launchpad-card-review' : '',
        playbookKnownOffline && !template.needs_review ? 'launchpad-card-offline' : '',
    ].filter(Boolean).join(' ');

    return (
        <Col xs={24} sm={12} md={12} lg={8} xl={6} xxl={6}>
            <div
                className={cardClass}
                onClick={() => {
                    if (disabled) {
                        return;
                    }
                    onSelect(template);
                }}
            >
                <div className={`launchpad-card-stub ${isDocker ? 'launchpad-stub-docker' : 'launchpad-stub-ssh'}`}>
                    <div className="launchpad-card-stub-icon">
                        {isDocker ? (
                            <svg viewBox="0 0 640 512" fill="currentColor">
                                <path d="M349.9 236.3h-66.1v-59.4h66.1v59.4zm0-204.3h-66.1v60.7h66.1V32zm78.2 144.8H362v59.4h66.1v-59.4zm-156.3-72.1h-66.1v60.1h66.1v-60.1zm78.1 0h-66.1v60.1h66.1v-60.1zm276.8 100c-14.4-9.7-47.6-13.2-73.1-8.4-3.3-24-16.7-44.9-41.1-63.7l-14-9.3-9.3 14c-18.4 27.8-23.4 73.6-3.7 103.8-8.7 4.7-25.8 11.1-48.4 10.7H2.4c-7.6 42.6-3.4 97.6 28.6 144.4 30 44 75.4 66.4 134.2 66.4 127.6 0 221.9-58.7 266.4-165.1 17.3.3 54.7.3 73.8-36.4.5-1 11.1-22.9 11.1-22.9l-14.5-9.5zM349.9 32h-66.1v60.7h66.1V32zm-78.2 72.1h-66.1v60.1h66.1v-60.1zm0-72.1h-66.1v60.7h66.1V32zm-78.1 72.1h-66.1v60.1h66.1v-60.1z" />
                            </svg>
                        ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="4 17 10 11 4 5" />
                                <line x1="12" y1="19" x2="20" y2="19" />
                            </svg>
                        )}
                    </div>
                    <div className="launchpad-card-type-label">{isDocker ? 'DOCKER' : 'SSH'}</div>
                </div>

                <div className="launchpad-card-body">
                    <div className="launchpad-card-header">
                        <div className="launchpad-card-title">{template.name || '未命名任务'}</div>
                        {template.needs_review ? (
                            <span className="launchpad-card-review-badge">需审核</span>
                        ) : playbookKnownOffline ? (
                            <span className="launchpad-card-review-badge">离线</span>
                        ) : (
                            <span className="launchpad-card-ready">
                                <CheckCircleOutlined /> Ready
                            </span>
                        )}
                    </div>

                    <div className="launchpad-card-desc">
                        {template.description || `目标: ${hosts.slice(0, 3).join(', ')}${hosts.length > 3 ? ` +${hosts.length - 3}` : ''}`}
                    </div>

                    <div className="launchpad-card-playbook">
                        <ProjectOutlined style={{ fontSize: 10, flexShrink: 0 }} />
                        <span className="launchpad-card-playbook-text">
                            {template.playbook?.name || template.playbook_id?.slice(0, 8) || '-'}
                        </span>
                    </div>

                    <div className="launchpad-card-info-grid">
                        <span className="launchpad-card-info-item">
                            <DesktopOutlined /> <span className="info-value">{hosts.length}</span> 主机
                        </span>
                        <span className="launchpad-card-info-item">
                            <SettingOutlined /> <span className="info-value">{configuredCount}/{varCount}</span> 参数
                        </span>
                        <span className="launchpad-card-info-item">
                            <KeyOutlined style={{ color: secretCount > 0 ? '#fa8c16' : undefined }} /> <span className="info-value">{secretCount}</span> 凭据
                        </span>
                        <span className="launchpad-card-info-item">
                            <BellOutlined style={{ color: hasNotify ? '#1890ff' : undefined }} /> {hasNotify ? '已配置' : '未配置'}
                        </span>
                    </div>

                    <div className="launchpad-card-footer">
                        <span className="launchpad-card-footer-left">
                            <ClockCircleOutlined /> {template.updated_at ? new Date(template.updated_at).toLocaleDateString() : '-'}
                        </span>
                        <span style={{ fontSize: 10, color: '#bfbfbf', fontFamily: 'monospace' }}>
                            #{template.id.slice(0, 6)}
                        </span>
                    </div>
                </div>
            </div>
        </Col>
    );
};

export default ExecuteLaunchpadCard;
