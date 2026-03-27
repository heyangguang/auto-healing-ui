import React, { startTransition, lazy, Suspense, useMemo, useState } from 'react';
import { AppstoreOutlined, DashboardOutlined, DownOutlined, HomeOutlined, MenuOutlined, QuestionCircleOutlined, UpOutlined } from '@ant-design/icons';
import { history, useAccess, useLocation, useModel } from '@umijs/max';
import { AvatarDropdown, AvatarFullName, AvatarName } from '@/components/RightContent/AvatarDropdown';
import { SERVICES } from '@/config/navData';
import StarryBackground from './StarryBackground';
import { hasAnyVisibleService, readImpersonationActive, type AccessMap } from './access';
import useTopNavStyles from './styles';
import useResponsive from './useResponsive';

const ProductMenu = lazy(() => import('@/components/ProductMenu'));
const GlobalSearch = lazy(() => import('@/components/GlobalSearch'));
const NotificationBell = lazy(() => import('@/components/NotificationBell'));
const TenantSwitcher = lazy(() => import('@/components/TenantSwitcher'));
const ImpersonationBanner = lazy(() => import('@/components/ImpersonationBanner'));

const TopNavBar: React.FC = () => {
    const { styles, cx } = useTopNavStyles();
    const location = useLocation();
    const access = useAccess() as unknown as AccessMap;
    const { initialState } = useModel('@@initialState');
    const { isMobile, isTablet } = useResponsive();
    const realPlatformAdmin = initialState?.currentUser?.is_platform_admin === true;
    const [menuOpen, setMenuOpen] = useState(false);
    const globalSearchFallbackWidth = isTablet ? 240 : 320;

    const isWorkbench = location.pathname === '/' || location.pathname === '/workbench';
    const isDashboard = location.pathname.startsWith('/dashboard');
    const showDashboard = Boolean(access.canViewDashboard);
    const hasSideNav = !isWorkbench && !isDashboard;
    const isImpersonating = useMemo(readImpersonationActive, []);
    const showTenantNav = !access.isPlatformAdmin || isImpersonating;
    const hasAnyService = useMemo(() => hasAnyVisibleService(SERVICES, access), [access]);

    return (
        <>
            <div id="top-nav-bar" className={styles.navBar}>
                <StarryBackground />
                <div className={styles.leftSection}>
                    {isMobile && hasSideNav && (
                        <button type="button" className={styles.hamburger} onClick={() => window.dispatchEvent(new Event('toggle-sidenav'))} aria-label="切换侧边栏">
                            <MenuOutlined />
                        </button>
                    )}
                    <button type="button" className={styles.logo} onClick={() => startTransition(() => history.push('/'))} aria-label="返回工作台">
                        <span className={styles.logoIcon}><img src="/pangolin-logo.png" alt="Pangolin" style={{ height: 38 }} /></span>
                    </button>
                    <div className={styles.navLinks}>
                        {showTenantNav && (
                            <button
                                type="button"
                                className={cx(styles.navItem, isWorkbench && !menuOpen && styles.navItemActive)}
                                onClick={() => { setMenuOpen(false); startTransition(() => history.push('/')); }}
                                aria-current={isWorkbench && !menuOpen ? 'page' : undefined}
                            >
                                <HomeOutlined className={styles.navIcon} />
                                {!isTablet && <span>工作台</span>}
                            </button>
                        )}
                        {showTenantNav && showDashboard && (
                            <button
                                type="button"
                                className={cx(styles.navItem, isDashboard && !menuOpen && styles.navItemActive)}
                                onClick={() => { setMenuOpen(false); startTransition(() => history.push('/dashboard')); }}
                                aria-current={isDashboard && !menuOpen ? 'page' : undefined}
                            >
                                <DashboardOutlined className={styles.navIcon} />
                                {!isTablet && <span>监控面板</span>}
                            </button>
                        )}
                        {showTenantNav && hasAnyService && (
                            <button
                                type="button"
                                id="tour-product-menu"
                                className={cx(styles.navItem, menuOpen && styles.navItemActive)}
                                onClick={() => setMenuOpen(!menuOpen)}
                                aria-haspopup="dialog"
                                aria-expanded={menuOpen}
                                aria-label="打开产品与服务菜单"
                            >
                                <AppstoreOutlined className={styles.navIcon} />
                                {!isTablet && <span>产品与服务</span>}
                                {menuOpen ? <UpOutlined className={styles.arrowIcon} /> : <DownOutlined className={styles.arrowIcon} />}
                            </button>
                        )}
                    </div>
                </div>

                {!isMobile && showTenantNav && (
                    <Suspense fallback={<div style={{ width: globalSearchFallbackWidth, height: 36 }} />}>
                        <GlobalSearch compact={isTablet} />
                    </Suspense>
                )}

                <div className={styles.rightSection}>
                    {!isMobile && (
                        <>
                            <button type="button" className={styles.iconBtn} title="帮助文档" aria-label="帮助文档" onClick={() => startTransition(() => history.push('/guide'))}>
                                <QuestionCircleOutlined />
                            </button>
                            {showTenantNav && access.canViewSiteMessages && (
                                <Suspense fallback={<span style={{ display: 'inline-block', width: 36, height: 36 }} />}>
                                    <span id="tour-notification-bell"><NotificationBell /></span>
                                </Suspense>
                            )}
                            {realPlatformAdmin
                                ? <Suspense fallback={<div style={{ minWidth: 220, height: 32 }} />}><ImpersonationBanner /></Suspense>
                                : <Suspense fallback={<div style={{ width: 160, height: 36 }} />}><TenantSwitcher /></Suspense>}
                            <div className={styles.divider} />
                        </>
                    )}
                    <AvatarDropdown menu>
                        <button type="button" className={styles.avatarWrapper} aria-haspopup="menu" aria-label="打开用户菜单">
                            <span className={styles.userAvatar}><AvatarName /></span>
                            {!isMobile && <span className={styles.userName}><AvatarFullName /></span>}
                        </button>
                    </AvatarDropdown>
                </div>
            </div>
            <Suspense fallback={null}>
                <ProductMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
            </Suspense>
        </>
    );
};

export default React.memo(TopNavBar);
