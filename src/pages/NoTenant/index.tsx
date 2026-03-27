import React from 'react';
import { Result, Button, ConfigProvider, message } from 'antd';
import { useNavigate } from '@@/exports';
import { StopOutlined } from '@ant-design/icons';
import { TokenManager } from '@/requestErrorConfig';
import { logout } from '@/services/auto-healing/auth';

/**
 * 无租户权限提示页面
 * 用户登录后如果没有分配任何租户,将显示此页面
 */
const NoTenantPage: React.FC = () => {
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            const refreshToken = TokenManager.getRefreshToken() || undefined;
            await logout(refreshToken ? { refresh_token: refreshToken } : undefined);
        } catch {
            message.warning('服务端登出失败，已清除本地登录状态');
        }
        TokenManager.clearTokens();
        navigate('/user/login');
    };

    return (
        <ConfigProvider
            theme={{
                token: {
                    borderRadius: 0,
                    colorPrimary: '#0f62fe', // IBM Blue
                },
            }}
        >
            <div
                style={{
                    height: '100vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#f4f4f4',
                }}
            >
                <Result
                    icon={<StopOutlined style={{ color: '#da1e28' }} />}
                    status="403"
                    title="无租户权限"
                    subTitle="您的账号暂未分配任何租户,无法访问系统功能。请联系系统管理员为您分配租户权限。"
                    extra={
                        <Button type="primary" size="large" onClick={handleLogout}>
                            退出登录
                        </Button>
                    }
                    style={{
                        backgroundColor: '#ffffff',
                        padding: '48px',
                        borderRadius: 0,
                    }}
                />
            </div>
        </ConfigProvider>
    );
};

export default NoTenantPage;
