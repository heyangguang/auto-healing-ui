import React from 'react';
import { PlusOutlined, CodeOutlined, FileTextOutlined } from '@ant-design/icons';
import { history, useAccess } from '@umijs/max';
import { createStyles } from 'antd-style';
import { canAccessPath } from '@/utils/pathAccess';

const useStyles = createStyles(({ token }) => ({
    card: {
        background: '#fff',
        border: '1px solid #f0f0f0',
        padding: 16,
        marginBottom: 12,
    },
    title: {
        fontSize: 14,
        fontWeight: 600,
        color: '#262626',
        marginBottom: 12,
    },
    actionItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 12px',
        cursor: 'pointer',
        fontSize: 14,
        color: '#595959',
        transition: 'all 0.15s',
        '&:hover': {
            color: token.colorPrimary,
            background: '#fafafa',
        },
    },
    actionIcon: {
        fontSize: 15,
        color: '#8c8c8c',
    },
}));

const QuickActions: React.FC = () => {
    const { styles } = useStyles();
    const access = useAccess();

    const actions = [
        { icon: <PlusOutlined />, label: '新建工单', path: '/resources/incidents', onClick: () => history.push('/resources/incidents') },
        { icon: <CodeOutlined />, label: '执行脚本', path: '/execution/execute', onClick: () => history.push('/execution/execute') },
        { icon: <FileTextOutlined />, label: '查看文档', path: '', onClick: () => window.open('https://pro.ant.design/docs/getting-started', '_blank') },
    ];

    return (
        <div className={styles.card}>
            <div className={styles.title}>快速操作</div>
            {actions.map((action) => (
                <div
                    key={action.path || action.label}
                    className={styles.actionItem}
                    onClick={() => (!action.path || canAccessPath(action.path, access)) && action.onClick()}
                    style={action.path && !canAccessPath(action.path, access) ? { opacity: 0.45, cursor: 'not-allowed' } : undefined}
                >
                    <span className={styles.actionIcon}>{action.icon}</span>
                    <span>{action.label}</span>
                </div>
            ))}
        </div>
    );
};

export default QuickActions;
