import React from 'react';
import { useModel } from '@umijs/max';
import { Tag } from 'antd';
import { createStyles } from 'antd-style';
import TeamsAvatar from '@/components/TeamsAvatar';

const useStyles = createStyles(({ token }) => ({
    card: {
        background: '#fff',
        border: '1px solid #f0f0f0',
        padding: 16,
        marginBottom: 12,
    },
    header: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        background: token.colorPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 600,
        fontSize: 16,
        flexShrink: 0,
    },
    info: {
        flex: 1,
        minWidth: 0,
    },
    name: {
        fontSize: 15,
        fontWeight: 600,
        color: '#262626',
        lineHeight: '22px',
    },
    role: {
        fontSize: 12,
        color: '#8c8c8c',
        lineHeight: '18px',
    },
}));

const UserInfoCard: React.FC = () => {
    const { styles } = useStyles();
    const { initialState } = useModel('@@initialState');
    const user = initialState?.currentUser;
    const displayName = user?.name || user?.display_name || user?.username || '用户';
    const seed = user?.username || displayName;
    const role = user?.access === 'admin' ? '系统管理员' : '普通用户';

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div className={styles.avatar}><TeamsAvatar seed={seed} name={displayName} size={40} /></div>
                <div className={styles.info}>
                    <div className={styles.name}>{displayName}</div>
                    <div className={styles.role}>
                        <Tag color="blue" style={{ margin: 0, fontSize: 11 }}>{role}</Tag>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserInfoCard;
