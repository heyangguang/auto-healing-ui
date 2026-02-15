import React from 'react';
import { SearchOutlined } from '@ant-design/icons';
import { Input } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
    searchWrapper: {
        /* 改为 flex 弹性占位，不再用绝对定位 */
        flex: 1,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minWidth: 0,       /* 允许缩小 */
        padding: '0 16px',
    },
    searchInput: {
        width: '100%',
        maxWidth: 400,
        background: 'rgba(255,255,255,0.12) !important',
        borderColor: 'rgba(255,255,255,0.2) !important',
        color: '#fff !important',
        '&::placeholder': {
            color: 'rgba(255,255,255,0.55) !important',
        },
        '&:hover': {
            borderColor: 'rgba(255,255,255,0.45) !important',
            background: 'rgba(255,255,255,0.18) !important',
        },
        '&:focus, &.ant-input-affix-wrapper-focused': {
            borderColor: `${token.colorPrimary} !important`,
            background: 'rgba(255,255,255,0.18) !important',
            boxShadow: `0 0 0 2px rgba(24,144,255,0.15) !important`,
        },
        '.ant-input': {
            color: '#fff !important',
            background: 'transparent !important',
            '&::placeholder': {
                color: 'rgba(255,255,255,0.55) !important',
            },
        },
        '.ant-input-prefix': {
            color: 'rgba(255,255,255,0.55)',
            marginInlineEnd: 8,
        },
        '.ant-input-clear-icon': {
            color: 'rgba(255,255,255,0.45)',
            '&:hover': {
                color: 'rgba(255,255,255,0.8)',
            },
        },
    },
}));

const GlobalSearch: React.FC = () => {
    const { styles } = useStyles();

    return (
        <div className={styles.searchWrapper}>
            <Input
                className={styles.searchInput}
                prefix={<SearchOutlined />}
                placeholder="搜索产品、资源、文档..."
                allowClear
                size="middle"
            />
        </div>
    );
};

export default React.memo(GlobalSearch);
