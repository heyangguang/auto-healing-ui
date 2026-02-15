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
import { history, useLocation } from '@umijs/max';
import { createStyles } from 'antd-style';
import { AvatarDropdown, AvatarName, AvatarFullName } from '@/components/RightContent/AvatarDropdown';
import GlobalSearch from '@/components/GlobalSearch';
const ProductMenu = lazy(() => import('@/components/ProductMenu'));
import { CATEGORIES, SERVICES } from '@/config/menu';

const MOBILE_BP = 768;

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
    },
    leftSection: {
        display: 'flex',
        alignItems: 'center',
        gap: 0,
        flexShrink: 0,
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
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        flexShrink: 0,
        paddingRight: 8,
        marginLeft: 'auto',
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
    const [menuOpen, setMenuOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(
        typeof window !== 'undefined' ? window.innerWidth <= MOBILE_BP : false
    );

    useEffect(() => {
        const onResize = () => setIsMobile(window.innerWidth <= MOBILE_BP);
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const isWorkbench = location.pathname === '/' || location.pathname === '/workbench';
    const isDashboard = location.pathname.startsWith('/dashboard');

    // 判断当前页面是否有侧边栏
    const hasSideNav = !isWorkbench && !isDashboard;

    return (
        <>
            <div className={styles.navBar}>
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

                    {/* 导航链接 */}
                    <div className={styles.navLinks}>
                        <div
                            className={cx(styles.navItem, isWorkbench && !menuOpen && styles.navItemActive)}
                            onClick={() => { setMenuOpen(false); startTransition(() => history.push('/')); }}
                        >
                            <HomeOutlined className={styles.navIcon} />
                            {!isMobile && <span>工作台</span>}
                        </div>

                        <div
                            className={cx(styles.navItem, isDashboard && !menuOpen && styles.navItemActive)}
                            onClick={() => { setMenuOpen(false); startTransition(() => history.push('/dashboard')); }}
                        >
                            <DashboardOutlined className={styles.navIcon} />
                            {!isMobile && <span>监控面板</span>}
                        </div>

                        <div
                            className={cx(styles.navItem, menuOpen && styles.navItemActive)}
                            onClick={() => setMenuOpen(!menuOpen)}
                        >
                            <AppstoreOutlined className={styles.navIcon} />
                            <span>产品与服务</span>
                            {menuOpen ? (
                                <UpOutlined className={styles.arrowIcon} />
                            ) : (
                                <DownOutlined className={styles.arrowIcon} />
                            )}
                        </div>
                    </div>
                </div>

                {/* 全局搜索 - 移动端隐藏 */}
                {!isMobile && <GlobalSearch />}

                {/* 右侧操作 */}
                <div className={styles.rightSection}>
                    {!isMobile && (
                        <>
                            <div className={styles.iconBtn} title="帮助文档">
                                <QuestionCircleOutlined />
                            </div>
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
