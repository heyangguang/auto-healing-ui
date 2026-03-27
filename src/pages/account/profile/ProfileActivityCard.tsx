import React from 'react';
import { Card } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { describeActivity, type ProfileActivityRecord } from './profileHelpers';

type ProfileActivityCardProps = {
    actorName: string;
    unavailable?: boolean;
    opLogs: ProfileActivityRecord[];
};

const ProfileActivityCard: React.FC<ProfileActivityCardProps> = ({ actorName, opLogs, unavailable }) => (
    <Card title={<><HistoryOutlined style={{ marginRight: 6 }} />操作日志</>} styles={{ body: { padding: '4px 16px' } }}>
        {unavailable ? (
            <div className="empty-state">当前租户操作日志暂不可用</div>
        ) : opLogs.length > 0 ? (
            <ul className="op-timeline">
                {opLogs.map((log) => {
                    const { action, color, resource } = describeActivity(log);
                    return (
                        <li key={log.id}>
                            <span className="op-dot" style={{ background: color }} />
                            <span className="op-main">
                                <strong style={{ marginRight: 4 }}>{actorName}</strong>
                                <span className="op-action">{action}</span>
                                {resource && <span className="op-resource">{resource}</span>}
                            </span>
                            <span className="op-time">{dayjs(log.created_at).format('MM-DD HH:mm')}</span>
                        </li>
                    );
                })}
            </ul>
        ) : <div className="empty-state">暂无操作记录</div>}
    </Card>
);

export default ProfileActivityCard;
