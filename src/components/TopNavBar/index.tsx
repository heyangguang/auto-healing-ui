import React, { useState, useEffect, startTransition, lazy, Suspense } from 'react';
import {
    QuestionCircleOutlined,
    HomeOutlined,
    AppstoreOutlined,
    DashboardOutlined,
    DownOutlined,
    UpOutlined,
    MenuOutlined,
} from '@ant-design/icons';
import { history, useLocation, useAccess, useModel } from '@umijs/max';
import { createStyles } from 'antd-style';
import { AvatarDropdown, AvatarName, AvatarFullName } from '@/components/RightContent/AvatarDropdown';
import GlobalSearch from '@/components/GlobalSearch';
import NotificationBell from '@/components/NotificationBell';
import TenantSwitcher from '@/components/TenantSwitcher';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import StarryBackground from './StarryBackground';
const ProductMenu = lazy(() => import('@/components/ProductMenu'));
import { CATEGORIES, SERVICES } from '@/config/navData';

const MOBILE_BP = 768;
const TABLET_BP = 1200;

const useStyles = createStyles(({ token }) => ({
    navBar: {
        display: 'flex',
        alignItems: 'center',
        height: 58,
        padding: '0 16px',
        background: '#161616',
        color: '#fff',
        position: 'sticky' as const,
        top: 0,
        zIndex: 1001,
        borderBottom: '1px solid #333',
        /* 不要 overflow:hidden，否则搜索下拉面板会被裁剪 */
    },
    leftSection: {
        position: 'relative' as const,
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        flexShrink: 1,
        minWidth: 0,
    },
    hamburger: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 40,
        height: 40,
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 18,
        marginRight: 4,
        '&:hover': {
            color: '#fff',
            background: 'rgba(255,255,255,0.08)',
        },
    },
    logo: {
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '0 16px 0 0',
        cursor: 'pointer',
        height: 58,
        flexShrink: 0,
        boxSizing: 'border-box' as const,
    },
    logoIcon: {
        width: 28,
        height: 28,
        background: token.colorPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#fff',
        fontWeight: 700,
        fontSize: 10,
    },
    logoText: {
        fontSize: 15,
        fontWeight: 600,
        color: '#fff',
        letterSpacing: 0.5,
        whiteSpace: 'nowrap' as const,
    },
    navLinks: {
        display: 'flex',
        gap: 4,
    },
    navItem: {
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        padding: '6px 12px',
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 13,
        fontWeight: 500,
        transition: 'all 0.2s',
        userSelect: 'none' as const,
        '&:hover': {
            color: '#fff',
            background: 'rgba(255,255,255,0.1)',
        },
    },
    navItemActive: {
        color: '#fff',
        background: 'rgba(255,255,255,0.1)',
    },
    navIcon: {
        fontSize: 16,
    },
    arrowIcon: {
        fontSize: 12,
        marginLeft: 1,
    },
    /* 移动端隐藏导航文字 */
    navLabel: {},
    rightSection: {
        position: 'relative' as const,
        zIndex: 1,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 1,
        paddingRight: 8,
        marginLeft: 'auto',
        minWidth: 0,
    },
    iconBtn: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 36,
        height: 36,
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.7)',
        fontSize: 18,
        transition: 'all 0.2s',
        '&:hover': {
            color: '#fff',
            background: 'rgba(255,255,255,0.08)',
        },
    },
    divider: {
        width: 1,
        height: 20,
        background: 'rgba(255,255,255,0.2)',
        margin: '0 8px',
    },
    avatarWrapper: {
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '0 4px 0 8px',
        height: 58,
        cursor: 'pointer',
        color: 'rgba(255,255,255,0.85)',
        fontSize: 13,
        transition: 'all 0.2s',
        whiteSpace: 'nowrap' as const,
        '&:hover': {
            opacity: 0.85,
        },
    },
    userAvatar: {
        width: 28,
        height: 28,
        background: token.colorPrimary,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 12,
        fontWeight: 600,
        color: '#fff',
        flexShrink: 0,
    },
    userName: {
        fontSize: 13,
        color: 'rgba(255,255,255,0.9)',
        whiteSpace: 'nowrap' as const,
    },
}));

