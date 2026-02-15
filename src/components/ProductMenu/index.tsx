import React, { useState, startTransition } from 'react';
import {
    CloseOutlined,
    StarFilled,
    ClockCircleOutlined,
} from '@ant-design/icons';
import { history } from '@umijs/max';
import { Drawer } from 'antd';
import { createStyles } from 'antd-style';
import { CATEGORIES, SERVICES, FAVORITES, RECENTS } from '@/config/menu';

/* ──── 样式 ──── */
const useStyles = createStyles(({ token }) => ({
    /* ── 左侧分类面板 ── */
    leftPanel: {
        width: 200,
        minWidth: 200,
        background: 'linear-gradient(180deg, #ffffff 0%, #f7f9fc 100%)',
        borderRight: '1px solid #f0f0f0',
        paddingTop: 20,
        flexShrink: 0,
        display: 'flex',
        flexDirection: 'column' as const,
    },
    catItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '13px 24px',
        cursor: 'pointer',
        fontSize: 14,
        color: '#595959',
        transition: 'all 0.15s',
        borderLeft: '3px solid transparent',
        position: 'relative' as const,
        '&:hover': {
            color: token.colorPrimary,
            background: 'rgba(24,144,255,0.04)',
        },
    },
    catItemActive: {
        color: token.colorPrimary,
        fontWeight: 600,
        background: '#fff',
        borderLeft: `3px solid ${token.colorPrimary}`,
    },
    catIcon: {
        fontSize: 16,
        flexShrink: 0,
    },

    /* ── 右侧内容面板 ── */
    rightPanel: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column' as const,
        overflow: 'hidden',
        background: '#fff',
    },
    header: {
        padding: '20px 28px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#262626',
    },
    closeBtn: {
        width: 32,
        height: 32,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        color: '#8c8c8c',
        fontSize: 16,
        transition: 'color 0.2s',
        '&:hover': {
            color: '#262626',
        },
    },

    /* ── 收藏 & 最近 ── */
    quickArea: {
        padding: '16px 28px',
        background: '#fafbfc',
        borderBottom: '1px solid #f0f0f0',
        borderTop: '1px solid #f0f0f0',
        display: 'flex',
        gap: 48,
    },
    quickSection: {
        flex: 1,
    },
    quickLabel: {
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        fontSize: 13,
        fontWeight: 600,
        color: '#262626',
        marginBottom: 10,
    },
    quickLabelIcon: {
        fontSize: 14,
    },
    quickLinks: {
        display: 'flex',
        flexWrap: 'wrap' as const,
        gap: 20,
    },
    quickLink: {
        fontSize: 13,
        color: '#595959',
        cursor: 'pointer',
        transition: 'color 0.15s',
        '&:hover': {
            color: token.colorPrimary,
        },
    },

    /* ── 服务区域 ── */
    serviceArea: {
        padding: '24px 28px',
        flex: 1,
        overflowY: 'auto' as const,
    },
    serviceTitle: {
        fontSize: 16,
        fontWeight: 600,
        color: '#262626',
        marginBottom: 24,
    },
    serviceGrid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '8px 24px',
    },
    serviceCard: {
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '16px 16px',
        cursor: 'pointer',
        transition: 'all 0.15s',
        '&:hover': {
            background: '#f5f9ff',
        },
    },
    serviceIcon: {
        fontSize: 18,
        color: token.colorPrimary,
        marginTop: 2,
        flexShrink: 0,
    },
    serviceName: {
        fontSize: 14,
        fontWeight: 500,
        color: '#262626',
        lineHeight: '22px',
    },
    serviceDesc: {
        fontSize: 12,
        color: '#8c8c8c',
        lineHeight: '18px',
        marginTop: 2,
    },
}));

/* ──── 组件 ──── */
interface ProductMenuProps {
    open: boolean;
    onClose: () => void;
}

const ProductMenu: React.FC<ProductMenuProps> = ({ open, onClose }) => {
    const { styles, cx } = useStyles();
    const [activeCategory, setActiveCategory] = useState('healing');

    const handleNavigate = (path: string) => {
        startTransition(() => {
            history.push(path);
        });
        onClose();
    };

    const activeCat = CATEGORIES.find((c) => c.id === activeCategory);
    const services = SERVICES[activeCategory] || [];

    return (
        <Drawer
            open={open}
            onClose={onClose}
            placement="left"
            width={800}
            closable={false}
            mask={true}
            styles={{
                body: { display: 'flex', padding: 0, height: '100%' },
                wrapper: { maxWidth: '90vw' },
                mask: { position: 'fixed', top: 58, left: 0, right: 0, bottom: 0, width: '100vw', height: 'calc(100vh - 58px)' },
            }}
            rootStyle={{ zIndex: 1002, position: 'fixed', top: 58, left: 0, right: 0, bottom: 0, width: '100vw', height: 'calc(100vh - 58px)' }}
        >
            {/* 左侧分类面板 */}
            <div className={styles.leftPanel}>
                {CATEGORIES.map((cat) => (
                    <div
                        key={cat.id}
                        className={cx(styles.catItem, activeCategory === cat.id && styles.catItemActive)}
                        onClick={() => setActiveCategory(cat.id)}
                    >
                        <span className={styles.catIcon}>{cat.icon}</span>
                        <span>{cat.label}</span>
                    </div>
                ))}
            </div>

            {/* 右侧内容面板 */}
            <div className={styles.rightPanel}>
                {/* 顶部 Header */}
                <div className={styles.header}>
                    <span className={styles.headerTitle}>全站导航</span>
                    <div className={styles.closeBtn} onClick={onClose}>
                        <CloseOutlined />
                    </div>
                </div>

                {/* 收藏 & 最近 */}
                <div className={styles.quickArea}>
                    <div className={styles.quickSection}>
                        <div className={styles.quickLabel}>
                            <StarFilled className={styles.quickLabelIcon} style={{ color: '#faad14' }} />
                            我的收藏
                        </div>
                        <div className={styles.quickLinks}>
                            {FAVORITES.map((f) => (
                                <span
                                    key={f.id}
                                    className={styles.quickLink}
                                    onClick={() => handleNavigate(f.path)}
                                >
                                    {f.name}
                                </span>
                            ))}
                        </div>
                    </div>
                    <div className={styles.quickSection}>
                        <div className={styles.quickLabel}>
                            <ClockCircleOutlined className={styles.quickLabelIcon} />
                            最近访问
                        </div>
                        <div className={styles.quickLinks}>
                            {RECENTS.map((r) => (
                                <span
                                    key={r.id}
                                    className={styles.quickLink}
                                    onClick={() => handleNavigate(r.path)}
                                >
                                    {r.name}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 服务列表 */}
                <div className={styles.serviceArea}>
                    <div className={styles.serviceTitle}>{activeCat?.label}</div>
                    <div className={styles.serviceGrid}>
                        {services.map((svc) => (
                            <div
                                key={svc.id}
                                className={styles.serviceCard}
                                onClick={() => handleNavigate(svc.path)}
                            >
                                {svc.icon && <span className={styles.serviceIcon}>{svc.icon}</span>}
                                <div>
                                    <div className={styles.serviceName}>{svc.name}</div>
                                    {svc.desc && <div className={styles.serviceDesc}>{svc.desc}</div>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </Drawer>
    );
};

export default ProductMenu;
