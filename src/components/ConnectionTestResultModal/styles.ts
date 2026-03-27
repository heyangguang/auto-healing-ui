import { createStyles } from 'antd-style';

export const useStyles = createStyles(() => ({
    summary: {
        display: 'flex',
        gap: 1,
        background: '#f0f0f0',
        borderRadius: 4,
        overflow: 'hidden',
        marginBottom: 16,
    },
    summaryCard: {
        flex: 1,
        background: '#fff',
        padding: '14px 0',
        textAlign: 'center' as const,
    },
    summaryValue: {
        fontSize: 24,
        fontWeight: 600,
        lineHeight: 1.2,
    },
    summaryLabel: {
        fontSize: 12,
        color: '#8c8c8c',
        marginTop: 2,
    },
    groupContainer: {
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    groupHeader: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '8px 14px',
        cursor: 'pointer',
        userSelect: 'none' as const,
        transition: 'background 0.15s',
        borderBottom: '1px solid #f0f0f0',
        '&:hover': {
            background: '#fafafa',
        },
    },
    groupHeaderLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flex: 1,
        minWidth: 0,
    },
    groupHeaderRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    groupBody: {
        maxHeight: 280,
        overflow: 'auto',
        background: '#fafafa',
    },
    errorGroupDivider: {
        borderTop: '1px solid #f0f0f0',
    },
    footer: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    copyWrapper: {
        display: 'inline-flex',
        alignItems: 'center',
        '& .ant-typography': {
            marginBottom: '0 !important',
        },
        '& .ant-typography-copy': {
            marginInlineStart: '0 !important',
        },
    },
}));
