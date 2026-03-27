import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token }) => ({
    filterBar: {
        display: 'flex',
        gap: 8,
        alignItems: 'center',
    },
    listContainer: {
        border: '1px solid #d9d9d9',
        borderRadius: 4,
        overflow: 'hidden',
        background: '#fff',
    },
    listScroll: {
        maxHeight: 320,
        overflow: 'auto',
    },
    listEmpty: {
        display: 'flex',
        flexDirection: 'column' as const,
        alignItems: 'center',
        justifyContent: 'center',
        padding: '48px 0',
        color: '#bfbfbf',
    },
    listEmptyIcon: {
        fontSize: 40,
        marginBottom: 8,
        color: '#d9d9d9',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px',
        cursor: 'pointer',
        borderBottom: '1px solid #f5f5f5',
        transition: 'background 0.1s',
        userSelect: 'none' as const,
        '&:hover': {
            background: '#fafafa',
        },
    },
    rowSelected: {
        background: '#e6f7ff !important',
        borderLeft: `3px solid ${token.colorPrimary}`,
        paddingLeft: 11,
    },
    rowLeft: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        minWidth: 0,
        flex: 1,
    },
    rowRight: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
    },
    statusBar: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '6px 12px',
        background: '#fafafa',
        borderTop: '1px solid #f0f0f0',
        fontSize: 12,
        color: '#8c8c8c',
    },
    selectedBanner: {
        padding: '8px 12px',
        background: '#e6f7ff',
        border: '1px solid #91d5ff',
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12,
    },
}));
