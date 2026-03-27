import React, { useMemo, useCallback, startTransition } from 'react';
import { history, useLocation, useAccess } from '@umijs/max';
import { createStyles } from 'antd-style';
import { Drawer } from 'antd';
import { CATEGORIES, SERVICES } from '@/config/navData';
import { canAccessPath } from '@/utils/pathAccess';
import type { ServiceItem } from '@/config/navData';

const NAV_HEIGHT = 58;
const SIDE_WIDTH = 200;

const useStyles = createStyles(({ token }) => ({
    sideNav: {
        position: 'fixed' as const,
        left: 0,
        top: NAV_HEIGHT,
        bottom: 0,
        width: SIDE_WIDTH,
        background: '#fff',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column' as const,
        overflowY: 'auto' as const,
        overflowX: 'hidden' as const,
        zIndex: 100,
    },
    header: {
        padding: '16px 20px',
        borderBottom: '1px solid #f0f0f0',
        marginBottom: 8,
    },
    headerTitle: {
        fontSize: 14,
        fontWeight: 600,
        color: '#262626',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
    },
    headerIcon: {
        color: token.colorPrimary,
        fontSize: 16,
    },
    navItem: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 20px',
        cursor: 'pointer',
        fontSize: 14,
        color: '#595959',
        transition: 'all 0.15s',
        userSelect: 'none' as const,
        borderLeft: '3px solid transparent',
        '&:hover': {
            color: token.colorPrimary,
            background: '#f5f5f5',
        },
    },
    navItemActive: {
        color: token.colorPrimary,
        fontWeight: 500,
        background: '#e6f7ff',
        borderLeft: `3px solid ${token.colorPrimary}`,
    },
    navItemIcon: {
        fontSize: 16,
        flexShrink: 0,
    },
    navItemLabel: {
        flex: 1,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
    },
}));

interface SideNavProps {
    isMobile?: boolean;
    drawerOpen?: boolean;
    onDrawerClose?: () => void;
}

const SideNav: React.FC<SideNavProps> = ({ isMobile, drawerOpen, onDrawerClose }) => {
    const { styles, cx } = useStyles();
    const location = useLocation();
    const access = useAccess() as unknown as Record<string, boolean>;

    const activeCategory = useMemo(() => {
        for (const [catId, items] of Object.entries(SERVICES)) {
            if (items.some(item => location.pathname === item.path || location.pathname.startsWith(`${item.path}/`))) {
                return CATEGORIES.find(c => c.id === catId);
            }
        }
        return null;
    }, [location.pathname]);

    const hasServiceAccess = useCallback((svc: ServiceItem) => {
        if (svc.accesses?.length) {
            return svc.accesses.every((key) => !key || Boolean(access[key]));
        }
        if (svc.access) return Boolean(access[svc.access]);
        return canAccessPath(svc.path, access);
    }, [access]);

    const menuItems = useMemo(() => {
        if (!activeCategory) return [];
        const items = SERVICES[activeCategory.id] || [];
        return items.filter(hasServiceAccess);
    }, [activeCategory, hasServiceAccess]);

    if (!activeCategory || menuItems.length === 0) {
        return null;
    }

    const navContent = (
        <>
            <div className={styles.header}>
                <div className={styles.headerTitle}>
                    <span className={styles.headerIcon}>{activeCategory.icon}</span>
                    <span>{activeCategory.label}</span>
                </div>
            </div>
            <div style={{ flex: 1, paddingBottom: 20 }}>
                {menuItems.map((item) => {
                    const isActive = location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
                    return (
                        <div
                            key={item.id}
                            className={cx(styles.navItem, isActive && styles.navItemActive)}
                            onClick={() => {
                                startTransition(() => {
                                    history.push(item.path);
                                });
                                onDrawerClose?.();
                            }}
                        >
                            <span className={styles.navItemIcon}>{item.icon}</span>
                            <span className={styles.navItemLabel}>{item.name}</span>
                        </div>
                    );
                })}
            </div>
        </>
    );

    /* ===== 移动端: Drawer 抽屉 ===== */
    if (isMobile) {
        return (
            <Drawer
                placement="left"
                open={drawerOpen}
                onClose={onDrawerClose}
                size={SIDE_WIDTH}
                styles={{
                    body: { padding: 0 },
                    header: { display: 'none' },
                }}
                rootStyle={{ zIndex: 1002 }}
            >
                {navContent}
            </Drawer>
        );
    }

    /* ===== 桌面端: 固定侧栏 ===== */
    return (
        <nav id="side-nav-bar" className={styles.sideNav}>
            {navContent}
        </nav>
    );
};

export default React.memo(SideNav);
