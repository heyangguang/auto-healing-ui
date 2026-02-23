import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useLocation } from '@umijs/max';
import { createStyles } from 'antd-style';
import SideNav from '@/components/SideNav';
import { findServiceByPath } from '@/config/menu';
import { recordRecent } from '@/services/auto-healing/userNav';


const NAV_HEIGHT = 58;
const SIDE_WIDTH = 200;
const MOBILE_BP = 768;

/* ========== 窗口宽度 hook ========== */
const useWindowWidth = () => {
    const [width, setWidth] = useState(
        typeof window !== 'undefined' ? window.innerWidth : 1200
    );
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    useEffect(() => {
        const onResize = () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            timerRef.current = setTimeout(() => setWidth(window.innerWidth), 100);
        };
        window.addEventListener('resize', onResize);
        return () => {
            window.removeEventListener('resize', onResize);
            if (timerRef.current) clearTimeout(timerRef.current);
        };
    }, []);
    return width;
};

const useStyles = createStyles(() => ({
    appLayout: {
        display: 'flex',
        flex: 1,
        minHeight: `calc(100vh - ${NAV_HEIGHT}px)`,
    },
    sideNavPlaceholder: {
        width: SIDE_WIDTH,
        minWidth: SIDE_WIDTH,
        flexShrink: 0,
    },
    mainContent: {
        flex: 1,
        overflowY: 'auto' as const,
        overflowX: 'hidden' as const,
        background: '#f5f5f5',
        minWidth: 0,
        height: `calc(100vh - ${NAV_HEIGHT}px)`,
    },
}));

interface AppLayoutProps {
    children: React.ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
    const { styles } = useStyles();
    const location = useLocation();
    const windowWidth = useWindowWidth();
    const isMobile = windowWidth <= MOBILE_BP;

    const [drawerOpen, setDrawerOpen] = useState(false);

    // 路由切换时关闭抽屉
    useEffect(() => {
        setDrawerOpen(false);
    }, [location.pathname]);

    // 路由切换时记录最近访问（静默，不影响页面加载）
    const lastRecordedPath = useRef('');
    useEffect(() => {
        const path = location.pathname;
        if (path === lastRecordedPath.current) return;
        lastRecordedPath.current = path;
        const svc = findServiceByPath(path);
        if (svc) {
            recordRecent({ menu_key: svc.id, name: svc.name, path: svc.path }).catch(() => { });
        }
    }, [location.pathname]);

    // 监听 TopNavBar 的汉堡按钮事件
    useEffect(() => {
        const handler = () => setDrawerOpen(prev => !prev);
        window.addEventListener('toggle-sidenav', handler);
        return () => window.removeEventListener('toggle-sidenav', handler);
    }, []);

    const showSideNav = useMemo(() => {
        const p = location.pathname;
        const isWorkbench = p === '/' || p === '/workbench';
        const isDashboard = p.startsWith('/dashboard');
        const isDetailPage = /^\/execution\/(runs|templates)\/[^/]+$/.test(p);
        const isAccount = p.startsWith('/account');
        const isGuide = p.startsWith('/guide');
        const isException = p.startsWith('/exception');
        return !isWorkbench && !isDashboard && !isDetailPage && !isAccount && !isGuide && !isException;
    }, [location.pathname]);

    return (
        <div className={styles.appLayout}>
            {showSideNav && (
                <>
                    <SideNav
                        isMobile={isMobile}
                        drawerOpen={drawerOpen}
                        onDrawerClose={() => setDrawerOpen(false)}
                    />
                    {!isMobile && <div className={styles.sideNavPlaceholder} />}
                </>
            )}
            <main className={styles.mainContent}>
                {children}
            </main>

        </div>
    );
};

export { useWindowWidth, MOBILE_BP };
export default React.memo(AppLayout);