const TopNavBar: React.FC = () => {
    const { styles, cx } = useStyles();
    const location = useLocation();
    const access = useAccess() as unknown as Record<string, boolean>;
    const { initialState } = useModel('@@initialState');
    const realPlatformAdmin = initialState?.currentUser?.is_platform_admin === true;
    const [menuOpen, setMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BP : false
    );
    const [isTablet, setIsTablet] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= TABLET_BP : false
    );

    useEffect(() => {
        const onResize = () => {
            setIsMobile(window.innerWidth <= MOBILE_BP);
            setIsTablet(window.innerWidth <= TABLET_BP);
        };
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const isWorkbench = location.pathname === '/' || location.pathname === '/workbench';
    const isDashboard = location.pathname.startsWith('/dashboard');

    // 权限检查：监控面板是否可见
    const showDashboard = !!access.canViewDashboard;

    // 权限检查：是否有任何可见的产品服务
    const hasAnyService = React.useMemo(() => {
        for (const [, items] of Object.entries(SERVICES)) {
            if (items.some(svc => !svc.access || access[svc.access])) return true;
        }
        return false;
    }, [access]);

    // 判断当前页面是否有侧边栏
    const hasSideNav = !isWorkbench && !isDashboard;

    // 🆕 检查 Impersonation 状态（严格校验：isImpersonating + 未过期）
    const isImpersonating = React.useMemo(() => {
        try {
            const raw = localStorage.getItem('impersonation-storage');
            if (raw) {
                const imp = JSON.parse(raw);
                if (imp?.isImpersonating && imp?.session?.expiresAt) {
                    return new Date(imp.session.expiresAt) > new Date();
                }
            }
        } catch { /* ignore */ }
        return false;
    }, []);

    return (
        <>
            <div id="top-nav-bar" className={styles.navBar}>
                <StarryBackground />
                <div className={styles.leftSection}>

                    {/* 汉堡菜单: 仅移动端 + 有侧边栏时显示 */}
                    {isMobile && hasSideNav && (
                        <div
                            className={styles.hamburger}
                            onClick={() => window.dispatchEvent(new Event('toggle-sidenav'))}
                        >
                            <MenuOutlined />
                        </div>
                    )}

                    {/* Logo */}
                    <div className={styles.logo} onClick={() => startTransition(() => history.push('/'))}>
                        <div className={styles.logoIcon}>AH</div>
                        {!isMobile && <span className={styles.logoText}>Auto Healing</span>}
                    </div>

                    {/* 导航链接 - 平台管理员未 Impersonation 时隐藏租户级导航 */}
                    <div className={styles.navLinks}>
                        {(!access.isPlatformAdmin || isImpersonating) && (
                            <div
                                className={cx(styles.navItem, isWorkbench && !menuOpen && styles.navItemActive)}
                                onClick={() => { setMenuOpen(false); startTransition(() => history.push('/')); }}
                            >
                                <HomeOutlined className={styles.navIcon} />
                                {!isTablet && <span>工作台</span>}
                            </div>
                        )}

                        {(!access.isPlatformAdmin || isImpersonating) && showDashboard && (
                            <div
                                className={cx(styles.navItem, isDashboard && !menuOpen && styles.navItemActive)}
                                onClick={() => { setMenuOpen(false); startTransition(() => history.push('/dashboard')); }}
                            >
                                <DashboardOutlined className={styles.navIcon} />
                                {!isTablet && <span>监控面板</span>}
                            </div>
                        )}

                        {(!access.isPlatformAdmin || isImpersonating) && hasAnyService && (
                            <div
                                id="tour-product-menu"
                                className={cx(styles.navItem, menuOpen && styles.navItemActive)}
                                onClick={() => setMenuOpen(!menuOpen)}
                            >
                                <AppstoreOutlined className={styles.navIcon} />
                                {!isTablet && <span>产品与服务</span>}
                                {menuOpen ? (
                                    <UpOutlined className={styles.arrowIcon} />
                                ) : (
                                    <DownOutlined className={styles.arrowIcon} />
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* 全局搜索 - 平台管理员未 Impersonation 时隐藏 */}
                {!isMobile && (!access.isPlatformAdmin || isImpersonating) && <GlobalSearch compact={isTablet} />}

                {/* 右侧操作 */}
                <div className={styles.rightSection}>
                    {!isMobile && (
                        <>
                            <div className={styles.iconBtn} title="帮助文档" onClick={() => startTransition(() => history.push('/guide'))}>
                                <QuestionCircleOutlined />
                            </div>
                            {(!access.isPlatformAdmin || isImpersonating) && (
                                <span id="tour-notification-bell"><NotificationBell /></span>
                            )}
                            {/* 平台管理员：impersonation 时显示 Banner，否则不显示 */}
                            {/* 普通用户：显示 TenantSwitcher */}
                            {realPlatformAdmin
                                ? <ImpersonationBanner />
                                : <TenantSwitcher />
                            }
                            <div className={styles.divider} />
                        </>
                    )}

                    <AvatarDropdown menu>
                        <div className={styles.avatarWrapper}>
                            <div className={styles.userAvatar}>
                                <AvatarName />
                            </div>
                            {!isMobile && (
                                <span className={styles.userName}>
                                    <AvatarFullName />
                                </span>
                            )}
                        </div>
                    </AvatarDropdown>
                </div>
            </div>

            {/* Drawer Mega Menu — 懒加载，仅在用户主动打开时才加载 */}
            <Suspense fallback={null}>
                <ProductMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
            </Suspense>
        </>
    );
};

export default React.memo(TopNavBar);
