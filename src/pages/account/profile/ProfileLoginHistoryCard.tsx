import React from 'react';
import { DesktopOutlined, LoginOutlined, MobileOutlined } from '@ant-design/icons';
import { Card } from 'antd';
import dayjs from 'dayjs';
import { parseUA, type ProfileLoginRecord } from './profileHelpers';

type ProfileLoginHistoryCardProps = {
    loginLogs: ProfileLoginRecord[];
};

const ProfileLoginHistoryCard: React.FC<ProfileLoginHistoryCardProps> = ({ loginLogs }) => (
    <Card title={<><LoginOutlined style={{ marginRight: 6 }} />最近登录</>} style={{ marginBottom: 16 }} styles={{ body: { padding: '4px 16px' } }}>
        {loginLogs.length > 0 ? (
            <table className="login-table">
                <tbody>
                    {loginLogs.map((log) => {
                        const isSuccess = log.status === 'success';
                        const userAgent = log.user_agent || '';
                        const DeviceIcon = userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')
                            ? MobileOutlined
                            : DesktopOutlined;
                        const isCurl = userAgent.startsWith('curl');

                        return (
                            <tr key={log.id}>
                                <td>
                                    <div
                                        className="login-device-icon"
                                        style={{
                                            background: isSuccess ? '#f6ffed' : '#fff1f0',
                                            color: isSuccess ? '#52c41a' : '#f5222d',
                                            border: isSuccess ? '1px solid #b7eb8f' : '1px solid #ffa39e',
                                        }}
                                    >
                                        {isCurl ? <span style={{ fontSize: 8, fontWeight: 700 }}>CMD</span> : <DeviceIcon />}
                                    </div>
                                </td>
                                <td><span className="login-device-text">{parseUA(userAgent)}</span></td>
                                <td>
                                    <span className="login-ip">{log.ip_address}</span>
                                    <span className="login-result" style={{ color: isSuccess ? '#52c41a' : '#f5222d', marginLeft: 4 }}>
                                        · {isSuccess ? '成功' : '失败'}
                                    </span>
                                </td>
                                <td className="login-time">{dayjs(log.created_at).format('MM-DD HH:mm')}</td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        ) : <div className="empty-state">暂无登录记录</div>}
    </Card>
);

export default ProfileLoginHistoryCard;
